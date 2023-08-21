const ethers = require("ethers");
const dotenv = require("dotenv");
const path = require("path");
const constants = require("../utils/constants");
const {
  getApproximateTokensAmountInPool,
  calculateAndWriteToCSV,
  amountTradeXSlippage,
  reversePrice,
} = require("../utils/common");

const DEX = "Uniswap V3";

dotenv.config({ path: path.resolve(__dirname, "../.env") });
const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;

const pairs = [
  {
    cryptoASymbol: "USDC",
    cryptoBSymbol: "WETH",
  },
  {
    cryptoASymbol: "USDT",
    cryptoBSymbol: "USDC",
  },
  {
    cryptoASymbol: "UNI",
    cryptoBSymbol: "WETH",
  },
  {
    cryptoASymbol: "RLB",
    cryptoBSymbol: "WETH",
  },
  {
    cryptoASymbol: "WBTC",
    cryptoBSymbol: "USDC",
  },
];

const { cryptoASymbol, cryptoBSymbol } = pairs[4];
const cryptoA = constants[cryptoASymbol];
const cryptoB = constants[cryptoBSymbol];

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

let fee = 500;
const factoryAddress = "0x1F98431c8aD98523631AE4a59f267346ea31F984"; // Uniswap V3 Factory address
const poolFees = [500, 3000, 10000];
const factoryAbi = [
  "function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)",
];
async function findPoolAndFee(fromCrypto, toCrypto) {
  const factoryContract = new ethers.Contract(
    factoryAddress,
    factoryAbi,
    provider
  );
  const poolAddresses = await Promise.all(
    poolFees.map((fee) =>
      factoryContract.getPool(fromCrypto.address, toCrypto.address, fee)
    )
  );
  // Find first not empty address
  for (let i = 0; i < poolAddresses.length; i++) {
    if (poolAddresses[i] != "0x0000000000000000000000000000000000000000")
      return [poolAddresses[i], poolFees[i]];
  }
  throw new Error("No pool found");
}

async function getSecondCryptoPriceInFirstCryptoAndPoolSize(
  fromCrypto,
  toCrypto
) {
  [poolAddress, fee] = await findPoolAndFee(fromCrypto, toCrypto);
  const poolSize = await getApproximateTokensAmountInPool(
    poolAddress,
    fromCrypto,
    toCrypto
  );
  const poolContract = new ethers.Contract(poolAddress, poolAbi, provider);
  const poolBalance = await poolContract.slot0();
  const sqrtPriceX96 = poolBalance.sqrtPriceX96;
  let Decimal0 = fromCrypto.decimals;
  let Decimal1 = toCrypto.decimals;
  if (fromCrypto.address.toLowerCase() > toCrypto.address.toLowerCase())
    [Decimal0, Decimal1] = [Decimal1, Decimal0];
  const buyOneOfToken0 =
    (sqrtPriceX96 / 2 ** 96) ** 2 /
    (10 ** Decimal1 / 10 ** Decimal0).toFixed(Decimal1);
  const buyOneOfToken1 = (1 / buyOneOfToken0).toFixed(Decimal0);
  if (fromCrypto.address.toLowerCase() > toCrypto.address.toLowerCase())
    return [poolSize, buyOneOfToken0];
  return [poolSize, buyOneOfToken1];
}

async function getPricesInEachOther(fromCrypto, toCrypto) {
  const [poolSize, secondPriceInFirst] =
    await getSecondCryptoPriceInFirstCryptoAndPoolSize(fromCrypto, toCrypto);
  const firstPriceInSecond = reversePrice(
    secondPriceInFirst,
    toCrypto.decimals
  );
  return [poolSize, firstPriceInSecond, secondPriceInFirst];
}

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

async function calculateSlippage(fromCrypto, toCrypto) {
  const [poolSize, firstPriceInSecond, secondPriceInFirst] =
    await getPricesInEachOther(fromCrypto, toCrypto);
  const gasFee = fee / 1e6;

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
