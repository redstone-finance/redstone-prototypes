const axios = require("axios");
// const { ethers } = require('ethers');
// const provider = new ethers.providers.JsonRpcProvider('URL_DO_RPC');
const hermesApiBaseUrl = "https://hermes.pyth.network";

// https://pyth.network/developers/price-feed-ids
const tokenIds = {
  ETH: "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
  BTC: "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
  USDC: "0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a",
  USDT: "0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b",
};

async function getPricesForTokens(tokenIdsArray, publishTime) {
  try {
    const idsParam = tokenIdsArray.map((id) => `ids[]=${id}`).join("&");
    const url = `${hermesApiBaseUrl}/v2/updates/price/${publishTime}?${idsParam}`;

    const response = await axios.get(url, {
      headers: { accept: "application/json" },
    });
    return response.data.parsed;
  } catch (error) {
    console.error("Failed to fetch price data:", error.message);
    return null;
  }
}

async function getPricesForTokensFromBlockToBlock(startBlock, endBlock) {
  const startTimestamp = 1709112229;
  // (await provider.getBlock(startBlock)).timestamp;
  // const endTimestamp = (await provider.getBlock(endBlock)).timestamp;

  const tokenIdsArray = Object.values(tokenIds);
  const priceData = await getPricesForTokens(tokenIdsArray, startTimestamp);

  if (priceData) {
    priceData.forEach((token) => {
      const expoAdjustedPrice =
        Number(token.price.price) * Math.pow(10, token.price.expo);
      console.log(`ID: ${token.id}`);
      console.log(`Price: ${expoAdjustedPrice.toFixed(2)}`);
      console.log(`Publish Time: ${token.price.publish_time}`);
      console.log("-----------------------------");
    });
  } else {
    console.log("No price data available");
  }
}

const startBlock = 123456; 
const endBlock = 123556;
getPricesForTokensFromBlockToBlock(startBlock, endBlock);
