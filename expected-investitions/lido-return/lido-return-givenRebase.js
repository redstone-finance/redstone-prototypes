const { Web3 } = require("web3");
const { fromWei } = require("web3-utils");

const rpcUrl = "https://eth.drpc.org";
const httpProvider = new Web3.providers.HttpProvider(rpcUrl);
const web3 = new Web3(httpProvider);

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

async function retryOperation(operation, retryCount = 5, delay = 10000) {
  for (let i = 0; i < retryCount; i++) {
    try {
      return await operation();
    } catch (error) {
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

async function getBlockNumbers() {
  return await retryOperation(async () => {
    const days = 9;
    const blockRange = days * 24 * 60 * 5; // assuming 5 blocks per minute, if more than increase 5 to 6 or 7
    const currentBlockNumber = Number(await web3.eth.getBlockNumber());
    const transactions = await web3.eth.getPastLogs({
      address: address,
      fromBlock: currentBlockNumber - blockRange,
      toBlock: currentBlockNumber,
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
  const yearlyReturn = periodReturn ** (secondsInYear / secondsInPeriod);
  console.log(
    `Period return: ${periodReturn} in ${Math.round(
      secondsInPeriod / (60 * 60 * 24)
    )} days`
  );
  console.log("Yearly return", yearlyReturn);
  return yearlyReturn;
}

async function readHistoricalValues() {
  const blocksToCheck = await getBlockNumbers();
  const actualBlocksToCheck = [
    blocksToCheck[blocksToCheck.length - 8],
    blocksToCheck[blocksToCheck.length - 1],
  ];

  const blockValues = await Promise.all(
    actualBlocksToCheck.map((blockNumber) =>
      readFunctionValueAtBlock(blockNumber)
    )
  );

  calculateYearlyReturn(blockValues[0], blockValues[1]);
}

readHistoricalValues();
