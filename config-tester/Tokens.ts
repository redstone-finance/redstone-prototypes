export type TokenInfo = {
  symbol: string;
  address: string;
  decimals: number;
};

export function getTokenInfo(
  chain: string, // TODO: we could handle lowercase, uppercase, and chainId
  symbol: string
): TokenInfo {
  const { address, decimals } = chainTokenMap[chain][symbol];
  if (!address || !decimals) {
    throw new Error(`Token ${symbol} not found on ${chain}`);
  }
  const tokenInfo: TokenInfo = { symbol, address, decimals };
  return tokenInfo;
}

export function getChainId(chainName: string): number {
  const chainId = chainNameToChainId[chainName];
  if (!chainId) {
    throw new Error(`Chain ${chainName} not found`);
  }
  return chainId;
}

export type TokenMap = {
  [symbol: string]: {
    address: string;
    decimals: number;
  };
};

type ChainTokenMap = {
  [chain: string]: TokenMap;
};

// https://chainlist.org - for testing
// Also rpc-providers/src/chains-configs/index.ts ChainConfigs
const chainNameToChainId: Record<string, number> = {
  hardhat: 31337,
  ethereum: 1,
  arbitrum: 42161,
  avalanche: 43114,
  optimism: 10,
  polygon: 137,
  celo: 42220,
  base: 8453,
  canto: 7700,
  manta: 169,
  blast: 81457,
  "etherlink-ghostnet": 128123,
  mode: 34443,
  mantle: 5000,
  "ethereum-sepolia": 11155111,
  bnb: 56,
  "bnb-testnet": 97,
  "blast-testnet": 23888,
  "celo-baklava": 62320,
  hubble: 1992,
  kava: 2222,
  fraxtal: 252,
  linea: 59144,
  b2: 223,
  "blast-sepolia": 168587773,
  "re.al": 111188,
};

// ERC20 tokens must provide decimals in smart contract
export const chainTokenMap: ChainTokenMap = {
  ethereum: {
    GHO: {
      address: "0x40d16fc0246ad3160ccc09b8d0d3a2cd28ae6c2f",
      decimals: 18,
    },
    USDC: {
      address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      decimals: 6,
    },
    USDT: {
      address: "0xdac17f958d2ee523a2206206994597c13d831ec7",
      decimals: 6,
    },
    WETH: {
      address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
      decimals: 18,
    },
    weETH: {
      address: "0xcd5fe23c85820f7b72d0926fc9b05b43e359b7ee",
      decimals: 18,
    },
    rETH: {
      address: "0xae78736Cd615f374D3085123A210448E74Fc6393",
      decimals: 18,
    },
    osETH: {
      address: "0xf1c9acdc66974dfb6decb12aa385b9cd01190e38",
      decimals: 18,
    },
    SWETH: {
      address: "0xf951e335afb289353dc249e82926178eac7ded78",
      decimals: 18,
    },
    OHM: {
      address: "0x64aa3364f17a4d01c6f1751fd97c2bd3d7e7f1d5",
      decimals: 9,
    },
    BAL: {
      address: "0xba100000625a3754423978a60c9317c58a424e3D",
      decimals: 18,
    },
    ETHx: {
      address: "0xA35b1B31Ce002FBF2058D22F30f95D405200A15b",
      decimals: 18,
    },
    AURA: {
      address: "0xc0c293ce456ff0ed870add98a0828dd4d2903dbf",
      decimals: 18,
    },
    wstETH: {
      address: "0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0",
      decimals: 18,
    },
    pxETH: {
      address: "0x04C154b66CB340F3Ae24111CC767e0184Ed00Cc6",
      decimals: 18,
    },
    ezETH: {
      address: "0xbf5495efe5db9ce00f80364c8b423567e58d2110",
      decimals: 18,
    },
    rsETH: {
      address: "0xA1290d69c65A6Fe4DF752f95823fae25cB99e5A7",
      decimals: 18,
    },
    DAI: {
      address: "0x6b175474e89094c44da98b954eedeac495271d0f",
      decimals: 18,
    },
    LUSD: {
      address: "0x5f98805A4E8be255a32880FDeC7F6728C6568bA0",
      decimals: 18,
    },
    frxETH: {
      address: "0x5E8422345238F34275888049021821E8E08CAa1f",
      decimals: 18,
    },
    rswETH: {
      address: "0xFAe103DC9cf190eD75350761e95403b7b8aFa6c0",
      decimals: 18,
    },
    AAVE: {
      address: "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9",
      decimals: 18,
    },
  },
  blast: {
    ETH: {
      address: "0x0000000000000000000000000000000000000000",
      decimals: 18,
    },
    USDB: {
      address: "0x4300000000000000000000000000000000000003",
      decimals: 18,
    },
  },
  arbitrum: {
    WETH: {
      address: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
      decimals: 18,
    },
    wstETH: {
      address: "0x5979d7b546e38e414f7e9822514be443a4800529",
      decimals: 18,
    },
  },
};
