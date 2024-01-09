const ethers = require("ethers");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../.env") });
const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;

const provider = new ethers.providers.JsonRpcProvider(
  `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`
);

// Replace with your crypto address
// const cryptoAddress = "0x8b12bd54ca9b2311960057c8f3c88013e79316e3";
const cryptoAddress = process.argv[2];
if (!cryptoAddress) {
  console.error(
    "Crypto address is missing. Usage: decimals.js <cryptoAddress>"
  );
  process.exit(1);
}

async function getDecimals() {
  const contract = new ethers.Contract(
    cryptoAddress,
    ["function decimals() view returns (uint8)"],
    provider
  );
  const decimals = await contract.decimals();
  return decimals;
}

getDecimals()
  .then((decimals) => {
    console.log("Decimals:", decimals);
  })
  .catch((error) => {
    console.error("Error:", error);
  });
