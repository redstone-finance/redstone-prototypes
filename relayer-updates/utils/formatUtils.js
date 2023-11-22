const { getTxPreparationTimestampAndValues } = require("./processUtils");

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

module.exports = {
  mapTxToInfluxDbRequest,
  mapBlockToInfluxDbRequest,
  formatTransaction,
};
