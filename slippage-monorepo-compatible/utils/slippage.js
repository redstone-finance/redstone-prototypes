const axios = require("axios");
const redstone = require("redstone-api");
const {
  safeAsyncCall,
  safeAsyncCallWithDefaultZero,
} = require("../utils/error");
const {
  writePoolSlippageToCSV,
  writeMissingPoolToCSV,
  checkIfPoolAlreadyExists,
} = require("../utils/csv");

const amountToCheckRatio = 100;

async function getPoolSize(poolAddress) {
  const network = "eth";
  const apiUrl = `https://api.geckoterminal.com/api/v2/networks/${network}/pools/${poolAddress}`;
  const response = await axios.get(apiUrl);
  data = response.data.data;
  const reserveInUSD = data.attributes.reserve_in_usd;
  console.log(`Reserve in USD for pool ${poolAddress}: ${reserveInUSD}`);
  return Math.floor(reserveInUSD);
}

async function getPoolTokens(poolAddress) {
  const network = "eth";
  const apiUrl = `https://api.geckoterminal.com/api/v2/networks/${network}/pools/${poolAddress}`;
  const response = await axios.get(apiUrl);
  const data = response.data.data;
  const baseTokenId = data.relationships.base_token.data.id.split("_")[1];
  const quoteTokenId = data.relationships.quote_token.data.id.split("_")[1];
  const poolName = data.attributes.name.split(" / ");

  const tokens = {
    [poolName[0].toLowerCase()]: baseTokenId,
    [poolName[1].toLowerCase()]: quoteTokenId,
  };
  return tokens;
}

async function getTokenPriceInUSD(tokenSymbol) {
  if (
    tokenSymbol === "WETH" ||
    tokenSymbol === "FRXETH" ||
    tokenSymbol === "ALETH"
  ) {
    tokenSymbol = "ETH"; //TODO: maybe in future different methodology
  }
  if (tokenSymbol === "crvUSD") {
    tokenSymbol = "USDC";
  }
  const price = await redstone.getPrice(tokenSymbol);
  console.log(`Token price ${tokenSymbol} in USD: ${price.value}`);
  return price.value;
}

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

async function getPricing(fromCrypto, toCrypto, getOutAmount) {
  const amountInUSD = amountToCheckRatio;
  const firstPriceInUSD = await safeAsyncCall(() =>
    getTokenPriceInUSD(fromCrypto.symbol)
  );
  const secondPriceInUSD = await safeAsyncCall(() =>
    getTokenPriceInUSD(toCrypto.symbol)
  );

  const firstAmount = Number(amountInUSD / firstPriceInUSD).toFixed(
    fromCrypto.decimals
  );
  const secondAmount = Number(amountInUSD / secondPriceInUSD).toFixed(
    toCrypto.decimals
  );

  const receivedSecondAmount = await safeAsyncCall(() =>
    getOutAmount(firstAmount, fromCrypto, toCrypto)
  );

  const receivedFirstAmount = await safeAsyncCall(() =>
    getOutAmount(secondAmount, toCrypto, fromCrypto)
  );

  return [
    firstPriceInUSD,
    secondPriceInUSD,
    receivedFirstAmount / secondAmount,
    receivedSecondAmount / firstAmount,
  ];
}

async function calculateSlip(
  amountInUSD,
  tokenInPriceInUSD,
  expectedSecondForFirstUnit,
  fromCrypto,
  toCrypto,
  getOutAmount
) {
  const fromAmount = Number(amountInUSD / tokenInPriceInUSD).toFixed(
    fromCrypto.decimals
  );

  const receivedSecondAmount = await safeAsyncCallWithDefaultZero(() =>
    getOutAmount(fromAmount, fromCrypto, toCrypto)
  );

  // const receivedSecondAmount = await safeAsyncCall(() =>
  //   getOutAmount(fromAmount, fromCrypto, toCrypto)
  // );

  const expectedSecondAmount = fromAmount * expectedSecondForFirstUnit;
  const differencePercentage = parseFloat(
    ((receivedSecondAmount - expectedSecondAmount) / expectedSecondAmount) * 100
  ).toFixed(6);

  return differencePercentage;
}

async function calculateSlippage(prices, fromCrypto, toCrypto, getOutAmount) {
  const [
    firstPriceInUSD,
    secondPriceInUSD,
    receivedFirstForSecond,
    receivedSecondForFirst,
  ] = await getPricing(fromCrypto, toCrypto, getOutAmount);

  const resultPromises = prices.map(async (price) => {
    const slipAtoB = calculateSlip(
      price,
      firstPriceInUSD,
      receivedSecondForFirst,
      fromCrypto,
      toCrypto,
      getOutAmount
    );
    const slipBtoA = calculateSlip(
      price,
      secondPriceInUSD,
      receivedFirstForSecond,
      toCrypto,
      fromCrypto,
      getOutAmount
    );
    const [resultAtoB, resultBtoA] = await Promise.all([slipAtoB, slipBtoA]);
    return [resultAtoB, resultBtoA];
  });

  const results = await Promise.all(resultPromises);
  return [receivedFirstForSecond, receivedSecondForFirst, results];
}

async function addAddressToTokesIfMissing(tokenA, tokenB, poolAddress) {
  if (!tokenA.address || !tokenB.address) {
    const poolTokens = await safeAsyncCall(() => getPoolTokens(poolAddress));
    tokenA.address = poolTokens[tokenA.symbol.toLowerCase()];
    tokenB.address = poolTokens[tokenB.symbol.toLowerCase()];
  }
}

async function calculatePoolSlippage(
  DEX,
  poolAddress,
  fromCrypto,
  toCrypto,
  getOutAmount
) {
  try {
    if (
      await checkIfPoolAlreadyExists(
        DEX,
        poolAddress,
        fromCrypto.symbol,
        toCrypto.symbol,
        "StepSlippage"
      )
    ) {
      console.log(
        "Pool already exists in Slippage CSV file: ",
        DEX,
        poolAddress
      );
      return;
    }

    let poolSize;
    if (DEX === "Maverick") {
      poolSize = 0; //TODO: different way to spot pool size on Maverick
    } else {
      poolSize = await safeAsyncCall(() => getPoolSize(poolAddress));
      await addAddressToTokesIfMissing(fromCrypto, toCrypto, poolAddress);
    }

    const prices = [10000];// generatePricesArray(); //Change to check single slippage: [10000];

    const [receivedFirstForSecond, receivedSecondForFirst, results] =
      await calculateSlippage(prices, fromCrypto, toCrypto, getOutAmount);
    console.log("Finished calculating slippage for DEX: ", DEX, poolAddress);
    await writePoolSlippageToCSV(
      DEX,
      poolAddress,
      fromCrypto.symbol,
      toCrypto.symbol,
      poolSize,
      receivedFirstForSecond,
      receivedSecondForFirst,
      results,
      prices
    );
  } catch (error) {
    console.error(
      "Error while calculating pool slippage: ",
      DEX,
      poolAddress,
      fromCrypto.symbol,
      toCrypto.symbol
    );
    console.error(error);
    if (
      !(await checkIfPoolAlreadyExists(
        DEX,
        poolAddress,
        fromCrypto.symbol,
        toCrypto.symbol,
        "StepSlippageMissingPools"
      ))
    ) {
      await writeMissingPoolToCSV(
        DEX,
        poolAddress,
        fromCrypto.symbol,
        toCrypto.symbol
      );
    }
  }
}

module.exports = {
  getTokenPriceInUSD,
  getPoolTokens,
  calculatePoolSlippage,
};
