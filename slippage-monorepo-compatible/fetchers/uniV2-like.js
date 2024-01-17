const ethers = require("ethers");
const dotenv = require("dotenv");
const path = require("path");
const { processUniV2LikeConfig } = require("../utils/poolsFromManifest");
const { calculatePoolSlippage } = require("../utils/slippage");

dotenv.config({ path: path.resolve(__dirname, "../.env") });
const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;
const provider = new ethers.providers.JsonRpcProvider(
  `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`
);

const abi = [
  "function getAmountsOut(uint256 amountIn, address[] memory path) public view returns (uint256[] memory amounts)",
];

const routerAddresses = {
  "Uniswap V2": "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
  SushiSwap: "0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f",
};
let pool, contract;

async function getOutAmount(fromAmount, fromCrypto, toCrypto) {
  const amounts = await contract.getAmountsOut(
    ethers.utils.parseUnits(fromAmount.toString(), fromCrypto.decimals),
    [fromCrypto.address, toCrypto.address]
  );
  return ethers.utils.formatUnits(amounts[1].toString(), toCrypto.decimals);
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
  const pools = await processUniV2LikeConfig();

  for (const [index, poolData] of pools.entries()) {
    console.log(`Processing pool ${index + 1}/${pools.length}`);
    pool = poolData;
    const routerAddress = routerAddresses[pool.DEX];
    contract = new ethers.Contract(routerAddress, abi, provider);
    await findPoolSlippage();
  }
}

findPoolsSlippages().catch((err) => {
  console.error("Error occurred:", err);
});
