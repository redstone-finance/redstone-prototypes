import axios from "axios";

interface TokenPrice {
  token: string;
  value: number;
}

async function updateLimits(service: string) {
  const latestPricesUrl = `https://oracle-gateway-1.a.redstone.finance/data-packages/latest/redstone-${service}-prod`;
  //todo: add the period to the url and fetch only one token

  try {
    const latestPricesResponse = await axios.get<any>(latestPricesUrl);
    const tokensPrices: TokenPrice[] = getTokensPrices(
      latestPricesResponse.data
    );

    // console.log("Tokens prices:");
    // for (const tokenPrice of tokensPrices) {
    //   console.log(`${tokenPrice.token}: ${tokenPrice.value}`);
    // }
  } catch (error) {
    console.error(`Error while fetching latest prices: ${error}`);
  }
}

function getTokensPrices(latestPrices: any): TokenPrice[] {
  let tokensPrices: TokenPrice[] = [];
  for (const currency in latestPrices) {
    const currencyDataPoints = latestPrices[currency];
    if (currency === "___ALL_FEEDS___") continue;
    const currencyPrice = currencyDataPoints[0].dataPoints[0].value;
    reportPriceDifference(currency, currencyDataPoints, currencyPrice);
    tokensPrices.push({ token: currency, value: currencyPrice });
  }
  return tokensPrices;
}

function reportPriceDifference(
  currency: string,
  currencyDataPoints: any,
  currencyPrice: number
) {
  let [max, min] = [currencyPrice, currencyPrice];
  for (const currencyDataPoint of currencyDataPoints) {
    for (const dataPoint of currencyDataPoint.dataPoints) {
      const value = dataPoint.value;
      if (value > max) max = value;
      if (value < min) min = value;
    }
  }
  if (max != min) {
    console.log(
      `Difference deviation for ${currency}: ${
        (max - min) / currencyPrice
      }`
    );
  }
}

const service = process.argv[2];
if (service) {
  updateLimits(service);
} else {
  console.error(
    "Please provide the service name (e.g., primary or avalanche)."
  );
}
