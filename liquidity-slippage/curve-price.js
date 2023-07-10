const ethers = require("ethers");
const dotenv = require("dotenv");
const redstone = require("redstone-api");
const constants = require("./constants");

dotenv.config();
const startPriceUSD = constants.startPriceUSD;

const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;

const provider = new ethers.providers.JsonRpcProvider(
  `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`
);

const address = "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7"; // DAI, USDC

const abi = [
  "function get_dy(int128 i, int128 j, uint256 dx) external view returns (uint256)",
  "function get_dx(int128 i, int128 j, uint256 dy) external view returns (uint256)",
];

const contract = new ethers.Contract(address, abi, provider);

// Get the price of DAI in USDC from Curve
async function getDAIPriceInUSDC() {
  const usdcToDai = await contract.get_dy(
    1,
    0,
    ethers.utils.parseUnits("1", 6)
  );
  const formattedPrice = ethers.utils.formatUnits(usdcToDai.toString(), 18);
  const trimmedPrice = Number(formattedPrice).toFixed(6);
  return trimmedPrice;
}

// Checks how much DAI you will receive for a given USDC amount
async function getDaiAmount(usdcAmount) {
  const daiAmount = await contract.get_dy(
    1,
    0,
    ethers.utils.parseUnits(usdcAmount.toString(), 6)
  );
  return Number(ethers.utils.formatUnits(daiAmount.toString(), 18)).toFixed(6);
}

async function calculateDaiAmount() {
  const daiPriceInUSDC = await getDAIPriceInUSDC();
  console.log("Price DAI in USDC:", daiPriceInUSDC);

  const usdcPriceInUSD = await redstone.getPrice("USDC");
  let usdcAmount = Number(startPriceUSD / usdcPriceInUSD.value).toFixed(6);
  let currentPrice = daiPriceInUSDC;

  let receivedDaiAmount = 0;
  let expectedDaiAmount = 0;
  let jumps = 0;
  while (receivedDaiAmount * 2 >= expectedDaiAmount) {
    jumps++;
    receivedDaiAmount = await getDaiAmount(usdcAmount);
    expectedDaiAmount = usdcAmount / currentPrice;

    const differencePercentage =
      ((receivedDaiAmount - expectedDaiAmount) / expectedDaiAmount) * 100;
    const priceInUSD = usdcPriceInUSD.value * usdcAmount;

    console.log(
      `For ${usdcAmount} USDC (${priceInUSD.toFixed(
        2
      )} USD), received DAI: ${receivedDaiAmount}, expected DAI: ${expectedDaiAmount}, difference: ${differencePercentage.toFixed(
        2
      )}%`
    );
    usdcAmount *= 2;
  }
  console.log(
    `Jumps (the higher, the bigger pool, price harder to manipulate): ${jumps}`
  );
}

calculateDaiAmount().catch((err) => {
  console.error("Error occurred:", err);
});
