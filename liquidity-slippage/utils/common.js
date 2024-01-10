const ethers = require("ethers");
const redstone = require("redstone-api");
const dotenv = require("dotenv");
const path = require("path");
const axios = require("axios");
const constants = require("../utils/constants");
const {
  appendToCSV,
  stepToCSV,
  stepToCSVUnrelated,
} = require("../utils/csv-utils");
const { safeAsyncCall } = require("../utils/error-utils");

const pricesUnrelated = constants.pricesUnrelated;
const pricesRelated = constants.pricesRelated;

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const provider = new ethers.providers.JsonRpcProvider(
  `https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`
);

async function getPriceFromCoingecko(name) {
  const apiUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${name}&vs_currencies=usd`;
  const response = await axios.get(apiUrl);
  return response.data[name].usd;
}

async function calculatePoolSize(token0Amount, token1Amount, token0, token1) {
  const [token0PriceInUSD, token1PriceInUSD] = await Promise.all([
    getPrice(token0),
    getPrice(token1),
  ]);
  const poolSize = (
    token0Amount * token0PriceInUSD +
    token1Amount * token1PriceInUSD
  ).toFixed(2);
  // const formattedPoolSize = parseFloat(poolSize).toLocaleString();
  // console.log(
  //   `Pool size: ${formattedPoolSize} USD (may contain unclaimed fees)`
  // );
  return poolSize;
}

function reversePrice(price, decimals) {
  return (1 / price).toFixed(decimals);
}

function calcPriceSecondInFirst(
  token0Amount,
  token1Amount,
  token0Decimals,
  token1Decimals
) {
  const secondPriceInFirst = token0Amount
    .mul(ethers.utils.parseUnits("1", token1Decimals))
    .div(token1Amount);
  return ethers.utils.formatUnits(
    secondPriceInFirst.toString(),
    token0Decimals
  );
}

function calcPricesInEachOther(
  token0Amount,
  token1Amount,
  token0Decimals,
  token1Decimals
) {
  const secondPriceInFirst = calcPriceSecondInFirst(
    token0Amount,
    token1Amount,
    token0Decimals,
    token1Decimals
  );
  const firstPriceInSecond = reversePrice(secondPriceInFirst, token1Decimals);
  return [secondPriceInFirst, firstPriceInSecond];
}

async function getApproximateTokensAmountInPool(
  poolAddress,
  fromCrypto,
  toCrypto
) {
  const ERC20Abi = [
    "function balanceOf(address account) external view returns (uint256)",
  ];
  let ERC20Contract = new ethers.Contract(
    fromCrypto.address,
    ERC20Abi,
    provider
  );
  const amountFrom = await ERC20Contract.balanceOf(poolAddress);
  ERC20Contract = new ethers.Contract(toCrypto.address, ERC20Abi, provider);
  const amountTo = await ERC20Contract.balanceOf(poolAddress);
  return await calculatePoolSize(
    ethers.utils.formatUnits(amountFrom.toString(), fromCrypto.decimals),
    ethers.utils.formatUnits(amountTo.toString(), toCrypto.decimals),
    fromCrypto,
    toCrypto
  );
}

async function callGetOutAmount(
  amountInUSD,
  tokenInPriceInUSD,
  secondPriceInFirst,
  fromCrypto,
  toCrypto,
  gasFee,
  contract,
  getOutAmount
) {
  const fromAmount = Number(amountInUSD / tokenInPriceInUSD).toFixed(
    fromCrypto.decimals
  );

  const receivedSecondAmount = await getOutAmount(
    fromAmount,
    fromCrypto,
    toCrypto,
    contract
  );

  const expectedSecondAmount = (fromAmount / secondPriceInFirst) * (1 - gasFee);
  const differencePercentage = parseFloat(
    ((receivedSecondAmount - expectedSecondAmount) / expectedSecondAmount) * 100
  ).toFixed(2);

  // console.log("SecondPriceInFirst", secondPriceInFirst);
  // console.log("receivedSecondAmount", receivedSecondAmount);
  // console.log("expectedSecondAmount", expectedSecondAmount);
  // console.log("differencePercentage", differencePercentage);

  return differencePercentage;
}

function delay(ms = 1800) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function slowCallGetOutAmount(
  prices,
  firstPriceInSecond,
  secondPriceInFirst,
  gasFee,
  fromCrypto,
  toCrypto,
  getOutAmount,
  contract,
  firstPriceInUSD,
  secondPriceInUSD
) {
  const resultPromises = [];
  let counter = 0;

  await delay(); // Delay to avoid rate limit

  for (const price of prices) {
    const slipAtoB = await callGetOutAmount(
      price,
      firstPriceInUSD,
      secondPriceInFirst,
      fromCrypto,
      toCrypto,
      gasFee,
      contract,
      getOutAmount
    );

    await delay(); // Delay to avoid rate limit

    const slipBtoA = await callGetOutAmount(
      price,
      secondPriceInUSD,
      firstPriceInSecond,
      toCrypto,
      fromCrypto,
      gasFee,
      contract,
      getOutAmount
    );

    resultPromises.push([slipAtoB, slipBtoA]);

    counter++;
    if (counter % 50 === 0) console.log(`Fetched ${counter} prices`);
    await delay(); // Delay to avoid rate limit
  }

  return resultPromises;
}

async function calculatePriceDifference(
  prices,
  firstPriceInSecond,
  secondPriceInFirst,
  gasFee,
  fromCrypto,
  toCrypto,
  getOutAmount,
  contract
) {
  const firstPriceInUSD = await getPrice(fromCrypto);
  const secondPriceInUSD = await getPrice(toCrypto);

  // return await slowCallGetOutAmount(
  //   prices,
  //   firstPriceInSecond,
  //   secondPriceInFirst,
  //   gasFee,
  //   fromCrypto,
  //   toCrypto,
  //   getOutAmount,
  //   contract,
  //   firstPriceInUSD,
  //   secondPriceInUSD
  // );

  const resultPromises = prices.map(async (price) => {
    const slipAtoB = callGetOutAmount(
      price,
      firstPriceInUSD,
      secondPriceInFirst,
      fromCrypto,
      toCrypto,
      gasFee,
      contract,
      getOutAmount
    );
    const slipBtoA = callGetOutAmount(
      price,
      secondPriceInUSD,
      firstPriceInSecond,
      toCrypto,
      fromCrypto,
      gasFee,
      contract,
      getOutAmount
    );
    const [resultAtoB, resultBtoA] = await Promise.all([slipAtoB, slipBtoA]);
    return [resultAtoB, resultBtoA];
  });

  const results = await Promise.all(resultPromises);
  return results;
}

function generateDataObject(
  DEX,
  cryptoASymbol,
  cryptoBSymbol,
  poolSize,
  secondPriceInFirst,
  firstPriceInSecond,
  slippageUnrelated,
  pricesUnrelatedUSD,
  slippageRelated,
  pricesRelatedUSD
) {
  slippageUnrelated.forEach((slippage, index) => {
    slippage.unshift(pricesUnrelatedUSD[index].toString());
  });
  slippageRelated.forEach((slippage, index) => {
    slippage.unshift(pricesRelatedUSD[index].toString());
  });
  const dataObject = {
    DEX: DEX,
    TokenA: cryptoASymbol,
    TokenB: cryptoBSymbol,
    poolSize: poolSize,
    secondPriceInFirst: secondPriceInFirst,
    firstPriceInSecond: firstPriceInSecond,
    slippageUnrelated,
    slippageRelated,
  };
  console.log(dataObject);
  return dataObject;
}

function getPoolRelatedAmounts(poolSize) {
  const poolRelatedAmounts = pricesRelated.map((part) =>
    (poolSize * part).toFixed(2)
  );
  return poolRelatedAmounts;
}

async function calculateAndWriteToCSV(
  DEX,
  fromCrypto,
  toCrypto,
  poolSize,
  secondPriceInFirst,
  firstPriceInSecond,
  gasFee,
  getOutAmount,
  contract
) {
  const poolRelatedAmounts = getPoolRelatedAmounts(poolSize);
  const [resultsIndependent, resultsDependent] = await Promise.all([
    calculatePriceDifference(
      pricesUnrelated,
      firstPriceInSecond,
      secondPriceInFirst,
      gasFee,
      fromCrypto,
      toCrypto,
      getOutAmount,
      contract
    ),
    calculatePriceDifference(
      poolRelatedAmounts,
      firstPriceInSecond,
      secondPriceInFirst,
      gasFee,
      fromCrypto,
      toCrypto,
      getOutAmount,
      contract
    ),
  ]);
  const dataObject = generateDataObject(
    DEX,
    fromCrypto.symbol,
    toCrypto.symbol,
    poolSize,
    secondPriceInFirst,
    firstPriceInSecond,
    resultsIndependent,
    pricesUnrelated,
    resultsDependent,
    poolRelatedAmounts
  );
  appendToCSV(dataObject);
}

function stepAmount(poolSize, prices) {
  const poolRelatedAmounts = prices.map((part) => (poolSize * part).toFixed(2));
  return poolRelatedAmounts;
}

function generateStepDataObject(
  DEX,
  cryptoASymbol,
  cryptoBSymbol,
  poolSize,
  secondPriceInFirst,
  firstPriceInSecond,
  slippageRelated,
  pricesRelatedUSD
) {
  slippageRelated.forEach((slippage, index) => {
    slippage.unshift(pricesRelatedUSD[index].toString());
  });
  const dataObject = {
    DEX: DEX,
    TokenA: cryptoASymbol,
    TokenB: cryptoBSymbol,
    poolSize: poolSize,
    secondPriceInFirst: secondPriceInFirst,
    firstPriceInSecond: firstPriceInSecond,
    slippageRelated,
  };
  return dataObject;
}

async function amountTradeXSlippage(
  DEX,
  fromCrypto,
  toCrypto,
  poolSize,
  secondPriceInFirst,
  firstPriceInSecond,
  gasFee,
  getOutAmount,
  contract
) {
  const prices = Array.from({ length: 2000 }, (_, i) => (i + 1) / 1000);
  const poolRelatedAmounts = stepAmount(poolSize, prices);

  const resultsDependent = await calculatePriceDifference(
    poolRelatedAmounts,
    firstPriceInSecond,
    secondPriceInFirst,
    gasFee,
    fromCrypto,
    toCrypto,
    getOutAmount,
    contract
  );

  const dataObject = generateStepDataObject(
    DEX,
    fromCrypto.symbol,
    toCrypto.symbol,
    poolSize,
    secondPriceInFirst,
    firstPriceInSecond,
    resultsDependent,
    poolRelatedAmounts
  );

  stepToCSV(dataObject, prices);
}

//NEW CODE: --------------------------------------------------------------------------

function appendToArray(startPrice, endPrice, step, array) {
  for (let price = startPrice; price <= endPrice; price += step) {
    array.push(price);
  }
}

const generatePricesArray = () => {
  const pricesArray = [];
  appendToArray(1e4, 1e5, 1e4, pricesArray);
  appendToArray(1e5, 1e6, 2.5e4, pricesArray);
  appendToArray(1e6, 1e7, 1e5, pricesArray);
  return pricesArray;
};

async function getPrice(crypto) {
  try {
    console.log(`Getting price for ${crypto.symbol}`);
    const price = await safeAsyncCall(
      async () => {
        return await getPriceFromCoingecko(crypto.name);
      },
      3,
      65 * 1000 // 65 seconds
    );
    console.log("Price found:", price);
    return price;
  } catch (error) {
    try {
      const price = await safeAsyncCall(
        async () => {
          return await redstone.getPrice(crypto.symbol);
        },
        3,
        6 * 1000 // 6 seconds
      );
      return price.value;
    } catch (error) {
      console.log(`Price for ${crypto.symbol} not found`, error);
      throw error;
    }
  }
}

async function amountTradeXSlippageIndependent(
  DEX,
  fromCrypto,
  toCrypto,
  poolSize,
  getOutAmount,
  contract
) {
  const prices = generatePricesArray();

  const [receivedFirstForSecond, receivedSecondForFirst, results] =
    await calculateSlippage(
      prices,
      fromCrypto,
      toCrypto,
      getOutAmount,
      contract
    );

  console.log("Finished calculating slippage");
  const dataObject = generateStepDataObject(
    DEX,
    fromCrypto.symbol,
    toCrypto.symbol,
    poolSize,
    receivedFirstForSecond,
    receivedSecondForFirst,
    results,
    prices
  );
  console.log("Finished generating data object");
  await stepToCSVUnrelated(dataObject, prices);
}

async function getPricing(fromCrypto, toCrypto, contract, getOutAmount) {
  // Already with Fee, so we can simply multiply in later usage.
  const amountInUSD = 1000;
  const firstPriceInUSD = await getPrice(fromCrypto);
  const secondPriceInUSD = await getPrice(toCrypto);

  const firstAmount = Number(amountInUSD / firstPriceInUSD).toFixed(
    fromCrypto.decimals
  );

  const secondAmount = Number(amountInUSD / secondPriceInUSD).toFixed(
    toCrypto.decimals
  );

  const receivedSecondAmount = await getOutAmount(
    firstAmount,
    fromCrypto,
    toCrypto,
    contract
  );

  const receivedFirstAmount = await getOutAmount(
    secondAmount,
    toCrypto,
    fromCrypto,
    contract
  );

  return [
    firstPriceInUSD,
    secondPriceInUSD,
    receivedFirstAmount / secondAmount,
    receivedSecondAmount / firstAmount,
  ];
}

async function calculateSlippage(
  prices,
  fromCrypto,
  toCrypto,
  getOutAmount,
  contract
) {
  const [
    firstPriceInUSD,
    secondPriceInUSD,
    receivedFirstForSecond,
    receivedSecondForFirst,
  ] = await getPricing(fromCrypto, toCrypto, contract, getOutAmount);

  const resultPromises = prices.map(async (price) => {
    const slipAtoB = safeAsyncCall(async () => {
      return await calculateSlip(
        price,
        firstPriceInUSD,
        receivedSecondForFirst,
        fromCrypto,
        toCrypto,
        contract,
        getOutAmount
      );
    });

    const slipBtoA = safeAsyncCall(async () => {
      return await calculateSlip(
        price,
        secondPriceInUSD,
        receivedFirstForSecond,
        toCrypto,
        fromCrypto,
        contract,
        getOutAmount
      );
    });
    const [resultAtoB, resultBtoA] = await Promise.all([slipAtoB, slipBtoA]);
    return [resultAtoB, resultBtoA];
  });

  const results = await Promise.all(resultPromises);
  return [receivedFirstForSecond, receivedSecondForFirst, results];
}

async function calculateSlip(
  amountInUSD,
  tokenInPriceInUSD,
  expectedSecondForFirstUnit,
  fromCrypto,
  toCrypto,
  contract,
  getOutAmount
) {
  const fromAmount = Number(amountInUSD / tokenInPriceInUSD).toFixed(
    fromCrypto.decimals
  );

  const receivedSecondAmount = await getOutAmount(
    fromAmount,
    fromCrypto,
    toCrypto,
    contract
  );

  const expectedSecondAmount = fromAmount * expectedSecondForFirstUnit;
  const differencePercentage = parseFloat(
    ((receivedSecondAmount - expectedSecondAmount) / expectedSecondAmount) * 100
  ).toFixed(2);

  return differencePercentage;
}

module.exports = {
  calculatePoolSize,
  calcPriceSecondInFirst,
  getApproximateTokensAmountInPool,
  calculatePriceDifference,
  generateDataObject,
  getPoolRelatedAmounts,
  calculateAndWriteToCSV,
  reversePrice,
  calcPricesInEachOther,
  amountTradeXSlippage,
  amountTradeXSlippageIndependent,
};
