const axios = require("axios");
const dotenv = require("dotenv");
const redstone = require("redstone-api");
const contracts = require("./contracts.json");

dotenv.config();

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const ARBISCAN_API_KEY = process.env.ARBISCAN_API_KEY;

const blockchainExplorerMap = {
  ethereum: {
    explorer: "etherscan.io",
    apiKey: ETHERSCAN_API_KEY,
    implicitGasPrice: false,
  },
  arbitrum: {
    explorer: "arbiscan.io",
    apiKey: ARBISCAN_API_KEY,
    implicitGasPrice: 1e8,
  },
};

const getExactEthPrices = false; // Set to true to get exact ETH prices for each transaction

let firstDay;
let firstMonth;
let currentDay;
let currentMonth;
function getNumberOfDaysInMonth(month) {
  const [year, monthValue] = month.split("-");
  let days = new Date(year, monthValue, 0).getDate();
  if (month === currentMonth) {
    days = currentDay;
  }
  if (month === firstMonth) {
    days = days - firstDay + 1;
  }
  return days;
}

// Prepare dates for calculating days in first and last month
function prepareDates(timestamp) {
  const date = new Date();
  currentMonth = `${date.getFullYear()}-${date.getMonth() + 1}`;
  currentDay = date.getDate();
  const firstDate = new Date(timestamp * 1000);
  firstMonth = `${firstDate.getFullYear()}-${firstDate.getMonth() + 1}`;
  firstDay = firstDate.getDate();
}

async function cumulativeGasCost(contractName) {
  const contract = contracts.find((c) => c.name === contractName);
  if (!contract) {
    console.error("Contract not found in the config file");
    return;
  }
  const { address, network } = contract;
  const {
    explorer: blockchainExplorer,
    apiKey: API_KEY,
    implicitGasPrice,
  } = blockchainExplorerMap[network];
  const apiUrl = `https://api.${blockchainExplorer}/api?module=account&action=txlist&address=${address}&apikey=${API_KEY}`;

  try {
    const response = await axios.get(apiUrl);
    const transactions = response.data.result;
    const ethPrices = await getEthPrices(transactions);
    const [transactionsByMonth, cumulativeGasCostETH, cumulativeGasCostUSD] =
      calculateGasCostPerMonth(transactions, ethPrices, implicitGasPrice);
    displayResults(
      transactions,
      cumulativeGasCostETH,
      cumulativeGasCostUSD,
      contractName,
      transactionsByMonth
    );
  } catch (error) {
    console.error("Error:", error);
  }
}

function printTransaction(tx) {
  console.log("Gas limit:", tx.gas);
  console.log("Cumulative gas used:", tx.cumulativeGasUsed);
  console.log("Gas used:", tx.gasUsed);
  console.log("Gas price:", tx.gasPrice);
}

let divCounter = 0;
function higherGasPrice(tx) {
  if (parseInt(tx.gasPrice) !== 1e8) {
    divCounter++;
    console.log("Gas price is not 1e8:", tx.gasPrice / 1e8, "div:", divCounter);
  }
}

function calculateGasCostPerMonth(transactions, ethPrices, implicitGasPrice) {
  const transactionsByMonth = {};
  let cumulativeGasCostETH = 0;
  let cumulativeGasCostUSD = 0;
  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];
    // printTransaction(tx); // Uncomment to print transaction details
    // higherGasPrice(tx); // Uncomment to check if gas price is higher than 1e8
    const gasUsed = parseInt(tx.gasUsed);
    const gasPrice = implicitGasPrice || parseInt(tx.gasPrice); // Use implicit gas price if it's provided (not 0)
    const gasCost = (gasUsed * gasPrice) / 1e18; // Gas costs are in Wei, so divide by 1e18 to convert to ETH
    cumulativeGasCostETH += gasCost;
    cumulativeGasCostUSD += gasCost * ethPrices[i];

    insertTransactionsByMonth(transactionsByMonth, tx, gasCost, ethPrices[i]);
  }

  return [transactionsByMonth, cumulativeGasCostETH, cumulativeGasCostUSD];
}

