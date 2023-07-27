// Array containing stableCoins
export const stableCoins: string[] = [
  "USDT",
  "USDC",
  "DAI",
  "FRAX",
  "USDT.e",
  "LUSD",
  "ALUSD",
];

// Array containing normal tokens
export const normalTokens: string[] = [
  "ETH",
  "PNG",
  "AVAX",
  "LINK",
  "BTC",
  "QI",
  "sAVAX",
  "PTP",
  "YY_AAVE_AVAX",
  "YY_PTP_sAVAX",
  "PNG_AVAX_USDC_LP",
  "PNG_AVAX_USDT_LP",
  "PNG_AVAX_ETH_LP",
  "TJ_AVAX_USDC_LP",
  "TJ_AVAX_USDT_LP",
  "TJ_AVAX_ETH_LP",
  "TJ_AVAX_BTC_LP",
  "TJ_AVAX_sAVAX_LP",
  "MOO_TJ_AVAX_USDC_LP",
  "YY_PNG_AVAX_USDC_LP",
  "YY_PNG_AVAX_ETH_LP",
  "YY_TJ_AVAX_sAVAX_LP",
  "YY_TJ_AVAX_USDC_LP",
  "YY_TJ_AVAX_ETH_LP",
  "XAVA",
  "YYAV3SA1",
  "GMX",
  "GLP",
  "JOE",
  "BUSD",
  "YY_GLP",
  "SHLB_AVAX-USDC_B",
  "SHLB_BTC.b-AVAX_B",
  "SHLB_USDT.e-USDt_C",
  "SHLB_JOE-AVAX_B",
  "SOFR",
  "SOFR_EFFECTIVE_DATE",
  "SOFRAI",
  "SOFRAI_EFFECTIVE_DATE",
  "gmdUSDC",
  "gmdAVAX",
  "gmdBTC",
  "gmdETH",
  "EUROC",
  "SHLB_EUROC-USDC_V2_1_B",
  "TJ_AVAX_USDC_AUTO",
  "CRV",
  "crvUSDBTCETH",
  "IB01.L",
  "SHLB_GMX-AVAX_B",
  "VST",
  "FXS",
  "WSTETH",
  "SWETH",
  "FRXETH",
  "ALETH",
  "crvFRAX",
  "3Crv",
  "AAVE",
  "C3M",
  "SONIA",
  "USDC.USDT",
  "USDC.DAI",
];

export const stableCoinsLimitPercentage: number = 0.02; // 2%
export const normalTokensLimitPercentage: number = 0.5; // 50%

export interface ProdDetails {
  [service: string]: {
    hash: string;
    manifestName: string;
    fallbackManifestUrl: string;
  };
}

export const prodDetails: ProdDetails = {
  primary: {
    hash: "xasdqwr",
    manifestName: "redstone-primary-prod-node-1",
    fallbackManifestUrl:
      "https://raw.githubusercontent.com/redstone-finance/redstone-oracles-monorepo/f4ab23f92b2e65fade1233214b57ba1ee0ca7e3f/packages/oracle-node/manifests/data-services/primary.json",
  },
  avalanche: {
    hash: "zxczxasd",
    manifestName: "redstone-avalanche-prod",
    fallbackManifestUrl:
      "https://raw.githubusercontent.com/redstone-finance/redstone-oracles-monorepo/main/packages/oracle-node/manifests/data-services/avalanche.json",
  },
};

export const configUrl: string =
  "https://raw.githubusercontent.com/redstone-finance/remote-config/main/monitoring-remote-config-a51m53ue.json";
