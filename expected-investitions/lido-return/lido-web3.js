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

async function readFunctionValueAtBlock(targetBlockNumber, retryCount = 5) {
  for (let i = 0; i < retryCount; i++) {
    try {
      const block = await web3.eth.getBlock(targetBlockNumber);
      if (block) {
        const timestamp = Number(block.timestamp);
        const date = new Date(timestamp * 1000);
        const formattedDate = new Intl.DateTimeFormat("default", {
          timeZone: "UTC",
          year: "numeric",
          month: "numeric",
          day: "numeric",
          hour: "numeric",
          minute: "numeric",
        }).format(date);
        const result = await contract.methods
          .stEthPerToken()
          .call(null, targetBlockNumber);
        return {
          value: fromWei(result, "ether"),
          date: formattedDate,
          timestamp: timestamp,
          blockNumber: targetBlockNumber,
        };
      } else {
        console.error(`Error fetching block data. (Attempt ${i + 1})`);
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }
    } catch (error) {
      console.error(`Error reading function value (Attempt ${i + 1})`);
      await new Promise((resolve) => setTimeout(resolve, 10000));
      if (i === retryCount - 1) console.error(error);
    }
  }
}

async function readHistoricalValues() {
  const currentBlockNumber = Number(await web3.eth.getBlockNumber());
  const averageBlockTime = await getAverageBlockTime(web3.eth);
  const blocksToCheck = [];
  const timesPerDay = 3;
  const numOfDays = 9;
  for (let i = 0; i <= numOfDays * timesPerDay; i++) {
    blocksToCheck.push(
      Math.floor(
        Number(
          currentBlockNumber -
            (((i * 24) / timesPerDay) * 60 * 60) / averageBlockTime
        )
      )
    );
  }
  const blockValues = await Promise.all(
    blocksToCheck.map((blockNumber) => readFunctionValueAtBlock(blockNumber))
  );

  for (let i = 1; i < blockValues.length; i++) {
    if (blockValues[i].value < blockValues[i - 1].value) {
      // console.log(blockValues[i-1].value, blockValues[i].value);
      // console.log(blockValues[i-1].blockNumber, blockValues[i].blockNumber);
      // const targetValue = blockValues[i-1].value;
      const firstBlocWithTargetValue = await binSearchBlockWithValue(
        blockValues[i - 1].value,
        blockValues[i].blockNumber,
        blockValues[i - 1].blockNumber
      );
      console.log("firstBlocWithTargetValue", firstBlocWithTargetValue);
    }
  }

  // console.log(blockValues);
  const uniqueValues = [...new Set(blockValues.map((item) => item.value))];
  // console.log(uniqueValues);
  const uniqueValuesWithCount = uniqueValues.map((value) => {
    return {
      value: value,
      count: blockValues.filter((item) => item.value === value).length,
    };
  });
  // console.log(uniqueValuesWithCount);

  // console.log(uniqueValuesWithCount[0].value);
  // console.log(uniqueValuesWithCount[7].value);
  // calculateYearlyReturn(
  //   uniqueValuesWithCount[7].value,
  //   uniqueValuesWithCount[0].value
  // );
}

function calculateYearlyReturn(startWeekVal, EndWeekVal) {
  const weeklyReturn = EndWeekVal / startWeekVal;
  const yearlyReturn = weeklyReturn ** (365 / 7);
  console.log("weeklyReturn", weeklyReturn);
  console.log("yearlyReturn", yearlyReturn);
}

async function binSearchBlockWithValue(targetValue, startBlock, endBlock) {
  if (endBlock == startBlock) {
    const blockData = await readFunctionValueAtBlock(endBlock);
    // console.log("endBlock", endBlock);
    return blockData;
  }
  const middleBlock = Math.floor((startBlock + endBlock) / 2);
  const middleBlockValue = await readFunctionValueAtBlock(middleBlock);
  if (middleBlockValue.value < targetValue) {
    return binSearchBlockWithValue(targetValue, middleBlock + 1, endBlock);
  } else {
    return binSearchBlockWithValue(targetValue, startBlock, middleBlock);
  }
}

readHistoricalValues();
