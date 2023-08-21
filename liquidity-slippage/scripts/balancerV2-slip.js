//TODO: refactor balancer V2 how to get amout out?!
const ethers = require("ethers");
const dotenv = require("dotenv");
const path = require("path");
const redstone = require("redstone-api");
const constants = require("../utils/constants");
const {
  calculatePoolSize,
  calcPriceSecondInFirst,
  getApproximateTokensAmountInPool,
  calculatePriceDifference,
} = require("../utils/common");

dotenv.config({ path: path.resolve(__dirname, "../.env") });
const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;
const pricesUSD = constants.pricesUSD;
cryptoASymbol = "BAL";
cryptoBSymbol = "WETH";

// TODO: Need to manually change pool address...
const poolAddress = "0x5c6Ee304399DBdB9C8Ef030aB642B10820DB8F56"; // BAL / WETH

const cryptoA = constants[cryptoASymbol];
const cryptoB = constants[cryptoBSymbol];

const provider = new ethers.providers.JsonRpcProvider(
  `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`
);

const BPoolABI = [
  "function getSwapFeePercentage() external view returns (uint256)",
  "function getRate() external view returns (uint256)",
  "function getNormalizedWeights() external view returns (uint256[] memory)",
  "function onSwap(uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out) external view returns (uint256)",
  "function totalSupply() external view returns (uint256)",
];
const balancerPool = new ethers.Contract(poolAddress, BPoolABI, provider);

async function prepareData(fromCrypto, toCrypto) {
  const normalizedWeights = await balancerPool.getNormalizedWeights();
  const normalizedWeightIn = normalizedWeights[0];
  const normalizedWeightOut = normalizedWeights[1];
  const rate = await balancerPool.getRate();
  const swapFeePercentage = await balancerPool.getSwapFeePercentage();
  const swapFee = swapFeePercentage / 1e18;
  const totalSupply = await balancerPool.totalSupply();
  console.log(`Swap fee: ${swapFeePercentage / 1e18}%`);
  console.log(`Rate: ${rate / 1e18}`);
  console.log(`Normalized weight in: ${normalizedWeightIn / 1e18}`);
  console.log(`Normalized weight out: ${normalizedWeightOut / 1e18}`);
  console.log(`Total supply: ${totalSupply / 1e18}`);

  //   feePercentage = await balancerPool.getSwapFeePercentage();
  //   console.log(`Swap fee: ${ethers.utils.formatUnits(feePercentage, 18)}%`);

  //   [swapFee, tokenBalanceIn, tokenWeightIn, tokenBalanceOut, tokenWeightOut] =
  //     await Promise.all([
  //       balancerPool.getSwapFee(),
  //       balancerPool.getBalance(fromCrypto.address),
  //       balancerPool.getDenormalizedWeight(fromCrypto.address),
  //       balancerPool.getBalance(toCrypto.address),
  //       balancerPool.getDenormalizedWeight(toCrypto.address),
  //     ]);
  //   secondPriceInFirst = calcPriceSecondInFirst(
  //     tokenBalanceIn,
  //     tokenBalanceOut,
  //     fromCrypto.decimals,
  //     toCrypto.decimals
  //   );

  await getApproximateTokensAmountInPool(poolAddress, fromCrypto, toCrypto);
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
