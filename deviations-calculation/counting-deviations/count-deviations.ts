import axios from "axios";
import _ from "lodash";
import { CachedDataPackage } from "src/data-packages/data-packages.model";
import config from "../src/config";
import { fetchDataPackages, getDeviationPercentage } from "./common";
import { writeCsvFile } from "./csv-utils";

const probingWindowInDays = 20;
const END_TIMESTAMP = Date.now();
const TIMESTAMPS_INTERVAL = probingWindowInDays * 24 * 60 * 60 * 1000;
const START_TIMESTAMP = END_TIMESTAMP - TIMESTAMPS_INTERVAL;
const DATA_SERVICE_INTERVAL = 60 * 1000;
const DEVIATION_LIMIT = 0.01;
const assetName = "VST";
const dataServiceId = "redstone-main-demo";
const dataFeedId = "IB01.L";
const generateCsv = true;

(async () => {
  const dataPackages = await fetchDataPackages(config.mongoDbUrl, {
    startTimestamp: START_TIMESTAMP,
    endTimestamp: END_TIMESTAMP,
    dataServiceId,
    dataFeedId,
  });
  // const pricesFromApi = await fetchPricesFromApi(
  //   START_TIMESTAMP,
  //   END_TIMESTAMP
  // );

  const { deviationsWithoutGranulation } =
    await countDeviationsBiggerThanLimitAndFindMax(dataPackages);
  console.log(
    `Found ${deviationsWithoutGranulation} deviations without granulation bigger than limit`
  );

  if (generateCsv) {
    await generateCsvOutput(dataPackages);
  }
})();

async function countDeviationsBiggerThanLimitAndFindMax(prices: any[]) {
  console.log(`Counting deviations bigger than ${DEVIATION_LIMIT}`);
  const deviationsWithoutGranulation =
    handleDeviationsCalculationsFromDb(prices);
  return { deviationsWithoutGranulation };
}

async function fetchPricesFromApi(fromTimestamp: number, toTimestamp: number) {
  console.log("Fetching prices from API");
  const pricesExpectedCount = TIMESTAMPS_INTERVAL / DATA_SERVICE_INTERVAL;
  const apiLimit = 3000;
  const chunksCount = Math.floor(pricesExpectedCount / apiLimit);

  const fetchFromApi = async (index: number) => {
    return await axios.get("https://api.redstone.finance/prices", {
      params: {
        symbol: assetName,
        provider: "redstone-rapid",
        fromTimestamp,
        toTimestamp,
        limit: TIMESTAMPS_INTERVAL / DATA_SERVICE_INTERVAL,
        offset: index * apiLimit,
      },
    });
  };

  const allPrices = [];
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
  return allPrices;
}

function handleDeviationsCalculationsFromApi(prices: any[]) {
  let index = 0;
  let deviationsBiggerThanLimitCount = 0;
  let lastValue = prices[index].source["curve-frax"];
  while (!!prices[index] && !!prices[index + 1]) {
    const currentValue = prices[index].source["curve-frax"];
    if (!currentValue) {
      index += 1;
      continue;
    }
    const deviation = getDeviationPercentage(
      Number(currentValue),
      Number(lastValue)
    );
    if (deviation >= DEVIATION_LIMIT) {
      lastValue = Number(currentValue);
      deviationsBiggerThanLimitCount += 1;
    }
    index += 1;
  }
  return deviationsBiggerThanLimitCount;
}

function handleDeviationsCalculationsFromDb(dataPackages: CachedDataPackage[]) {
  let index = 0;
  let deviationsBiggerThanLimitCount = 0;
  let lastValue = dataPackages[index].dataPoints[0].value;
  while (!!dataPackages[index] && !!dataPackages[index + 1]) {
    const currentValue = dataPackages[index].dataPoints[0].value;
    const deviation = getDeviationPercentage(
      Number(currentValue),
      Number(lastValue)
    );
    if (deviation >= DEVIATION_LIMIT) {
      lastValue = Number(currentValue);
      deviationsBiggerThanLimitCount += 1;
    }
    index += 1;
  }
  return deviationsBiggerThanLimitCount;
}

function convertDataToCsvFormat(dataPackages: CachedDataPackage[]) {
  const csvRows = dataPackages.map((dataPackage) => {
    const { timestampMilliseconds, dataPoints } = dataPackage;
    const dataPointValues = dataPoints.map((dataPoint) => dataPoint.value);
    return `${timestampMilliseconds},${dataPointValues.join(",")}`;
  });
  return csvRows.join("\n");
}

async function generateCsvOutput(dataPackages: CachedDataPackage[]) {
  const csvData = convertDataToCsvFormat(dataPackages);
  await writeCsvFile("output.csv", csvData);
  console.log("Generated CSV output file: output.csv");
}
