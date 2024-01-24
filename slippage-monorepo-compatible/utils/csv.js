const fs = require("fs").promises;
const { parse } = require("csv-parse");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const path = require("path");

const currentScriptPath = __filename;
const currentScriptDirectory = path.dirname(currentScriptPath);

function generateDataObject(
  DEX,
  poolAddress,
  cryptoASymbol,
  cryptoBSymbol,
  poolSize,
  secondPriceInFirst,
  firstPriceInSecond,
  slippageValues,
  pricesUSD
) {
  slippageValues.forEach((slippage, index) => {
    slippage.unshift(pricesUSD[index].toString());
  });

  const dataObject = {
    DEX: DEX,
    TokenA: cryptoASymbol,
    TokenB: cryptoBSymbol,
    PoolAddress: poolAddress,
    PoolSize: poolSize,
    secondPriceInFirst: secondPriceInFirst,
    firstPriceInSecond: firstPriceInSecond,
    slippageValues,
  };
  return dataObject;
}

async function appendPoolSlippageToCSV(data, prices) {
  const file = `../results-csv/StepSlippage.csv`;
  const filePath = path.join(currentScriptDirectory, file);

  const headers = [
    { id: "DEX", title: "DEX" },
    { id: "TokenA", title: "TokenA" },
    { id: "TokenB", title: "TokenB" },
    { id: "PoolAddress", title: "Pool Address" },
    { id: "PriceTokenBinA", title: "Price Token B in A" },
    { id: "PriceTokenAinB", title: "Price Token A in B" },
    { id: "PoolSize", title: "Pool Size" },
  ];

  prices.forEach((price) => {
    const priceKey = `Slip$${price / 1e3}k`;
    const priceKeyAtoB = `${priceKey}AtoB`;
    const priceKeyBtoA = `${priceKey}BtoA`;
    headers.push({ id: priceKeyAtoB, title: priceKeyAtoB });
    headers.push({ id: priceKeyBtoA, title: priceKeyBtoA });
  });

  try {
    await fs.access(filePath);
  } catch (error) {
    const csvWriter = createCsvWriter({
      path: filePath,
      header: headers,
    });
    await csvWriter.writeRecords([]); // Empty array to create file with headers
  }

  const dataToWrite = {
    DEX: data.DEX,
    TokenA: data.TokenA,
    TokenB: data.TokenB,
    PoolAddress: data.PoolAddress,
    PriceTokenBinA: data.secondPriceInFirst,
    PriceTokenAinB: data.firstPriceInSecond,
    PoolSize: data.PoolSize,
  };

  prices.forEach((price, index) => {
    const priceKey = `Slip$${price / 1e3}k`;
    const priceKeyAtoB = `${priceKey}AtoB`;
    const priceKeyBtoA = `${priceKey}BtoA`;
    dataToWrite[priceKeyAtoB] = data.slippageValues[index][1];
    dataToWrite[priceKeyBtoA] = data.slippageValues[index][2];
  });

  const csvWriter = createCsvWriter({
    path: filePath,
    header: headers,
    append: true,
  });

  await csvWriter.writeRecords([dataToWrite]).then(() => {
    console.log("Pool Slippage has been added to CSV file.");
  });
}

async function writePoolSlippageToCSV(
  DEX,
  poolAddress,
  cryptoASymbol,
  cryptoBSymbol,
  poolSize,
  receivedFirstForSecond,
  receivedSecondForFirst,
  results,
  prices
) {
  const dataObject = generateDataObject(
    DEX,
    poolAddress,
    cryptoASymbol,
    cryptoBSymbol,
    poolSize,
    receivedFirstForSecond,
    receivedSecondForFirst,
    results,
    prices
  );
  await appendPoolSlippageToCSV(dataObject, prices);
}

async function writeMissingPoolToCSV(
  DEX,
  poolAddress,
  cryptoASymbol,
  cryptoBSymbol
) {
  const file = `../results-csv/StepSlippageMissingPools.csv`;
  const filePath = path.join(currentScriptDirectory, file);

  const headers = [
    { id: "DEX", title: "DEX" },
    { id: "TokenA", title: "TokenA" },
    { id: "TokenB", title: "TokenB" },
    { id: "PoolAddress", title: "Pool Address" },
  ];

  const dataToWrite = {
    DEX: DEX,
    TokenA: cryptoASymbol,
    TokenB: cryptoBSymbol,
    PoolAddress: poolAddress,
  };

  try {
    await fs.access(filePath);
  } catch (error) {
    const csvWriter = createCsvWriter({
      path: filePath,
      header: headers,
    });
    await csvWriter.writeRecords([]); // Empty array to create file with headers
  }

  const csvWriter = createCsvWriter({
    path: filePath,
    header: headers,
    append: true,
  });

  await csvWriter.writeRecords([dataToWrite]).then(() => {
    console.log("Missing Pool Slippage has been added to CSV file.");
  });
}

async function checkIfPoolAlreadyExists(
  DEX,
  poolAddress,
  cryptoASymbol,
  cryptoBSymbol,
  fileCSV
) {
  const file = `../results-csv/${fileCSV}.csv`;
  const filePath = path.join(currentScriptDirectory, file);

  const dataToCheck = {
    DEX: DEX,
    PoolAddress: poolAddress,
    TokenA: cryptoASymbol,
    TokenB: cryptoBSymbol,
  };

  try {
    await fs.access(filePath);
  } catch (error) {
    return false;
  }

  const data = await fs.readFile(filePath, { encoding: "utf8" });
  const rows = data.split("\n");

  return rows.some((row) => {
    const [dex, tokenA, tokenB, poolAddr] = row.split(",");
    return (
      dex === dataToCheck.DEX &&
      poolAddr === dataToCheck.PoolAddress &&
      ((tokenA === dataToCheck.TokenA && tokenB === dataToCheck.TokenB) ||
        (tokenA === dataToCheck.TokenB && tokenB === dataToCheck.TokenA))
    );
  });
}

async function readCSV(filePath) {
  const fileContent = await fs.readFile(filePath);
  return new Promise((resolve, reject) => {
    parse(
      fileContent,
      { columns: true, skip_empty_lines: true },
      (err, output) => {
        if (err) reject(err);
        else resolve(output);
      }
    );
  });
}

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
  const inputFile = `../results-csv/${inputCSV}.csv`;
  const inputFilePath = path.join(currentScriptDirectory, inputFile);
  const outputFile = `../results-csv/${outputCSV}.csv`;
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
  const inputFile = `../results-csv/${inputCSV}.csv`;
  const inputFilePath = path.join(currentScriptDirectory, inputFile);
  const outputFile = `../results-csv/${inputCSV}-Prod.csv`;
  const outputFilePath = path.join(currentScriptDirectory, outputFile);

  try {
    await fs.access(inputFilePath);
  } catch (error) {
    console.log("Source file does not exist.");
    return;
  }

  const prodTokens = [
    "swETH",
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
      prodTokens.includes(record.TokenA) ||
      prodTokens.includes(record.TokenB)
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

// filerMultipleCSVFiles([
//   "StepSlippage",
//   "AmountForSlippage",
// ]).catch((error) => console.error(error));

// processStepAndWriteAmountForSlippageCSV(
//   "StepSlippage",
//   "AmountForSlippage"
// ).catch((error) => console.error(error));

module.exports = {
  writePoolSlippageToCSV,
  writeMissingPoolToCSV,
  checkIfPoolAlreadyExists,
  readCSV,
};
