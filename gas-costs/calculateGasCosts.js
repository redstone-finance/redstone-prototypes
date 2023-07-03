const axios = require("axios");
const dotenv = require("dotenv");
const contracts = require("./contracts.json");

dotenv.config();

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const ARBISCAN_API_KEY = process.env.ARBISCAN_API_KEY;

const blockchainExplorerMap = {
  ethereum: { explorer: "etherscan.io", apiKey: ETHERSCAN_API_KEY },
  arbitrum: { explorer: "arbiscan.io", apiKey: ARBISCAN_API_KEY },
};

async function calculateCumulativeGasCosts(contractName) {
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

    let cumulativeGasCost = 0;

    // Iterate through each transaction
    for (const tx of transactions) {
      const gasUsed = parseInt(tx.gasUsed);
      const gasPrice = parseInt(tx.gasPrice);
      const gasCost = gasUsed * gasPrice;
      cumulativeGasCost += gasCost;
    }

    cumulativeGasCost = cumulativeGasCost / 1e18; // Gas costs are in gwei, so divide by 1e18 to convert to ETH

    console.log(
      `Cumulative Gas Costs for contract '${name}':`,
      cumulativeGasCost,
      "ETH"
    );
  } catch (error) {
    console.error("Error:", error);
  }
}

// Example usage
calculateCumulativeGasCosts("swell");
calculateCumulativeGasCosts("vesta");
