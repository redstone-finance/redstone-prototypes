const fs = require("fs");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const path = require("path");

const file = "../results/slippage.csv";
const currentScriptPath = __filename;
const currentScriptDirectory = path.dirname(currentScriptPath);
const filePath = path.join(currentScriptDirectory, file);

function appendToCSV(filePath, data) {
  const headers = [
    { id: "DEX", title: "DEX" },
    { id: "TokenA", title: "TokenA" },
    { id: "TokenB", title: "TokenB" },
    { id: "PriceTokenAinB", title: "Price Token A in B" },
    { id: "PriceTokenBinA", title: "Price Token B in A" },
    { id: "PoolSize", title: "Pool Size" },
    { id: "Slip10e4", title: "Slip 10e-4" },
    { id: "Slip10e6", title: "Slip 10e-6" },
    { id: "Slip10e8", title: "Slip 10e-8" },
  ];

  try {
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
    csvWriter.writeRecords([data]).then(() => {
      console.log("Object has been added to CSV file.");
    });
  } catch (error) {
    console.error("Error occurred while adding object to CSV file:", error);
  }
}

// Usage example:
const dataToAppend = {
  DEX: "Uniswap V2",
  TokenA: "ETH",
  TokenB: "BTC",
  PriceTokenAinB: 0.1,
  PriceTokenBinA: 10,
  PoolSize: 10000,
  Slip10e4: 0.30001,
  Slip10e6: 0.000001,
  Slip10e8: 0.00000001,
};

appendToCSV(filePath, dataToAppend);
