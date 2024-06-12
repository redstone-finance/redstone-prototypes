import { BigNumberish, Contract } from "ethers";

const ethers = require("ethers");

const providerUrl = "https://eth-pokt.nodies.app";
const provider = new ethers.providers.JsonRpcProvider(providerUrl);

const poolAbi = [
  {
    name: "tokenA",
    outputs: [{ type: "address", name: "tokenA" }],
    inputs: [],
    stateMutability: "view",
    type: "function",
  },
  {
    name: "tokenB",
    outputs: [{ type: "address", name: "tokenB" }],
    inputs: [],
    stateMutability: "view",
    type: "function",
  },
];

const erc20Abi = [
  {
    inputs: [],
    name: "symbol",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
];

const poolAddress = "0x0d16ae020a45424ef1a30c8db8f09ca6c7f991a5";
const poolContract = new Contract(poolAddress, poolAbi, provider);

async function tester() {
    const tokenA = await poolContract.tokenB();
    console.log(tokenA);
  }
  
  tester();

// void (async () => {
//   for (const config of Object.values(configs.tokens)) {
//     const { token0Symbol, token1Symbol, poolAddress } = config;
//     console.log(`Checking pool of ${token0Symbol} / ${token1Symbol}`);

//     const poolContract = new Contract(poolAddress, poolAbi, ethereumProvider);

//     // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
//     const tokenA = await poolContract.tokenA();
//     // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
//     const tokenAContract = new Contract(tokenA, erc20Abi, ethereumProvider);
//     // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
//     const tokenASymbol = await tokenAContract.symbol();

//     // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
//     const tokenB = await poolContract.tokenB();
//     // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
//     const tokenBContract = new Contract(tokenB, erc20Abi, ethereumProvider);
//     // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
//     const tokenBSymbol = await tokenBContract.symbol();

//     // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
//     if (token0Symbol.toLowerCase() !== tokenASymbol.toLowerCase()) {
//       console.log(
//         `WRONG TOKEN0 CONFIGURATION: CURRENT - ${token0Symbol}, CONTRACT - ${tokenASymbol}`
//       );
//     }
//     // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
//     if (token1Symbol.toLowerCase() !== tokenBSymbol.toLowerCase()) {
//       console.log(
//         `WRONG TOKEN1 CONFIGURATION: CURRENT - ${token1Symbol}, CONTRACT - ${tokenBSymbol}`
//       );
//     }

//     console.log("\n");
//   }
// })();
