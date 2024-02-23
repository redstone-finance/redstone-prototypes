const fs = require("fs").promises;
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const dotenv = require("dotenv");
const path = require("path");
const { readCSV, ensureDirectoryExists } = require("../utils/csv");
const { getTokenPriceInUSD } = require("../utils/slippage");

dotenv.config({ path: path.resolve(__dirname, "../.env") });
const RESULTS_VERSION = process.env.RESULTS_VERSION;

const currentScriptPath = __filename;
const currentScriptDirectory = path.dirname(currentScriptPath);

async function updatePriceForToken(pairedToken, records) {
  const price = await getTokenPriceInUSD(pairedToken);
  records.forEach((record) => {
    if (record.TokenA === pairedToken || record.TokenB === pairedToken) {
      record.pairedTokenPrice = price;
    }
  });
}

async function findPairedTokenPrices(token, records) {
  const pairedTokens = new Set();
  records.forEach((record) => {
    if (record.TokenA === token) {
      pairedTokens.add(record.TokenB);
    } else {
      pairedTokens.add(record.TokenA);
    }
  });

  const priceUpdatePromises = Array.from(pairedTokens).map((pairedToken) =>
    updatePriceForToken(pairedToken, records)
  );

  await Promise.all(priceUpdatePromises);
}

function getPriceAndIsTokenA(token, record) {
  const isTokenA = record.TokenA === token;
  const ratio = isTokenA
    ? record["Price Token A in B"]
    : record["Price Token B in A"];
  //TODO: different pricing methodology?
  const pairedTokenPrice = record.pairedTokenPrice;
  // const pairedToken = isTokenA ? record.TokenB : record.TokenA;
  // const pairedTokenPrice = pairedToken.includes("ETH") ? 2209 : 1;
  const price = parseFloat(ratio) * pairedTokenPrice;
  return { price, isTokenA };
}

function findMedian(data) {
  const sortedData = data.sort((a, b) => a.price - b.price);

  let cumulativeWeight = 0;
  let medianPrice = 0;
  for (const record of sortedData) {
    cumulativeWeight += record.Weight;
    if (cumulativeWeight >= 1 / 2) {
      medianPrice = record.price;
      break;
    }
  }
  return medianPrice;
}

function findWeightsAndMedian(data) {
  const totalWeight = data.reduce((sum, record) => sum + record.Weight, 0);

  data.forEach((record) => {
    record.Weight = record.Weight / totalWeight;
  });

  const weights = {};
  for (const record of data) {
    weights[record.PoolAddress] = record.Weight;
  }
  medianPrice = findMedian(data);

  return {
    weights,
    medianPrice,
  };
}

function findWeightsAndMedianForThreshold(
  token,
  records,
  threshold,
  direction
) {
  const processedData = records.map((record) => {
    const { price, isTokenA } = getPriceAndIsTokenA(token, record);
    let weight;
    if (direction === "Buy") {
      weight = isTokenA
        ? record[`Slip${threshold}%ValueB`]
        : record[`Slip${threshold}%ValueA`];
    } else {
      weight = isTokenA
        ? record[`Slip${threshold}%ValueA`]
        : record[`Slip${threshold}%ValueB`];
    }

    return {
      PoolAddress: record["Pool Address"],
      Weight: parseFloat(weight),
      price: parseFloat(price),
    };
  });

  //TODO: if weights are missing for some pools, assign 1e8 to them
  processedData.forEach((record) => {
    if (isNaN(record.Weight)) {
      record.Weight = 1e8;
    }
  });

  return findWeightsAndMedian(processedData);
}

function reverseWeights(data) {
  // TODO: maybe more complicated function??
  data.forEach((record) => {
    record.Weight = 1 / record.Weight;
  });
}

function findWeightsAndMedianForValue(token, records, value, direction) {
  const processedData = records.map((record) => {
    const { price, isTokenA } = getPriceAndIsTokenA(token, record);

    let weight;
    if (direction === "Buy") {
      weight = isTokenA
        ? record[`Slip$${value}kBtoA`]
        : record[`Slip$${value}kAtoB`];
    } else {
      weight = isTokenA
        ? record[`Slip$${value}kAtoB`]
        : record[`Slip$${value}kBtoA`];
    }

    return {
      PoolAddress: record["Pool Address"],
      Weight: Math.abs(parseFloat(weight) / 100),
      price: parseFloat(price),
    };
  });

  processedData.forEach((record) => {
    if (record.Weight === 0) {
      record.Weight = 1 / 1e5; //TODO: extreme value -maybe slippage should have more decimal places?
    }
  });

  // TODO: maybe more complicated function??
  reverseWeights(processedData);

  return findWeightsAndMedian(processedData);
}

