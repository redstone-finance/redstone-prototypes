const ethers = require("ethers");
const dotenv = require("dotenv");
const path = require("path");
const constants = require("../../utils/constants");

dotenv.config({ path: path.resolve(__dirname, "../.env") });
const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;
const provider = new ethers.providers.JsonRpcProvider(
  `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`
);
const DEX = "Curve";

const abi = [
  "function get_dy(int128 i, int128 j, uint256 dx) external view returns (uint256)",
  "function coins(uint256 i) external view returns (address)",
  "function balances(uint256 i) external view returns (uint256)",
];

const poolAddress = "0x752ebeb79963cf0732e9c0fec72a49fd1defaeac";
const cryptoASymbol = "T";
const cryptoFromSymbol = cryptoASymbol;
const cryptoBSymbol = "WETH";
const fromIndex = 1;
const toIndex = 0;

const contract = new ethers.Contract(poolAddress, abi, provider);

async function getOutAmount(fromAmount, fromCrypto, toCrypto, contract) {
  let [from, to] = [fromIndex, toIndex];
  if (fromCrypto.symbol !== cryptoFromSymbol) {
    [from, to] = [toIndex, fromIndex];
  }
  const amountIn = ethers.utils.parseUnits(
    fromAmount.toString(),
    fromCrypto.decimals
  );

  console.log("amountIn: ", amountIn.toString());
  console.log("from: ", from);
  console.log("to: ", to);

  const outAmount = await contract.callStatic.get_dy(
    from,
    to,
    amountIn,
  );
  return ethers.utils.formatUnits(outAmount.toString(), toCrypto.decimals);
}

async function calculateSlippage() {
  const fromCrypto = constants[cryptoASymbol];
  const toCrypto = constants[cryptoBSymbol];
  //call getOutAmount
  const outAmount = await getOutAmount(10**18, fromCrypto, toCrypto, contract);
  console.log("outAmount: ", outAmount);
}

async function findSlippage() {
  await calculateSlippage();
}

findSlippage().catch((err) => {
  console.error("Error occurred:", err);
});
