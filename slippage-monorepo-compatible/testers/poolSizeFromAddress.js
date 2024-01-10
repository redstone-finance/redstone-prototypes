const axios = require("axios");

async function getPoolSize(poolAddress) {
  const network = "eth";
  try {
    const apiUrl = `https://api.geckoterminal.com/api/v2/networks/${network}/pools/${poolAddress}`;
    const response = await axios.get(apiUrl);
    const reserveInUSD = response.data.data.attributes.reserve_in_usd;
    console.log(`Reserve in USD for pool ${poolAddress}: ${reserveInUSD}`);
    return Math.floor(reserveInUSD);
  } catch (error) {
    console.error("Error while fetching pool reserve data:", error);
    throw error;
  }
}

const poolAddress = "0x322135dd9cbae8afa84727d9ae1434b5b3eba44b";
getPoolSize(poolAddress)
  .then((reserve) => console.log(reserve))
  .catch((err) => console.error(err));
