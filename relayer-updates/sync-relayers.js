// TODO: switch to typescript?
const ethers = require("ethers");

const { networks } = require("./utils/constant");
const { fetchConfig } = require("./utils/configUtils");
const {
  getLastSynchronizedBlocks,
  saveInInfluxDb,
} = require("./utils/influxUtils");
const { processBlocks } = require("./utils/processUtils");
const { formatTransaction } = require("./utils/formatUtils");

async function findTransactionsWithMarker(rpcUrl, chainName, startBlockNumber) {
  try {
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const latestBlockNumber = await provider.getBlockNumber();
    if (!startBlockNumber) {
      //important for the first run
      startBlockNumber = latestBlockNumber;
    }
    const batchSize = 150;

    const txListWithTimestamp = [];
    for (let i = startBlockNumber; i <= latestBlockNumber; i += batchSize) {
      const endBlock = Math.min(i + batchSize - 1, latestBlockNumber);
      const blocksData = await processBlocks(provider, i, endBlock);

      for (const blockData of blocksData) {
        for (const tx of blockData.transactions) {
          if (tx.data && tx.data.includes("000002ed57011e0000")) {
            const fullTx = await provider.getTransactionReceipt(tx.hash);
            const formattedTx = formatTransaction(
              blockData,
              tx,
              fullTx,
              chainName
            );
            txListWithTimestamp.push({ ...formattedTx });
          }
        }
      }
    }
    return [txListWithTimestamp, latestBlockNumber];
  } catch (error) {
    console.error("Error in findTransactionsWithMarker:", error);
    throw error;
  }
}

exports.handler = async (event, context) => {
  try {
    const influx = await fetchConfig();
    const lastSynchronizedBlocks = await getLastSynchronizedBlocks(influx);

    const allTransactions = [];
    const latestBlocks = [];
    await Promise.all(
      networks.map((network) =>
        findTransactionsWithMarker(
          network.rpcUrl,
          network.chainName,
          lastSynchronizedBlocks[network.chainName]
        ).then(([txListWithTimestamp, latestBlockNumber]) => {
          allTransactions.push(...txListWithTimestamp);
          latestBlocks.push({
            chainName: network.chainName,
            latestBlockNumber: latestBlockNumber,
          });
        })
      )
    );

    saveInInfluxDb(influx, allTransactions, latestBlocks);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Sync process completed." }),
    };
  } catch (error) {
    console.error("Error in handler:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};

exports.handler();
