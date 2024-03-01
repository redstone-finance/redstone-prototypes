const axios = require("axios");
const fs = require("fs").promises; // Only for reading the JSON file
// import { RedstoneCommon } from "@redstone-finance/utils";
// import { sendErrorLog } from "@redstone-finance/lambda-common";
// const errorLogLambda = RedstoneCommon.getFromEnv("SEND_ERROR_LOG_LAMBDA_NAME");

const filePathSupportedPools = "./supported_pools.json";

const LST_LRT_addresses = {
  ETHx: "0xA35b1B31Ce002FBF2058D22F30f95D405200A15b",
  osETH: "0xf1C9acDc66974dFB6dEcB12aA385b9cD01190E38",
  swETH: "0xf951E335afb289353dc249e82926178EaC7DEd78",
  pxETH: "0x04C154b66CB340F3Ae24111CC767e0184Ed00Cc6",
  STONE: "0x7122985656e38BDC0302Db86685bb972b145bD3C", // -- NO DATA YET
  weETH: "0xCd5fE23C85820F7B72D0926FC9b05b43E359b7ee",
  rsETH: "0xA1290d69c65A6Fe4DF752f95823fae25cB99e5A7",
  ezETH: "0xbf5495Efe5DB9ce00f80364C8B423567e58d2110",
};

const config = {
  baseURL: "https://api.geckoterminal.com/api/v2",
  network: "eth",
  page: 1,
  sort: "h24_volume_usd_liquidity_desc", // "h24_volume_usd_desc",
};

function processPoolsData(responseData) {
  const filteredData = responseData.filter(
    (pool) => Number(pool.attributes.reserve_in_usd) > 50000
  );
  filteredData.sort(
    (a, b) =>
      Number(b.attributes.reserve_in_usd) - Number(a.attributes.reserve_in_usd)
  );

  const poolAddressesAndLiquidity = filteredData.map((pool) => ({
    address: pool.attributes.address,
    liquidity: Math.round(Number(pool.attributes.reserve_in_usd)),
  }));

  return poolAddressesAndLiquidity;
}

async function fetchPoolsForToken(tokenAddress) {
  try {
    const response = await axios.get(
      `${config.baseURL}/networks/${config.network}/tokens/${tokenAddress}/pools`,
      {
        params: {
          page: config.page,
          sort: config.sort,
        },
        headers: {
          accept: "application/json",
        },
      }
    );

    return processPoolsData(response.data.data);
  } catch (error) {
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.error("No pools for token found: " + tokenAddress);
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    return [];
  }
}

async function fetchPoolsForAllTokens() {
  const poolPromises = Object.entries(LST_LRT_addresses).map(
    async ([tokenName, tokenAddress]) => {
      const poolsData = await fetchPoolsForToken(tokenAddress);
      return { tokenName, poolsData: poolsData };
    }
  );

  const allPools = await Promise.all(poolPromises);

  const allTokenPools = allPools.reduce((acc, { tokenName, poolsData }) => {
    acc[tokenName] = poolsData;
    return acc;
  }, {});

  return allTokenPools;
}

async function getAllSupportedPools() {
  try {
    const data = await fs.readFile(filePathSupportedPools, "utf8");
    const poolsData = JSON.parse(data);
    return poolsData;
  } catch (error) {
    console.error("Error reading or parsing the file:", error);
    return [];
  }
}

async function findNewPools() {
  const supportedPools = await getAllSupportedPools();
  const recommendedPools = await fetchPoolsForAllTokens();

  const newPools = {};

  for (const [tokenName, pools] of Object.entries(recommendedPools)) {
    const supportedPoolsForToken = supportedPools[tokenName]
      ? supportedPools[tokenName].map((pool) => pool.address)
      : [];

    const newPoolsForToken = pools.filter(
      (pool) => !supportedPoolsForToken.includes(pool.address)
    );

    if (newPoolsForToken.length > 0) {
      newPools[tokenName] = newPoolsForToken;
    }
  }

  return newPools;

  console.log("New Pools:");
  for (const [tokenName, pools] of Object.entries(newPools)) {
    console.log(`\n${tokenName}:`);
    pools.forEach((pool) => {
      console.log(`Address: ${pool.address}, Liquidity: ${pool.liquidity}`);
    });
  }
}

async function findNewPoolsAndSendAlert() {
  const newPools = await findNewPools();

//   console.log(newPools);

  let alertMessage = "⛔️ New pools detected:\n";

  let newPoolsFound = false;
  for (const [tokenName, pools] of Object.entries(newPools)) {
    if (pools.length > 0) {
      newPoolsFound = true;
      alertMessage += `\n${tokenName}:\n`;
      pools.forEach((pool) => {
        alertMessage += `Address: ${pool.address}, Liquidity: ${pool.liquidity}\n`;
      });
    }
  }

  if (newPoolsFound) {
    console.log(alertMessage);
    // await sendErrorLog(errorLogLambda, alertMessage);
  }
}

findNewPoolsAndSendAlert();


// const networkId = "eth";
// const COINGECKO_API_KEY = "CG-PRO-API-KEY";

// async function fetchPoolsForTokenCoingecko(tokenAddress) {
//   try {
//     const response = await axios.get(
//       `https://pro-api.coingecko.com/api/v3/onchain/networks/${networkId}/tokens/${tokenAddress}/pools`,
//       {
//         headers: {
//           "x-cg-pro-api-key": COINGECKO_API_KEY,
//         },
//       }
//     );

//     return processPoolsData(response.data.data);
//   } catch (error) {
//     console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
//     console.error("No pools for token found: " + tokenAddress);
//     console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
//     return [];
//   }
// }
