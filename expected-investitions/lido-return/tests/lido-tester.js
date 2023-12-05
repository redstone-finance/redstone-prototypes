const { Web3 } = require("web3");
const { fromWei } = require("web3-utils");
const EthDater = require("ethereum-block-by-date");
const fs = require("fs");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

const rpcUrl = "https://eth.drpc.org";
// const rpcUrl = "https://rpc.builder0x69.io";
const httpProvider = new Web3.providers.HttpProvider(rpcUrl);
const web3 = new Web3(httpProvider);
const dater = new EthDater(web3);
const borderTimestamp = 1613752630000;

const contractAddress = "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0";
const address = "0xd15a672319cf0352560ee76d9e89eab0889046d3";
//fromAddress 0x889edc2edab5f40e902b864ad4d7ade8e412f9b1;
const topics = [
  "0xd2282bfa24f3803076af0953f1ed987d0e45edacdc20d6dce52337b1c4588cdb",
  "0x0000000000000000000000000000000000000000000000000000000000000000",
  "0x000000000000000000000000ae7ab96520de3a18e5e111b5eaab095312d7fe84",
];

const contractABI = [
  {
    constant: true,
    inputs: [],
    name: "stEthPerToken",
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
];

const contract = new web3.eth.Contract(contractABI, contractAddress);

async function retryOperation(operation, retryCount = 100, delay = 10000) {
  for (let i = 0; i < retryCount; i++) {
    try {
      return await operation();
    } catch (error) {
      if ((i + 1) % 10 == 0)
        console.error(`Error (Attempt ${i + 1}/${retryCount})`);
      if (i === retryCount - 1) console.error(error);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

async function readFunctionValueAtBlock(targetBlockNumber) {
  return await retryOperation(async () => {
    const block = await web3.eth.getBlock(targetBlockNumber);
    const timestamp = Number(block.timestamp);
    const result = await contract.methods
      .stEthPerToken()
      .call(null, targetBlockNumber);
    return { value: fromWei(result, "ether"), timestamp: timestamp };
  });
}

async function getBlockNumbers(toTimestamp = Math.floor(Date.now())) {
  return await retryOperation(async () => {
    const days = 9;
    const blockRange = days * 24 * 60 * 5; // assuming 5 blocks per minute, if more than increase 5 to 6 or 7
    const endBlockNumber = (await dater.getDate(toTimestamp)).block;
    const transactions = await web3.eth.getPastLogs({
      address: address,
      fromBlock: endBlockNumber - blockRange,
      toBlock: endBlockNumber,
      topics: topics,
    });

    const blockNumbers = transactions.map((transaction) => {
      return Number(transaction.blockNumber);
    });
    return blockNumbers;
  });
}

function calculateYearlyReturn(startValTime, endValTime) {
  const secondsInYear = 365.25 * 24 * 60 * 60;
  const secondsInPeriod = endValTime.timestamp - startValTime.timestamp;
  const periodReturn = endValTime.value / startValTime.value;
  if (secondsInPeriod === 0) return 1; // if no rebase happened
  const yearlyReturn = periodReturn ** (secondsInYear / secondsInPeriod);
  //   console.log(
  //     `Period return: ${periodReturn} in ${Math.round(
  //       secondsInPeriod / (60 * 60 * 24)
  //     )} days`
  //   );
  //   console.log("Yearly return", yearlyReturn);
  return yearlyReturn;
}

async function getReturnToTimestamp(toTimestamp) {
  const blocksToCheck = await getBlockNumbers(toTimestamp);
  const actualBlocksToCheck = [
    blocksToCheck[Math.max(blocksToCheck.length - 8, 0)],
    blocksToCheck[blocksToCheck.length - 1],
  ];
  const blockValues = await Promise.all(
    actualBlocksToCheck.map((blockNumber) =>
      readFunctionValueAtBlock(blockNumber)
    )
  );
  return calculateYearlyReturn(blockValues[0], blockValues[1]);
}

async function getRatioAtTimestamp(timestamp) {
  return await retryOperation(async () => {
    const blockNumber = (await dater.getDate(timestamp)).block;
    const value = await contract.methods
      .stEthPerToken()
      .call(null, blockNumber);
    return fromWei(value, "ether");
  });
}

async function writeResultsToCsv(yearlyReturns, fileName) {
  const csvWriter = createCsvWriter({
    path: fileName,
    header: [
      { id: "endTime", title: "EndTime" },
      { id: "value", title: "Value" },
    ],
    append: true,
  });
  const records = yearlyReturns.map((yearlyReturn) => ({
    endTime: yearlyReturn.endTime,
    value: yearlyReturn.value,
  }));
  await csvWriter.writeRecords(records);
}

async function readHistoricalValues1h30D() {
  const currentTimestampMs = Math.floor(Date.now());
  let timestampsList = [];
  for (let i = 0; i < 24 * 30; i++) {
    timestampsList.push(currentTimestampMs - i * 3600 * 1000); // 1 hour
  }
  const yearlyReturns = await Promise.all(
    timestampsList.map(async (timestamp) => ({
      endTime: new Date(timestamp).toISOString(),
      value: await getReturnToTimestamp(timestamp),
    }))
  );
  writeResultsToCsv(yearlyReturns, "lido-return-1h30D.csv");
}

// readHistoricalValues1h30D();

async function readHistoricalValues1d1Y() {
  const currentTimestampMs = Math.floor(Date.now());
  let timestampsList = [];
  for (let i = 0; i < 366; i++) {
    timestampsList.push(currentTimestampMs - i * 24 * 3600 * 1000); // 1 day
  }
  const yearlyReturns = await Promise.all(
    timestampsList.map(async (timestamp) => ({
      endTime: new Date(timestamp).toISOString(),
      value: await getReturnToTimestamp(timestamp),
    }))
  );
  writeResultsToCsv(yearlyReturns, "lido-return-1d1Y.csv");
}

async function readHistoricalRatio1d3Y() {
  const currentTimestampMs02 = new Date(
    new Date().setHours(2, 0, 0, 0)
  ).getTime();
  let timestampsList = [];
  for (let i = 0; i < 366 * 3; i++) {
    if (currentTimestampMs02 - i * 24 * 3600 * 1000 < borderTimestamp) break;
    timestampsList.push(currentTimestampMs02 - i * 24 * 3600 * 1000); // 1 day
  }
  const Ratios = await Promise.all(
    timestampsList.map(async (timestamp) => ({
      endTime: new Date(timestamp).toISOString(),
      value: await getRatioAtTimestamp(timestamp),
    }))
  );
  writeResultsToCsv(Ratios, "lido-ratio-1d3Y.csv");

  console.log(timestampsList.length);
  console.log(Ratios.length);
  let counter = 0;
  for (let i = 1; i < timestampsList.length; i++) {
    if (Ratios[i].value > Ratios[i - 1].value) {
      console.log("error at " + i + " " + Ratios[i].endTime);
    }
    if (Ratios[i].value == Ratios[i - 1].value) {
      counter += 1;
      console.log("same at " + i + " " + Ratios[i].endTime);
    }
  }
  console.log(counter);
}

// readHistoricalRatio1d3Y();

async function readHistoricalRatio1h3Y() {
  const currentTimestampMs02 = new Date(
    new Date().setHours(2, 0, 0, 0)
  ).getTime();
  let timestampsList = [];
  for (let i = 0; i < 24 * 366 * 3; i++) {
    if (currentTimestampMs02 - i * 3600 * 1000 < borderTimestamp) break;
    timestampsList.push(currentTimestampMs02 - i * 3600 * 1000); // 1 hour
  }

  const batchProcessSize = 500;
  const Ratios = [];

  for (let i = 0; i < timestampsList.length; i += batchProcessSize) {
    const currentBatch = timestampsList.slice(i, i + batchProcessSize);
    const batchResults = await Promise.all(
      currentBatch.map(async (timestamp) => ({
        endTime: new Date(timestamp).toISOString(),
        value: await getRatioAtTimestamp(timestamp),
      }))
    );
    await writeResultsToCsv(batchResults, "lido-ratio-1h3Y.csv");
    Ratios.push(...batchResults);
    console.log(
      `Processed ${Ratios.length} records out of ${timestampsList.length}`
    );
    console.log(
      `Processed ${Math.round((Ratios.length / timestampsList.length) * 100)}%`
    );
  }

  // writeResultsToCsv(Ratios, "lido-ratio-1h3Y.csv");

  console.log(timestampsList.length);
  console.log(Ratios.length);
  let counter = 0;
  for (let i = 1; i < timestampsList.length; i++) {
    if (Ratios[i].value > Ratios[i - 1].value) {
      console.log("error at " + i + " " + Ratios[i].endTime);
    }
    if (Ratios[i].value < Ratios[i - 1].value) {
      counter += 1;
    }
  }
  console.log(counter);
}

readHistoricalRatio1h3Y();

// async function tester() {
//   const timestampMs = 1613752630000;
//   // new Date(new Date().setHours(2, 0, 0, 0)).getTime() -
//   // 24 * 3600 * 1000 * 365 * 2.789;
//   // console.log(timestampMs)
//   console.log(await getRatioAtTimestamp(timestampMs));
// }

// tester();
