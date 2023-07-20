const ethers = require("ethers");
const dotenv = require("dotenv");
const path = require("path");
const redstone = require("redstone-api");
const constants = require("../utils/constants");
const {
  calcPriceSecondInFirst,
  calculatePoolSize,
  getApproximateTokensAmountInPool,
  calculatePriceDifference,
} = require("../utils/common");

dotenv.config({ path: path.resolve(__dirname, "../.env") });
const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;
const pricesUSD = constants.pricesUnrelated;

cryptoASymbol = "DAI";
cryptoBSymbol = "USDC";
const cryptoA = constants[cryptoASymbol];
const cryptoB = constants[cryptoBSymbol];

const provider = new ethers.providers.JsonRpcProvider(
  `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`
);

// TODO: Need to manually change pool address...
const address = "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7"; // DAI, USDC, USDT
// const address = "0x4CA9b3063Ec5866A4B82E437059D2C43d1be596F"; // HBTC, WBTC
// const address = "0xc5424B857f758E906013F3555Dad202e4bdB4567"; // ETH, sETH
// const address = "0xD51a44d3FaE010294C616388b506AcdA1bfAAE46"; // WBTC, WETH, USDT

let fromIndex = -1;
let toIndex = -1;

const abi = [
  "function get_dy(int128 i, int128 j, uint256 dx) external view returns (uint256)",
  "function coins(uint256 i) external view returns (address)",
  "function balances(uint256 i) external view returns (uint256)",
  "function get_virtual_price() external view returns (uint256)",
  "function exchange(int128 i, int128 j, uint256 dx, uint256 min_dy) external returns (uint256)",
  "function exchange_underlying(int128 i, int128 j, uint256 dx, uint256 min_dy) external returns (uint256)",
];

const contract = new ethers.Contract(address, abi, provider);

async function getSecondCryptoPriceInFirstCrypto(fromCrypto, toCrypto) {
  const [balanceFrom, balanceTo] = await Promise.all([
    contract.balances(fromIndex),
    contract.balances(toIndex),
  ]);

  const poolSize = await calculatePoolSize(
    ethers.utils.formatUnits(balanceFrom.toString(), fromCrypto.decimals),
    ethers.utils.formatUnits(balanceTo.toString(), toCrypto.decimals),
    fromCrypto.symbol,
    toCrypto.symbol
  );
  console.log(poolSize);
  // await getApproximateTokensAmountInPool(address, fromCrypto, toCrypto);

  //TODO: Unable to make any transaction... on contract "0xD51a44d3FaE010294C616388b506AcdA1bfAAE46"
  const secondPriceInFirst = await contract.callStatic.get_dy(
    fromIndex,
    toIndex,
    ethers.utils.parseUnits("1", fromCrypto.decimals)
  );
  console.log(secondPriceInFirst.toString());

  return ethers.utils.formatUnits(
    secondPriceInFirst.toString(),
    toCrypto.decimals
  );
}

async function getOutAmount(fromAmount, fromCrypto, toCrypto, contract) {
  const outAmount = await contract.get_dy(
    fromIndex,
    toIndex,
    ethers.utils.parseUnits(fromAmount.toString(), fromCrypto.decimals)
  );
  return ethers.utils.formatUnits(outAmount.toString(), toCrypto.decimals);
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

  const gasFee = 0.0;
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
  let i = 0;
  while (fromIndex === -1 || toIndex === -1) {
    const coinAddress = await contract.coins(i);
    if (coinAddress === cryptoA.address) fromIndex = i;
    if (coinAddress === cryptoB.address) toIndex = i;
    if (i++ > 5) {
      console.log("Wrong pool address");
      return;
    }
  }
  await calculateSlippage(cryptoA, cryptoB);
  [fromIndex, toIndex] = [toIndex, fromIndex];
  await calculateSlippage(cryptoB, cryptoA);
}

findSlippage().catch((err) => {
  console.error("Error occurred:", err);
});
