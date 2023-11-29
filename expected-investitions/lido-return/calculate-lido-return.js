const { Web3 } = require("web3");

const rpcUrl = "https://eth.llamarpc.com";
const httpProvider = new Web3.providers.HttpProvider(rpcUrl);
const web3 = new Web3(httpProvider);

const address = "0xd15a672319cf0352560ee76d9e89eab0889046d3";
//fromAddress 0x889edc2edab5f40e902b864ad4d7ade8e412f9b1;
const topics = [
  "0xd2282bfa24f3803076af0953f1ed987d0e45edacdc20d6dce52337b1c4588cdb",
  "0x0000000000000000000000000000000000000000000000000000000000000000",
  "0x000000000000000000000000ae7ab96520de3a18e5e111b5eaab095312d7fe84",
];

// async function getTransactions() {
//   try {
//     const days = 15;
//     const blockRange = days * 24 * 60 * 5; // assuming 5 blocks per minute
//     const currentBlockNumber = Number(await web3.eth.getBlockNumber());
//     const transactions = await web3.eth.getPastLogs({
//       address: address,
//       fromBlock: currentBlockNumber - blockRange,
//       toBlock: currentBlockNumber,
//       topics: topics,
//     });

//     console.log("Transactions:", transactions.length);
//     transactions.forEach((transaction) => {
//       console.log(transaction);
//       console.log("Block Number:", Number(transaction.blockNumber));
//       // console.log("Transaction Hash:", transaction.transactionHash);
//     });
//   } catch (error) {
//     console.error("Error fetching transactions:", error);
//   }
// }

// getTransactions();

async function getTransactions(fromBlock, toBlock, retryCount = 5) {
  for (let i = 0; i < retryCount; i++) {
    try {
      const transactions = await web3.eth.getPastLogs({
        address: address,
        fromBlock: fromBlock,
        toBlock: toBlock,
        topics: topics,
      });

      // transactions.forEach((transaction) => {
      //   console.log("Block Number:", Number(transaction.blockNumber));
      //   // console.log("Transaction Hash:", transaction.transactionHash);
      // });

      //return blockNumbers

      const blockNumbers = transactions.map((transaction) => {
        return Number(transaction.blockNumber);
      });
      return blockNumbers;
    } catch (error) {
      console.error(`Error fetching transactions (Attempt ${i + 1})`);
      await new Promise((resolve) => setTimeout(resolve, 10000));
      if (i === retryCount - 1) console.error(error);
    }
  }
}

async function runForMultipleDays(startBlock, endBlock, intervalDays) {
  const result = [];

  while (startBlock < endBlock) {
    const fromBlock = startBlock;
    const toBlock = Math.min(startBlock + intervalDays * 24 * 60 * 5, endBlock);

    const transactions = await getTransactions(fromBlock, toBlock);
    result.push(...transactions);
    startBlock = toBlock + 1;
  }

  return result;
}

async function main() {
  const currentBlockNumber = Number(await web3.eth.getBlockNumber());
  const endBlock = currentBlockNumber;
  const totalDays = 180;
  const startBlock = endBlock - totalDays * 24 * 60 * 5; // assuming 5 blocks per minute
  const intervalDays = 15;

  const result = await runForMultipleDays(startBlock, endBlock, intervalDays);
  console.log("Results:", result);
  console.log("Total:", result.length);
}

main();
