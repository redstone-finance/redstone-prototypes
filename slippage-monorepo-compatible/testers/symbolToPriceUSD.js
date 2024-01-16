const redstone = require("redstone-api");
const axios = require("axios");

async function getTokenPriceInUSD(tokenSymbol) {
  if (tokenSymbol === "WETH") {
    tokenSymbol = "ETH";
  }
  try {
    const price = await redstone.getPrice(tokenSymbol);
    console.log(`Token price ${tokenSymbol} in USD: ${price.value}`);
    return price.value;
  } catch (error) {
    console.error("Error occurred:", error);
    throw error;
  }
}

// getTokenPriceInUSD("WETH");

async function getTokenId(symbol) {
  try {
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/coins/list"
    );
    const coins = response.data;
    const coin = coins.find(
      (c) => c.symbol.toLowerCase() === symbol.toLowerCase()
    );
    return coin ? coin.id : null;
  } catch (error) {
    console.error(`Error finding token ID: ${error.message}`);
    return null;
  }
}

async function getTokenPriceInUSDCoingecko(symbol) {
  const tokenId = await getTokenId(symbol);
  if (!tokenId) {
    console.log(`Token with symbol '${symbol}' not found.`);
    return;
  }

  try {
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=usd`
    );
    const price = response.data[tokenId].usd;
    console.log(`The price of ${symbol} (${tokenId}) in USD is: $${price}`);
  } catch (error) {
    console.error(
      `An error occurred while fetching the price: ${error.message}`
    );
  }
}

getTokenPriceInUSDCoingecko("WETH");
