const { SSMClient, GetParameterCommand } = require("@aws-sdk/client-ssm");
const client = new SSMClient({ region: "eu-west-1" });
const axios = require("axios");

async function getLastSynchronizedBlock(influx) {
  const query = `from(bucket: "redstone")
    |> range(start: -1h)
    |> filter(fn: (r) => r._measurement == "last_synchronized_block")
    |> last()
    |> keep(columns: ["_value"])`;

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

  const data = response.data;
  const startIndex = data.indexOf("0,");
  const valuePart = data.substring(startIndex + 2);
  const lastSynchronizedBlock = Number(valuePart);
  return lastSynchronizedBlock;
}

async function saveLastSynchronizedBlock(influx, blockNumber) {
  const measurement = "last_synchronized_block";
  const tags = "blockNumber=blockNumber";
  const fields = `_value=${blockNumber}`;
  const timestamp = new Date().getTime();

  const requestData = [`${measurement},${tags} ${fields} ${timestamp}`];

  await insertIntoInfluxDb(influx, requestData);
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

exports.handler = async (event, context) => {
  const influx = await fetchConfig();
  saveLastSynchronizedBlock(influx, 1435416889);
  const lastSynchronizedBlock = await getLastSynchronizedBlock(influx);
  console.log(lastSynchronizedBlock);

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Sync process completed." }),
  };
};

exports.handler();

// function mapToInfluxDbRequest(transaction) {
//   // tags that are used to narrow queried data in InfluxDb
//   const tags =
//     `chainName=${transaction.chainName},` + // e.g. ethereum, avalanche
//     `relayerName=${transaction.relayer},` + // e.g. swell, voltz
//     `from=${transaction.from},` + // transaction sender address
//     `isFailed=${transaction.isFailed}`; // if transaction failed

//   const txPreparationTimestampField = isNaN(transaction.txPreparationTimestamp)
//     ? ""
//     : `txPreparationTimestamp=${transaction.txPreparationTimestamp},`;
//   let fields =
//     `gas=${transaction.gas},` + // gas limit
//     `gasPrice=${transaction.gasPrice},` + // gas price
//     `gasUsed=${transaction.gasUsed},` + // gas used in transaction
//     txPreparationTimestampField + // txPreparationTimestamp from EVM connector
//     `cumulativeGasUsed=${transaction.cumulativeGasUsed}`; // total amount of gas used when this transactionw as executed in the block

//   const values = transaction.values;
//   if (values) {
//     Object.keys(values).forEach((key) => {
//       fields += `,${key}=${values[key]}`; // values of data feeds
//     });
//   }

//   const timestamp = transaction.timestamp; // timestamp of transaction

//   return `onChainRelayersTransactions,${tags} ${fields} ${timestamp}`;
// }
