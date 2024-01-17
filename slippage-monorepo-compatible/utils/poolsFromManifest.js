const fs = require("fs").promises;
const path = require("path");

function keyToDEX(key) {
  return key
    .split("-")
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getTokenIndexedFromDetailsUniV3(details, index) {
  return {
    symbol: details[`token${index}Symbol`],
    address: details[`token${index}Address`],
    decimals: details[`token${index}Decimals`],
  };
}

function getTokenIndexedFromDetailsUniV2(details, index) {
  return {
    symbol: details[`symbol${index}`],
    decimals: details[`symbol${index}Decimals`],
  };
}

function getTwoTokensFromDetailsUniV3(details) {
  return [
    getTokenIndexedFromDetailsUniV3(details, 0),
    getTokenIndexedFromDetailsUniV3(details, 1),
  ];
}

function getTwoTokensFromDetailsUniV2(details) {
  return [
    getTokenIndexedFromDetailsUniV2(details, 0),
    getTokenIndexedFromDetailsUniV2(details, 1),
  ];
}

async function processUniswapV3Config() {
  const filePath = path.join(
    __dirname,
    "../../../redstone-monorepo-priv/packages/oracle-node/src/fetchers/evm-chain/ethereum/uniswap-v3-on-chain/uniswap-v3-ethereum-fetchers-config.json"
  );

  try {
    const data = await fs.readFile(filePath, { encoding: "utf8" });
    const config = JSON.parse(data);
    const poolsInfo = [];

    Object.keys(config).forEach((key) => {
      const poolData = config[key];
      const DEX = keyToDEX(key);

      Object.values(poolData).forEach((details) => {
        const [tokenA, tokenB] = getTwoTokensFromDetailsUniV3(details);
        const poolInfo = {
          DEX: DEX,
          poolAddress: details.poolAddress,
          fee: details.fee,
          quoterAddress: details.quoterAddress,
          tokenA: tokenA,
          tokenB: tokenB,
        };
        poolsInfo.push(poolInfo);
      });
    });
    return poolsInfo;
  } catch (err) {
    console.error("Error while reading file:", err);
    throw err;
  }
}

async function processUniswapV2Config() {
  const filePath = path.join(
    __dirname,
    "../../../redstone-monorepo-priv/packages/oracle-node/src/fetchers/evm-chain/ethereum/uniswap-v2-on-chain/uniswap-v2-on-chain-fetchers-config.json"
  );

  try {
    const data = await fs.readFile(filePath, { encoding: "utf8" });
    const config = JSON.parse(data);
    const poolsInfo = [];

    Object.keys(config).forEach((key) => {
      const poolData = config[key];
      const DEX = keyToDEX(key);

      Object.values(poolData).forEach((details) => {
        const [tokenA, tokenB] = getTwoTokensFromDetailsUniV2(details);
        const poolInfo = {
          DEX: DEX,
          poolAddress: details.address,
          tokenA: tokenA,
          tokenB: tokenB,
        };
        poolsInfo.push(poolInfo);
      });
    });
    return poolsInfo;
  } catch (err) {
    console.error("Error while reading file:", err);
    throw err;
  }
}

async function processSushiSwapConfig() {
  const filePath = path.join(
    __dirname,
    "../../../redstone-monorepo-priv/packages/oracle-node/src/fetchers/evm-chain/ethereum/sushiswap-on-chain/sushiswap-ethereum-on-chain-fetchers-config.json"
  );

  try {
    const data = await fs.readFile(filePath, { encoding: "utf8" });
    const config = JSON.parse(data);
    const poolsInfo = [];

    Object.keys(config).forEach((key) => {
      const poolData = config[key];
      const DEX = "SushiSwap";

      Object.values(poolData).forEach((details) => {
        const [tokenA, tokenB] = getTwoTokensFromDetailsUniV2(details);
        const poolInfo = {
          DEX: DEX,
          poolAddress: details.address,
          tokenA: tokenA,
          tokenB: tokenB,
        };
        poolsInfo.push(poolInfo);
      });
    });
    return poolsInfo;
  } catch (err) {
    console.error("Error while reading file:", err);
    throw err;
  }
}

async function processUniV2LikeConfig() {
  const uniswapV2Pools = await processUniswapV2Config();
  const sushiSwapPools = await processSushiSwapConfig();
  const poolsInfo = [...uniswapV2Pools, ...sushiSwapPools];
  return poolsInfo;
}

function transformToJsonLikeString(dataString) {
  let transformed = dataString.replace(/(\w+):/g, '"$1":');
  transformed = transformed.replace(/ethereumProvider/g, `"ethereum"`);
  transformed = transformed.replace(/arbitrumProvider/g, `"arbitrum"`);
  transformed = transformed.replace(/"multiBlockConfig":\s*[\w_]+,\s*/g, "");
  transformed = transformed.replace(/,\s*}/g, " }");
  transformed = transformed.replace(/(\d)e(\d+)/g, (match, base, exponent) => {
    return exponent;
  });

  return "{\n" + transformed + "\n}";
}

async function processCurveConfig() {
  const filePath = path.join(
    __dirname,
    "../../../redstone-monorepo-priv/packages/oracle-node/src/fetchers/curve/curve-fetchers-config.ts"
  );

  try {
    const data = await fs.readFile(filePath, { encoding: "utf8" });
    const startSequence =
      "export const curveFetchersConfig: Record<string, PoolsConfig> = {";
    const endSequence = ",\n};";

    const startIndex = data.indexOf(startSequence);
    const endIndex = data.indexOf(endSequence, startIndex);

    const jsonLikeString = data
      .substring(startIndex + startSequence.length, endIndex)
      .trim();

    const transformedString = transformToJsonLikeString(jsonLikeString);
    const config = JSON.parse(transformedString);
    const poolsInfo = [];

    const DEX = "Curve";
    for (const poolName in config) {
      if (config.hasOwnProperty(poolName)) {
        const pool = config[poolName];
        for (const tokenName in pool) {
          if (pool.hasOwnProperty(tokenName)) {
            const tokenData = pool[tokenName];
            const tokenA = {
              symbol: tokenName,
              decimals: tokenData.tokenDecimalsMultiplier,
              index: tokenData.tokenIndex,
            };

            const tokenB = {
              symbol: tokenData.pairedToken,
              decimals: tokenData.pairedTokenDecimalsMultiplier,
              index: tokenData.pairedTokenIndex,
            };

            const poolInfo = {
              DEX: DEX,
              poolAddress: tokenData.address,
              functionName: tokenData.functionName,
              network: tokenData.provider,
              tokenA: tokenA,
              tokenB: tokenB,
            };
            poolsInfo.push(poolInfo);
          }
        }
      }
    }

    //TODO: in the future make support for arbitrum pools
    const filteredPools = poolsInfo.filter(
      (pool) => pool.network === "ethereum"
    );

    return filteredPools;
    // return poolsInfo;
  } catch (err) {
    console.error("Error while reading file:", err);
    throw err;
  }
}

// async function main() {
//   const pools = await processCurveConfig();
//   console.log(pools);
// }
// main();

module.exports = {
  processUniswapV3Config,
  processUniV2LikeConfig,
  processCurveConfig,
};
