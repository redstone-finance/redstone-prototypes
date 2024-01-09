const ethers = require("ethers");
const dotenv = require("dotenv");
const path = require("path");
const constants = require("../utils/constants");
const poolsInfo = require("../utils/pools-info");
const {
  amountTradeXSlippageIndependent,
  getApproximateTokensAmountInPool,
} = require("../utils/common");

dotenv.config({ path: path.resolve(__dirname, "../.env") });
const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;

const provider = new ethers.providers.JsonRpcProvider(
  `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`
);
const abi = [
  "function getAmountsOut(uint256 amountIn, address[] memory path) public view returns (uint256[] memory amounts)",
];

async function getOutAmount(fromAmount, fromCrypto, toCrypto, contract) {
  const amounts = await contract.getAmountsOut(
    ethers.utils.parseUnits(fromAmount.toString(), fromCrypto.decimals),
    [fromCrypto.address, toCrypto.address]
  );
  return ethers.utils.formatUnits(amounts[1].toString(), toCrypto.decimals);
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

  const poolSize = await getApproximateTokensAmountInPool(
    poolAddress,
    fromCrypto,
    toCrypto
  );

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

let DEX, address, factoryAddress, contract;

async function uniswapV2() {
  DEX = "Uniswap V2";
  address = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"; // Uniswap V2 Router address
  factoryAddress = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f"; // Uniswap V2 Factory address
  contract = new ethers.Contract(address, abi, provider);
  await findSlippage().catch((err) => {
    console.error("Error occurred:", err);
  });
}

async function sushiSwap() {
  DEX = "SushiSwap";
  address = "0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f"; // SushiSwap Router02 address
  factoryAddress = "0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac"; // SushiSwap Factory address
  contract = new ethers.Contract(address, abi, provider);
  await findSlippage().catch((err) => {
    console.error("Error occurred:", err);
  });
}

async function main() {
  await sushiSwap();
  await uniswapV2();
}

main().catch((err) => {
  console.error("Error occurred:", err);
});
