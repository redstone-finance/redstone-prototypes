const redstone = require("redstone-api");

async function getTokenPriceInUSD(tokenSymbol) {
  try {
    const price = await redstone.getPrice(tokenSymbol);
    console.log(`Token price ${tokenSymbol} w USD: ${price.value}`);
    return price.value;
  } catch (error) {
    console.error("Error occurred:", error);
    throw error;
  }
}

getTokenPriceInUSD("OHM");
