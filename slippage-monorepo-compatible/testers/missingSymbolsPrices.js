const { processUniswapV3Config } = require("../utils/poolsFromManifest");
const { getTokenPriceInUSD } = require("../utils/slippage");

const missingTokens = [];
const foundTokens = [];

async function findMissingPrices() {
  const pools = await processUniswapV3Config();
  for (const poolData of pools) {
    pool = poolData;
    tokenA = pool.tokenA;
    tokenB = pool.tokenB;

    if (!foundTokens.includes(tokenA.symbol) && !missingTokens.includes(tokenA.symbol)) {
      try {
        const price = await getTokenPriceInUSD(tokenA.symbol);
        foundTokens.push(tokenA.symbol);
      } catch (error) {
        missingTokens.push(tokenA.symbol);
      }
    }
    if (!foundTokens.includes(tokenB.symbol) && !missingTokens.includes(tokenB.symbol)) {
      try {
        const price = await getTokenPriceInUSD(tokenB.symbol);
        foundTokens.push(tokenB.symbol);
      } catch (error) {
        missingTokens.push(tokenB.symbol);
      }
    }
  }
  console.log("Found tokens: ", foundTokens.length);
  console.log("Missing tokens: ", missingTokens.length);

  console.log("Missing tokens: ", missingTokens);
}

findMissingPrices();
