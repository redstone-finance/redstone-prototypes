const ethers = require("ethers");
const dotenv = require("dotenv");
const path = require("path");
const Decimal = require("decimal.js");

dotenv.config({ path: path.resolve(__dirname, "../.env") });
const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;
const provider = new ethers.providers.JsonRpcProvider(
  `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`
);

// const quoterAddress = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6"; // Uniswap V3 Quoter address
const quoterAddress = "0x61fFE014bA17989E743c5F6cB21bF9697530B21e";
// const abi = [
//   "function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)",
// ];
const abi = [
  {
    inputs: [
      {
        components: [
          { internalType: "address", name: "tokenIn", type: "address" },
          {
            internalType: "address",
            name: "tokenOut",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "amountIn",
            type: "uint256",
          },
          { internalType: "uint24", name: "fee", type: "uint24" },
          {
            internalType: "uint160",
            name: "sqrtPriceLimitX96",
            type: "uint160",
          },
        ],
        internalType: "struct IQuoterV2.QuoteExactInputSingleParams",
        name: "params",
        type: "tuple",
      },
    ],
    name: "quoteExactInputSingle",
    outputs: [
      { internalType: "uint256", name: "amountOut", type: "uint256" },
      {
        internalType: "uint160",
        name: "sqrtPriceX96After",
        type: "uint160",
      },
      {
        internalType: "uint32",
        name: "initializedTicksCrossed",
        type: "uint32",
      },
      { internalType: "uint256", name: "gasEstimate", type: "uint256" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const contract = new ethers.Contract(quoterAddress, abi, provider);

async function getOutAmount(fromAmount, fromCrypto, toCrypto) {
  const amountOut = await contract.callStatic.quoteExactInputSingle({
    tokenIn: fromCrypto.address,
    tokenOut: toCrypto.address,
    fee: pool.fee,
    amountIn: ethers.utils.parseUnits(
      fromAmount.toString(),
      fromCrypto.decimals
    ),
    sqrtPriceLimitX96: 0,
  });

//   return new Decimal(amountOut[0].toString())
//     .div(10 ** toCrypto.decimals)
//     .toString();

  return ethers.utils.formatUnits(amountOut[0], toCrypto.decimals);

  //   const amountOut = await contract.callStatic.quoteExactInputSingle(
  //     fromCrypto.address,
  //     toCrypto.address,
  //     pool.fee,
  //     ethers.utils.parseUnits(fromAmount.toString(), fromCrypto.decimals),
  //     0
  //   );
  //   return ethers.utils.formatUnits(amountOut.toString(), toCrypto.decimals);
}

const fromCrypto = {
  symbol: "WETH",
  address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  decimals: 18,
};

const toCrypto = {
  symbol: "WBTC",
  address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
  decimals: 8,
};

const pool = {
  fee: 500,
};

const amountsIn = [0.0001, 0.001, 0.01, 0.1, 1, 10000];

async function slippageTester() {
  for (const amountIn of amountsIn) {
    const amountOut = await getOutAmount(amountIn, fromCrypto, toCrypto);
    console.log(
      `Amount in: ${amountIn} ${fromCrypto.symbol}, amount out: ${amountOut} ${toCrypto.symbol}`
    );
  }
}

slippageTester().catch((err) => {
  console.error("Error occurred:", err);
});
