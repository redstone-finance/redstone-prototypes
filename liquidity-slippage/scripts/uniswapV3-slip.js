const ethers = require("ethers");
const dotenv = require("dotenv");
const path = require("path");
const poolsInfo = require("../utils/pools-info");
const constants = require("../utils/constants");
const {
  getApproximateTokensAmountInPool,
  amountTradeXSlippageIndependent,
} = require("../utils/common");

dotenv.config({ path: path.resolve(__dirname, "../.env") });
const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;

const DEX = "Uniswap V3";
let fee;

const provider = new ethers.providers.JsonRpcProvider(
  `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`
);

const address = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6"; // Uniswap V3 Quoter address
const abi = [
  "function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)",
];
const contract = new ethers.Contract(address, abi, provider);

async function getOutAmount(fromAmount, fromCrypto, toCrypto, contract) {
  const amountIn = ethers.utils.parseUnits(
    fromAmount.toString(),
    fromCrypto.decimals
  );
  const amountOut = await contract.callStatic.quoteExactInputSingle(
    fromCrypto.address,
    toCrypto.address,
    fee,
    amountIn,
    0
  );
  return ethers.utils.formatUnits(amountOut.toString(), toCrypto.decimals);
}

async function calculateSlippage(pool) {
  console.log(
    `Started calculating slippage on ${DEX} for pool: `,
    pool.poolAddress,
    "...",
    pool.cryptoASymbol,
    pool.cryptoBSymbol
  );
  const poolAddress = pool.poolAddress;
  const fromCrypto = constants[pool.cryptoASymbol];
  const toCrypto = constants[pool.cryptoBSymbol];
  fee = pool.fee;

  poolSize = await getApproximateTokensAmountInPool(
    poolAddress,
    fromCrypto,
    toCrypto
  );
  console.log("Pool size: ", poolSize);

  await amountTradeXSlippageIndependent(
    DEX,
    fromCrypto,
    toCrypto,
    poolSize,
    getOutAmount,
    contract
  );
}

async function findSlippage() {
  const pools = poolsInfo.poolsInfo[DEX];
  for (const pool of pools) {
    await calculateSlippage(pool);
  }
}

findSlippage().catch((err) => {
  console.error("Error occurred:", err);
});
