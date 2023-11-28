const ethers = require("ethers");
const redstone = require("@redstone-finance/protocol");
const { arrayify, toUtf8String } = require("ethers/lib/utils");

const networks = [
  {
    chainName: "manta",
    rpcUrl: "https://pacific-rpc.manta.network/http",
  },
];

async function tester() {
  const rpcUrl = "https://pacific-rpc.manta.network/http";
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  // const latestBlockNumber = await provider.getBlockNumber();
  // console.log(latestBlockNumber);

  const transactionHash =
    "0x285ee268b873bd274e7cfaa0696557b78ca263f35031d6f5c79c0686ad9a7f44";
  // "0x2e02241794bf913de77ab310c748921302ff3e78018831b01641e1d7e42f56d6";
  // "0x43f5187e40cf3f85ac8d3d0239d4ceef1eb497d1bc540c7a6a2e54b44eed26d4";

  //  const transactionHash =
  //    "0x285ee268b873bd274e7cfaa0696557b78ca263f35031d6f5c79c0686ad9a7f44";
  // //get transaction data
  // const transaction = await provider.getTransaction(transactionHash);
  const fullTx = await provider.getTransactionReceipt(transactionHash);

  const gasCost = Number(fullTx.effectiveGasPrice) * Number(fullTx.gasUsed);
  console.log("Gas Price:", fullTx.effectiveGasPrice.toString());
  console.log("Gas Used:", fullTx.gasUsed.toString());
  console.log("Gas Cost:", gasCost / 1e18);

  // console.log(fullTx.effectiveGasPrice);
  // console.log(fullTx.gasUsed);
  // const result2 = redstone.RedstonePayload.parse(arrayify(transaction.data));
  // const result2 = new RedstonePayloadParser(arrayify(transaction.data)).parse();
  // console.log(result2);
}

tester();

async function processBlocks(provider, startBlock, endBlock) {
  const blockPromises = [];
  for (let blockNumber = startBlock; blockNumber <= endBlock; blockNumber++) {
    const blockPromise = provider.getBlockWithTransactions(blockNumber);
    blockPromises.push(blockPromise);
  }
  const blocksData = await Promise.all(blockPromises);
  return blocksData;
}

// function formatTransaction(blockData, tx, fullTx, chainName) {
//   const { txPreparationTimestamp, values } =
//     getTxPreparationTimestampAndValues(tx);

//   return {
//     timestamp: Number(blockData.timestamp) * 1000,
//     gas: Number(blockData.gasLimit), // TODO: make sure it's equivalent to gas.
//     gasPrice: Number(tx.gasPrice), // or fullTx.effectiveGasPrice
//     gasUsed: Number(fullTx.gasUsed),
//     cumulativeGasUsed: Number(fullTx.cumulativeGasUsed),
//     from: fullTx.from,
//     isFailed: fullTx.status === 0, // isFailed: transaction.isError === "0" // TODO: make sure it's equivalent
//     txPreparationTimestamp: txPreparationTimestamp,
//     chainName: chainName,
//     adapterContract: tx.to,
//     values: values,
//   };
// }

async function findTransactionsWithMarker(rpcUrl, chainName) {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

  const latestBlockNumber = await provider.getBlockNumber();
  const startBlockNumber = latestBlockNumber - 100;
  const batchSize = 150;

  const gasPrices = [];
  let iter = 1;
  let limGasPrice = 0;

  const txListWithTimestamp = [];
  for (let i = startBlockNumber; i <= latestBlockNumber; i += batchSize) {
    const endBlock = Math.min(i + batchSize - 1, latestBlockNumber);
    const blocksData = await processBlocks(provider, i, endBlock);
    // console.log(`Processing blocks ${i} - ${endBlock}`);
    // 20940626135068.52;
    // 0.000340945511364850;
    // 340945511364850/10^18 = 3.4*10^-3 Gwei
    // 30*24*30*3.4*10^-4 = 7.5 Gwei = 0.25 USD

    // 10^13/10^18=10^-5 Gwei -> 1,5*10^-5 Gwei
    // 4 * 30 * 24 * 30 * 2.1*10^-5 = 2 Gwei = 0.075 USD
    for (const blockData of blocksData) {
      for (const tx of blockData.transactions) {
        const fullTx = await provider.getTransactionReceipt(tx.hash);
        const gasCost =
          Number(fullTx.effectiveGasPrice) * Number(fullTx.gasUsed);
        gasPrices.push(gasCost);
        limGasPrice = (limGasPrice / iter) * (iter - 1) + gasCost / iter;
        iter++;
        console.log(limGasPrice);
      }
    }
  }
  console.log(gasPrices);
  //calculate average gas price
  const avgGasPrice = gasPrices.reduce((a, b) => a + b, 0) / gasPrices.length;
  console.log(avgGasPrice);

  return [txListWithTimestamp, latestBlockNumber];
}

// function getTxPreparationTimestampAndValues(transaction) {
//   const parsingResult = redstone.RedstonePayload.parse(
//     arrayify(transaction.data)
//   );
//   const unsignedMetadata = toUtf8String(parsingResult.unsignedMetadata);
//   return {
//     txPreparationTimestamp: Number(
//       unsignedMetadata.substring(0, unsignedMetadata.indexOf("#"))
//     ),
//     values: getTxValues(parsingResult),
//   };
// }

// function getTxValues(parsingResult) {
//   const feedIdToValues = {};
//   parsingResult.signedDataPackages.flatMap((signedDataPackage) =>
//     signedDataPackage.dataPackage.dataPoints.map((numericDataPoint) => {
//       const { dataFeedId, value } = numericDataPoint;
//       const numberValue = Number(
//         //TODO: maybe use BigInt or shift by eg. 8 decimals?
//         value.reduce((acc, byte) => (acc << 8n) + BigInt(byte), 0n)
//       );
//       feedIdToValues[dataFeedId] = (feedIdToValues[dataFeedId] || []).concat(
//         numberValue
//       );
//     })
//   );

//   const values = Object.fromEntries(
//     Object.entries(feedIdToValues).map(([feedId, valuesArray]) => [
//       `value-${feedId}`,
//       getMedianForFeedId(valuesArray),
//     ])
//   );

//   return values;
// }

// function getMedianForFeedId(values) {
//   values.sort();
//   const middle = Math.floor(values.length / 2);
//   if (values.length % 2 === 0) {
//     return (values[middle - 1] + values[middle]) / 2;
//   } else {
//     return values[middle];
//   }
// }

exports.handler = async (event, context) => {
  const allTransactions = [];
  const latestBlocks = [];
  await Promise.all(
    networks.map((network) =>
      findTransactionsWithMarker(network.rpcUrl, network.chainName).then(
        ([txListWithTimestamp, latestBlockNumber]) => {
          allTransactions.push(...txListWithTimestamp);
          latestBlocks.push({
            chainName: network.chainName,
            latestBlockNumber: latestBlockNumber,
          });
        }
      )
    )
  );

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Sync process completed." }),
  };
};

// exports.handler();
