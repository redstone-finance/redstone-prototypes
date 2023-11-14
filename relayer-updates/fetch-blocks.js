// TODO: divide into modules(constants file for networks, processUtils, formatUtils, influxUtils), 
// TODO: more try-catch, testing, optimize the code (refactor, promise.all etc)
// TODO: switch to typescript?
const redstone = require("@redstone-finance/protocol");
const ethers = require("ethers");
const { arrayify, toUtf8String } = require("ethers/lib/utils");
const axios = require("axios");

const networks = [
  {
    chainName: "arbitrum",
    rpcUrl: "https://arbitrum.meowrpc.com/",
  },
  {
    chainName: "ethereum",
    rpcUrl: "https://api.zmok.io/mainnet/oaen6dy8ff6hju9k",
  },
  {
    chainName: "avalanche",
    rpcUrl: "https://api.avax.network/ext/bc/C/rpc",
  },
  //TODO: add more chains and replace rpcUrls
];

async function getLastSynchronizedBlocks(influx) {
  const query = `from(bucket: "redstone")
    |> range(start: -1h)
    |> filter(fn: (r) => r._measurement == "lastSynchronizedBlock")
    |> group(columns: ["chainName"])
    |> last()
    |> keep(columns: ["chainName", "_value"])`;

  const config = {
    headers: {
      Authorization: `Token ${influx.influxDbToken}`,
      "Content-Type": "application/vnd.flux",
    },
    responseType: "json",
  };

  const response = await axios.post(
    `${influx.influxDbUrl}/api/v2/query?org=redstone&bucket=redstone`,
    query,
    config
  );

  const lines = response.data.split("\n");
  const latestBlocks = {};
  for (let i = 1; i < lines.length - 2; i++) {
    // first line is header, last 2 lines are empty
    const line = lines[i];
    const columns = line.split(",");
    const chainName = columns[4].trim();
    const blockNumber = parseInt(columns[3].trim());
    latestBlocks[chainName] = blockNumber;
  }
  return latestBlocks;
}

const { SSMClient, GetParameterCommand } = require("@aws-sdk/client-ssm");
const client = new SSMClient({ region: "eu-west-1" });

async function getSSMParameterValue(parameterName) {
  const command = new GetParameterCommand({
    Name: parameterName,
    WithDecryption: true,
  });
  return (await client.send(command)).Parameter.Value;
}

async function fetchConfig() {
  const influxDbUrlPromise = getSSMParameterValue("/dev/influxdb/url");
  const influxDbTokenPromise = getSSMParameterValue("/dev/influxdb/token");

  const [influxDbUrl, influxDbToken] = await Promise.all([
    influxDbUrlPromise,
    influxDbTokenPromise,
  ]);

  return {
    influxDbUrl,
    influxDbToken,
  };
}

async function processBlocks(provider, startBlock, endBlock) {
  const blockPromises = [];
  for (let blockNumber = startBlock; blockNumber <= endBlock; blockNumber++) {
    const blockPromise = provider.getBlockWithTransactions(blockNumber);
    blockPromises.push(blockPromise);
  }
  const blocksData = await Promise.all(blockPromises);
  return blocksData;
}

function formatTransaction(blockData, tx, fullTx, chainName) {
  const { txPreparationTimestamp, values } =
    getTxPreparationTimestampAndValues(tx);
  const txData = tx.data.substring(0, 10); // First 4 bytes of data

  return {
    timestamp: Number(blockData.timestamp) * 1000,
    gas: Number(blockData.gasLimit), // TODO: make sure it's equivalent to gas.
    gasPrice: Number(tx.gasPrice), // or fullTx.effectiveGasPrice
    gasUsed: Number(fullTx.gasUsed),
    cumulativeGasUsed: Number(fullTx.cumulativeGasUsed),
    from: fullTx.from,
    isFailed: fullTx.status === 0, // isFailed: transaction.isError === "0" // TODO: make sure it's equivalent
    txPreparationTimestamp: txPreparationTimestamp,
    chainName: chainName,
    adapterContract: tx.to,
    values: values,
    txData: txData,
  };
}

async function findTransactionsWithMarker(rpcUrl, chainName, startBlockNumber) {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

  const latestBlockNumber = await provider.getBlockNumber();
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
          // console.log(formattedTx);
        }
      }
    }
  }
  return [txListWithTimestamp, latestBlockNumber];
}

async function insertIntoInfluxDb(influx, requestData) {
  const config = {
    headers: {
      Authorization: `Token ${influx.influxDbToken}`,
    },
  };
  await axios.post(
    `${influx.influxDbUrl}/api/v2/write?org=redstone&bucket=redstone&precision=ms`,
    requestData.join("\n"),
    config
  );
}

