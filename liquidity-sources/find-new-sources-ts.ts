import axios from "axios";
import fs from "fs/promises"; // Only for reading the JSON file
// import { RedstoneCommon } from "@redstone-finance/utils";
// import { sendErrorLog } from "@redstone-finance/lambda-common";
// const errorLogLambda = RedstoneCommon.getFromEnv("SEND_ERROR_LOG_LAMBDA_NAME");

interface Pool {
  address: string;
  liquidity: number;
}

interface PoolsData {
  [key: string]: Pool[];
}

const filePathSupportedPools = "./supported_pools.json";

const LST_LRT_addresses: { [key: string]: string } = {
  ETHx: "0xA35b1B31Ce002FBF2058D22F30f95D405200A15b",
  osETH: "0xf1C9acDc66974dFB6dEcB12aA385b9cD01190E38",
  swETH: "0xf951E335afb289353dc249e82926178EaC7DEd78",
  pxETH: "0x04C154b66CB340F3Ae24111CC767e0184Ed00Cc6",
  STONE: "0x7122985656e38BDC0302Db86685bb972b145bD3C",
  weETH: "0xCd5fE23C85820F7B72D0926FC9b05b43E359b7ee",
  rsETH: "0xA1290d69c65A6Fe4DF752f95823fae25cB99e5A7",
  ezETH: "0xbf5495Efe5DB9ce00f80364C8B423567e58d2110",
};

const config = {
  baseURL: "https://api.geckoterminal.com/api/v2",
  network: "eth",
  page: 1,
  sort: "h24_volume_usd_liquidity_desc",
};

function processPoolsData(responseData: any[]): Pool[] {
  const filteredData = responseData.filter(
    (pool) => Number(pool.attributes.reserve_in_usd) > 50000
  );
  filteredData.sort(
    (a, b) =>
      Number(b.attributes.reserve_in_usd) - Number(a.attributes.reserve_in_usd)
  );

  const poolAddressesAndLiquidity: Pool[] = filteredData.map((pool) => ({
    address: pool.attributes.address,
    liquidity: Math.round(Number(pool.attributes.reserve_in_usd)),
  }));

  return poolAddressesAndLiquidity;
}

async function fetchPoolsForToken(tokenAddress: string): Promise<Pool[]> {
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

async function fetchPoolsForAllTokens(): Promise<PoolsData> {
  const poolPromises = Object.entries(LST_LRT_addresses).map(
    async ([tokenName, tokenAddress]) => {
      const poolsData: Pool[] = await fetchPoolsForToken(tokenAddress);
      return { tokenName, poolsData };
    }
  );

  const allPools = await Promise.all(poolPromises);

  const allTokenPools: PoolsData = allPools.reduce(
    (acc: PoolsData, { tokenName, poolsData }) => {
      acc[tokenName] = poolsData;
      return acc;
    },
    {} as PoolsData
  );

  return allTokenPools;
}

async function getAllSupportedPools(): Promise<PoolsData> {
  try {
    const data = await fs.readFile(filePathSupportedPools, "utf8");
    const poolsData: PoolsData = JSON.parse(data);
    return poolsData;
  } catch (error) {
    console.error("Error reading or parsing the file:", error);
    return {};
  }
}

async function findNewPools(): Promise<PoolsData> {
  const supportedPools: PoolsData = await getAllSupportedPools();
  const recommendedPools: PoolsData = await fetchPoolsForAllTokens();

  const newPools: PoolsData = {};

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
}

async function findNewPoolsAndSendAlert(): Promise<void> {
  const newPools: PoolsData = await findNewPools();

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
  } else {
    console.log("No new pools found.");
  }
}

findNewPoolsAndSendAlert();
