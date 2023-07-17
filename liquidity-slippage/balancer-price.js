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
cryptoASymbol = "USDC";
cryptoBSymbol = "WETH";

// TODO: Need to manually change pool address...
const poolAddress = "0x8a649274E4d777FFC6851F13d23A86BBFA2f2Fbf"; // USDC / WETH
// const poolAddress = "0x1efF8aF5D577060BA4ac8A29A13525bb0Ee2A3D5"; // WETH / WBTC
// const poolAddress = "0xddce7b2c3f7Fbc4F1eAb24970c3fd26fEe1FF80F"; // TXJP / WETH
// const poolAddress = "0xc2A04278Ad502349e6AABb748A41ABdA9dfD18a9"; // PNK / WETH
// const poolAddress = "0xc1b10e536CD611aCFf7a7c32A9E29cE6A02Ef6ef"; // MPL / USDC
// const poolAddress = "0x69d460e01070A7BA1bc363885bC8F4F0daa19Bf5"; // DAI / USDC
// const poolAddress = "0x165a50Bc092f6870DC111C349baE5Fc35147ac86"; // WETH / DAI

const cryptoA = constants[cryptoASymbol];
const cryptoB = constants[cryptoBSymbol];

const provider = new ethers.providers.JsonRpcProvider(
  `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`
);

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
  secondPriceInFirst;

async function prepareData(fromCrypto, toCrypto) {
  [swapFee, tokenBalanceIn, tokenWeightIn, tokenBalanceOut, tokenWeightOut] =
    await Promise.all([
      balancerPool.getSwapFee(),
      balancerPool.getBalance(fromCrypto.address),
      balancerPool.getDenormalizedWeight(fromCrypto.address),
      balancerPool.getBalance(toCrypto.address),
      balancerPool.getDenormalizedWeight(toCrypto.address),
    ]);
  secondPriceInFirst = calcPriceSecondInFirst(
    tokenBalanceIn,
    tokenBalanceOut,
    fromCrypto.decimals,
    toCrypto.decimals
  );
  await calculatePoolSize(
    ethers.utils.formatUnits(tokenBalanceIn.toString(), fromCrypto.decimals),
    ethers.utils.formatUnits(tokenBalanceOut.toString(), toCrypto.decimals),
    fromCrypto.symbol,
    toCrypto.symbol
  );
  // await getApproximateTokensAmountInPool(poolAddress, fromCrypto, toCrypto);
}

async function getOutAmount(fromAmount, fromCrypto, toCrypto, contract) {
  // contract = balancerPool;
  const outAmount = await contract.calcOutGivenIn(
    tokenBalanceIn,
    tokenWeightIn,
    tokenBalanceOut,
    tokenWeightOut,
    ethers.utils.parseUnits(fromAmount.toString(), fromCrypto.decimals),
    swapFee
  );
  return ethers.utils.formatUnits(outAmount.toString(), toCrypto.decimals);
}

async function calculateSlippage(fromCrypto, toCrypto) {
  await prepareData(fromCrypto, toCrypto);
  console.log(
    `Price ${toCrypto.symbol} in ${fromCrypto.symbol}: ${secondPriceInFirst}`
  );
  const gasFee = ethers.utils.formatUnits(swapFee.toString(), 18);
  const firstPriceInUSD = await redstone.getPrice(fromCrypto.symbol);
  const results = await calculatePriceDifference(
    pricesUSD,
    firstPriceInUSD,
    secondPriceInFirst,
    gasFee,
    fromCrypto,
    toCrypto,
    getOutAmount,
    balancerPool
  );
  results.forEach((result) => console.log(result));
}

async function findSlippage() {
  await calculateSlippage(cryptoA, cryptoB);
  await calculateSlippage(cryptoB, cryptoA);
}

findSlippage().catch((err) => {
  console.error("Error occurred:", err);
});
