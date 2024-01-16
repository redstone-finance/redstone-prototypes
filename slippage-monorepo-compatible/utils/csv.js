const fs = require("fs");
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

  if (!fs.existsSync(filePath)) {
    const csvWriter = createCsvWriter({
      path: filePath,
      header: headers,
    });
    csvWriter.writeRecords([]); // Empty array to create file with headers
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

  csvWriter.writeRecords([dataToWrite]).then(() => {
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

  if (!fs.existsSync(filePath)) {
    const csvWriter = createCsvWriter({
      path: filePath,
      header: headers,
    });
    csvWriter.writeRecords([]); // Empty array to create file with headers
  }

  const csvWriter = createCsvWriter({
    path: filePath,
    header: headers,
    append: true,
  });

  csvWriter.writeRecords([dataToWrite]).then(() => {
    console.log("Missing Pool Slippage has been added to CSV file.");
  });
}

module.exports = {
  writePoolSlippageToCSV,
  writeMissingPoolToCSV,
};
