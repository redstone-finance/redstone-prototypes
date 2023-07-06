const axios = require("axios");
const dotenv = require("dotenv");
const redstone = require("redstone-api");
const contracts = require("./contracts.json");

dotenv.config();

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const ARBISCAN_API_KEY = process.env.ARBISCAN_API_KEY;

const blockchainExplorerMap = {
  ethereum: { explorer: "etherscan.io", apiKey: ETHERSCAN_API_KEY },
  arbitrum: { explorer: "arbiscan.io", apiKey: ARBISCAN_API_KEY },
};

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
function preapareDates(timestamp) {
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

  const { name, address, network } = contract;
  const { explorer: blockchainExplorer, apiKey: API_KEY } =
    blockchainExplorerMap[network];

  const apiUrl = `https://api.${blockchainExplorer}/api?module=account&action=txlist&address=${address}&apikey=${API_KEY}`;

  try {
    // Get the transaction history for the contract address from the blockchain explorer API
    const response = await axios.get(apiUrl);
    const transactions = response.data.result;

    let cumulativeGasCostETH = 0;
    let cumulativeGasCostUSD = 0;

    // Group transactions by month
    const transactionsByMonth = {};

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

    // Iterate through each transaction
    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i];
      const gasUsed = parseInt(tx.gasUsed);
      const gasPrice = parseInt(tx.gasPrice);
      const gasCost = (gasUsed * gasPrice) / 1e18; // Gas costs are in gwei, so divide by 1e18 to convert to ETH

      cumulativeGasCostETH += gasCost;
      cumulativeGasCostUSD += gasCost * ethPrices[i];

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
      transactionsByMonth[month].cumulativeGasCostUSD += gasCost * ethPrices[i];
    }

    preapareDates(transactions[0].timeStamp);

    const numberOfTransactions = transactions.length;
    console.log("Total number of transactions:", numberOfTransactions);
    console.log(
      `Cumulative Gas Costs for contract '${name}':`,
      cumulativeGasCostETH,
      "ETH",
      cumulativeGasCostUSD,
      "USD"
    );
    console.log("--------------------");

    // Display grouped transactions by month
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
      console.log("--------------------");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

// Example usage: node calculateGasCosts.js swell or npm start swell
const contractName = process.argv[2];
cumulativeGasCost(contractName);
