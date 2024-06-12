import axios from "axios";

import { chainTokenMap, TokenMap } from "./Tokens";

type GeckoResponse = {
  data: [
    {
      attributes: {
        address: string;
        symbol: string;
        decimals: number;
        coingecko_coin_id: string;
      };
    }
  ];
};

function mapChainNameToGeckoTerminalChainName(chainName: string): string {
  // https://api.geckoterminal.com/api/v2/networks?page=1'
  switch (chainName) {
    case "ethereum":
      return "eth";
    case "arbitrumOne":
      return "arbitrum";
    case "avalanche":
      return "avax";
    case "optimism":
      return "optimism";
    case "canto":
      return "canto";
    case "base":
      return "base";
    default:
      console.log(
        `Unsupported chain name: ${chainName}, add it to the mapChainNameToGeckoTerminalChainName function in test/config-validator/validate-tokens-config.spec.ts`
      );
      throw new Error(
        "Unsupported chain name, add it to the mapChainNameToGeckoTerminalChainName function in DexFetcher.ts."
      );
  }
}

// async function getTokenInfoFromGeckoTerminal(
//   chainName: string,
//   addresses: string[]
// ): Promise<TokenMap> {
//   const network = mapChainNameToGeckoTerminalChainName(chainName);
//   const chunkSize = 30; // GeckoTerminal limit is 30 addresses per request
//   const addressChunks = [];
//   for (let i = 0; i < addresses.length; i += chunkSize) {
//     addressChunks.push(addresses.slice(i, i + chunkSize));
//   }

//   const requests = addressChunks.map((chunk) =>
//     axios.get<GeckoResponse>(
//       `https://api.geckoterminal.com/api/v2/networks/${network}/tokens/multi/${chunk.join(
//         "%2C"
//       )}`
//     )
//   );

//   const responses = await Promise.all(requests);
//   const tokenMapGecko: TokenMap = {};
//   responses.forEach((response) => {
//     response.data.data.forEach((token) => {
//       tokenMapGecko[token.attributes.symbol.toLowerCase()] = {
//         address: token.attributes.address,
//         decimals: token.attributes.decimals,
//       };
//     });
//   });

//   return tokenMapGecko;
// }

async function getTokenInfoFromGeckoTerminalWithRetry(
  chainName: string,
  addresses: string[]
): Promise<TokenMap> {
  const network = mapChainNameToGeckoTerminalChainName(chainName);
  const chunkSize = 30; // GeckoTerminal limit is 30 addresses per request
  const addressChunks = [];
  for (let i = 0; i < addresses.length; i += chunkSize) {
    addressChunks.push(addresses.slice(i, i + chunkSize));
  }
  // addresses = addresses.slice(0, 30); // Only fetch the first 30 tokens
  let attempts = 0;
  const maxAttempts = 5;
  while (attempts < maxAttempts) {
    try {
      const requests = addressChunks.map((chunk) =>
        axios.get<GeckoResponse>(
          `https://api.geckoterminal.com/api/v2/networks/${network}/tokens/multi/${chunk.join(
            "%2C"
          )}`
        )
      );
      const responses = await Promise.all(requests);
      const tokenMapGecko: TokenMap = {};
      responses.forEach((response) => {
        response.data.data.forEach((token) => {
          tokenMapGecko[
            token.attributes.coingecko_coin_id === "usd-coin-ethereum-bridged"
              ? "usdc.e"
              : token.attributes.symbol.toLowerCase()
          ] = {
            address: token.attributes.address,
            decimals: token.attributes.decimals,
          };
        });
      });

      return tokenMapGecko;
    } catch (error) {
      attempts++;
      if (attempts === maxAttempts) {
        throw new Error(
          `Failed to fetch tokens info from gecko terminal on chain: ${chainName}`
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 61000)); // 61s to avoid rate limiting
    }
  }
  throw new Error("Unexpected error in getTokenInfoFromGeckoTerminalWithRetry");
}

async function validateTokensConfigOnChain(
  chainName: string,
  tokenMap: TokenMap
): Promise<boolean> {
  let result = true;
  const addresses = Object.values(tokenMap).map((token) => token.address);
  try {
    const tokenMapGecko = await getTokenInfoFromGeckoTerminalWithRetry(
      chainName,
      addresses
    );
    for (const [symbol, tokenInfo] of Object.entries(tokenMap)) {
      const expectedToken = tokenMapGecko[symbol.toLowerCase()];
      if (!expectedToken) {
        console.log(
          `Token ${symbol} on ${chainName} not found on gecko terminal`
        );
        result = false;
        continue;
      }
      if (
        expectedToken.address.toLowerCase() !==
          tokenInfo.address.toLowerCase() ||
        expectedToken.decimals !== tokenInfo.decimals
      ) {
        result = false;
        console.log(
          `Token ${symbol} on ${chainName} does not match the expected values are: { address: ${expectedToken.address}, decimals: ${expectedToken.decimals} }`
        );
      }
    }
    return result;
  } catch (error) {
    console.log(error);
    return false;
  }
}

async function validateTokensConfig() {
  const promises: Promise<boolean>[] = [];
  for (const [chain, tokenMap] of Object.entries(chainTokenMap)) {
    if (chain === "blast" || chain === "merlin") {
      continue;
    }
    promises.push(validateTokensConfigOnChain(chain, tokenMap));
  }
  const results = await Promise.all(promises);
  const finalResult = results.every((res) => res);
  return finalResult;
}

validateTokensConfig();