async function processTokenDataAndWriteCSV(token) {
  const inputFile1Name = "AmountForSlippage-Prod";
  const inputFile2Name = "StepSlippage-Prod";
  const inputFile1 = `../results-csv-${RESULTS_VERSION}/${inputFile1Name}.csv`;
  const inputFile1Path = path.join(currentScriptDirectory, inputFile1);
  const inputFile2 = `../results-csv-${RESULTS_VERSION}/${inputFile2Name}.csv`;
  const inputFile2Path = path.join(currentScriptDirectory, inputFile2);
  const outputFile = `../results-csv-${RESULTS_VERSION}/results-per-token/${token}.csv`;
  const outputFilePath = path.join(currentScriptDirectory, outputFile);

  await ensureDirectoryExists(
    path.join(__dirname, `../results-csv-${RESULTS_VERSION}/results-per-token`)
  );

  try {
    await fs.access(inputFile1Path);
    await fs.access(inputFile2Path);
  } catch (error) {
    console.log("Source files does not exist.");
    return;
  }

  const records1 = await readCSV(inputFile1Path);
  const records2 = await readCSV(inputFile2Path);

  const filteredData1 = records1.filter(
    (record) => record.TokenA === token || record.TokenB === token
  );

  const filteredData2 = records2.filter(
    (record) => record.TokenA === token || record.TokenB === token
  );

  const headers = [
    { id: "WeightStrategy", title: "Weight Strategy" },
    { id: "WeightedMedianPrice", title: "Weighted Median Price" },
  ];
  filteredData1.forEach((record) => {
    headers.push({ id: record["Pool Address"], title: record["Pool Address"] }); //Same are in filteredData2
  });

  await findPairedTokenPrices(token, filteredData1);
  await findPairedTokenPrices(token, filteredData2);

  const records = [];

  const direction = ["Buy", "Sell"];

  const slipThresholdsPercentage = [1, 2, 3]; // 1%, 2%, 3%
  for (const threshold of slipThresholdsPercentage) {
    for (const dir of direction) {
      const { weights, medianPrice } = findWeightsAndMedianForThreshold(
        token,
        filteredData1,
        threshold,
        dir
      );
      const record = {
        WeightStrategy: `${dir} paired ${threshold}%`,
        WeightedMedianPrice: medianPrice,
      };
      for (const poolAddress in weights) {
        record[poolAddress] = weights[poolAddress];
      }
      records.push(record);
    }
  }

  const slipValuesInUSDInThousands = [10, 20, 50, 100, 200, 500, 1000]; // 10k, 20k, 50k, 100k, 200k, 500k, 1M)
  for (const value of slipValuesInUSDInThousands) {
    for (const dir of direction) {
      const { weights, medianPrice } = findWeightsAndMedianForValue(
        token,
        filteredData2,
        value,
        dir
      );
      const record = {
        WeightStrategy: `${dir} paired $${value}k`,
        WeightedMedianPrice: medianPrice,
      };
      for (const poolAddress in weights) {
        record[poolAddress] = weights[poolAddress];
      }
      records.push(record);
    }
  }

  const csvWriter = createCsvWriter({
    path: outputFilePath,
    header: headers,
  });

  await csvWriter.writeRecords([]); // Empty array to create file with headers
  await csvWriter.writeRecords(records);

  console.log(
    `Processed ${token}, weights have been written to the results-per-token/${token}.csv file.`
  );
}

async function processAllTokens() {
  const prodTokens = [
    "SWETH",
    "ETHx",
    "weETH",
    "osETH",
    "pxETH",
    "wstETH",
    "rETH",
  ];
  const promises = prodTokens.map((token) =>
    processTokenDataAndWriteCSV(token)
  );
  await Promise.all(promises);
}

// processAllTokens();

module.exports = processAllTokens;
