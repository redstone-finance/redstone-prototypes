const ethers = require("ethers");
const dotenv = require("dotenv");
const path = require("path");
const { processUniswapV3Config } = require("../utils/poolsFromManifest");

// const poolsInfo = require("../utils/pools-info");
// const constants = require("../utils/constants");
// const {
//   getApproximateTokensAmountInPool,
//   amountTradeXSlippageIndependent,
// } = require("../utils/common");

dotenv.config({ path: path.resolve(__dirname, "../.env") });
const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;
const provider = new ethers.providers.JsonRpcProvider(
  `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`
);

// TODO: update in monorepo, test both cases
const address = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6"; // Uniswap V3 Quoter address
const abi = [
  "function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)",
];
let pool, contract;

// const contract = new ethers.Contract(address, abi, provider);

async function getOutAmount(fromAmount, fromCrypto, toCrypto) {
  const amountOut = await contract.callStatic.quoteExactInputSingle(
    fromCrypto.address,
    toCrypto.address,
    pool.fee,
    ethers.utils.parseUnits(fromAmount.toString(), fromCrypto.decimals),
    0
  );
  return ethers.utils.formatUnits(amountOut.toString(), toCrypto.decimals);
}

async function findPoolSlippage() {
  //   console.log(
  //     `Started calculating slippage on ${DEX} for pool: `,
  //     pool.poolAddress,
  //     "...",
  //     pool.cryptoASymbol,
  //     pool.cryptoBSymbol
  //   );
  //   const poolAddress = pool.poolAddress;
  //   const fromCrypto = constants[pool.cryptoASymbol];
  //   const toCrypto = constants[pool.cryptoBSymbol];
  //   fee = pool.fee;

  //   poolSize = await getApproximateTokensAmountInPool(
  //     poolAddress,
  //     fromCrypto,
  //     toCrypto
  //   );
  //   console.log("Pool size: ", poolSize);

  await calculatePoolSlippage(
    pool.DEX,
    pool.tokenA,
    pool.tokenB,
    getOutAmount
  );
}

async function findPoolsSlippages() {
  const pools = await processUniswapV3Config();
  console.log("pools: ", pools);
  for (const poolData of pools) {
    pool = poolData;
    contract = new ethers.Contract(pool.quoterAddress, abi, provider); //TODO: update in monorepo? check if correct
    console.log("pool: ", pool);
    await findPoolSlippage();
  }
}

findSlippage().catch((err) => {
  console.error("Error occurred:", err);
});
