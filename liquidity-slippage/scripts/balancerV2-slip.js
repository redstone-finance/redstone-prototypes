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

const addresses = [
  {
    address:
      "0x60d604890feaa0b5460b28a424407c24fe89374a0000000000000000000004fc",
    fee: 0.0, //todo: get fee
    cryptoASymbol: "swETH",
    cryptoBSymbol: "WETH",
    fromIndex: 1,
    toIndex: 2,
  },
  {
    address:
      "0xc443c15033fcb6cf72cc24f1bda0db070ddd9786000000000000000000000593",
    fee: 0.0, //todo: get fee
    cryptoASymbol: "GHO",
    cryptoBSymbol: "DAI",
    fromIndex: 1,
    toIndex: 2,
  },
  {
    address:
      "0xc443c15033fcb6cf72cc24f1bda0db070ddd9786000000000000000000000593",
    fee: 0.0, //todo: get fee
    cryptoASymbol: "GHO",
    cryptoBSymbol: "USDC",
    fromIndex: 1,
    toIndex: 2,
  },
  {
    address:
      "0xcfae6e251369467f465f13836ac8135bd42f8a56000000000000000000000591",
    fee: 0.0, //todo: get fee
    cryptoASymbol: "GHO",
    cryptoBSymbol: "USDT",
    fromIndex: 2,
    toIndex: 3,
  },
];

const { address, fee, cryptoASymbol, cryptoBSymbol, fromIndex, toIndex } =
  addresses[2];

const cryptoA = constants[cryptoASymbol];
const cryptoB = constants[cryptoBSymbol];

const provider = new ethers.providers.JsonRpcProvider(
  `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`
);

const BPoolABI = [
  //todo: get correct ABI or use different way to get pool data!
  "function getSwapFeePercentage() external view returns (uint256)",
  "function getRate() external view returns (uint256)",
  "function getNormalizedWeights() external view returns (uint256[] memory)",
  "function onSwap(uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out) external view returns (uint256)",
  "function totalSupply() external view returns (uint256)",
  "function getSpotPrice(uint256 tokenInIndex, uint256 tokenOutIndex) external view returns (uint256)",
];
const balancerPool = new ethers.Contract(address, BPoolABI, provider); //todo: not working?

// const contract = balancerPool;

async function getPricesInEachOther(fromCrypto, toCrypto) {
  // todo: rewrite to balancer V2
  // const [balanceFrom, balanceTo] = await Promise.all([
  //   contract.balances(fromIndex),
  //   contract.balances(toIndex),
  // ]);

  // const poolSize = await calculatePoolSize(
  //   ethers.utils.formatUnits(balanceFrom.toString(), fromCrypto.decimals),
  //   ethers.utils.formatUnits(balanceTo.toString(), toCrypto.decimals),
  //   fromCrypto,
  //   toCrypto
  // );

  // const secondPriceInFirst = await contract.callStatic.get_dy(
  //   fromIndex,
  //   toIndex,
  //   ethers.utils.parseUnits("1", fromCrypto.decimals)
  // );

  // const firstPriceInSecond = await contract.callStatic.get_dy(
  //   toIndex,
  //   fromIndex,
  //   ethers.utils.parseUnits("1", toCrypto.decimals)
  // );

  // return [
  //   poolSize,
  //   ethers.utils.formatUnits(
  //     firstPriceInSecond.toString(),
  //     fromCrypto.decimals
  //   ),
  //   ethers.utils.formatUnits(
  //     secondPriceInFirst.toString(),
  //     toCrypto.decimals
  //   ),
  // ];

  const [from, to] = [fromIndex, toIndex];
  //todo: not working!
  const priceInEachOther = await balancerPool.getSpotPrice(from, to);
  return;
  console.log(
    `Price ${toCrypto.symbol} in ${fromCrypto.symbol}: ${priceInEachOther}`
  );
  return priceInEachOther;
}

async function getOutAmount(fromAmount, fromCrypto, toCrypto, contract) {
  let [from, to] = [fromIndex, toIndex];
  if (fromCrypto.symbol !== cryptoASymbol) {
    [from, to] = [toIndex, fromIndex];
  }
  const outAmount = await contract.get_dy(
    from,
    to,
    ethers.utils.parseUnits(fromAmount.toString(), fromCrypto.decimals)
  ); //todo: change get_dy to balancer function maybe calcOutGivenIn
  return ethers.utils.formatUnits(outAmount.toString(), toCrypto.decimals);
}

async function calculateSlippage(fromCrypto, toCrypto) {
  // const [poolSize, firstPriceInSecond, secondPriceInFirst] =
  await getPricesInEachOther(fromCrypto, toCrypto);
  return;

  // calculateAndWriteToCSV(
  // DEX,
  // fromCrypto,
  // toCrypto,
  // poolSize,
  // secondPriceInFirst,
  // firstPriceInSecond,
  // fee,
  // getOutAmount,
  // contract
  // );
  amountTradeXSlippage(
    DEX,
    fromCrypto,
    toCrypto,
    poolSize,
    secondPriceInFirst,
    firstPriceInSecond,
    fee,
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

// async function prepareData(fromCrypto, toCrypto) {
//   const normalizedWeights = await balancerPool.getNormalizedWeights();
//   const normalizedWeightIn = normalizedWeights[0];
//   const normalizedWeightOut = normalizedWeights[1];
//   const rate = await balancerPool.getRate();
//   const swapFeePercentage = await balancerPool.getSwapFeePercentage();
//   const swapFee = swapFeePercentage / 1e18;
//   const totalSupply = await balancerPool.totalSupply();
//   console.log(`Swap fee: ${swapFeePercentage / 1e18}%`);
//   console.log(`Rate: ${rate / 1e18}`);
//   console.log(`Normalized weight in: ${normalizedWeightIn / 1e18}`);
//   console.log(`Normalized weight out: ${normalizedWeightOut / 1e18}`);
//   console.log(`Total supply: ${totalSupply / 1e18}`);

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

//   await getApproximateTokensAmountInPool(poolAddress, fromCrypto, toCrypto);
// }

// async function getOutAmount(fromAmount, fromCrypto, toCrypto, contract) {
//   // contract = balancerPool;
//   const outAmount = await contract.calcOutGivenIn(
//     tokenBalanceIn,
//     tokenWeightIn,
//     tokenBalanceOut,
//     tokenWeightOut,
//     ethers.utils.parseUnits(fromAmount.toString(), fromCrypto.decimals),
//     swapFee
//   );
//   return ethers.utils.formatUnits(outAmount.toString(), toCrypto.decimals);
// }

// async function calculateSlippage(fromCrypto, toCrypto) {
//   await prepareData(fromCrypto, toCrypto);
//   console.log(
//     `Price ${toCrypto.symbol} in ${fromCrypto.symbol}: ${secondPriceInFirst}`
//   );
//   const gasFee = ethers.utils.formatUnits(swapFee.toString(), 18);
//   const firstPriceInUSD = await redstone.getPrice(fromCrypto.symbol);
//   const results = await calculatePriceDifference(
//     pricesUSD,
//     firstPriceInUSD,
//     secondPriceInFirst,
//     gasFee,
//     fromCrypto,
//     toCrypto,
//     getOutAmount,
//     balancerPool
//   );
//   results.forEach((result) => console.log(result));
// }
