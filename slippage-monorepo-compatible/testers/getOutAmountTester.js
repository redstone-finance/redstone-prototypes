const ethers = require("ethers");
const dotenv = require("dotenv");
const path = require("path");
const { processUniswapV3Config } = require("../utils/poolsFromManifest");

dotenv.config({ path: path.resolve(__dirname, "../.env") });
const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;
const provider = new ethers.providers.JsonRpcProvider(
  `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`
);

const address = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6"; // Uniswap V3 Quoter address
const abi = [
  "function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)",
];
let pool, contract;

// const contract = new ethers.Contract(address, abi, provider);

async function getOutAmount(fromAmount, fromCrypto, toCrypto) {
  const amountOut = await contract.callStatic.quoteExactInputSingle(
    fromCrypto.address,
    toCrypto.address,
    pool.fee,
    ethers.utils.parseUnits(fromAmount.toString(), fromCrypto.decimals),
    0
  );
  return ethers.utils.formatUnits(amountOut.toString(), toCrypto.decimals);
}

const missedWithV3Quoter = [];
// const missedWithConfigQuoter = [];

const quotersList = [];

async function testGetOutAmount() {
  const pools = await processUniswapV3Config();
  for (const poolData of pools) {
    // if (!quotersList.includes(poolData.quoterAddress)) {
    //   quotersList.push(poolData.quoterAddress);
    // }

    pool = poolData;
    const fromAmount = 1;
    const fromCrypto = pool.tokenA;
    const toCrypto = pool.tokenB;
    // try {
    //   contract = new ethers.Contract(pool.quoterAddress, abi, provider);
    //   const amountOut = await getOutAmount(fromAmount, fromCrypto, toCrypto);
    // } catch (error) {
    //   missedWithConfigQuoter.push(pool);
    // }
    try {
      contract = new ethers.Contract(address, abi, provider);
      const amountOut = await getOutAmount(fromAmount, fromCrypto, toCrypto);
    } catch (error) {
      missedWithV3Quoter.push(pool);
    }
  }

  //   console.log("Quoters list: ", quotersList);

  console.log("Missed with V3 Quoter: ", missedWithV3Quoter.length);
  //   console.log("Missed with Config Quoter: ", missedWithConfigQuoter.length);
  console.log("Total number of pools: ", pools.length);

  console.log("Missed with V3 Quoter: ", missedWithV3Quoter);
  //   console.log("Missed with Config Quoter: ", missedWithConfigQuoter);
}

testGetOutAmount();
