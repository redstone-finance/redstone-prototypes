const axios = require("axios");

// Replace '<YOUR_ARBISCAN_API_KEY>' with your actual Arbiscan API key
const api_KEY = "<YOUR_ARBISCAN_API_KEY>";
const contractAddress = "0x36497bcfea36a3ba831e8322cad35be1663d347c";

async function calculateCumulativeGasCosts(contractAddress) {
  const apiUrl = `https://api.arbiscan.io/api?module=account&action=txlist&address=${contractAddress}&apikey=${api_KEY}`;

  try {
    // Get the transaction history for the contract address from Arbiscan API
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

    cumulativeGasCost = cumulativeGasCost / 1e18;

    console.log("Cumulative Gas Costs:", cumulativeGasCost, "ETH");
  } catch (error) {
    console.error("Error:", error);
  }
}

calculateCumulativeGasCosts(contractAddress);
