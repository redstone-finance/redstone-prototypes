// ethers@5.4.1
const ethers = require("ethers");

// Replace '<YOUR_ETHERSCAN_API_KEY>' with your actual Etherscan API key
const api_KEY = "<YOUR_ETHERSCAN_API_KEY>";
const contractAddress = "0x68ba9602B2AeE30847412109D2eE89063bf08Ec2";

async function calculateCumulativeGasCosts(contractAddress) {
  const etherscanProvider = new ethers.providers.EtherscanProvider(
    "homestead",
    api_KEY
  );

  try {
    // Get the transaction history for the contract address
    const history = await etherscanProvider.getHistory(contractAddress);
    let cumulativeGasCost = ethers.BigNumber.from(0);

    // Iterate through each transaction in the history
    for (const tx of history) {
      const txReceipt = await etherscanProvider.getTransactionReceipt(tx.hash);
      const gasUsed = txReceipt.gasUsed;
      const gasPrice = tx.gasPrice; // Equals to txReceipt.effectiveGasPrice
      const gasCost = gasUsed.mul(gasPrice);
      cumulativeGasCost = cumulativeGasCost.add(gasCost);
    }

    // Convert the cumulative gas cost to ETH
    //  cumulativeGasCost = cumulativeGasCost.div(1e9); // 1e9 Gwei = 1 ETH ?

    const cumulativeGasCostInEth = ethers.utils.formatUnits(
      cumulativeGasCost,
      "ether"
    );

    console.log("Cumulative Gas Costs:", cumulativeGasCostInEth, "ETH");
  } catch (error) {
    console.error("Error:", error);
  }
}

calculateCumulativeGasCosts(contractAddress);
