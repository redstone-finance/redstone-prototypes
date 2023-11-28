const axios = require("axios");
const dotenv = require("dotenv");
const redstone = require("redstone-api");

dotenv.config();

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const ARBISCAN_API_KEY = process.env.ARBISCAN_API_KEY;

const blockchainExplorerMap = {
  ethereum: {
    explorer: "etherscan.io",
    apiKey: ETHERSCAN_API_KEY,
  },
};

const address = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84";
const network = "ethereum";

async function cumulativeGasCost() {
  const { explorer: blockchainExplorer, apiKey: API_KEY } =
    blockchainExplorerMap[network];
  const apiUrl = `https://api.${blockchainExplorer}/api?module=account&action=txlist&address=${address}&apikey=${API_KEY}`;

  try {
    const response = await axios.get(apiUrl);
    const transactions = response.data.result;

    let totalEther = 0;
    let octoberEther = 0;
    const differentMonths = new Set();
    transactions.forEach((tx) => {
      const date = new Date(parseInt(tx.timeStamp) * 1000);
      const month = `${date.getFullYear()}-${date.getMonth() + 1}`;
      differentMonths.add(month);
      if (month == "2021-5") octoberEther += Number(tx.value) / 1e18;
      const etherValue = Number(tx.value) / 1e18;
      totalEther += etherValue;
    });
    console.log("Total Ether:", totalEther.toFixed(6)); // Adjust the precision as needed
    console.log("October Ether:", octoberEther.toFixed(6)); // Adjust the precision as needed
    console.log("Different months:", differentMonths);

    // const functionNames = new Set();
    // transactions.forEach((tx) => {
    //   functionNames.add(tx.functionName);
    // });
    // console.log(functionNames);

    // const ethPrices = await getEthPrices(transactions);
    // const [transactionsByMonth, cumulativeGasCostETH, cumulativeGasCostUSD] =
    //   calculateGasCostPerMonth(transactions, ethPrices, implicitGasPrice);
    // displayResults(
    //   transactions,
    //   cumulativeGasCostETH,
    //   cumulativeGasCostUSD,
    //   contractName,
    //   transactionsByMonth
    // );
  } catch (error) {
    console.error("Error:", error);
  }
}

cumulativeGasCost();

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
    console.log("--------------------");
  }
}
