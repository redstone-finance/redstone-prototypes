const axios = require("axios");
const fs = require("fs");
const dotenv = require("dotenv");
const {
  stableCoins,
  normalTokens,
  stableCoinsLimitPercentage,
  normalTokensLimitPercentage,
  prodDetails,
  configUrl,
} = require("./constants.js");
dotenv.config();
const alertUrl = process.env.ALERT_URL;
const githubAccessToken = process.env.GITHUB_ACCESS_TOKEN;

async function updateLimits(service) {
  const latestPricesUrl = `https://oracle-gateway-1.a.redstone.finance/data-packages/latest/redstone-${service}-prod`;
  const manifestUrl = await getManifestUrlFromConfig(service);
  const filename = `circuit-breaker-${service}-prod-${prodDetails[service].hash}.json`;
  try {
    const latestPricesResponse = await axios.get(latestPricesUrl);
    const tokensPrices = getTokensPrices(latestPricesResponse.data);
    const response = await axios.get(manifestUrl);
    const tokens = Object.keys(response.data["tokens"]);
    let hardLimits = {};
    for (const token of tokens) {
      const limitPercentage = getLimitPercentage(token);
      hardLimits[token] = getHardLimits(token, tokensPrices, limitPercentage);
    }
    hardLimits = sortAlphabetically(hardLimits); // for easier diff
    saveToFile(filename, hardLimits);
  } catch (error) {
    sendAlert(service, error);
  }
}

async function getManifestUrlFromConfig(service) {
  const config = {
    headers: {
      Authorization: `Bearer ${githubAccessToken}`,
    },
  };
  try {
    const response = await axios.get(configUrl, config);
    const manifestUrl =
      response.data.defaultConfig.apiProviders[
        prodDetails[service].manifestName
      ].manifestUrl;
    return manifestUrl || prodDetails[service].fallbackManifestUrl;
  } catch (error) {
    sendAlert(service, error);
    return prodDetails[service].fallbackManifestUrl;
  }
}

function getTokensPrices(latestPrices) {
  let tokensPrices = [];
  for (const currency in latestPrices) {
    const currencyDataPoints = latestPrices[currency];
    if (currency === "___ALL_FEEDS___") continue;
    const currencyPrice = currencyDataPoints[0].dataPoints[0].value;
    tokensPrices.push({ token: currency, value: currencyPrice });
  }
  return tokensPrices;
}

function getLimitPercentage(token) {
  if (stableCoins.includes(token)) {
    return stableCoinsLimitPercentage;
  } else if (normalTokens.includes(token)) {
    return normalTokensLimitPercentage;
  } else {
    throw new Error("Unknown token, add to constants", token);
  }
}

function getHardLimits(token, tokensPrices, limitPercentage) {
  const latestValue = getLatestValueForToken(token, tokensPrices);
  return calculateLimits(latestValue, limitPercentage);
}

function getLatestValueForToken(token, tokensPrices) {
  const tokenPrice = tokensPrices.find(
    (tokenPrice) => tokenPrice.token === token
  );
  if (tokenPrice) return tokenPrice.value;
  else {
    // TODO: add missing tokens pricing, remove this and uncomment the throw error line
    console.log("Token price not found", token);
    return 0;
  }
  // else throw new Error("Token price not found", token);
}

function calculateLimits(latestValue, limitPercentage) {
  const lower = latestValue * (1 - limitPercentage);
  const upper = latestValue * (1 + limitPercentage);
  return { lower, upper };
}

function sortAlphabetically(hardLimits) {
  const sorted = {};
  Object.keys(hardLimits)
    .sort()
    .forEach(function (key) {
      sorted[key] = hardLimits[key];
    });
  return sorted;
}

function saveToFile(filename, hardLimits) {
  fs.writeFileSync(filename, JSON.stringify(hardLimits, null, 2));
}

function sendAlert(service, error) {
  axios.post(alertUrl, {
    message: `Error updating limits for ${service}: ${error.message}`,
  });
}

const service = process.argv[2];
if (service) {
  updateLimits(service);
} else {
  console.error(
    "Please provide the service name (e.g., primary or avalanche)."
  );
}
