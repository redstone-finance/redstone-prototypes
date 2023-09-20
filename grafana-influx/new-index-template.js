//TODO: lines 193-196, 215-240, 269-276
const redstone = require("redstone-protocol");
const { arrayify, toUtf8String } = require("ethers/lib/utils");
const axios = require("axios");
const { SSMClient, GetParameterCommand } = require("@aws-sdk/client-ssm");

const config = {
  arbitrum: {
    config: {
      indexerUrl: "api.arbiscan.io",
      indexerApiKey: "1RC98M9ZMRGCHCKV4NKIIQ7DMSF6IU1P82",
    },
    relayers: [
      {
        name: "vesta",
        address: "0x36497bcfea36a3ba831e8322cad35be1663d347c",
      },
      {
        name: "voltz",
        address: "0x58ebec7c7bb905e998860942eecf93a4fc90eea2",
      },
    ],
  },
  ethereum: {
    config: {
      indexerUrl: "api.etherscan.io",
      indexerApiKey: "NU6BVEU2SFBUG4W3MSYQGCI1BCTGKNG5Z1",
    },
    relayers: [
      {
        name: "swell",
        address: "0x68ba9602b2aee30847412109d2ee89063bf08ec2",
      },
      {
        name: "angle",
        address: "0x5BeEFeFE23aecccC77d164AB8E9Ff74e056588f1",
      },
    ],
  },
  avalanche: {
    config: {
      indexerUrl: "api.snowtrace.io",
      indexerApiKey: "C5T62B8A6U2ITB48WCXTMPEPR4SAJEE233",
    },
    relayers: [
      {
        name: "voltz",
        address: "0x6f2fe8f948cdf3d7e252ff6183e1cb84cc1c0f3e",
      },
    ],
  },
  "bnb-testnet": {
    config: {
      indexerUrl: "api-testnet.bscscan.com",
      indexerApiKey: "GN5K2HX3YTZKPKF6FHPXAZ79FD39UWCSAY",
    },
    relayers: [
      {
        name: "venus",
        address: "0x5b0e8f9b1a0de4fec0fbe53387817f30d7dec800",
      },
    ],
  },
};

const client = new SSMClient({ region: "eu-west-1" });
// AWS Cli generate private key...

async function fetchConfig() {
  const influxDbUrlPromise = getSSMParameterValue("/dev/influxdb/url");
  const influxDbTokenPromise = getSSMParameterValue("/dev/influxdb/token");
  return {
    influxDbUrl: await influxDbUrlPromise,
    influxDbToken: await influxDbTokenPromise,
  };
}

async function getSSMParameterValue(paraterName) {
  const command = new GetParameterCommand({
    Name: paraterName,
    WithDecryption: true,
  });
  return (await client.send(command)).Parameter.Value;
}

async function fetchAllTransactions(fromTimestamp) {
  const allTransactionsPromises = Object.keys(config).map((chainName) =>
    fetchTransactionsForChain(
      config[chainName].config,
      config[chainName].relayers,
      chainName,
      fromTimestamp
    )
  );

  return (await Promise.all(allTransactionsPromises)).flat();
}

async function fetchTransactionsForChain(
  config,
  relayers,
  chainName,
  fromTimestamp
) {
  const transactionsForChainPromises = relayers.map(async (relayer) =>
    fetchTransactionsForRelayer(config, relayer, chainName, fromTimestamp)
  );

  const transactionsForChain = (
    await Promise.all(transactionsForChainPromises)
  ).flat();

  console.log(
    `Finished fetching transactions for: ${chainName}, count: ${transactionsForChain.length}`
  );
  return transactionsForChain;
}

async function getFromBlockNumber(fromTimestamp, config) {
  const three_minutes = 180_000;
  const timestamp =
    fromTimestamp === undefined ? Date.now() - three_minutes : fromTimestamp;

  const timestampInSeconds = Math.floor(timestamp / 1000);
  const url = `https://${config.indexerUrl}/api?module=block&action=getblocknobytime&timestamp=${timestampInSeconds}&closest=before&apikey=${config.indexerApiKey}`;
  return (await axios.get(url)).data.result;
}

async function fetchTransactionsForRelayer(
  config,
  relayer,
  chainName,
  fromTimestamp
) {
  const fromBlockNumber = await getFromBlockNumber(fromTimestamp, config);
  const transactions = await fetchTransactionsWithPaginationAcc(
    [],
    1,
    10000,
    config,
    relayer,
    fromBlockNumber
  );
  return filterAndMapTransactions(transactions, chainName, relayer);
}

async function fetchTransactionsWithPaginationAcc(
  transactionsAcc,
  pageNumber,
  maxResultsPerPage,
  config,
  relayer,
  fromBlockNumber
) {
  const transactions = await fetchTransactionsWithPagination(
    pageNumber,
    maxResultsPerPage,
    config,
    relayer,
    fromBlockNumber
  );
  const newTransactionsAcc = transactionsAcc.concat(transactions);
  if (transactions.length === maxResultsPerPage) {
    return await fetchTransactionsWithPaginationAcc(
      newTransactionsAcc,
      pageNumber + 1,
      maxResultsPerPage,
      config,
      relayer,
      fromBlockNumber
    );
  } else {
    return newTransactionsAcc;
  }
}

