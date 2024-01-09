const axios = require("axios");
const dotenv = require("dotenv");
const path = require("path");
const ethers = require("ethers");
const constants = require("../../utils/constants");
const { amountTradeXSlippage } = require("../../utils/common");

dotenv.config({ path: path.resolve(__dirname, "../.env") });
const ONEinch_API_KEY = process.env.ONEinch_API_KEY;

const DATA_INDEX = 2;

const DEX = "1inch";
const quoteApiUrl = "https://api.1inch.dev/swap/v5.2/1/quote";
const priceApiUrl = "https://api.1inch.dev/price/v1.1/1";

const addresses = [
  {
    cryptoASymbol: "DAI",
    cryptoBSymbol: "WETH",
    poolSize: 6.1e8,
    gasFee: 0.0001,
  },
  {
    cryptoASymbol: "USDC",
    cryptoBSymbol: "DAI",
    poolSize: 1.7e9,
    gasFee: 0.0001,
  },
  {
    cryptoASymbol: "UNI",
    cryptoBSymbol: "WETH",
    poolSize: 3.1e7,
    gasFee: 0.003,
  },
  {
    cryptoASymbol: "SUSHI",
    cryptoBSymbol: "DAI",
    poolSize: 4.4e6,
    gasFee: 0.003,
  },
  {
    cryptoASymbol: "SNX",
    cryptoBSymbol: "WETH",
    poolSize: 4e6,
    gasFee: 0.005,
  },
];

const { cryptoASymbol, cryptoBSymbol, poolSize, gasFee } = addresses[DATA_INDEX];

const cryptoA = constants[cryptoASymbol];
const cryptoB = constants[cryptoBSymbol];

const headers = {
  accept: "application/json",
  Authorization: `Bearer ${ONEinch_API_KEY}`,
};

async function getOutAmount(fromAmount, fromCrypto, toCrypto, contract) {
  const response = await axios.get(quoteApiUrl, {
    params: {
      src: fromCrypto.address,
      dst: toCrypto.address,
      amount: ethers.utils
        .parseUnits(fromAmount, fromCrypto.decimals)
        .toString(),
    },

    headers: headers,
  });
  return ethers.utils.formatUnits(response.data.toAmount, toCrypto.decimals);
}

async function getPricesInEachOther(fromCrypto, toCrypto) {
  const fullApiUrl = `${priceApiUrl}/${fromCrypto.address},${toCrypto.address}`;
  const response = await axios.get(fullApiUrl, {
    headers: headers,
  });

  const sellTokenToEthRate = response.data[toCrypto.address.toLowerCase()];
  const buyTokenToEthRate = response.data[fromCrypto.address.toLowerCase()];

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
    cryptoA,
    cryptoB
  );

  const contract = "0x"; // Just for compatibility with other DEXs

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