function insertTransactionsByMonth(transactionsByMonth, tx, gasCost, ethPrice) {
  const date = new Date(parseInt(tx.timeStamp) * 1000);
  const month = `${date.getFullYear()}-${date.getMonth() + 1}`;

  if (!transactionsByMonth[month]) {
    transactionsByMonth[month] = {
      transactions: [],
      cumulativeGasCostETH: 0,
      cumulativeGasCostUSD: 0,
    };
  }
  transactionsByMonth[month].transactions.push(tx);
  transactionsByMonth[month].cumulativeGasCostETH += gasCost;
  transactionsByMonth[month].cumulativeGasCostUSD += gasCost * ethPrice;
}

async function getEthPrices(transactions) {
  if (getExactEthPrices) {
    console.log("Getting exact ETH prices for each transaction");
    return await getExactEthPrice(transactions);
  }
  return await getApproximateEthPrices(transactions);
}

async function getApproximateEthPrices(transactions) {
  const ethPrice = await redstone.getPrice("ETH");
  const ethPrices = transactions.map((tx) => ethPrice.value);
  return ethPrices;
}

async function getExactEthPrice(transactions) {
  // Prepare an array of promises for fetching ETH prices for each transaction
  const ethPricePromises = transactions.map(async (tx) => {
    const timeStamp = parseInt(tx.timeStamp) * 1000; // Convert seconds to milliseconds
    const ethUSD = await redstone.getHistoricalPrice("ETH", {
      date: timeStamp,
    });
    return ethUSD.value;
  });

  // Fetch ETH prices for all transactions in parallel
  const ethPrices = await Promise.all(ethPricePromises);
  return ethPrices;
}

function displayResults(
  transactions,
  cumulativeGasCostETH,
  cumulativeGasCostUSD,
  contractName,
  transactionsByMonth
) {
  prepareDates(transactions[0].timeStamp);
  displayCumulativeGasCosts(
    transactions.length,
    cumulativeGasCostETH,
    cumulativeGasCostUSD,
    contractName
  );
  displayGasPerMonth(transactionsByMonth);
}

function displayCumulativeGasCosts(
  numberOfTransactions,
  cumulativeGasCostETH,
  cumulativeGasCostUSD
) {
  console.log("Total number of transactions:", numberOfTransactions);
  console.log(
    `Cumulative Gas Costs for contract '${contractName}':`,
    cumulativeGasCostETH,
    "ETH",
    cumulativeGasCostUSD,
    "USD"
  );
  if (txCostUSD) {
    console.log(`Cost of a single transaction:`, Number(txCostUSD), "USD");
    console.log(
      `Assuming const txCostUSD: Total cost of transactions:`,
      Number((txCostUSD * numberOfTransactions).toFixed(2)),
      "USD"
    );
  }
  console.log("--------------------");
}

function displayGasPerMonth(transactionsByMonth) {
  for (const month in transactionsByMonth) {
    const { transactions, cumulativeGasCostETH, cumulativeGasCostUSD } =
      transactionsByMonth[month];

    const numberOfDays = getNumberOfDaysInMonth(month);
    const averageTransactionsPerDay = transactions.length / numberOfDays;

    console.log(`Month: ${month}`);
    console.log("Number of transactions:", transactions.length);
    console.log(
      "Average number of transactions per day:",
      +averageTransactionsPerDay.toFixed(2)
    );
    console.log(
      "Cumulative Gas Costs:",
      cumulativeGasCostETH,
      "ETH",
      cumulativeGasCostUSD,
      "USD"
    );
    if (txCostUSD) {
      console.log(
        `Assuming const txCostUSD: Monthly cost of transactions:`,
        Number((txCostUSD * transactions.length).toFixed(2)),
        "USD,",
        `Average cost per day:`,
        Number((txCostUSD * averageTransactionsPerDay).toFixed(2)),
        "USD"
      );
    }
    console.log("--------------------");
  }
}

// Example usage: node calculateGasCosts.js swell or npm start swell
const contractName = process.argv[2];
const txCostUSD = process.argv[3]; // Optional argument for the cost of a single transaction in USD
cumulativeGasCost(contractName);
