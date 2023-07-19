const fs = require("fs");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const path = require("path");
const constants = require("../utils/constants");
const pricesUnrelated = constants.pricesUnrelated;
const pricesRelated = constants.pricesRelated;

const file = "../results/slippage.csv";
const currentScriptPath = __filename;
const currentScriptDirectory = path.dirname(currentScriptPath);
const filePath = path.join(currentScriptDirectory, file);

function appendToCSV(data) {
  const headers = [
    { id: "DEX", title: "DEX" },
    { id: "TokenA", title: "TokenA" },
    { id: "TokenB", title: "TokenB" },
    { id: "PriceTokenBinA", title: "Price Token B in A" },
    { id: "PriceTokenAinB", title: "Price Token A in B" },
    { id: "PoolSize", title: "Pool Size" },
  ];
  pricesUnrelated.forEach((price) => {
    const priceKey = `Slip${price.toExponential()}`.replace("+", "");
    const priceKeyAtoB = `${priceKey}AtoB`;
    const priceKeyBtoA = `${priceKey}BtoA`;
    headers.push({ id: priceKeyAtoB, title: priceKeyAtoB });
    headers.push({ id: priceKeyBtoA, title: priceKeyBtoA });
  });

  pricesRelated.forEach((price) => {
    const priceKey = `SlipRelated${price.toExponential()}`;
    const priceKeyAtoB = `${priceKey}AtoB`;
    const priceKeyBtoA = `${priceKey}BtoA`;
    headers.push({ id: priceKeyAtoB, title: priceKeyAtoB });
    headers.push({ id: priceKeyBtoA, title: priceKeyBtoA });
  });

  try {
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
      PriceTokenBinA: data.secondPriceInFirst,
      PriceTokenAinB: data.firstPriceInSecond,
      PoolSize: data.poolSize,
    };

    pricesUnrelated.forEach((price, index) => {
      const priceKey = `Slip${price.toExponential()}`.replace("+", "");
      const priceKeyAtoB = `${priceKey}AtoB`;
      const priceKeyBtoA = `${priceKey}BtoA`;
      dataToWrite[priceKeyAtoB] = data.slippageRelated[index][1];
      dataToWrite[priceKeyBtoA] = data.slippageRelated[index][2];
    });

    pricesRelated.forEach((price, index) => {
      const priceKey = `SlipRelated${price.toExponential()}`;
      const priceKeyAtoB = `${priceKey}AtoB`;
      const priceKeyBtoA = `${priceKey}BtoA`;
      dataToWrite[priceKeyAtoB] = data.slippageUnrelated[index][1];
      dataToWrite[priceKeyBtoA] = data.slippageUnrelated[index][2];
    });

    const csvWriter = createCsvWriter({
      path: filePath,
      header: headers,
      append: true,
    });

    csvWriter.writeRecords([dataToWrite]).then(() => {
      console.log("Object has been added to CSV file.");
    });
  } catch (error) {
    console.error("Error occurred while adding object to CSV file:", error);
  }
}

module.exports = {
  appendToCSV,
};

// Example data
// const data = {
//   DEX: "Uniswap V3",
//   TokenA: "ETH",
//   TokenB: "DAI",
//   poolSize: "77323.93",
//   secondPriceInFirst: "406.272380476506100422",
//   firstPriceInSecond: "0.002461402861861115",
//   slippageUnrelated: [
//     ["10000", "-40.31", "-2.08"],
//     ["1000000", "-99.40", "-91.46"],
//     ["100000000", "-99.99", "-99.91"],
//   ],
//   slippageRelated: [
//     ["77.32", "-0.02", "-0.02"],
//     ["773.24", "-0.22", "-0.16"],
//     ["7732.39", "-22.81", "-1.62"],
//   ],
// };
