const ethers = require("ethers");
const dotenv = require("dotenv");
const path = require("path");
const Decimal = require("decimal.js");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

// publicRpcUrls: [
//     "https://rpc.blast.io",
//     "https://rpc.ankr.com/blast",
//     "https://blast.din.dev/rpc",
//     "https://blastl2-mainnet.public.blastapi.io",
//     "https://blast.blockpi.network/v1/rpc/public",
//   ],
const providerUrl = "https://rpc.blast.io";
const provider = new ethers.providers.JsonRpcProvider(providerUrl);
// const provider = new ethers.providers.JsonRpcProvider(`https://blast.blockpi.network/v1/rpc/public`);

const DEFAULT_POOL_IDX = 420;

// queryPrice: (
//     base: string,
//     quote: string,
//     poolIdx: number,
//     override: ContractCallOverrides
//   ) => Promise<BigNumberish>;

// const abi = [
//   "function queryPrice(string base, string quote, uint256 poolIdx) external view returns (uint128)",
// ];

const bignumberishToDecimal = (value) =>
  new Decimal(ethers.BigNumber.from(value).toHexString());

const abi = [
  {
    inputs: [
      { internalType: "address", name: "base", type: "address" },
      { internalType: "address", name: "quote", type: "address" },
      { internalType: "uint256", name: "poolIdx", type: "uint256" },
    ],
    name: "queryPrice",
    outputs: [{ internalType: "uint128", name: "", type: "uint128" }],
    stateMutability: "view",
    type: "function",
  },
];

const impactAbi = [
  {
    inputs: [
      { internalType: "address", name: "base", type: "address" },
      { internalType: "address", name: "quote", type: "address" },
      { internalType: "uint256", name: "poolIdx", type: "uint256" },
      { internalType: "bool", name: "isBuy", type: "bool" },
      { internalType: "bool", name: "inBaseQty", type: "bool" },
      { internalType: "uint128", name: "qty", type: "uint128" },
      { internalType: "uint16", name: "poolTip", type: "uint16" },
      { internalType: "uint128", name: "limitPrice", type: "uint128" },
    ],
    name: "calcImpact",
    outputs: [
      { internalType: "int128", name: "baseFlow", type: "int128" },
      { internalType: "int128", name: "quoteFlow", type: "int128" },
      { internalType: "uint128", name: "finalPrice", type: "uint128" },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const AMBIENT_QUERY_CONTRACT_ADDRESS =
  "0xA3BD3bE19012De72190c885FB270beb93e36a8A7";

const AMBIENT_IMPACT_CONTRACT_ADDRESS =
  "0x6A699AB45ADce02891E6115b81Dfb46CAa5efDb9";

const poolsConfig = {
  USDB: {
    token0: {
      symbol: "ETH",
      address: "0x0000000000000000000000000000000000000000",
      decimals: 18,
    },
    token1: {
      symbol: "USDB",
      address: "0x4300000000000000000000000000000000000003",
      decimals: 18,
    },
  },
};

function getPoolTokens(assetId) {
  const { token0, token1 } = poolsConfig[assetId];
  const isBaseToken0 = token0.symbol === assetId;
  const isBaseAddressSmaller = isBaseToken0
    ? token0.address.toLowerCase() < token1.address.toLowerCase()
    : token1.address.toLowerCase() < token0.address.toLowerCase();
  return {
    basePoolToken: {
      symbol: assetId,
      address: isBaseToken0 ? token0.address : token1.address,
      decimals: isBaseToken0 ? token0.decimals : token1.decimals,
      index: isBaseAddressSmaller ? 0 : 1,
    },
    quotedPoolToken: {
      symbol: isBaseToken0 ? token1.symbol : token0.symbol,
      address: isBaseToken0 ? token1.address : token0.address,
      decimals: isBaseToken0 ? token1.decimals : token0.decimals,
      index: isBaseAddressSmaller ? 1 : 0,
    },
  };
}

async function queryPrice(assetId) {
  const poolDetailsContract = new ethers.Contract(
    AMBIENT_QUERY_CONTRACT_ADDRESS,
    abi,
    provider
  );

  const { basePoolToken, quotedPoolToken } = getPoolTokens(assetId);
  console.log(basePoolToken, quotedPoolToken);
  const isBaseIndex0 = basePoolToken.index === 0;
  console.log(isBaseIndex0);

  console.log(
    isBaseIndex0 ? basePoolToken.address : quotedPoolToken.address,
    isBaseIndex0 ? quotedPoolToken.address : basePoolToken.address
  );

  const sqrtPriceX64 = await poolDetailsContract.queryPrice(
    isBaseIndex0 ? basePoolToken.address : quotedPoolToken.address,
    isBaseIndex0 ? quotedPoolToken.address : basePoolToken.address,
    DEFAULT_POOL_IDX
  );

  const adjustMultiplayer = new Decimal(10).toPower(
    isBaseIndex0
      ? quotedPoolToken.decimals - basePoolToken.decimals
      : basePoolToken.decimals - quotedPoolToken.decimals
  );
  const priceShift = new Decimal(2).toPower(2 * 64);
  const token0DivToken1Ratio = bignumberishToDecimal(sqrtPriceX64)
    .toPower(2)
    .div(priceShift)
    .mul(adjustMultiplayer);

  return isBaseIndex0
    ? token0DivToken1Ratio
    : new Decimal(1).div(token0DivToken1Ratio);
}

async function getAmountOut(amountIn, tokenIn, tokenOut, contract) {
  const isTokenInToken0 = tokenIn.index === 0;
  // priceLimit is uint128 we want its max or min (depends on trade direction)
  const priceLimit = isTokenInToken0 ? `0x${"ff".repeat(16)}` : "0";

  const ambientImpactResponse = await contract.calcImpact(
    isTokenInToken0 ? tokenIn.address : tokenOut.address,
    isTokenInToken0 ? tokenOut.address : tokenIn.address,
    DEFAULT_POOL_IDX,
    isTokenInToken0,
    isTokenInToken0,
    ethers.utils.parseUnits(amountIn.toString(), tokenIn.decimals).toString(),
    0,
    priceLimit
  );

  return new Decimal(
    ethers.utils.formatUnits(
      isTokenInToken0
        ? ambientImpactResponse.quoteFlow
        : ambientImpactResponse.baseFlow,
      tokenOut.decimals
    )
  ).mul(-1);
}

// queryPrice("USDB").then(console.log);

const outContract = new ethers.Contract(
  AMBIENT_IMPACT_CONTRACT_ADDRESS,
  impactAbi,
  provider
);

const {basePoolToken, quotedPoolToken} = getPoolTokens("USDB");

getAmountOut(new Decimal(10000), basePoolToken, quotedPoolToken, outContract).then(console.log);

// const contract = new ethers.Contract(pool.poolAddress, abiV2, provider);

// const fromAmount = 1;
// getOutAmount(fromAmount, pool.tokenA, pool.tokenB).then(console.log);
