import {
  CachedDataPackage,
  DataPackage,
} from "./data-packages.model";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
const mongoDbUrl = process.env.MONGO_DB_URL || "";


const THRESHOLDS = [1, 0.5, 0.2, 0.1]; // in percent
const DATA_SERVICE_ID = "redstone-avalanche-prod";

interface DataPackagesGroupedBySigner {
  [signer: string]: CachedDataPackage[];
}

async function main(symbol: string, period: number = 30) {
  const END_TIMESTAMP = Date.now();
  const START_TIMESTAMP = END_TIMESTAMP - period * 24 * 60 * 60 * 1000;
  await mongoose.connect(mongoDbUrl);
  console.log("MongoDB connected");
  const dataPackagesBySigner = await queryDataPackagesGroupedBySigner(
    symbol,
    START_TIMESTAMP,
    END_TIMESTAMP
  );

  // console.log(dataPackagesBySigner);

  const deviationsPerThreshold: {
    [threshold: string]: { [signer: string]: number };
  } = {};
  for (const threshold of THRESHOLDS) {
    deviationsPerThreshold[threshold] = {};
    for (const [signerAddress, dataPackages] of Object.entries(
      dataPackagesBySigner
    )) {
      // console.log(`\n\n\n==== ${signerAddress} ====`);
      const sortedDataPackages = dataPackages.sort(
        (a, b) => b.timestampMilliseconds - a.timestampMilliseconds
      );

      let currentValue: number | undefined;
      let deviationsCount = 0;
      // let lastTimestamp = 0;
      for (const dataPackage of sortedDataPackages) {
        // lastTimestamp = timeInfo(dataPackage, lastTimestamp);

        for (const dataPoint of dataPackage.dataPoints) {
          const newValue = Number(dataPoint.value);
          if (currentValue !== undefined) {
            const deviation = getDeviationPercentage(newValue, currentValue);
            if (deviation > threshold) {
              deviationsCount++;
              currentValue = newValue;
            }
          }
          currentValue = newValue;
        }
      }
      deviationsPerThreshold[threshold][signerAddress] = deviationsCount;
      console.log(
        `Deviations count for threshold ${threshold}% and signer ${signerAddress}: ${deviationsCount}`
      );
    }
  }

  // Calculate and display average deviations per day for each threshold
  for (const threshold of THRESHOLDS) {
    console.log(`\nAverage deviations per day for threshold ${threshold}%:`);
    for (const [signerAddress, deviationsCount] of Object.entries(
      deviationsPerThreshold[threshold]
    )) {
      const averageDeviationsPerDay = deviationsCount / (period / 30); // Assuming each month has 30 days
      console.log(
        `${signerAddress}: ${averageDeviationsPerDay.toFixed(2)} deviations/day`
      );
    }
  }
  //disconnect from database
  await mongoose.disconnect();
}

function timeInfo(
  dataPackage: CachedDataPackage,
  lastTimestamp: number
): number {
  const timestamp = dataPackage.timestampMilliseconds;
  const diff = lastTimestamp ? lastTimestamp - timestamp : undefined;
  lastTimestamp = timestamp;
  const timestampFromId = new Date(
    (dataPackage as any)._id.getTimestamp()
  ).getTime();
  const timestampFromIdDiff = timestampFromId - timestamp;
  console.log(`\nTime: ${formatTime(timestamp)}. Diff: ${diff}`);
  console.log(`Data points count: ${dataPackage.dataPoints.length}`);
  if (dataPackage.dataPoints.length < 32) {
    console.log(dataPackage.dataPoints);
  }
  if (timestampFromIdDiff > 10000) {
    console.log(`Timestamp from id diff: ${timestampFromIdDiff}`);
  }
  return lastTimestamp;
}

function formatTime(timestamp: number) {
  return new Date(timestamp).toISOString();
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
  return groupedBySigner;
}

