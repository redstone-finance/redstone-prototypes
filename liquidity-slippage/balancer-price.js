const ethers = require("ethers");
const dotenv = require("dotenv");
const redstone = require("redstone-api");
const constants = require("./constants");
const {
  calculatePoolSize,
  calcPriceSecondInFirst,
  getApproximateTokensAmountInPool,
} = require("./common");

dotenv.config();
const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;
const startPriceUSD = constants.startPriceUSD;
cryptoASymbol = "USDC";
cryptoBSymbol = "WETH";
// TODO: Need to manually change pool address...
const poolAddress = "0x8a649274E4d777FFC6851F13d23A86BBFA2f2Fbf"; // Balancer weth/usdc pool address

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

async function getOutAmount(fromAmount, fromCrypto, toCrypto) {
  const outAmount = await balancerPool.calcOutGivenIn(
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
  const firstPriceInUSD = await redstone.getPrice(fromCrypto.symbol);
  let fromAmount = Number(startPriceUSD / firstPriceInUSD.value).toFixed(
    fromCrypto.decimals
  );

  let currentPrice = secondPriceInFirst;
  const transactionFee = ethers.utils.formatUnits(swapFee.toString(), 18);
  const receivedSecondAmount = await getOutAmount(
    fromAmount,
    fromCrypto,
    toCrypto
  );
  const expectedSecondAmount = fromAmount / currentPrice;
  const differencePercentage = parseFloat(
    ((receivedSecondAmount - expectedSecondAmount) / expectedSecondAmount) *
      100 +
      transactionFee
  ).toFixed(2);
  const priceInUSD = (firstPriceInUSD.value * fromAmount).toFixed(2);
  console.log(
    `For ${fromAmount} ${fromCrypto.symbol} (${priceInUSD} USD), received ${toCrypto.symbol}: ${receivedSecondAmount}, expected ${toCrypto.symbol}: ${expectedSecondAmount}, difference: ${differencePercentage}%`
  );
}

async function findSlippage() {
  await calculateSlippage(cryptoA, cryptoB);
  await calculateSlippage(cryptoB, cryptoA);
}

findSlippage().catch((err) => {
  console.error("Error occurred:", err);
});
