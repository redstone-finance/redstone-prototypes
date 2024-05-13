import axios from "axios";
import Decimal from "decimal.js";

const poolAddress = "0x5aee1e99fe86960377de9f88689616916d5dcabe";

type GeckoResponse = {
  data: {
    attributes: {
      name: string;
    };
  };
};

async function fetchPoolData(poolAddress: string) {
  const response = await axios.get<GeckoResponse>(
    `https://api.geckoterminal.com/api/v2/networks/eth/pools/${poolAddress}`
  );
  const pool = response.data.data;
  const name = pool.attributes.name;
  console.log(`Pool name: ${name}`);
  const tokens = name
    .split(" / ")
    .map((token) => token.split(" ")[0].toLowerCase());
  const feePercentageGecko = new Decimal(
    parseFloat(name.split(" / ").pop()!.split(" ")[1])
  ).div(100);
  console.log(`Tokens: ${tokens.join(", ")}`);
  if(feePercentageGecko.isNaN()) {
    console.error("Failed to parse fee percentage from pool name");
    return;
  }
  console.log(`Fee: ${feePercentageGecko.toNumber()}`);
}

fetchPoolData(poolAddress);
