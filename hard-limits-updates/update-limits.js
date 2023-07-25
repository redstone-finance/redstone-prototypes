const axios = require("axios");
const fs = require("fs");
const dotenv = require("dotenv");
const {
  stableCoins,
  normalTokens,
  stableCoinsLimitPercentage,
  normalTokensLimitPercentage,
} = require("./constants.js");
dotenv.config();
const alertUrl = process.env.ALERT_URL;

const hiddenNames = {
  primary: "xasdqwr",
  avalanche: "zxczxasd",
};

async function updateLimits(service) {
  const configUrl = `https://raw.githubusercontent.com/redstone-finance/redstone-oracles-monorepo/main/packages/oracle-node/manifests/data-services/${service}.json`;
  const filename = `circuit-breaker-${service}-prod-${hiddenNames[service]}.json`;
  try {
    const response = await axios.get(configUrl);
    const tokens = Object.keys(response.data["tokens"]);
    const hardLimitsPromises = tokens.map(async (token) => {
      const limitPercentage = getLimitPercentage(token);
      return { [token]: await getHardLimits(token, limitPercentage) };
    });
    Promise.all(hardLimitsPromises).then((results) => {
      const hardLimits = results.reduce(
        (acc, curr) => ({ ...acc, ...curr }),
        {}
      );
      saveToFile(filename, hardLimits);
    });
  } catch (error) {
    sendAlert(service, error);
  }
}

function getLimitPercentage(token) {
  if (stableCoins.includes(token)) {
    return stableCoinsLimitPercentage;
  } else if (normalTokens.includes(token)) {
    return normalTokensLimitPercentage;
  } else {
    throw new Error("Unknown token", token);
  }
}

async function getHardLimits(token, limitPercentage) {
  const latestValue = await fetchLatestValueForToken(token);
  return calculateLimits(latestValue, limitPercentage);
}

async function fetchLatestValueForToken(token) {
  //TODO: fetch the latest value from the redstone oracle.
  // A dummy value.
  return 2000;
}

function calculateLimits(latestValue, limitPercentage) {
  const lower = latestValue * (1 - limitPercentage);
  const upper = latestValue * (1 + limitPercentage);
  return { lower, upper };
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