function mapTxToInfluxDbRequest(transaction) {
  // Tags that are used to narrow queried data in InfluxDb
  const tags =
    `chainName=${transaction.chainName},` + // e.g. ethereum, avalanche
    `relayerName=${transaction.relayer},` + // e.g. swell, voltz //TODO: map using address "to" or from?
    `from=${transaction.from},` +
    `isFailed=${transaction.isFailed}`;

  const txPreparationTimestampField = isNaN(transaction.txPreparationTimestamp)
    ? ""
    : `txPreparationTimestamp=${transaction.txPreparationTimestamp},`;
  let fields =
    `gas=${transaction.gas},` +
    `gasPrice=${transaction.gasPrice},` +
    `gasUsed=${transaction.gasUsed},` +
    `txData=${transaction.txData},` +
    txPreparationTimestampField + // txPreparationTimestamp from EVM connector
    `cumulativeGasUsed=${transaction.cumulativeGasUsed}`; // total amount of gas used when this transaction was executed in the block

  const values = transaction.values;
  if (values) {
    Object.keys(values).forEach((key) => {
      fields += `,${key}=${values[key]}`; // values of data feeds
    });
  }

  const timestamp = transaction.timestamp;
  return `onChainRelayersTransactions,${tags} ${fields} ${timestamp}`;
}

function mapBlockToInfluxDbRequest(block) {
  const tags = `chainName=${block.chainName}`;
  const fields = `_value=${block.latestBlockNumber}`;
  const timestamp = new Date().getTime();
  return `lastSynchronizedBlock,${tags} ${fields} ${timestamp}`;
}

async function saveInInfluxDb(influx, transactions, lastSynchronizedBlocks) {
  const transactionsRequest = transactions.map((transaction) =>
    mapTxToInfluxDbRequest(transaction)
  );
  const lastSynchronizedBlocksRequest = lastSynchronizedBlocks.map((block) =>
    mapBlockToInfluxDbRequest(block)
  );
  const requestData = transactionsRequest.concat(lastSynchronizedBlocksRequest);
  await insertIntoInfluxDb(influx, requestData);
}

function getTxPreparationTimestampAndValues(transaction) {
  const parsingResult = redstone.RedstonePayload.parse(
    arrayify(transaction.data)
  );
  const unsignedMetadata = toUtf8String(parsingResult.unsignedMetadata);
  return {
    txPreparationTimestamp: Number(
      unsignedMetadata.substring(0, unsignedMetadata.indexOf("#"))
    ),
    values: getTxValues(parsingResult),
  };
}

function getTxValues(parsingResult) {
  const feedIdToValues = {};
  parsingResult.signedDataPackages.flatMap((signedDataPackage) =>
    signedDataPackage.dataPackage.dataPoints.map((numericDataPoint) => {
      const { dataFeedId, value } = numericDataPoint;
      const numberValue = Number(
        //TODO: maybe use BigInt or shift by eg. 8 decimals?
        value.reduce((acc, byte) => (acc << 8n) + BigInt(byte), 0n)
      );
      feedIdToValues[dataFeedId] = (feedIdToValues[dataFeedId] || []).concat(
        numberValue
      );
    })
  );

  const values = Object.fromEntries(
    Object.entries(feedIdToValues).map(([feedId, valuesArray]) => [
      `value-${feedId}`,
      getMedianForFeedId(valuesArray),
    ])
  );

  return values;
}

function getMedianForFeedId(values) {
  values.sort();
  const middle = Math.floor(values.length / 2);
  if (values.length % 2 === 0) {
    return (values[middle - 1] + values[middle]) / 2;
  } else {
    return values[middle];
  }
}

exports.handler = async (event, context) => {
  const influx = await fetchConfig();
  // const fakeLatestBlocks = [
  //   { chainName: "arbitrum", latestBlockNumber: 148325599 },
  //   { chainName: "ethereum", latestBlockNumber: 18571144 },
  //   { chainName: "avalanche", latestBlockNumber: 37758428 },
  // ];
  // const allTransactionsFake = [];
  // await saveInInfluxDb(influx, allTransactionsFake, fakeLatestBlocks);

  //TODO: first add current blocks to influx, then schedule the lambda to run every 20 minutes
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
};

exports.handler();

// const rpcUrls = [
//   // "https://arbitrum-one.blastapi.io/6ebaff4b-205e-4027-8cdc-10c3bacc8abb",
//   // "https://arb1.arbitrum.io/rpc",
//   // "https://arb-mainnet-public.unifra.io",
//   "https://arbitrum.meowrpc.com/",
// ];
// arbitrum, ethereum, avalanche, kava, celo ...

// TODO: uncomment when on AWS lambda if used there
// const AWS = require("aws-sdk");
// const ssm = new AWS.SSM();

// async function getSSMParameter(parameterName) {
//   const params = {
//     Name: parameterName,
//     WithDecryption: true,
//   };

//   try {
//     const response = await ssm.getParameter(params).promise();
//     return response.Parameter.Value;
//   } catch (error) {
//     console.error(`Error getting ${parameterName} from SSM:`, error);
//     throw error;
//   }
// }

// async function fetchConfig() {
//   const influxDbUrlPromise = getSSMParameter("/dev/influxdb/url");
//   const influxDbTokenPromise = getSSMParameter("/dev/influxdb/token");

//   const [influxDbUrl, influxDbToken] = await Promise.all([
//     influxDbUrlPromise,
//     influxDbTokenPromise,
//   ]);

//   const influx = new InfluxDB({
//     url: influxDbUrl,
//     token: influxDbToken,
//     org: "redstone",
//     timeout: 1 * 60 * 1000, // 1 minute
//   });

//   return influx;
// }
