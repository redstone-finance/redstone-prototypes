const Web3 = require("web3");
const {
  ChainId,
  Token,
  WETH,
  Fetcher,
  Route,
  Trade,
  TradeType,
} = require("@sushiswap/sdk");

const dotenv = require("dotenv");

dotenv.config();

const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;

// Konfiguracja połączenia Web3 z Twoim węzłem Ethereum
const infuraUrl = `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`;
const web3 = new Web3(new Web3.providers.HttpProvider(infuraUrl));

// Adresy tokenów USDC i WETH na Ethereum
const usdcAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // USDC address
const wethAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"; // WETH address

// Ilość USDC, które chcesz wymienić na WETH
const usdcAmount = 100; // Zmień wartość na żądaną ilość

async function calculateTokenAmount() {
  try {
    // Pobieranie instancji tokenów USDC i WETH
    const usdcToken = new Token(ChainId.MAINNET, usdcAddress, 6);
    const wethToken = new Token(ChainId.MAINNET, wethAddress, 18);

    // Pobieranie informacji o parach handlowych z SushiSwap
    const pair = await Fetcher.fetchPairData(usdcToken, wethToken);
    const route = new Route([pair], wethToken);

    // Tworzenie obiektu Trade dla wymiany USDC na WETH
    const trade = new Trade(
      route,
      new TokenAmount(usdcToken, usdcAmount * 10 ** usdcToken.decimals),
      TradeType.EXACT_INPUT
    );

    // Obliczanie ilości tokenów WETH, które otrzymasz
    const wethAmount = trade.outputAmount.toSignificant(6); // Wyświetlana ilość z 6 miejscami po przecinku

    console.log(`Otrzymasz ${wethAmount} tokenów WETH za ${usdcAmount} USDC.`);
  } catch (error) {
    console.error("Wystąpił błąd:", error);
  }
}

calculateTokenAmount();
