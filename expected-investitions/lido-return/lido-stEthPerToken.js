const axios = require("axios");
const dotenv = require("dotenv");
const ethers = require("ethers");

dotenv.config();
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const rpcUrl = "https://eth.llamarpc.com";

const contractAddress = "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0";
const apiKey = ETHERSCAN_API_KEY;
const functionSignature = "035faf82"; // "stEthPerToken";

const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
const contractABI = [
  "function stEthPerToken() external view returns (uint256)",
];
const contract = new ethers.Contract(contractAddress, contractABI, provider);

async function readFunctionValue() {
  try {
    const blockNumber = provider.getBlockNumber();
    const result = await contract.stEthPerToken();
    console.log("Function value at block", blockNumber, ":", result.toString());
    readFunctionValueAtBlock(blockNumber - 1000000);
  } catch (error) {
    console.error("Error reading function value:", error);
  }
}

readFunctionValue();

async function readFunctionValueAtBlock(targetBlockNumber) {
  try {
    const result = await contract.callStatic.stEthPerToken(
      {},
      { blockTag: targetBlockNumber }
    );
    console.log(
      `Function value at block ${targetBlockNumber}:`,
      result.toString()
    );
  } catch (error) {
    console.error("Error reading function value:", error);
  }
}


// async function readFunctionValue() {
//   try {
//     const blockNumber = provider.getBlockNumber();
//     const averageBlockTime = await getAverageBlockTime(provider);

//     if (averageBlockTime !== null) {
//       const timeIntervals = [24, 48, 72, 7 * 24]; // in hours
//       for (const interval of timeIntervals) {
//         const blocksAgo = Math.floor((interval * 3600) / averageBlockTime);
//         const result = await contract.stEthPerToken(14670575);
//         console.log(
//           `Function value at block ${
//             blockNumber - blocksAgo
//           } (${interval}h ago):`,
//           result.toString()
//         );
//       }
//     }
//   } catch (error) {
//     console.error("Error reading function value:", error);
//   }
// }

// readFunctionValue();


async function getAverageBlockTime(provider) {
  try {
    const currentBlock = await provider.getBlockNumber();
    const blockDifference = 10000;
    const block1 = await provider.getBlock(currentBlock - 11);
    const block2 = await provider.getBlock(currentBlock - 11 - blockDifference);

    if (block1 && block2) {
      const timeDifference = block1.timestamp - block2.timestamp;
      const averageBlockTime = timeDifference / blockDifference;
      return averageBlockTime;
    } else {
      console.error("Error fetching block data.");
      return null;
    }
  } catch (error) {
    console.error("Error fetching average block time:", error);
    return null;
  }
}



async function getCurrentBlockNumber() {
  const baseUrl = "https://api.etherscan.io/api";

  const params = {
    module: "proxy",
    action: "eth_blockNumber",
    apikey: apiKey,
  };

  try {
    const response = await axios.get(baseUrl, { params });
    const currentBlockNumber = parseInt(response.data.result, 16);
    console.log("Current block number:", currentBlockNumber);
    return currentBlockNumber;
  } catch (error) {
    console.error("Error fetching current block number:", error);
    return null;
  }
}

async function getContractTransactionHistory(
  contractAddress,
  apiKey,
  startBlock,
  endBlock
) {
  const baseUrl = "https://api.etherscan.io/api";

  const params = {
    module: "account",
    action: "txlist",
    address: contractAddress,
    startblock: startBlock,
    endblock: endBlock,
    sort: "asc",
    apikey: apiKey,
  };

  try {
    const response = await axios.get(baseUrl, { params });
    const transactions = response.data.result || [];
    console.log("Transactions found:", transactions.length);
    return transactions;
  } catch (error) {
    console.error("Error fetching transaction history:", error);
    return [];
  }
}

function findFunctionCalls(transactions, functionSignature) {
  const calls = [];
  const differentMonths = new Set();

  for (const tx of transactions) {
    const date = new Date(parseInt(tx.timeStamp) * 1000);
    const month = `${date.getFullYear()}-${date.getMonth() + 1}`;
    differentMonths.add(month);
    const inputData = tx.input || "";
    if (inputData.includes(functionSignature)) {
      calls.push(tx);
    }
  }
  console.log("Different months:", differentMonths);

  return calls;
}

// async function processBlocks(provider, startBlock, endBlock) {
//   try {
//     const blockPromises = [];
//     for (let blockNumber = startBlock; blockNumber <= endBlock; blockNumber++) {
//       const blockPromise = provider.getBlockWithTransactions(blockNumber);
//       blockPromises.push(blockPromise);
//     }
//     const blocksData = await Promise.all(blockPromises);
//     return blocksData;
//   } catch (error) {
//     console.error("Error processing blocks:", error);
//     throw error;
//   }
// }

// (async () => {
//   //   const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
//   //   const latestBlockNumber = await provider.getBlockNumber();

//   //   const startBlockNumber = latestBlockNumber - 1000;

//   //   const batchSize = 150;
//   //   console.log("startBlockNumber:", startBlockNumber);
//   //   console.log("latestBlockNumber:", latestBlockNumber);
//   //   for (let i = startBlockNumber; i <= latestBlockNumber; i += batchSize) {
//   //     const endBlock = Math.min(i + batchSize - 1, latestBlockNumber);
//   //     const blocksData = await processBlocks(provider, i, endBlock);

//   //     const doneBlocks = (i-startBlockNumber)/ (latestBlockNumber-startBlockNumber)*100;
//   //     console.log("Done blocks:", doneBlocks.toFixed(2), "%");

//   //     for (const blockData of blocksData) {
//   //       for (const tx of blockData.transactions) {
//   //         if (tx.data && tx.data.includes(functionSignature)) {
//   //           console.log("Found in block:", blockData.number);
//   //         }
//   //       }
//   //     }
//   //   }
//   const currentBlockNumber = await getCurrentBlockNumber();
//   const startBlock = currentBlockNumber - 200000;
//   const endBlock = currentBlockNumber;
//   const transactions = await getContractTransactionHistory(
//     contractAddress,
//     apiKey,
//     startBlock,
//     endBlock
//   );

//   const functionCalls = findFunctionCalls(transactions, functionSignature);

//   console.log("Function calls found:");
//   console.log("Total:", functionCalls.length);
//   //   for (const call of functionCalls) {
//   //     console.log(call);
//   //   }
// })();
