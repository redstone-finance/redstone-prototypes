const axios = require("axios");
const hermesApiBaseUrl = "https://hermes.pyth.network";
const decimalsAccuracy = 2; // Adjusting has impact on filtering out repeated prices

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
    return (
      response.data.parsed.map((token) => {
        return {
          symbol: Object.keys(tokenIds).find(
            (symbol) => tokenIds[symbol] === "0x" + token.id
          ),
          id: token.id,
          price: Number(
            token.price.price * Math.pow(10, token.price.expo)
          ).toFixed(decimalsAccuracy),
          timestamp: token.price.publish_time,
        };
      }) || []
    );
  } catch (error) {
    console.error("Failed to fetch price data:", error.message);
    return null;
  }
}

function generateTimestamps(startTimestamp, endTimestamp) {
  return Array.from(
    { length: endTimestamp - startTimestamp + 1 },
    (_, index) => startTimestamp + index
  );
}

function filterConsecutiveDuplicatePrices(priceData) {
  Object.keys(priceData).forEach((token) => {
    priceData[token] = priceData[token].filter(
      (entry, index, array) =>
        index === 0 ||
        index === array.length - 1 ||
        entry.price !== array[index - 1].price
    );
  });
}

function restructurePriceData(priceData) {
  const structuredPriceData = {};
  priceData.forEach((data) => {
    if (data) {
      data.forEach((token) => {
        if (!structuredPriceData[token.symbol]) {
          structuredPriceData[token.symbol] = [];
        }
        structuredPriceData[token.symbol].push({
          price: token.price,
          timestamp: token.timestamp,
        });
      });
    }
  });

  filterConsecutiveDuplicatePrices(structuredPriceData);
  return structuredPriceData;
}

async function getPricesForTokensFromTimestampToTimestamp(
  startTimestamp,
  endTimestamp
) {
  const timestamps = generateTimestamps(startTimestamp, endTimestamp);
  const priceDataPromises = timestamps.map((timestamp) =>
    getPricesForTokens(Object.values(tokenIds), timestamp)
  );

  const priceData = await Promise.all(priceDataPromises);

  // if (priceData) {
  //   console.log("Price data:", priceData);
  // } else {
  //   console.log("No price data available");
  // }
  // return priceData || [];
  //for each token, build object with timestamp and price
  //return array of objects

  const structuredPriceData = restructurePriceData(priceData);
  console.log("Structured price data:", structuredPriceData);
  Object.keys(structuredPriceData).forEach((token) => {
    console.log(
      `Token: ${token}, length: ${structuredPriceData[token].length}`
    );
  });
  return structuredPriceData;
}

async function getPricesForTokensFromTimestamp(startTimestamp) {
  endTimestamp = Math.floor(Date.now() / 1000);
  const priceData = getPricesForTokensFromTimestampToTimestamp(
    startTimestamp,
    endTimestamp
  );
}

async function getPricesForTokensLast6mins() {
  const endTimestamp = Math.floor(Date.now() / 1000);
  const startTimestamp = endTimestamp - 6 * 60;
  const priceData = getPricesForTokensFromTimestampToTimestamp(
    startTimestamp,
    endTimestamp
  );
}

// const startTimestamp = 1709112229;
// getPricesForTokensFromTimestamp(startTimestamp);
getPricesForTokensLast6mins();
