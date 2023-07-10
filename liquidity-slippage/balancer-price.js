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

const poolAddress = "0x8a649274E4d777FFC6851F13d23A86BBFA2f2Fbf"; // Balancer weth/usdc pool address
const BPoolABI = [
  "function getSpotPrice(address tokenIn, address tokenOut) external view returns (uint spotPrice)",
  "function getBalance(address token) external view returns (uint)",
  "function getDenormalizedWeight(address token) external view returns (uint)",
  "function getSwapFee() external view returns (uint)",
  "function calcOutGivenIn(uint256 tokenBalanceIn, uint256 tokenWeightIn, uint256 tokenBalanceOut, uint256 tokenWeightOut, uint256 tokenAmountIn, uint256 swapFee) external pure returns (uint256)",
];
const balancerPool = new ethers.Contract(poolAddress, BPoolABI, provider);
let tokenBalanceIn,
  tokenWeightIn,
  tokenBalanceOut,
  tokenWeightOut,
  swapFee,
  wethPriceInUSDC;

async function prepareData() {
  [
    swapFee,
    tokenBalanceIn,
    tokenWeightIn,
    tokenBalanceOut,
    tokenWeightOut,
    wethPriceInUSDC,
  ] = await Promise.all([
    balancerPool.getSwapFee(),
    balancerPool.getBalance(usdcAddress),
    balancerPool.getDenormalizedWeight(usdcAddress),
    balancerPool.getBalance(wethAddress),
    balancerPool.getDenormalizedWeight(wethAddress),
    balancerPool.getSpotPrice(usdcAddress, wethAddress),
  ]);
  wethPriceInUSDC = ethers.utils.formatUnits(wethPriceInUSDC.toString(), 6);
}

// Checks how much WETH you will receive for a given USDC amount from Balancer
async function getWethAmount(usdcAmount) {
  const wethAmount = await balancerPool.calcOutGivenIn(
    tokenBalanceIn,
    tokenWeightIn,
    tokenBalanceOut,
    tokenWeightOut,
    ethers.utils.parseUnits(usdcAmount.toString(), 6),
    swapFee
  );

  const shiftedWethAmount = ethers.utils.formatUnits(wethAmount.toString(), 18);
  return shiftedWethAmount;
}

async function calculateWethAmount() {
  await prepareData();
  console.log(`Price WETH in USDC: ${wethPriceInUSDC}`);

  const usdcPriceInUSD = await redstone.getPrice("USDC");
  let usdcAmount = Number(startPriceUSD / usdcPriceInUSD.value).toFixed(6);
  let currentPrice = wethPriceInUSDC;
  const transactionFee = ethers.utils.formatUnits(swapFee.toString(), 18);

  let receivedWethAmount = 0;
  let expectedWethAmount = 0;
  let jumps = 0;
  while (receivedWethAmount * 2 >= expectedWethAmount) {
    jumps++;
    receivedWethAmount = await getWethAmount(usdcAmount);
    expectedWethAmount = usdcAmount / currentPrice;

    const differencePercentage = parseFloat(
      ((receivedWethAmount - expectedWethAmount) / expectedWethAmount) * 100 +
        transactionFee
    ).toFixed(2);
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

calculateWethAmount().catch((err) => {
  console.error("Error occurred:", err);
});