// export const calculateDeviationPercent = (args: {
//   prevValue: ConvertibleToISafeNumber;
//   newValue: ConvertibleToISafeNumber;
// }) =>
//   ISafeNumberMath.calculateDeviationPercent({
//     prevValue: castToISafeNumber(args.prevValue),
//     currValue: castToISafeNumber(args.newValue),
//   }).unsafeToNumber();

function getDeviationPercentage(a: number, b: number) {
  return Math.abs((a - b) / Math.min(a, b)) * 100;
}

const symbol = "LINK";
const periodInDays = 0.01;
main(symbol, periodInDays);







// import { CachedDataPackage, DataPackage } from "./common/data-packages.model";
// import { ALL_FEEDS_KEY } from "./common/data-packages.service";
// import mongoose from "mongoose";
// import axios from "axios";
// import config from "./common/config";

// // import RedstoneAPI from "redstone-api-library"; //todo...

// // Constants for deviations (1%, 0.5%, 0.2%, 0.1%)
// const THRESHOLDS = [1, 0.5, 0.2, 0.1];

// const DATA_SERVICE_ID = "redstone-avalanche-prod";

// interface DataPackagesGroupedBySigner {
//   [signer: string]: CachedDataPackage[];
// }

// interface PriceData {
//   // Define the properties of the price data here based on the API response
//   // For example:
//   timestamp: number;
//   price: number;
//   // Add more properties as needed
// }

// async function queryDataPackagesGroupedBySigner(
//   symbol: string,
//   START_TIMESTAMP: number,
//   END_TIMESTAMP: number
// ): Promise<DataPackagesGroupedBySigner> {
//   const dataPackages = await DataPackage.find(
//     {
//       timestampMilliseconds: {
//         $gte: START_TIMESTAMP,
//         $lte: END_TIMESTAMP,
//       },
//       dataFeedId: ALL_FEEDS_KEY,
//       dataServiceId: DATA_SERVICE_ID,
//     },
//     { timestampMilliseconds: 1, signerAddress: 1, dataPoints: 1 }
//   );

//   //TODO: filter by symbol
//   // const filteredDataPackages = dataPackages.filter((dataPackage) => {
//   //   return dataPackage.dataPoints.some(
//   //     (dataPoint) => dataPoint.dataFeedId === symbol
//   //   );
//   // });

//   const groupedBySigner: DataPackagesGroupedBySigner = {};

//   for (const dataPackage of dataPackages) {
//     if (!groupedBySigner[dataPackage.signerAddress]) {
//       groupedBySigner[dataPackage.signerAddress] = [];
//     }
//     groupedBySigner[dataPackage.signerAddress].push(dataPackage);
//   }
//   return groupedBySigner;
// }

// async function main(symbol: string, period: number = 30) {
//   // Calculate the start and end timestamps based on the period
//   const END_TIMESTAMP = Date.now();
//   const START_TIMESTAMP = END_TIMESTAMP - period * 24 * 60 * 60 * 1000; // TODO: 30 days, check it..
//   // await mongoose.connect(config.mongoDbUrl);
//   console.log("MongoDB connected");

//   // const dataPackagesBySigner = await queryDataPackagesGroupedBySigner(
//   //   symbol,
//   //   START_TIMESTAMP,
//   //   END_TIMESTAMP
//   // );

//   // Additional data source using Redstone API
//   /*const redstoneDataPackagesBySigner =*/ await queryRedstoneDataPackagesGroupedBySigner(
//     symbol,
//     START_TIMESTAMP,
//     END_TIMESTAMP
//   );

//   // // Merge the data packages from both sources
//   // for (const signerAddress in redstoneDataPackagesBySigner) {
//   //   if (dataPackagesBySigner[signerAddress]) {
//   //     dataPackagesBySigner[signerAddress].push(
//   //       ...redstoneDataPackagesBySigner[signerAddress]
//   //     );
//   //   } else {
//   //     dataPackagesBySigner[signerAddress] =
//   //       redstoneDataPackagesBySigner[signerAddress];
//   //   }
//   // }

