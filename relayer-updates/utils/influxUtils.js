const axios = require("axios");
const {
  mapTxToInfluxDbRequest,
  mapBlockToInfluxDbRequest,
} = require("./formatUtils");

async function getLastSynchronizedBlocks(influx) {
  try {
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
  } catch (error) {
    console.error("Error getting last synchronized blocks:", error);
    throw error;
  }
}

async function insertIntoInfluxDb(influx, requestData) {
  try {
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
  } catch (error) {
    console.error("Error inserting into InfluxDB:", error);
    throw error;
  }
}

async function saveInInfluxDb(influx, transactions, lastSynchronizedBlocks) {
  try {
    const transactionsRequest = transactions.map((transaction) =>
      mapTxToInfluxDbRequest(transaction)
    );
    const lastSynchronizedBlocksRequest = lastSynchronizedBlocks.map((block) =>
      mapBlockToInfluxDbRequest(block)
    );
    const requestData = transactionsRequest.concat(
      lastSynchronizedBlocksRequest
    );
    await insertIntoInfluxDb(influx, requestData);
  } catch (error) {
    console.error("Error saving data into InfluxDB:", error);
    throw error;
  }
}

module.exports = {
  getLastSynchronizedBlocks,
  saveInInfluxDb,
};
