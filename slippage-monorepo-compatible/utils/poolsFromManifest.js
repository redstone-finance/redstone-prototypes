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
      const DEX = "SushiSwap"

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

// async function main() {
//   const pools = await processUniV2LikeConfig();
//   console.log(pools);
// }
// main();

module.exports = {
  processUniswapV3Config,
  processUniV2LikeConfig,
};
