const ethers = require("ethers");
const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.resolve(__dirname, "../.env") });
const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;

const provider = new ethers.providers.JsonRpcProvider(
  `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`
);

const tokenAddress = "0xc0c293ce456ff0ed870add98a0828dd4d2903dbf";

const tokenAbi = [
  {
    constant: true,
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
];

const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, provider);

function getTokenSymbol() {
  return tokenContract.symbol();
}

module.exports = getTokenSymbol;

// getTokenSymbol()
//   .then((symbol) => console.log("Token symbol:", symbol))
//   .catch((error) => console.error("Error occurred:", error));
