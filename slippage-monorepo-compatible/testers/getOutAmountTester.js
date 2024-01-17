const ethers = require("ethers");
const dotenv = require("dotenv");
const path = require("path");
const { processUniswapV3Config, processCurveConfig } = require("../utils/poolsFromManifest");

dotenv.config({ path: path.resolve(__dirname, "../.env") });
const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;
const provider = new ethers.providers.JsonRpcProvider(
  `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`
);

const address = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6"; // Uniswap V3 Quoter address
const abiUniswapV3 = [
  "function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)",
];

const abiCurve = [
  "function get_dy(int128 i, int128 j, uint256 dx) external view returns (uint256)",
];
let pool, contract;

async function getOutAmountUniswapV3(
  fromAmount,
  fromCrypto,
  toCrypto
) {
  const amountOut = await contract.callStatic.quoteExactInputSingle(
    fromCrypto.address,
    toCrypto.address,
    pool.fee,
    ethers.utils.parseUnits(fromAmount.toString(), fromCrypto.decimals),
    0
  );
  return ethers.utils.formatUnits(amountOut.toString(), toCrypto.decimals);
}

async function getOutAmountCurve(fromAmount, fromCrypto, toCrypto) {
  const outAmount = await contract.callStatic.get_dy(
    fromCrypto.index,
    toCrypto.index,
    ethers.utils.parseUnits(fromAmount.toString(), fromCrypto.decimals)
  );
  return ethers.utils.formatUnits(outAmount.toString(), toCrypto.decimals);
}



const missedWithV3Quoter = [];
// const missedWithConfigQuoter = [];

const quotersList = [];

async function testGetOutAmountUniswapV3() {
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
    //   const amountOut = await getOutAmountUniswapV3(fromAmount, fromCrypto, toCrypto);
    // } catch (error) {
    //   missedWithConfigQuoter.push(pool);
    // }
    try {
      contract = new ethers.Contract(address, abiUniswapV3, provider);
      const amountOut = await getOutAmountUniswapV3(
        fromAmount,
        fromCrypto,
        toCrypto
      );
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


missedCurve = [];
async function testGetOutAmountCurve(){
  const pools = await processCurveConfig();
  for (const poolData of pools) {
    pool = poolData;
    const fromAmount = 1;
    const fromCrypto = pool.tokenA;
    const toCrypto = pool.tokenB;
    try {
      contract = new ethers.Contract(pool.poolAddress, abiCurve, provider);
      const amountOut = await getOutAmountCurve(fromAmount, fromCrypto, toCrypto);
    } catch (error) {
      missedCurve.push(pool);
    }
  }

  console.log("Missed with Curve: ", missedCurve.length);
  console.log("Total number of pools: ", pools.length);

  console.log("Missed with Curve: ", missedCurve);
}

// testGetOutAmountUniswapV3();
testGetOutAmountCurve();
