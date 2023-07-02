const axios = require("axios");

// Replace '<YOUR__API_KEY>' with your actual Etherscan / Arbiscan API key
const api_KEY = "<YOUR_API_KEY>";

const blockchainExplorer = "etherscan.io"; // or "arbiscan.io"
const contractAddress = "0x68ba9602B2AeE30847412109D2eE89063bf08Ec2";

// todo: Remove 2 lines bellow after testing
// const blockchainExplorer = "arbiscan.io"; // or "etherscan.io"
// const contractAddress = "0x36497bcfea36a3ba831e8322cad35be1663d347c";

async function calculateCumulativeGasCosts(contractAddress) {
  const apiUrl = `https://api.${blockchainExplorer}/api?module=account&action=txlist&address=${contractAddress}&apikey=${api_KEY}`;

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

    cumulativeGasCost = cumulativeGasCost / 1e18; // gas costs are in gwei, so divide by 1e18 to convert to ETH

    console.log("Cumulative Gas Costs:", cumulativeGasCost, "ETH");
  } catch (error) {
    console.error("Error:", error);
  }
}

calculateCumulativeGasCosts(contractAddress);