async function fetchTransactionsWithPagination(
  pageNumber,
  maxResultsPerPage,
  config,
  relayer,
  fromBlockNumber
) {
  const url = `https://${config.indexerUrl}/api?module=account&action=txlist&address=${relayer.address}&startblock=${fromBlockNumber}&endblock=latest&page=${pageNumber}&offset=${maxResultsPerPage}&sort=asc&apikey=${config.indexerApiKey}`;
  return (await axios.get(url)).data.result;
}

function filterAndMapTransactions(transactions, chainName, relayer) {
  const filteredTransacitons = transactions.filter(
    (transaction) => transaction.contractAddress === ""
  );

  const mappedTransactions = filteredTransacitons.map((transaction) => {
    // TODO -----------------------------------------------------------------------
    const { txPreparationTimestamp, values } =
      getTxPreparationTimestampAndValues(transaction);
    // ----------------------------------------------------------------------------
    return {
      timestamp: Number(transaction.timeStamp) * 1000,
      gas: Number(transaction.gas),
      gasPrice: Number(transaction.gasPrice),
      gasUsed: Number(transaction.gasUsed),
      cumulativeGasUsed: Number(transaction.cumulativeGasUsed),
      from: transaction.from,
      isFailed: transaction.isError === "0",
      txPreparationTimestamp: txPreparationTimestamp,
      chainName: chainName,
      relayer: relayer.name,
      values: values,
    };
  });

  return mappedTransactions;
}

// TODO -----------------------------------------------------------------------
function getTxPreparationTimestampAndValues(transaction) {
  const txCalldataBytes = arrayify(transaction.input);
  const parsingResult = redstone.RedstonePayload.parse(txCalldataBytes);
  const unsignedMetadata = toUtf8String(parsingResult.unsignedMetadata);
  return {
    txPreparationTimestamp: Number(
      unsignedMetadata.substring(0, unsignedMetadata.indexOf("#"))
    ),
    values: getTxValues(parsingResult),
  };
}

function getTxValues(parsingResult) {
  // for all feedIds take median from different nodes and place as value-xxx
  // where xxx is feedId
  // So in data we will have value-xxx: 123.45, value-yyy: 678.90 value-zzz: null etc.
  // (We can push to database record without value-kkk if value is null)
  const values = {};
  feedIds.forEach((feedId) => {
    // Logical part.....
    // values[`value-${feedId}`] = getMedianForFeedId(feedId, someData);
  });
  return values;
}
// ----------------------------------------------------------------------------

async function saveInInfluxDb(influxDbUrl, influxDbToken, transactions) {
  const requestData = transactions.map((transaction) =>
    mapToInfluxDbRequest(transaction)
  );
  await insertIntoInfluxDb(influxDbUrl, influxDbToken, requestData);
}

function mapToInfluxDbRequest(transaction) {
  // tags that are used to narrow queried data in InfluxDb
  const tags =
    `chainName=${transaction.chainName},` + // e.g. ethereum, avalanche
    `relayerName=${transaction.relayer},` + // e.g. swell, voltz
    `from=${transaction.from},` + // transaction sender address
    `isFailed=${transaction.isFailed}`; // if transaction failed

  const txPreparationTimestampField = isNaN(transaction.txPreparationTimestamp)
    ? ""
    : `txPreparationTimestamp=${transaction.txPreparationTimestamp},`;
  const fields =
    `gas=${transaction.gas},` + // gas limit
    `gasPrice=${transaction.gasPrice},` + // gas price
    `gasUsed=${transaction.gasUsed},` + // gas used in transaction
    txPreparationTimestampField + // txPreparationTimestamp from EVM connector
    `cumulativeGasUsed=${transaction.cumulativeGasUsed}`; // total amount of gas used when this transactionw as executed in the block

  const timestamp = transaction.timestamp; // timestamp of transaction

  // TODO --------------------------------------------------------------------------
  //   const values = transaction.values;
  //     if (values) {
  //         Object.keys(values).forEach((key) => {
  //         fields += `,value-${key}=${values[key]}`;
  //         });
  //     }
  // -------------------------------------------------------------------------------

  return `onChainRelayersTransactions,${tags} ${fields} ${timestamp}`;
}

async function insertIntoInfluxDb(influxDbUrl, influxDbToken, requestData) {
  const config = {
    headers: {
      Authorization: `Token ${influxDbToken}`,
    },
  };
  await axios.post(
    `${influxDbUrl}/api/v2/write?org=redstone&bucket=redstone-tests&precision=ms`, //TODO change bucket to redstone test
    requestData.join("\n"),
    config
  );
}

exports.handler = async function (event, context) {
  const configPromise = fetchConfig();
  const allTransactions = await fetchAllTransactions(event.fromTimestamp);
  const config = await configPromise;
  await saveInInfluxDb(
    config.influxDbUrl,
    config.influxDbToken,
    allTransactions
  );
};

//run code
exports.handler();
