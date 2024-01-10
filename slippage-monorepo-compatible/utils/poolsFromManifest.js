const fs = require("fs").promises;
const path = require("path");

function keyToDEX(key) {
  return key
    .split("-")
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getTokenIndexedFromDetails(details, index) {
  return {
    symbol: details[`token${index}Symbol`],
    address: details[`token${index}Address`],
    decimals: details[`token${index}Decimals`],
  };
}

function getTwoTokensFromDetails(details) {
  return [
    getTokenIndexedFromDetails(details, 0),
    getTokenIndexedFromDetails(details, 1),
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
        const [tokenA, tokenB] = getTwoTokensFromDetails(details);
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

// async function main() {
//   const pools = await processUniswapV3Config();
//   console.log(pools);
// }
// main();

module.exports = {
  processUniswapV3Config,
};
