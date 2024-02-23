const fs = require("fs").promises;
const { parse } = require("csv-parse");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../.env") });
const RESULTS_VERSION = process.env.RESULTS_VERSION;

const currentScriptPath = __filename;
const currentScriptDirectory = path.dirname(currentScriptPath);

async function ensureDirectoryExists(directory) {
  try {
    await fs.access(directory);
  } catch (error) {
    await fs.mkdir(directory, { recursive: true });
  }
}

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
  await ensureDirectoryExists(
    path.join(__dirname, `../results-csv-${RESULTS_VERSION}`)
  );

  const file = `../results-csv-${RESULTS_VERSION}/StepSlippage.csv`;
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
  await ensureDirectoryExists(
    path.join(__dirname, `../results-csv-${RESULTS_VERSION}`)
  );
  const file = `../results-csv-${RESULTS_VERSION}/StepSlippageMissingPools.csv`;
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
  const file = `../results-csv-${RESULTS_VERSION}/${fileCSV}.csv`;
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

module.exports = {
  writePoolSlippageToCSV,
  writeMissingPoolToCSV,
  checkIfPoolAlreadyExists,
  readCSV,
  ensureDirectoryExists,
};
