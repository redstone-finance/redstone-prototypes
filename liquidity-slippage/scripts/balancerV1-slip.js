const ethers = require("ethers");
const dotenv = require("dotenv");
const path = require("path");
const constants = require("../utils/constants");
const {
  calculatePoolSize,
  calculateAndWriteToCSV,
  amountTradeXSlippage,
  calcPricesInEachOther,
  calcPriceSecondInFirst,
  getApproximateTokensAmountInPool,
  calculatePriceDifference,
} = require("../utils/common");

dotenv.config({ path: path.resolve(__dirname, "../.env") });
const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;

const DEX = "Balancer V1";

const addresses = [
  {
    address: "0x8a649274E4d777FFC6851F13d23A86BBFA2f2Fbf",
    cryptoASymbol: "USDC",
    cryptoBSymbol: "WETH",
  },
  {
    address: "0x1efF8aF5D577060BA4ac8A29A13525bb0Ee2A3D5",
    cryptoASymbol: "WETH",
    cryptoBSymbol: "WBTC",
  },
  {
    address: "0x69d460e01070A7BA1bc363885bC8F4F0daa19Bf5",
    cryptoASymbol: "DAI",
    cryptoBSymbol: "USDC",
  },
  {
    address: "0x165a50Bc092f6870DC111C349baE5Fc35147ac86",
    cryptoASymbol: "WETH",
    cryptoBSymbol: "DAI",
  },
  {
    address: "0xc2A04278Ad502349e6AABb748A41ABdA9dfD18a9",
    cryptoASymbol: "PNK",
    cryptoBSymbol: "WETH",
  },
];

const { address, cryptoASymbol, cryptoBSymbol } = addresses[1];

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
const contract = new ethers.Contract(address, BPoolABI, provider);
let spotPriceBinA,
  spotPriceAinB,
  tokenBalanceIn,
  tokenWeightIn,
  tokenBalanceOut,
  tokenWeightOut,
  swapFee,
  gasFee;

async function prepareData(fromCrypto, toCrypto) {
  [
    // spotPriceBinA,
    // spotPriceAinB,
    swapFee,
    tokenBalanceIn,
    tokenWeightIn,
    tokenBalanceOut,
    tokenWeightOut,
  ] = await Promise.all([
    // contract.getSpotPrice(fromCrypto.address, toCrypto.address),
    // contract.getSpotPrice(toCrypto.address, fromCrypto.address),
    contract.getSwapFee(),
    contract.getBalance(fromCrypto.address),
    contract.getDenormalizedWeight(fromCrypto.address),
    contract.getBalance(toCrypto.address),
    contract.getDenormalizedWeight(toCrypto.address),
  ]);

  gasFee = ethers.utils.formatUnits(swapFee.toString(), 18);
}

async function getOutAmount(fromAmount, fromCrypto, toCrypto, contract) {
  let [balanceIn, balanceOut, weightIn, weightOut] = [
    tokenBalanceIn,
    tokenBalanceOut,
    tokenWeightIn,
    tokenWeightOut,
  ];
  if (fromCrypto.symbol !== cryptoASymbol) {
    [balanceIn, balanceOut, weightIn, weightOut] = [
      tokenBalanceOut,
      tokenBalanceIn,
      tokenWeightOut,
      tokenWeightIn,
    ];
  }
  const outAmount = await contract.calcOutGivenIn(
    balanceIn,
    weightIn,
    balanceOut,
    weightOut,
    ethers.utils.parseUnits(fromAmount.toString(), fromCrypto.decimals),
    swapFee
  );

  return ethers.utils.formatUnits(outAmount.toString(), toCrypto.decimals);
}

async function getPricesInEachOther(fromCrypto, toCrypto) {
  await prepareData(fromCrypto, toCrypto);
  const [secondPriceInFirst, firstPriceInSecond] = calcPricesInEachOther(
    tokenBalanceIn,
    tokenBalanceOut,
    fromCrypto.decimals,
    toCrypto.decimals
  );

  const poolSize = await calculatePoolSize(
    ethers.utils.formatUnits(tokenBalanceIn.toString(), fromCrypto.decimals),
    ethers.utils.formatUnits(tokenBalanceOut.toString(), toCrypto.decimals),
    fromCrypto,
    toCrypto
  );
  return [poolSize, firstPriceInSecond, secondPriceInFirst];
}

async function calculateSlippage(fromCrypto, toCrypto) {
  const [poolSize, firstPriceInSecond, secondPriceInFirst] =
    await getPricesInEachOther(fromCrypto, toCrypto);
  // calculateAndWriteToCSV(
  //   DEX,
  //   fromCrypto,
  //   toCrypto,
  //   poolSize,
  //   secondPriceInFirst,
  //   firstPriceInSecond,
  //   gasFee,
  //   getOutAmount,
  //   contract
  // );
  amountTradeXSlippage(
    DEX,
    fromCrypto,
    toCrypto,
    poolSize,
    secondPriceInFirst,
    firstPriceInSecond,
    gasFee,
    getOutAmount,
    contract
  );
}

async function findSlippage() {
  await calculateSlippage(cryptoA, cryptoB);
}

findSlippage().catch((err) => {
  console.error("Error occurred:", err);
});
