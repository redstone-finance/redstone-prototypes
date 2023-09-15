const axios = require("axios");
const dotenv = require("dotenv");
const path = require("path");
const ethers = require("ethers");
const constants = require("../utils/constants");
const { amountTradeXSlippage } = require("../utils/common");

dotenv.config({ path: path.resolve(__dirname, "../.env") });
const ZEROx_API_KEY = process.env.ZEROx_API_KEY;

const DATA_INDEX = 3;

const API_URL = "https://api.0x.org/swap/v1/quote";
const headers = { "0x-api-key": ZEROx_API_KEY };

const DEX = "0x";

const addresses = [
  {
    cryptoASymbol: "DAI",
    cryptoBSymbol: "WETH",
    poolSize: 1.3e8,
    gasFee: 0.002,
  },
  {
    cryptoASymbol: "USDC",
    cryptoBSymbol: "USDT",
    poolSize: 4.2e8,
    gasFee: 0.001,
  },
  {
    cryptoASymbol: "UNI",
    cryptoBSymbol: "WETH",
    poolSize: 2.9e7,
    gasFee: 0.002,
  },
  {
    cryptoASymbol: "SUSHI",
    cryptoBSymbol: "DAI",
    poolSize: 3.9e6,
    gasFee: 0.0001,
  },
  {
    cryptoASymbol: "SNX",
    cryptoBSymbol: "WETH",
    poolSize: 4e6,
    gasFee: 0.004,
  },
];

const { cryptoASymbol, cryptoBSymbol, poolSize, gasFee } = addresses[DATA_INDEX];

const cryptoA = constants[cryptoASymbol];
const cryptoB = constants[cryptoBSymbol];

async function getOutAmount(fromAmount, fromCrypto, toCrypto, contract) {
  const response = await axios.get(API_URL, {
    params: {
      buyToken: toCrypto.symbol,
      sellToken: fromCrypto.symbol,
      sellAmount: ethers.utils
        .parseUnits(fromAmount, fromCrypto.decimals)
        .toString(),
    },
    headers: headers,
  });
  //  estimatedPriceImpact: "98.4171",
  //  grossBuyAmount: '1898404160115835747652349',
  //  buyAmount: "1898404160115835747652349";

  //   console.log(response.data.sources);
  return ethers.utils.formatUnits(response.data.buyAmount, toCrypto.decimals);
}

async function getPricesInEachOther(fromCrypto, toCrypto) {
  //   sellTokenToEthRate: '2846.17033888683721623',
  //   buyTokenToEthRate: '1666.92884274936684794',
  //   sources: [
  //     { name: "0x", proportion: "0" },
  //     { name: "Uniswap", proportion: "0" },
  //     { name: "Uniswap_V2", proportion: "1" },
  //     { name: "Curve", proportion: "0" },
  //     { name: "Balancer", proportion: "0" },
  //     { name: "Balancer_V2", proportion: "0" },
  //     { name: "BancorV3", proportion: "0" },
  //     { name: "SushiSwap", proportion: "0" },
  //     { name: "DODO", proportion: "0" },
  //     { name: "DODO_V2", proportion: "0" },
  //     { name: "CryptoCom", proportion: "0" },
  //     { name: "Lido", proportion: "0" },
  //     { name: "MakerPsm", proportion: "0" },
  //     { name: "KyberDMM", proportion: "0" },
  //     { name: "Uniswap_V3", proportion: "0" },
  //     { name: "Curve_V2", proportion: "0" },
  //     { name: "ShibaSwap", proportion: "0" },
  //     { name: "Synapse", proportion: "0" },
  //     { name: "Synthetix", proportion: "0" },
  //     { name: "Aave_V2", proportion: "0" },
  //     { name: "Compound", proportion: "0" },
  //     { name: "KyberElastic", proportion: "0" },
  //     { name: "Maverick_V1", proportion: "0" },
  //     {
  //       name: 'MultiHop',
  //       proportion: '1',
  //       intermediateToken: '0xdac17f958d2ee523a2206206994597c13d831ec7',
  //       hops: [ 'Curve', 'SushiSwap' ]
  //    }
  //   ];

  const response = await axios.get(API_URL, {
    params: {
      buyToken: toCrypto.symbol,
      sellToken: fromCrypto.symbol,
      sellAmount: ethers.utils.parseUnits("1", fromCrypto.decimals).toString(),
    },
    headers: headers,
  });

  const sellTokenToEthRate = response.data.sellTokenToEthRate;
  const buyTokenToEthRate = response.data.buyTokenToEthRate;
  const firstPriceInSecond = (buyTokenToEthRate / sellTokenToEthRate).toFixed(
    toCrypto.decimals
  );
  const secondPriceInFirst = (sellTokenToEthRate / buyTokenToEthRate).toFixed(
    fromCrypto.decimals
  );

  return [firstPriceInSecond, secondPriceInFirst];
}

async function calculateSlippage(fromCrypto, toCrypto) {
  const [firstPriceInSecond, secondPriceInFirst] = await getPricesInEachOther(
    fromCrypto,
    toCrypto
  );
  const contract = "0x"; // Just for compatibility with other DEXs

  //   console.log(firstPriceInSecond, secondPriceInFirst);
  //   const mul = firstPriceInSecond * secondPriceInFirst;
  //   console.log(mul);

  // calculateAndWriteToCSV(
  //   DEX,
  //   fromCrypto,
  //   toCrypto,
  //   poolSize,
  //   secondPriceInFirst,
  //   firstPriceInSecond,
  //   gasFee,
  //   getOutAmount,
  //   contract
  // );

  amountTradeXSlippage(
    DEX,
    fromCrypto,
    toCrypto,
    poolSize,
    secondPriceInFirst,
    firstPriceInSecond,
    gasFee,
    getOutAmount,
    contract
  );
}

async function findSlippage() {
  await calculateSlippage(cryptoA, cryptoB);
}

findSlippage().catch((err) => {
  console.error("Error occurred:", err);
});
