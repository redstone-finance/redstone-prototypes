const { Web3 } = require("web3");
const { fromWei } = require("web3-utils");

const rpcUrl = "https://eth.llamarpc.com";
const httpProvider = new Web3.providers.HttpProvider(rpcUrl);
const web3 = new Web3(httpProvider);

const contractAddress = "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0";

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

async function getAverageBlockTime(provider) {
  try {
    const currentBlock = Number(await provider.getBlockNumber());
    const blockDifference = 1000000;
    const block1 = await provider.getBlock(currentBlock - 11);
    const block2 = await provider.getBlock(currentBlock - 11 - blockDifference);
    if (block1 && block2) {
      const timeDifference =
        Number(block1.timestamp) - Number(block2.timestamp);
      const averageBlockTime = timeDifference / blockDifference;
      return averageBlockTime;
    } else {
      console.error("Error fetching block data.");
      return null;
    }
  } catch (error) {
    console.error("Error fetching average block time:", error);
    return null;
  }
}

async function readFunctionValueAtBlock(targetBlockNumber) {
  try {
    const block = await web3.eth.getBlock(targetBlockNumber);
    if (block) {
      const timestamp = Number(block.timestamp);
      const date = new Date(timestamp * 1000);
      const formattedDate = date.toLocaleString();
      const result = await contract.methods
        .stEthPerToken()
        .call(null, targetBlockNumber);
      //   console.log(
      //     `Function value at block ${targetBlockNumber} (${formattedDate}):`,
      //     fromWei(result, "ether").toString()
      //   );
      return fromWei(result, "ether").toString();
    } else {
      console.error("Error fetching block data.");
    }
  } catch (error) {
    console.error("Error reading function value:", error);
  }
}

async function readHistoricalValues() {
  const currentBlockNumber = Number(await web3.eth.getBlockNumber());
  const averageBlockTime = await getAverageBlockTime(web3.eth);
  const blocksToCheck = [];
  for (let i = 0; i < 8; i++) {
    blocksToCheck.push(
      Math.floor(
        Number(currentBlockNumber - (i * 24 * 60 * 60) / averageBlockTime)
      )
    );
  }
//   console.log("blocksToCheck", blocksToCheck);
  const blockValues = await Promise.all(
    blocksToCheck.map((blockNumber) => readFunctionValueAtBlock(blockNumber))
  );
  console.log(blockValues[0]);
  console.log(blockValues[7]);
  calculateYearlyReturn(blockValues[7], blockValues[0]);
}

function calculateYearlyReturn(startWeekVal, EndWeekVal) {
  const weeklyReturn = EndWeekVal / startWeekVal;
  const yearlyReturn = weeklyReturn ** (365 / 7);
  console.log("weeklyReturn", weeklyReturn);
  console.log("yearlyReturn", yearlyReturn);
}

readHistoricalValues();
