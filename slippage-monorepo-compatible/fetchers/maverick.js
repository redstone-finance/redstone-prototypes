const ethers = require("ethers");
const dotenv = require("dotenv");
const path = require("path");
const { processMaverickConfig } = require("../utils/poolsFromManifest");
const { calculatePoolSlippage } = require("../utils/slippage");

dotenv.config({ path: path.resolve(__dirname, "../.env") });
const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;
const provider = new ethers.providers.JsonRpcProvider(
  `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`
);

const MAVERICK_POOL_INFORMATION_ABI = [
  {
    name: "calculateSwap",
    outputs: [{ type: "uint256", name: "returnAmount" }],
    inputs: [
      { type: "address", name: "pool" },
      { type: "uint128", name: "amount" },
      { type: "bool", name: "tokenAIn" },
      { type: "bool", name: "exactOutput" },
      { type: "uint256", name: "sqrtPriceLimit" },
    ],
    stateMutability: "view",
    type: "function",
  },
];

// const original = {
//   inputs: [
//     { internalType: "contract IPool", name: "pool", type: "address" },
//     { internalType: "uint128", name: "amount", type: "uint128" },
//     { internalType: "bool", name: "tokenAIn", type: "bool" },
//     { internalType: "bool", name: "exactOutput", type: "bool" },
//     { internalType: "uint256", name: "sqrtPriceLimit", type: "uint256" },
//   ],
//   name: "calculateSwap",
//   outputs: [{ internalType: "uint256", name: "returnAmount", type: "uint256" }],
//   stateMutability: "nonpayable",
//   type: "function",
// };

const poolInformationAddress = "0xadc6ced7666779ede88e82c95e363450ac59bfd3";
const contract = new ethers.Contract(
  poolInformationAddress,
  MAVERICK_POOL_INFORMATION_ABI,
  provider
);

let pool;

async function getOutAmount(fromAmount, fromCrypto, toCrypto) {
  const amountOut = await contract.callStatic.calculateSwap(
    pool.poolAddress,
    ethers.utils.parseUnits(fromAmount.toString(), fromCrypto.decimals),
    fromCrypto.tokenAIn, //TODO: true or false
    false, // False means amount is in, true means amount is out
    0 // Unlimited slippage
  );
  return ethers.utils.formatUnits(amountOut.toString(), toCrypto.decimals);
}

async function findPoolSlippage() {
  await calculatePoolSlippage(
    pool.DEX,
    pool.poolAddress,
    pool.tokenA,
    pool.tokenB,
    getOutAmount
  );
}

async function findPoolsSlippages() {
  const pools = await processMaverickConfig();

  for (const [index, poolData] of pools.entries()) {
    console.log(`Processing pool ${index + 1}/${pools.length}`);
    pool = poolData;
    await findPoolSlippage();
  }
}

findPoolsSlippages().catch((err) => {
  console.error("Error occurred:", err);
});

// //call function to test it:
// async function main() {
//   const newPool = {
//     address: "0x6c6FC818b25dF89A8adA8da5A43669023bAD1F4c",
//     tokenA: {
//       decimals: 18,
//       symbol: "LUSD",
//       tokenAIn: true,
//     },
//     tokenB: {
//       decimals: 6,
//       symbol: "USDC",
//       tokenAIn: false,
//     },
//   };

//   //     token0Symbol: "LUSD",
//   //       token1Symbol: "USDC",
//   //       token0Decimals: 18,
//   //       token1Decimals: 6,
//   //       pairedToken: "USDC",
//   //       poolAddress: "0x6c6FC818b25dF89A8adA8da5A43669023bAD1F4c",
//   pool = newPool;

//   const amountIn = ethers.utils.parseUnits("100", pool.tokenA.decimals);
//   const amountOut = await getOutAmount(amountIn, pool.tokenA, pool.tokenB);
//   console.log(`Amount of tokenB: ${amountOut}`);

//   //second direction of swap:
//   const amountIn2 = ethers.utils.parseUnits("100", pool.tokenB.decimals);
//   const amountOut2 = await getOutAmount(amountIn2, pool.tokenB, pool.tokenA);
//   console.log(`Amount of tokenA: ${amountOut2}`);
// }

// main().catch((err) => {
//   console.error("Error occurred:", err);
// });
