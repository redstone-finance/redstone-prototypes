const axios = require("axios");

// Replace '<YOUR_ETHERSCAN_API_KEY>' with your actual Etherscan API key
const api_KEY = "<YOUR_ETHERSCAN_API_KEY>";
const contractAddress = "0x68ba9602B2AeE30847412109D2eE89063bf08Ec2";

async function calculateCumulativeGasCosts(contractAddress) {
  const apiUrl = `https://api.etherscan.io/api?module=account&action=txlist&address=${contractAddress}&apikey=${api_KEY}`;

  try {
    // Get the transaction history for the contract address from Etherscan API
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
