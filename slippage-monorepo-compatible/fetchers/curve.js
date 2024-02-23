const ethers = require("ethers");
const dotenv = require("dotenv");
const path = require("path");
const { processCurveConfig } = require("../utils/poolsFromManifest");
const { calculatePoolSlippage } = require("../utils/slippage");

dotenv.config({ path: path.resolve(__dirname, "../.env") });
const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;
const provider = new ethers.providers.JsonRpcProvider(
  `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`
);

const abi = [
  "function get_dy(int128 i, int128 j, uint256 dx) external view returns (uint256)",
];
let pool, contract;

async function getOutAmount(fromAmount, fromCrypto, toCrypto) {
  const outAmount = await contract.callStatic.get_dy(
    fromCrypto.index,
    toCrypto.index,
    ethers.utils.parseUnits(fromAmount.toString(), fromCrypto.decimals)
  );
  return ethers.utils.formatUnits(outAmount.toString(), toCrypto.decimals);
}

async function findPoolSlippage() {
  await calculatePoolSlippage(
    pool.DEX,
    pool.poolAddress,
    pool.tokenA,
    pool.tokenB,
    getOutAmount
  );
}

async function findPoolsSlippages() {
  const pools = await processCurveConfig();

  for (const [index, poolData] of pools.entries()) {
    console.log(`Processing pool ${index + 1}/${pools.length}`);
    pool = poolData;
    contract = new ethers.Contract(pool.poolAddress, abi, provider);
    await findPoolSlippage();
  }
}

// findPoolsSlippages().catch((err) => {
//   console.error("Error occurred:", err);
// });

module.exports = findPoolsSlippages;
