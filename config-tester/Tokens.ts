export type TokenInfo = {
  symbol: string;
  address: string;
  decimals: number;
};

export function getTokenInfo(networkName: string, symbol: string): TokenInfo {
  const networkTokens = chainTokenMap[networkName];
  if (!networkTokens) {
    throw new Error(`Chain ${networkName} not found in chainTokenMap`);
  }
  if (!Object.keys(networkTokens).includes(symbol)) {
    throw new Error(`Token ${symbol} not found on ${networkName}`);
  }
  const token = networkTokens[symbol];
  const tokenInfo: TokenInfo = {
    symbol,
    address: token.address,
    decimals: token.decimals,
  };
  return tokenInfo;
}

export type TokenMap = {
  [symbol: string]: {
    address: string;
    decimals: number;
  };
};

type ChainTokenMap = {
  [key: string]: TokenMap;
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
    WBTC: {
      address: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
      decimals: 8,
    },
    pufETH: {
      address: "0xd9a442856c234a39a81a089c06451ebaa4306a72",
      decimals: 18,
    },
    FRAX: {
      address: "0x853d955acef822db058eb8505911ed77f175b99e",
      decimals: 18,
    },
    crvUSD: {
      address: "0xf939e0a03fb07f59a73314e73794be0e57ac1b4e",
      decimals: 18,
    },
    CRV: {
      address: "0xd533a949740bb3306d119cc777fa900ba034cd52",
      decimals: 18,
    },
    USDe: {
      address: "0x4c9edd5852cd905f086c759e8383e09bff1e68b3",
      decimals: 18,
    },
    stETH: {
      address: "0xae7ab96520de3a18e5e111b5eaab095312d7fe84",
      decimals: 18,
    },
    ALUSD: {
      address: "0xbc6da0fe9ad5f3b0d58160288917aa56653660e9",
      decimals: 18,
    },
    eUSD: {
      address: "0xa0d69e286b938e21cbf7e51d71f6a4c8918f482f",
      decimals: 18,
    },
    USDM: {
      address: "0x59d9356e565ab3a36dd77763fc0d87feaf85508c",
      decimals: 18,
    },
    agEUR: {
      address: "0x1a7e4e63778b4f12a199c062f3efdd288afcbce8",
      decimals: 18,
    },
    "ETH+": {
      address: "0xe72b141df173b999ae7c1adcbf60cc9833ce56a8",
      decimals: 18,
    },
    ETH: {
      address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      decimals: 18,
    },
    crvFRAX: {
      address: "0x3175df0976dfa876431c2e9ee6bc45b65d3473cc",
      decimals: 18,
    },
    "3Crv": {
      address: "0x6c3f90f043a72fa612cbac8115ee7e52bde6e490",
      decimals: 18,
    },
    EUROC: {
      address: "0x1abaea1f7c830bd89acc67ec4af516284b1bc33c",
      decimals: 6,
    },
    sDAI: {
      address: "0x83f20f44975d03b1b09e64809b757c47f942beea",
      decimals: 18,
    },
    CVX: {
      address: "0x4e3fbd56cd56c3e72c1403e103b45db9da5b9d2b",
      decimals: 18,
    },
    RSR: {
      address: "0x320623b8e4ff03373931769a31fc52a4e78b5d70",
      decimals: 18,
    },
    sfrxETH: {
      address: "0xac3e018457b222d93114458476f3e3416abbe38f",
      decimals: 18,
    },
    ALETH: {
      address: "0x0100546f2cd4c9d97f798ffc9755e47865ff7ee6",
      decimals: 18,
    },
    "mwstETH-WPUNKS:20": {
      address: "0xC975342A95cCb75378ddc646B8620fa3Cd5bc051",
      decimals: 18,
    },
    FXS: {
      address: "0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0",
      decimals: 18,
    },
    LINK: {
      address: "0x514910771af9ca656af840dff83e8264ecf986ca",
      decimals: 18,
    },
    PREMIA: {
      address: "0x6399c842dd2be3de30bf99bc7d1bbf6fa3650e70",
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
    WETH: {
      address: "0x4300000000000000000000000000000000000004",
      decimals: 18,
    },
    "mwstETH-WPUNKS:20": {
      address: "0x9a50953716bA58e3d6719Ea5c437452ac578705F",
      decimals: 18,
    },
  },
  arbitrumOne: {
    WETH: {
      address: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
      decimals: 18,
    },
    wstETH: {
      address: "0x5979d7b546e38e414f7e9822514be443a4800529",
      decimals: 18,
    },
    PREMIA: {
      address: "0x51fc0f6660482ea73330e414efd7808811a57fa2",
      decimals: 18,
    },
    FRAX: {
      address: "0x17fc002b466eec40dae837fc4be5c67993ddbd6f",
      decimals: 18,
    },
    VST: {
      address: "0x64343594ab9b56e99087bfa6f2335db24c2d1f17",
      decimals: 18,
    },
    JUSDC: {
      address: "0xe66998533a1992ece9ea99cdf47686f4fc8458e0",
      decimals: 18,
    },
    PLS: {
      address: "0x51318b7d00db7acc4026c88c3952b66278b6a67f",
      decimals: 18,
    },
    "USDC.e": {
      address: "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8",
      decimals: 6,
    },
    JGLP: {
      address: "0x7241bc8035b65865156ddb5edef3eb32874a3af6",
      decimals: 18,
    },
    USDT: {
      address: "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
      decimals: 6,
    },
  },
  avalanche: {
    USDC: {
      address: "0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e",
      decimals: 6,
    },
    EUROC: {
      address: "0xc891eb4cbdeff6e073e859e987815ed1505c2acd",
      decimals: 6,
    },
    WAVAX: {
      address: "0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7",
      decimals: 18,
    },
    JOE: {
      address: "0x6e84a6216ea6dacc71ee8e6b0a5b7322eebc0fdd",
      decimals: 18,
    },
    PNG: {
      address: "0x60781c2586d68229fde47564546784ab3faca982",
      decimals: 18,
    },
    QI: {
      address: "0x8729438eb15e2c8b576fcc6aecda6a148776c0f5",
      decimals: 18,
    },
    PTP: {
      address: "0x22d4002028f537599be9f666d1c4fa138522f9c8",
      decimals: 18,
    },
    XAVA: {
      address: "0xd1c3f94de7e5b45fa4edbba472491a9f4b166fc4",
      decimals: 18,
    },
    YAK: {
      address: "0x59414b3089ce2af0010e7523dea7e2b35d776ec7",
      decimals: 18,
    },
    "USDT.e": {
      address: "0xc7198437980c041c805a1edcba50c1ce5db95118",
      decimals: 6,
    },
    GMX: {
      address: "0x62edc0692bd897d2295872a9ffcac5425011c661",
      decimals: 18,
    },
  },
  merlin: {
    SolvBTC_MERLIN: {
      address: "0x41d9036454be47d3745a823c4aacd0e29cfb0f71",
      decimals: 18,
    },
    BTC: {
      address: "0xb880fd278198bd590252621d4cd071b1842e9bcd",
      decimals: 18,
    },
  },
  canto: {
    USDC: {
      address: "0x80b5a32E4F032B2a058b4F29EC95EEfEEB87aDcd",
      decimals: 6,
    },
    NOTE: {
      address: "0x4e71A2E537B7f9D9413D3991D37958c0b5e1e503",
      decimals: 18,
    },
    USDT: {
      address: "0xd567B3d7B8FE3C79a1AD8dA978812cfC4Fa05e75",
      decimals: 6,
    },
    WCANTO: {
      address: "0x826551890Dc65655a0Aceca109aB11AbDbD7a07B",
      decimals: 18,
    },
    ATOM: {
      address: "0xecEEEfCEE421D8062EF8d6b4D814efe4dc898265",
      decimals: 6,
    },
    ETH: {
      address: "0x5FD55A1B9FC24967C4dB09C513C3BA0DFa7FF687",
      decimals: 18,
    },
  },
  base: {
    USDC: {
      address: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
      decimals: 6,
    },
    eUSD: {
      address: "0xcfa3ef56d303ae4faaba0592388f19d7c3399fb4",
      decimals: 18,
    },
  },
  optimism: {
    USDC: {
      address: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607",
      decimals: 6,
    },
    ALUSD: {
      address: "0xCB8FA9a76b8e203D8C3797bF438d8FB81Ea3326A",
      decimals: 18,
    },
    OP: {
      address: "0x4200000000000000000000000000000000000042",
      decimals: 18,
    },
    LUSD: {
      address: "0xc40F949F8a4e094D1b49a23ea9241D289B7b2819",
      decimals: 18,
    },
    WETH: {
      address: "0x4200000000000000000000000000000000000006",
      decimals: 18,
    },
    ALETH: {
      address: "0x3E29D3A9316dAB217754d13b28646B76607c5f04",
      decimals: 18,
    },
    frxETH: {
      address: "0x6806411765Af15Bddd26f8f544A34cC40cb9838B",
      decimals: 18,
    },
    FRAX: {
      address: "0x2E3D870790dC77A83DD1d18184Acc7439A53f475",
      decimals: 18,
    },
  },
};
