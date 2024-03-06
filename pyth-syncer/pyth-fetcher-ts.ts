import axios from "axios";

const hermesApiBaseUrl = "https://hermes.pyth.network";
const decimalsAccuracy = 2; // Adjusting has impact on filtering out repeated prices

interface TokenIds {
  [key: string]: string;
}

interface PriceData {
  symbol?: string;
  id?: string;
  price: string;
  timestamp: number;
}

const tokenIds: TokenIds = {
  ETH: "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
  BTC: "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
  USDC: "0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a",
  USDT: "0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b",
};

async function getPricesForTokens(
  tokenIdsArray: string[],
  publishTime: number
): Promise<PriceData[] | null> {
  try {
    const idsParam = tokenIdsArray.map((id) => `ids[]=${id}`).join("&");
    const url = `${hermesApiBaseUrl}/v2/updates/price/${publishTime}?${idsParam}`;

    const response = await axios.get(url, {
      headers: { accept: "application/json" },
    });

    if (response.data && response.data.parsed) {
      return response.data.parsed.map((token: any) => ({
        symbol: Object.keys(tokenIds).find(
          (symbol) => tokenIds[symbol].toLowerCase() === "0x" + token.id.toLowerCase()
        ),
        id: token.id,
        price: Number(
          token.price.price * Math.pow(10, token.price.expo)
        ).toFixed(decimalsAccuracy),
        timestamp: token.price.publish_time,
      }));
    }

    return [];
  } catch (error: any) {
    console.error("Failed to fetch price data:", error.message);
    return null;
  }
}

function generateTimestamps(
  startTimestamp: number,
  endTimestamp: number
): number[] {
  return Array.from(
    { length: endTimestamp - startTimestamp + 1 },
    (_, index) => startTimestamp + index
  );
}

function filterConsecutiveDuplicatePrices(priceData: {
  [key: string]: PriceData[];
}): void {
  Object.keys(priceData).forEach((token) => {
    priceData[token] = priceData[token].filter(
      (entry, index, array) =>
        index === 0 ||
        index === array.length - 1 ||
        entry.price !== array[index - 1].price
    );
  });
}

function restructurePriceData(priceData: (PriceData[] | null)[]): {
  [key: string]: PriceData[];
} {
  const structuredPriceData: { [key: string]: PriceData[] } = {};
  priceData.forEach((data) => {
    if (data) {
      data.forEach((token) => {
        if (!structuredPriceData[token.symbol!]) {
          structuredPriceData[token.symbol!] = [];
        }
        structuredPriceData[token.symbol!].push({
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
  startTimestamp: number,
  endTimestamp: number
): Promise<{ [key: string]: PriceData[] }> {
  const timestamps = generateTimestamps(startTimestamp, endTimestamp);
  const priceDataPromises = timestamps.map((timestamp) =>
    getPricesForTokens(Object.values(tokenIds), timestamp)
  );

  const priceData = await Promise.all(priceDataPromises);
  const structuredPriceData = restructurePriceData(priceData);
  console.log("Structured price data:", structuredPriceData);
  Object.keys(structuredPriceData).forEach((token) => {
    console.log(
      `Token: ${token}, length: ${structuredPriceData[token].length}`
    );
  });
  return structuredPriceData;
}

async function getPricesForTokensLast6mins(): Promise<void> {
  const endTimestamp = Math.floor(Date.now() / 1000);
  const startTimestamp = endTimestamp - 6 * 60;
  await getPricesForTokensFromTimestampToTimestamp(
    startTimestamp,
    endTimestamp
  );
}

// Example usage
getPricesForTokensLast6mins();
