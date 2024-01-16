const ethers = require("ethers");
const dotenv = require("dotenv");
const path = require("path");
const { processUniswapV3Config } = require("../utils/poolsFromManifest");
const { calculatePoolSlippage } = require("../utils/slippage");

dotenv.config({ path: path.resolve(__dirname, "../.env") });
const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;
const provider = new ethers.providers.JsonRpcProvider(
  `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`
);

const quoterAddress = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6"; // Uniswap V3 Quoter address
const abi = [
  "function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)",
];
let pool;

const contract = new ethers.Contract(quoterAddress, abi, provider);

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
  await calculatePoolSlippage(
    pool.DEX,
    pool.poolAddress,
    pool.tokenA,
    pool.tokenB,
    getOutAmount
  );
}

async function findPoolsSlippages() {
  const pools = await processUniswapV3Config();

  for (const [index, poolData] of pools.entries()) {
    console.log(`Processing pool ${index + 1}/${pools.length}`);
    pool = poolData;
    //TODO: why pool.quoterAddress is different then our quoterAddress?
    await findPoolSlippage();
  }
}

findPoolsSlippages().catch((err) => {
  console.error("Error occurred:", err);
});