//   // // Calculate deviations and store results
//   // const deviationsPerThreshold: {
//   //   [threshold: string]: { [signer: string]: number };
//   // } = {};

//   // for (const threshold of THRESHOLDS) {
//   //   deviationsPerThreshold[threshold] = {};

//   //   for (const [signerAddress, dataPackages] of Object.entries(
//   //     dataPackagesBySigner
//   //   )) {
//   //     let currentValue: number | undefined;
//   //     let deviationsCount = 0;

//   //     for (const dataPackage of dataPackages) {
//   //       for (const dataPoint of dataPackage.dataPoints) {
//   //         const newValue = Number(dataPoint.value);
//   //         if (currentValue !== undefined) {
//   //           const deviation = getDeviationPercentage(newValue, currentValue);
//   //           if (deviation > threshold) {
//   //             deviationsCount++;
//   //             currentValue = newValue;
//   //           }
//   //         } else {
//   //           currentValue = newValue;
//   //         }
//   //       }
//   //     }

//   //     deviationsPerThreshold[threshold][signerAddress] = deviationsCount;
//   //   }
//   // }

//   // // Calculate and display average deviations per day for each threshold
//   // for (const threshold of THRESHOLDS) {
//   //   console.log(`\nAverage deviations per day for threshold ${threshold}%:`);
//   //   for (const [signerAddress, deviationsCount] of Object.entries(
//   //     deviationsPerThreshold[threshold]
//   //   )) {
//   //     const averageDeviationsPerDay = deviationsCount / (period / 30); // Assuming each month has 30 days
//   //     console.log(
//   //       `${signerAddress}: ${averageDeviationsPerDay.toFixed(2)} deviations/day`
//   //     );
//   //   }
//   // }
// }

// function getDeviationPercentage(a: number, b: number) {
//   return Math.abs((a - b) / Math.min(a, b)) * 100;
// }

// // Additional function to query data packages from Redstone API
// async function queryRedstoneDataPackagesGroupedBySigner(
//   symbol: string,
//   startTimestamp: number,
//   endTimestamp: number
// ) /*: Promise<DataPackagesGroupedBySigner>*/ {
//   const probingWindowInDays = 20;

//   const TIMESTAMPS_INTERVAL = 30 * 24 * 60 * 60 * 1000; // 30 days
//   const DATA_SERVICE_INTERVAL = 60 * 1000;
//   const pricesExpectedCount = TIMESTAMPS_INTERVAL / DATA_SERVICE_INTERVAL;
//   const apiLimit = 3000;
//   const chunksCount = Math.floor(pricesExpectedCount / apiLimit);

//   const fetchFromApi = async (index: number) => {
//     return await axios.get("https://api.redstone.finance/prices", {
//       params: {
//         symbol: symbol,
//         provider: "redstone-rapid",
//         startTimestamp,
//         endTimestamp,
//         limit: TIMESTAMPS_INTERVAL / DATA_SERVICE_INTERVAL,
//         offset: index * apiLimit,
//       },
//     });
//   };

//   const allPrices : PriceData[]= [];
//   for (const index of [...Array(chunksCount).keys()]) {
//     try {
//       const response = await fetchFromApi(index);
//       allPrices.push(...response.data);
//     } catch (error) {
//       console.log("Error");
//       const response = await fetchFromApi(index);
//       allPrices.push(...response.data);
//     }
//   }
//   console.log(`Fetched ${allPrices.length} prices from API`);

//   // // Replace the following with the appropriate code for querying Redstone API
//   // // and formatting the data as per the existing data structure
//   // const redstoneData = await RedstoneAPI.queryDataPackages(symbol, startTimestamp, endTimestamp);

//   // Process and group the data by signer as done for the MongoDB data in the existing code
//   // ...

//   // Return the data grouped by signer
//   // return redstoneData;
// }

// const symbol = "ETH";
// const periodInDays = 30;
// main(symbol, periodInDays);
