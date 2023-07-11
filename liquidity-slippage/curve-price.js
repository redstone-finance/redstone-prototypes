const ethers = require("ethers");
const dotenv = require("dotenv");
const redstone = require("redstone-api");
const constants = require("./constants");

dotenv.config();
const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;
const startPriceUSD = constants.startPriceUSD;

cryptoASymbol = "USDC";
cryptoBSymbol = "DAI";
const cryptoA = constants[cryptoASymbol];
const cryptoB = constants[cryptoBSymbol];

const provider = new ethers.providers.JsonRpcProvider(
  `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`
);

const address = "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7"; // DAI, USDC
let fromIndex = 1; // USDC
let toIndex = 0; // DAI

const abi = [
  "function get_dy(int128 i, int128 j, uint256 dx) external view returns (uint256)",
  "function get_dx(int128 i, int128 j, uint256 dy) external view returns (uint256)",
];

const contract = new ethers.Contract(address, abi, provider);

async function getSecondCryptoPriceInFirstCrypto(fromCrypto, toCrypto) {
  const secondPriceInFirst = await contract.get_dy(
    fromIndex,
    toIndex,
    ethers.utils.parseUnits("1", fromCrypto.decimals)
  );
  const formattedPrice = ethers.utils.formatUnits(
    secondPriceInFirst.toString(),
    toCrypto.decimals
  );
  return Number(formattedPrice).toFixed(fromCrypto.decimals);
}

async function getOutAmount(fromAmount, fromCrypto, toCrypto) {
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
  let fromAmount = Number(startPriceUSD / firstPriceInUSD.value).toFixed(
    fromCrypto.decimals
  );
  let currentPrice = secondPriceInFirst;
  let receivedSecondAmount = 0;
  let expectedSecondAmount = 0;
  let jumps = 0;
  while (receivedSecondAmount * 2 >= expectedSecondAmount) {
    jumps++;
    receivedSecondAmount = await getOutAmount(fromAmount, fromCrypto, toCrypto);
    expectedSecondAmount = fromAmount / currentPrice;

    const differencePercentage = (
      ((receivedSecondAmount - expectedSecondAmount) / expectedSecondAmount) *
        100 +
      0.2
    ).toFixed(2);
    const priceInUSD = (firstPriceInUSD.value * fromAmount).toFixed(2);
    console.log(
      `For ${fromAmount} ${fromCrypto.symbol} (${priceInUSD} USD), received ${toCrypto.symbol}: ${receivedSecondAmount}, expected ${toCrypto.symbol}: ${expectedSecondAmount}, difference: ${differencePercentage}%`
    );
    fromAmount *= 2;
  }
  console.log(
    `Jumps (the higher, the bigger pool, price harder to manipulate): ${jumps}`
  );
}

async function findSlippage() {
  await calculateSlippage(cryptoA, cryptoB);
  fromIndex = 0;
  toIndex = 1;
  await calculateSlippage(cryptoB, cryptoA);
}

findSlippage().catch((err) => {
  console.error("Error occurred:", err);
});
