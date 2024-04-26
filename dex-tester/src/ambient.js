const ethers = require("ethers");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

// publicRpcUrls: [
//     "https://rpc.blast.io",
//     "https://rpc.ankr.com/blast",
//     "https://blast.din.dev/rpc",
//     "https://blastl2-mainnet.public.blastapi.io",
//     "https://blast.blockpi.network/v1/rpc/public",
//   ],
const providerUrl = "https://blast.blockpi.network/v1/rpc/public";
const provider = new ethers.providers.Web3Provider(providerUrl);
// const provider = new ethers.providers.JsonRpcProvider(`https://blast.blockpi.network/v1/rpc/public`);

const DEFAULT_POOL_IDX = 420;

// queryPrice: (
//     base: string,
//     quote: string,
//     poolIdx: number,
//     override: ContractCallOverrides
//   ) => Promise<BigNumberish>;

const abi = [
  "function queryPrice(string base, string quote, uint256 poolIdx) external view returns (uint256)",
];

const AMBIENT_QUERY_CONTRACT_ADDRESS =
  "0xA3BD3bE19012De72190c885FB270beb93e36a8A7";

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
  // 0 is the index of token with smaller addresses
  const isToken0AddressSmaller =
    token0.address.toLowerCase() < token1.address.toLowerCase();
  return {
    basePoolToken: {
      symbol: assetId,
      address: isBaseToken0 ? token0.address : token1.address,
      decimals: isBaseToken0 ? token0.decimals : token1.decimals,
      index: isToken0AddressSmaller ? 0 : 1,
    },
    quotedPoolToken: {
      symbol: isBaseToken0 ? token1.symbol : token0.symbol,
      address: isBaseToken0 ? token1.address : token0.address,
      decimals: isBaseToken0 ? token1.decimals : token0.decimals,
      index: isToken0AddressSmaller ? 1 : 0,
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

  const sqrtPriceX64 = await poolDetailsContract.queryPrice(
    "0x0000000000000000000000000000000000000000",
    "0x4300000000000000000000000000000000000003",
    // isBaseIndex0 ? basePoolToken.address : quotedPoolToken.address,
    // isBaseIndex0 ? quotedPoolToken.address : basePoolToken.address,
    DEFAULT_POOL_IDX
  );

  const adjustMultiplayer = new Decimal(10).toPower(
    isBaseIndex0
      ? quotedPoolToken.decimals - basePoolToken.decimals
      : basePoolToken.decimals - quotedPoolToken.decimals
  );
  const priceShift = new Decimal(2).toPower(2 * 64);
  const token0DivToken1Ratio = RedstoneCommon.bignumberishToDecimal(
    sqrtPriceX64
  )
    .toPower(2)
    .div(priceShift)
    .mul(adjustMultiplayer);

  return isBaseIndex0
    ? token0DivToken1Ratio
    : new Decimal(1).div(token0DivToken1Ratio);
}

queryPrice("USDB").then(console.log);

// const contract = new ethers.Contract(pool.poolAddress, abiV2, provider);

// const fromAmount = 1;
// getOutAmount(fromAmount, pool.tokenA, pool.tokenB).then(console.log);
