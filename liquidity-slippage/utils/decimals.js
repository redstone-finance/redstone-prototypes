const ethers = require("ethers");
const dotenv = require("dotenv");

dotenv.config();
const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;

const provider = new ethers.providers.JsonRpcProvider(
  `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`
);

// Replace with your crypto address
const cryptoAddress = "0x78a0A62Fba6Fb21A83FE8a3433d44C73a4017A6f";

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
