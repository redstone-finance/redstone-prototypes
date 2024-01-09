const ethers = require("ethers");
const dotenv = require("dotenv");
const path = require("path");
const constants = require("../utils/constants");
const poolsInfo = require("../utils/pools-info");
const {
  calculatePoolSize,
  amountTradeXSlippageIndependent,
} = require("../utils/common");

dotenv.config({ path: path.resolve(__dirname, "../.env") });
const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;
const provider = new ethers.providers.JsonRpcProvider(
  `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`
);
const DEX = "Curve";
let fromIndex = -1;
let toIndex = -1;
let cryptoFromSymbol;

const abi = [
  "function get_dy(int128 i, int128 j, uint256 dx) external view returns (uint256)",
  "function coins(uint256 i) external view returns (address)",
  "function balances(uint256 i) external view returns (uint256)",
];
let contract;

async function getPoolSize(fromCrypto, toCrypto) {
  const [balanceFrom, balanceTo] = await Promise.all([
    contract.balances(fromIndex),
    contract.balances(toIndex),
  ]);

  return await calculatePoolSize(
    ethers.utils.formatUnits(balanceFrom.toString(), fromCrypto.decimals),
    ethers.utils.formatUnits(balanceTo.toString(), toCrypto.decimals),
    fromCrypto,
    toCrypto
  );
}

async function getOutAmount(fromAmount, fromCrypto, toCrypto, contract) {
  let [from, to] = [fromIndex, toIndex];
  if (fromCrypto.symbol !== cryptoFromSymbol) {
    [from, to] = [toIndex, fromIndex];
  }
  const outAmount = await contract.callStatic.get_dy(
    from,
    to,
    ethers.utils.parseUnits(fromAmount.toString(), fromCrypto.decimals)
  );
  return ethers.utils.formatUnits(outAmount.toString(), toCrypto.decimals);
}

async function calculateSlippage(pool) {
  console.log(
    `Started calculating slippage on ${DEX} for pool: `,
    pool.poolAddress,
    "...",
    pool.cryptoASymbol,
    pool.cryptoBSymbol
  );
  const fromCrypto = constants[pool.cryptoASymbol];
  const toCrypto = constants[pool.cryptoBSymbol];
  const poolSize = await getPoolSize(fromCrypto, toCrypto);

  await amountTradeXSlippageIndependent(
    DEX,
    fromCrypto,
    toCrypto,
    poolSize,
    getOutAmount,
    contract
  );
}

async function findSlippage() {
  const pools = poolsInfo.poolsInfo[DEX];
  for (const pool of pools) {
    contract = new ethers.Contract(pool.poolAddress, abi, provider);
    let i = 0;
    fromIndex = -1;
    toIndex = -1;
    cryptoFromSymbol = pool.cryptoASymbol;
    while (fromIndex === -1 || toIndex === -1) {
      const coinAddress = await contract.coins(i);
      if (
        coinAddress.toLowerCase() ===
        constants[pool.cryptoASymbol].address.toLowerCase()
      )
        fromIndex = i;
      if (
        coinAddress.toLowerCase() ===
        constants[pool.cryptoBSymbol].address.toLowerCase()
      )
        toIndex = i;
      if (i++ > 5) {
        console.log("Pool address doesn't match token addresses");
        return;
      }
    }
    await calculateSlippage(pool);
  }
}

findSlippage().catch((err) => {
  console.error("Error occurred:", err);
});
