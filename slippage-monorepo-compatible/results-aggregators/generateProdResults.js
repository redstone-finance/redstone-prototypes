const fs = require("fs").promises;
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const dotenv = require("dotenv");
const path = require("path");
const { readCSV } = require("../utils/csv");

dotenv.config({ path: path.resolve(__dirname, "../.env") });
const RESULTS_VERSION = process.env.RESULTS_VERSION;

const currentScriptPath = __filename;
const currentScriptDirectory = path.dirname(currentScriptPath);

function findFirstSlippage(record, threshold, tokenSuffix) {
  for (let key in record) {
    if (
      key.endsWith(tokenSuffix) &&
      Math.abs(parseFloat(record[key])) > threshold
    ) {
      return parseInt(key.split("k")[0].split("$")[1]) * 1e3;
    }
  }
  return null;
}

async function processStepAndWriteAmountForSlippageCSV(inputCSV, outputCSV) {
  const inputFile = `../results-csv-${RESULTS_VERSION}/${inputCSV}.csv`;
  const inputFilePath = path.join(currentScriptDirectory, inputFile);
  const outputFile = `../results-csv-${RESULTS_VERSION}/${outputCSV}.csv`;
  const outputFilePath = path.join(currentScriptDirectory, outputFile);

  try {
    await fs.access(inputFilePath);
  } catch (error) {
    console.log("Source file does not exist.");
    return;
  }

  const headers = [
    { id: "DEX", title: "DEX" },
    { id: "TokenA", title: "TokenA" },
    { id: "TokenB", title: "TokenB" },
    { id: "PoolAddress", title: "Pool Address" },
    { id: "PriceTokenBinA", title: "Price Token B in A" },
    { id: "PriceTokenAinB", title: "Price Token A in B" },
    { id: "PoolSize", title: "Pool Size" },
    { id: "Slip1%ValueA", title: "Slip1%ValueA" },
    { id: "Slip1%ValueB", title: "Slip1%ValueB" },
    { id: "Slip2%ValueA", title: "Slip2%ValueA" },
    { id: "Slip2%ValueB", title: "Slip2%ValueB" },
    { id: "Slip3%ValueA", title: "Slip3%ValueA" },
    { id: "Slip3%ValueB", title: "Slip3%ValueB" },
  ];

  const records = await readCSV(inputFilePath);
  const thresholdsPercentage = [1, 2, 3];

  const processedData = records.map((record) => {
    let result = {
      DEX: record.DEX,
      TokenA: record.TokenA,
      TokenB: record.TokenB,
      PoolAddress: record["Pool Address"],
      PriceTokenBinA: record["Price Token B in A"],
      PriceTokenAinB: record["Price Token A in B"],
      PoolSize: record["Pool Size"],
    };

    thresholdsPercentage.forEach((thresholdPercentage) => {
      result[`Slip${thresholdPercentage}%ValueA`] = findFirstSlippage(
        record,
        thresholdPercentage,
        "AtoB"
      );
      result[`Slip${thresholdPercentage}%ValueB`] = findFirstSlippage(
        record,
        thresholdPercentage,
        "BtoA"
      );
    });

    return result;
  });

  const csvWriter = createCsvWriter({
    path: outputFilePath,
    header: headers,
  });
  await csvWriter.writeRecords([]); // Empty array to create file with headers
  await csvWriter.writeRecords(processedData);
  console.log(
    `Processed ${inputCSV} and results has been written to the ${outputCSV} file.`
  );
}

async function filterAndWriteProdTokensCSV(inputCSV) {
  const inputFile = `../results-csv-${RESULTS_VERSION}/${inputCSV}.csv`;
  const inputFilePath = path.join(currentScriptDirectory, inputFile);
  const outputFile = `../results-csv-${RESULTS_VERSION}/${inputCSV}-Prod.csv`;
  const outputFilePath = path.join(currentScriptDirectory, outputFile);

  try {
    await fs.access(inputFilePath);
  } catch (error) {
    console.log("Source file does not exist.");
    return;
  }

  const prodTokens = [
    "SWETH",
    "ETHx",
    "weETH",
    "osETH",
    "pxETH",
    "wstETH",
    "rETH",
  ];

  const records = await readCSV(inputFilePath);

  const filteredData = records.filter(
    (record) =>
      prodTokens.includes(record.TokenA) || prodTokens.includes(record.TokenB)
  );

  const headers = Object.keys(records[0]).map((key) => ({
    id: key,
    title: key,
  }));

  const csvWriter = createCsvWriter({
    path: outputFilePath,
    header: headers,
  });
  await csvWriter.writeRecords([]); // Empty array to create file with headers
  await csvWriter.writeRecords(filteredData);
  console.log(
    `Filtered ${inputCSV} and results have been written to the ${inputCSV}-Prod file.`
  );
}

async function filerMultipleCSVFiles(inputCSVs) {
  for (let inputCSV of inputCSVs) {
    await filterAndWriteProdTokensCSV(inputCSV);
  }
}

async function main() {
  try {
    await processStepAndWriteAmountForSlippageCSV(
      "StepSlippage",
      "AmountForSlippage"
    );
    await filerMultipleCSVFiles(["StepSlippage", "AmountForSlippage"]);
  } catch (error) {
    console.error(error);
  }
}

// main();

module.exports = main;
