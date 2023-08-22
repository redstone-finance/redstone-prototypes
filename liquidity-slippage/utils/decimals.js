const ethers = require("ethers");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../.env") });
const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;

const provider = new ethers.providers.JsonRpcProvider(
  `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`
);

// Replace with your crypto address
const cryptoAddress = "0xf951e335afb289353dc249e82926178eac7ded78";

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
