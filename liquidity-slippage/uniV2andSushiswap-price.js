const ethers = require("ethers");
const dotenv = require("dotenv");
const redstone = require("redstone-api");
const constants = require("./constants");
const {
  calculatePoolSize,
  calcPriceSecondInFirst,
  getApproximateTokensAmountInPool,
  calculatePriceDifference,
} = require("./common");

dotenv.config();
const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;
const pricesUSD = constants.pricesUSD;
cryptoASymbol = "OHM";
cryptoBSymbol = "WETH";

const cryptoA = constants[cryptoASymbol];
const cryptoB = constants[cryptoBSymbol];

const provider = new ethers.providers.JsonRpcProvider(
  `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`
);
const abi = [
  "function getAmountsOut(uint256 amountIn, address[] memory path) public view returns (uint256[] memory amounts)",
];
const pairAbi = [
  "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function token0() external view returns (address)",
];

async function getSecondCryptoPriceInFirstCrypto(fromCrypto, toCrypto) {
  const factoryAbi = [
    "function getPair(address tokenA, address tokenB) external view returns (address pair)",
  ];
  const factoryContract = new ethers.Contract(
    factoryAddress,
    factoryAbi,
    provider
  );
  const pairAddress = await factoryContract.getPair(
    fromCrypto.address,
    toCrypto.address
  );
  const pairContract = new ethers.Contract(pairAddress, pairAbi, provider);
  const reserves = await pairContract.getReserves();
  const token0 = await pairContract.token0();
  let reserves0 = reserves[0];
  let reserves1 = reserves[1];

  if (toCrypto.address.toLowerCase() === token0.toLowerCase())
    [reserves0, reserves1] = [reserves1, reserves0];
  await calculatePoolSize(
    ethers.utils.formatUnits(reserves0, fromCrypto.decimals),
    ethers.utils.formatUnits(reserves1, toCrypto.decimals),
    fromCrypto.symbol,
    toCrypto.symbol
  );
  // await getApproximateTokensAmountInPool(pairAddress, fromCrypto, toCrypto);

  return await calcPriceSecondInFirst(
    reserves0,
    reserves1,
    fromCrypto.decimals,
    toCrypto.decimals
  );
}

async function getOutAmount(fromAmount, fromCrypto, toCrypto, contract) {
  const amounts = await contract.getAmountsOut(
    ethers.utils.parseUnits(fromAmount.toString(), fromCrypto.decimals),
    [fromCrypto.address, toCrypto.address]
  );
  return ethers.utils.formatUnits(amounts[1].toString(), toCrypto.decimals);
}

async function calculateSlippage(fromCrypto, toCrypto) {
  const secondPriceInFirst = await getSecondCryptoPriceInFirstCrypto(
    fromCrypto,
    toCrypto
  );
  console.log(
    `Price ${toCrypto.symbol} in ${fromCrypto.symbol}: ${secondPriceInFirst}`
  );

  const firstPriceInUSD = await redstone.getPrice(fromCrypto.symbol);
  const gasFee = 0.3;
  const results = await calculatePriceDifference(
    pricesUSD,
    firstPriceInUSD,
    secondPriceInFirst,
    gasFee,
    fromCrypto,
    toCrypto,
    getOutAmount,
    contract
  );
  results.forEach((result) => console.log(result));
}

async function findSlippage() {
  await calculateSlippage(cryptoA, cryptoB);
  await calculateSlippage(cryptoB, cryptoA);
}

let address = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"; // Uniswap V2 Router address
let factoryAddress = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f"; // Uniswap V2 Factory address
let contract = new ethers.Contract(address, abi, provider);
async function main() {
  console.log("Uniswap V2");
  await findSlippage().catch((err) => {
    console.error("Error occurred:", err);
  });

  address = "0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f"; // SushiSwap Router02 address
  factoryAddress = "0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac"; // SushiSwap Factory address
  contract = new ethers.Contract(address, abi, provider);
  console.log("SushiSwap");
  await findSlippage().catch((err) => {
    console.error("Error occurred:", err);
  });
}

main().catch((err) => {
  console.error("Error occurred:", err);
});
