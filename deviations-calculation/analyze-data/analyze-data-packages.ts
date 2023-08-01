import { CachedDataPackage, DataPackage } from "./data-packages.model";
import mongoose from "mongoose";
import axios from "axios";
import "dotenv/config";
const Big = require("big.js");

const mongoDbUrl = process.env.MONGO_DB_URL || "";

// USAGE: ts-node scripts/analyze-data-packages.ts

const symbol = "DAI";
const periodInDays = 5;
main(symbol, periodInDays);

const THRESHOLDS = [1, 0.5, 0.2, 0.1]; // in percent
const DATA_SERVICE_ID = "redstone-avalanche-prod";

interface DataPackagesGroupedBySigner {
  [signer: string]: CachedDataPackage[];
}

async function main(symbol: string, period: number = 30) {
  const END_TIMESTAMP = Date.now();
  const START_TIMESTAMP = END_TIMESTAMP - period * 24 * 60 * 60 * 1000;
  await analyzeApiData(symbol, period, START_TIMESTAMP, END_TIMESTAMP);

  await mongoose.connect(mongoDbUrl);
  console.log("MongoDB connected");
  const dataPackagesBySigner = await queryDataPackagesGroupedBySigner(
    symbol,
    START_TIMESTAMP,
    END_TIMESTAMP
  );

  const deviationsPerThreshold: {
    [threshold: string]: { [signer: string]: number };
  } = {};
  for (const threshold of THRESHOLDS) {
    deviationsPerThreshold[threshold] = {};
    for (const [signerAddress, dataPackages] of Object.entries(
      dataPackagesBySigner
    )) {
      let currentValue: number | undefined;
      let deviationsCount = 0;
      for (const dataPackage of dataPackages) {
        for (const dataPoint of dataPackage.dataPoints) {
          const newValue = Number(dataPoint.value);
          if (currentValue !== undefined) {
            if (getDeviationPercentage(newValue, currentValue) > threshold) {
              deviationsCount++;
              currentValue = newValue;
            }
          }
        }
      }
      deviationsPerThreshold[threshold][signerAddress] = deviationsCount;
      console.log(
        `Deviations count for threshold ${threshold}% and signer ${signerAddress}: ${deviationsCount}`
      );
    }
  }

  for (const threshold of THRESHOLDS) {
    console.log(`\nAverage deviations per day for threshold ${threshold}%:`);
    for (const [signerAddress, deviationsCount] of Object.entries(
      deviationsPerThreshold[threshold]
    )) {
      const averageDeviationsPerDay = deviationsCount / period;
      console.log(
        `${signerAddress}: ${averageDeviationsPerDay.toFixed(2)} deviations/day`
      );
    }
  }

  await mongoose.disconnect();
}

async function queryDataPackagesGroupedBySigner(
  symbol: string,
  START_TIMESTAMP: number,
  END_TIMESTAMP: number
): Promise<DataPackagesGroupedBySigner> {
  const dataPackages = await DataPackage.find(
    {
      timestampMilliseconds: {
        $gte: START_TIMESTAMP,
        $lte: END_TIMESTAMP,
      },
      dataFeedId: symbol,
      dataServiceId: DATA_SERVICE_ID,
    },
    { timestampMilliseconds: 1, signerAddress: 1, dataPoints: 1 }
  );
  const groupedBySigner: DataPackagesGroupedBySigner = {};
  for (const dataPackage of dataPackages) {
    if (!groupedBySigner[dataPackage.signerAddress]) {
      groupedBySigner[dataPackage.signerAddress] = [];
    }
    groupedBySigner[dataPackage.signerAddress].push(dataPackage);
  }
  for (const [signerAddress, dataPackages] of Object.entries(groupedBySigner)) {
    groupedBySigner[signerAddress] = dataPackages.sort(
      (a, b) => b.timestampMilliseconds - a.timestampMilliseconds
    );
  }
  return groupedBySigner;
}

// TODO: should we add repo as dependency and use this function instead of Big.js?
// yarn add git+ssh://git@github.com/username/redstone-oracles-monorepo.git
// import { calculateDeviationPercent } from "redstone-oracles-monorepo/packages/utils/src/math/index";
function getDeviationPercentage(a: number, b: number): number {
  if (typeof a !== "number" || typeof b !== "number") {
    throw new Error("Both arguments must be numbers.");
  }
  if (b === 0) {
    throw new Error("The second argument (b) cannot be zero.");
  }
  const prevValue = new Big(a.toString());
  const currValue = new Big(b.toString());
  const deviation = prevValue
    .minus(currValue)
    .div(currValue)
    .abs()
    .times(100)
    .toNumber();
  return deviation;
}

interface PriceData {
  provider: string;
  value: number;
  timestamp: number;
}

async function analyzeApiData(
  symbol: string,
  periodInDays: number,
  startTimestamp: number,
  endTimestamp: number
) {
  const prices = await queryRedstoneDataPackagesGroupedBySigner(
    symbol,
    periodInDays,
    startTimestamp,
    endTimestamp
  );
  handleDeviationsCalculationsFromApi(prices, periodInDays);
}

// Additional function to query data packages from Redstone API
async function queryRedstoneDataPackagesGroupedBySigner(
  symbol: string,
  periodInDays: number,
  startTimestamp: number,
  endTimestamp: number
): Promise<PriceData[]> {
  const TIMESTAMPS_INTERVAL = periodInDays * 24 * 60 * 60 * 1000;
  const DATA_SERVICE_INTERVAL = 60 * 1000;
  const pricesExpectedCount = TIMESTAMPS_INTERVAL / DATA_SERVICE_INTERVAL;
  const apiLimit = 3000;
  const chunksCount = Math.floor(pricesExpectedCount / apiLimit);

  const fetchFromApi = async (index: number) => {
    return await axios.get("https://api.redstone.finance/prices", {
      params: {
        symbol: symbol,
        provider: "redstone-rapid",
        startTimestamp,
        endTimestamp,
        limit: TIMESTAMPS_INTERVAL / DATA_SERVICE_INTERVAL,
        offset: index * apiLimit,
      },
    });
  };

  const allPrices: any[] = [];
  for (const index of [...Array(chunksCount).keys()]) {
    try {
      const response = await fetchFromApi(index);
      allPrices.push(...response.data);
    } catch (error) {
      console.log("Error");
      const response = await fetchFromApi(index);
      allPrices.push(...response.data);
    }
  }
  console.log(`Fetched ${allPrices.length} prices from API`);
  allPrices.sort((a, b) => a.timestamp - b.timestamp);
  return allPrices;
}

function handleDeviationsCalculationsFromApi(
  prices: PriceData[],
  periodInDays: number
) {
  if (prices.length === 0) {
    console.log("No prices found");
    return;
  }
  const deviationsCount: { [threshold: number]: number } = {};
  for (const threshold of THRESHOLDS) {
    deviationsCount[threshold] = 0;
    let currentValue: number = prices[0].value;
    for (const price of prices) {
      if (getDeviationPercentage(price.value, currentValue) > threshold) {
        deviationsCount[threshold]++;
        currentValue = price.value;
      }
    }
  }
  for (const threshold of THRESHOLDS) {
    const deviationsPerDay = deviationsCount[threshold] / periodInDays;
    console.log(
      `Average deviations per day for threshold ${threshold}%: ${deviationsPerDay.toFixed(
        2
      )}`
    );
  }
}
