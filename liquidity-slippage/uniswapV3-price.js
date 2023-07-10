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

const address = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6"; // Uniswap V3 Quoter address

const abi = [
  "function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)",
];

const poolAbi = [
  "function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)",
];

const contract = new ethers.Contract(address, abi, provider);

// Get the price of WETH in USDC from Uniswap V3
async function getWethPriceInUSDC() {
  const factoryAddress = "0x1F98431c8aD98523631AE4a59f267346ea31F984"; // Uniswap V3 Factory address
  const factoryAbi = [
    "function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)",
  ];
  const factoryContract = new ethers.Contract(
    factoryAddress,
    factoryAbi,
    provider
  );

  const poolAddress = await factoryContract.getPool(
    usdcAddress,
    wethAddress,
    3000 // 0.3% fee
  );

  const poolContract = new ethers.Contract(poolAddress, poolAbi, provider);
  const poolBalance = await poolContract.slot0();
  const sqrtPriceX96 = poolBalance.sqrtPriceX96;
  const decimalsToken0 = 6; // Set the decimals of token0
  const decimalsToken1 = 18; // Set the decimals of token1
  const buyOneOfToken0 =
    (sqrtPriceX96 / 2 ** 96) ** 2 /
    (10 ** decimalsToken1 / 10 ** decimalsToken0).toFixed(decimalsToken1);
  const buyOneOfToken1 = (1 / buyOneOfToken0).toFixed(decimalsToken0);
  return buyOneOfToken1;
}

// Checks how much WETH you will receive for a given USDC amount from Uniswap V3
async function getWethAmount(usdcAmount) {
  const amountIn = ethers.utils.parseUnits(usdcAmount.toString(), 6);

  const amountOut = await contract.callStatic.quoteExactInputSingle(
    usdcAddress,
    wethAddress,
    3000, // 0.3% fee
    amountIn,
    0
  );
  const wethAmount = ethers.utils.formatUnits(amountOut.toString(), 18);
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

calculateWethAmount().catch((err) => {
  console.error("Error occurred:", err);
});
