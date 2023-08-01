import axios from "axios";
import fs from "fs";
import {
  stableCoins,
  normalTokens,
  stableCoinsLimitPercentage,
  normalTokensLimitPercentage,
  prodDetails,
} from "./constants";

const alertUrl: string = process.env.ALERT_URL || "";
const parsedConfig: ConfigFile = require("../../monitoring-remote-config-a51m53ue.json");

interface Boundaries {
  lower: number;
  upper: number;
}

interface TokenPrice {
  token: string;
  value: number;
}

interface HardLimits {
  [token: string]: Boundaries;
}

interface ConfigFile {
  defaultConfig: {
    apiProviders: {
      [service: string]: {
        manifestUrl: string;
      };
    };
  };
}

async function updateLimits(service: string) {
  const latestPricesUrl = `https://oracle-gateway-1.a.redstone.finance/data-packages/latest/redstone-${service}-prod`;
  const manifestUrl = await getManifestUrlFromConfig(service);
  const filename = `circuit-breaker-${service}-prod-${prodDetails[service].hash}.json`;
  try {
    const latestPricesResponse = await axios.get<any>(latestPricesUrl);
    const tokensPrices: TokenPrice[] = getTokensPrices(
      latestPricesResponse.data
    );
    const response = await axios.get<any>(manifestUrl);
    const tokens: string[] = Object.keys(response.data["tokens"]).filter(
      (token) => !response.data["tokens"][token].skipSigning
    );
    let hardLimits: HardLimits = {};
    for (const token of tokens) {
      const limitPercentage: number = getLimitPercentage(token);
      hardLimits[token] = getHardLimits(token, tokensPrices, limitPercentage);
    }
    hardLimits = sortAlphabetically(hardLimits);
    saveToFile(filename, hardLimits);
  } catch (error) {
    sendAlert(service, error);
  }
}

async function getManifestUrlFromConfig(service: string): Promise<string> {
  try {
    const manifestUrl =
      parsedConfig.defaultConfig.apiProviders[prodDetails[service].manifestName]
        ?.manifestUrl;
    return manifestUrl || prodDetails[service].fallbackManifestUrl;
  } catch (error) {
    sendAlert(service, error);
    return prodDetails[service].fallbackManifestUrl;
  }
}

function getTokensPrices(latestPrices: any): TokenPrice[] {
  let tokensPrices: TokenPrice[] = [];
  for (const currency in latestPrices) {
    const currencyDataPoints = latestPrices[currency];
    if (currency === "___ALL_FEEDS___") continue;
    const currencyPrice = currencyDataPoints[0].dataPoints[0].value;
    tokensPrices.push({ token: currency, value: currencyPrice });
  }
  return tokensPrices;
}

function getLimitPercentage(token: string): number {
  if (stableCoins.includes(token)) {
    return stableCoinsLimitPercentage;
  } else if (normalTokens.includes(token)) {
    return normalTokensLimitPercentage;
  } else {
    throw new Error("Unknown token, add to constants: " + token);
  }
}

function getHardLimits(
  token: string,
  tokensPrices: TokenPrice[],
  limitPercentage: number
): Boundaries {
  const latestValue = getLatestValueForToken(token, tokensPrices);
  return calculateLimits(latestValue, limitPercentage);
}

function getLatestValueForToken(
  token: string,
  tokensPrices: TokenPrice[]
): number {
  const tokenPrice = tokensPrices.find(
    (tokenPrice) => tokenPrice.token === token
  );
  if (tokenPrice) {
    return tokenPrice.value;
  } else {
    throw new Error("Token price not found: " + token);
  }
}

function calculateLimits(
  latestValue: number,
  limitPercentage: number
): Boundaries {
  const lower = latestValue * (1 - limitPercentage);
  const upper = latestValue * (1 + limitPercentage);
  return { lower, upper };
}

function sortAlphabetically(hardLimits: HardLimits): HardLimits {
  const sortedHardLimits: HardLimits = {};
  const sortedKeys: string[] = Object.keys(hardLimits).sort();
  for (const key of sortedKeys) {
    sortedHardLimits[key] = hardLimits[key];
  }
  return sortedHardLimits;
}

function saveToFile(filename: string, hardLimits: HardLimits) {
  fs.writeFileSync(filename, JSON.stringify(hardLimits, null, 2));
}

function sendAlert(service: string, error: any) {
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
