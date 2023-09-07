import redstone from "redstone-api";
import { createObjectCsvWriter } from "csv-writer";
import path from "path";

async function analyzeDeviations(token: string) {
  const pricesData: any = await redstone.getHistoricalPrice(token, {
    startDate: "2023-07-12T23:00:01",
    endDate: "2023-07-14T04:00:00",
    interval: 600 * 1000, // 10 minutes
  });

  const sourceMinMax: { [key: string]: { min: number; max: number } } = {};

  for (const priceData of pricesData) {
    const sources = priceData.source;

    for (const key in sources) {
      const value = sources[key];

      if (!sourceMinMax[key]) {
        sourceMinMax[key] = { min: value, max: value };
      } else {
        if (value > sourceMinMax[key].max) {
          sourceMinMax[key].max = value;
        }
        if (value < sourceMinMax[key].min) {
          sourceMinMax[key].min = value;
        }
      }
    }
  }

  const outputFolder = "results";
  const csvFilePath = path.join(outputFolder, `${token}-deviation.csv`);

  const csvWriter = createObjectCsvWriter({
    path: csvFilePath,
    header: [
      { id: "source", title: "Source" },
      { id: "minPrice", title: "Min Price" },
      { id: "maxPrice", title: "Max Price" },
      { id: "deviationPercentage", title: "Deviation Percentage" },
    ],
  });

  const csvData = [];

  for (const sourceKey in sourceMinMax) {
    const { min, max } = sourceMinMax[sourceKey];
    const deviationPercentage = (((max - min) / min) * 100).toFixed(2);

    csvData.push({
      source: sourceKey,
      minPrice: min,
      maxPrice: max,
      deviationPercentage: deviationPercentage,
    });
  }

  await csvWriter.writeRecords(csvData);

  console.log(`Data saved to ${csvFilePath}`);
}

const token = process.argv[2];
if (token) {
  analyzeDeviations(token);
} else {
  console.error("Please provide the token name (e.g. ADA, MATIC).");
}
