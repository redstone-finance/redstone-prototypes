const ethers = require("ethers");
const dotenv = require("dotenv");
const redstone = require("redstone-api");
const constants = require("./constants");

dotenv.config();
const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;
const usdcAddress = constants.usdcAddress;
const wethAddress = constants.wethAddress;
const startPriceUSD = constants.startPriceUSD;

const provider = new ethers.providers.JsonRpcProvider(
  `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`
);

const abi = [
  "function getAmountsOut(uint256 amountIn, address[] memory path) public view returns (uint256[] memory amounts)",
];

const pairAbi = [
  "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
];

// Get the price of WETH in USDC from Uniswap V2
async function getWethPriceInUSDC() {
  const factoryAbi = [
    "function getPair(address tokenA, address tokenB) external view returns (address pair)",
  ];
  const factoryContract = new ethers.Contract(
    factoryAddress,
    factoryAbi,
    provider
  );

  const pairAddress = await factoryContract.getPair(usdcAddress, wethAddress);
  const pairContract = new ethers.Contract(pairAddress, pairAbi, provider);

  const reserves = await pairContract.getReserves();
  const wethReserve = reserves[1];
  const usdcReserve = reserves[0];

  const wethPriceInUSDC = usdcReserve
    .mul(ethers.utils.parseUnits("1", 18))
    .div(wethReserve);
  return ethers.utils.formatUnits(wethPriceInUSDC.toString(), 6);
}

// Checks how much WETH you will receive for a given USDC amount
async function getWethAmount(usdcAmount) {
  const amounts = await contract.getAmountsOut(
    ethers.utils.parseUnits(usdcAmount.toString(), 6),
    [usdcAddress, wethAddress]
  );
  const wethAmount = ethers.utils.formatUnits(amounts[1].toString(), 18);
  return wethAmount;
}

async function calculateWethAmount() {
  const wethPriceInUSDC = await getWethPriceInUSDC();
  console.log(`Price WETH in USDC: ${wethPriceInUSDC}`);

  const usdcPriceInUSD = await redstone.getPrice("USDC");
  let usdcAmount = Number(startPriceUSD / usdcPriceInUSD.value).toFixed(6);
  let currentPrice = wethPriceInUSDC;

  let receivedWethAmount = 0;
  let expectedWethAmount = 0;
  let jumps = 0;
  while (receivedWethAmount * 2 >= expectedWethAmount) {
    jumps++;
    receivedWethAmount = await getWethAmount(usdcAmount);
    expectedWethAmount = usdcAmount / currentPrice;

    const differencePercentage = (
      ((receivedWethAmount - expectedWethAmount) / expectedWethAmount) * 100 +
      0.3
    ).toFixed(2); // 0.3 is gas fee
    const priceInUSD = (usdcPriceInUSD.value * usdcAmount).toFixed(2);

    console.log(
      `For ${usdcAmount} USDC (${priceInUSD} USD), received WETH: ${receivedWethAmount}, expected WETH: ${expectedWethAmount}, difference: ${differencePercentage}%`
    );
    usdcAmount *= 2;
  }
  console.log(
    `Jumps (the higher, the bigger pool, price harder to manipulate): ${jumps}`
  );
}

let address = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"; // Uniswap V2 Router address
let factoryAddress = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f"; // Uniswap V2 Factory address
let contract = new ethers.Contract(address, abi, provider);
async function main() {
  console.log("Uniswap V2");
  await calculateWethAmount().catch((err) => {
    console.error("Error occurred:", err);
  });

  address = "0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f"; // SushiSwap Router02 address
  factoryAddress = "0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac"; // SushiSwap Factory address
  contract = new ethers.Contract(address, abi, provider);
  console.log("SushiSwap");
  await calculateWethAmount().catch((err) => {
    console.error("Error occurred:", err);
  });
}

main().catch((err) => {
  console.error("Error occurred:", err);
});
