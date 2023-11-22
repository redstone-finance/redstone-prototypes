const redstone = require("@redstone-finance/protocol");
const { arrayify, toUtf8String } = require("ethers/lib/utils");

async function processBlocks(provider, startBlock, endBlock) {
  try {
    const blockPromises = [];
    for (let blockNumber = startBlock; blockNumber <= endBlock; blockNumber++) {
      const blockPromise = provider.getBlockWithTransactions(blockNumber);
      blockPromises.push(blockPromise);
    }
    const blocksData = await Promise.all(blockPromises);
    return blocksData;
  } catch (error) {
    console.error("Error processing blocks:", error);
    throw error;
  }
}

function getTxPreparationTimestampAndValues(transaction) {
  try {
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
  } catch (error) {
    console.error("Error parsing transaction data:", error);
    throw error;
  }
}

function getTxValues(parsingResult) {
  try {
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
  } catch (error) {
    console.error("Error getting transaction values:", error);
    throw error;
  }
}

function getMedianForFeedId(values) {
  try {
    values.sort();
    const middle = Math.floor(values.length / 2);
    if (values.length % 2 === 0) {
      return (values[middle - 1] + values[middle]) / 2;
    } else {
      return values[middle];
    }
  } catch (error) {
    console.error("Error calculating median:", error);
    throw error;
  }
}

module.exports = {
  processBlocks,
  getTxPreparationTimestampAndValues,
};
