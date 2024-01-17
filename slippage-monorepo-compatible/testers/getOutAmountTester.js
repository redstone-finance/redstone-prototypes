const ethers = require("ethers");
const dotenv = require("dotenv");
const path = require("path");
const {
  processUniswapV3Config,
  processCurveConfig,
  processBalancerConfig,
} = require("../utils/poolsFromManifest");

dotenv.config({ path: path.resolve(__dirname, "../.env") });
const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;
const provider = new ethers.providers.JsonRpcProvider(
  `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`
);

const UNISWAP_QUOTER_ADDRESS = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6"; // Uniswap V3 Quoter address
const abiUniswapV3 = [
  "function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)",
];

const abiCurve = [
  "function get_dy(int128 i, int128 j, uint256 dx) external view returns (uint256)",
];

const BALANCER_VAULT_ADDRESS = "0xBA12222222228d8Ba445958a75a0704d566BF2C8";
const SwapExactIn = 0;
const AddressZero = "0x0000000000000000000000000000000000000000";
const FUNDS = {
  sender: AddressZero,
  recipient: AddressZero,
  fromInternalBalance: false,
  toInternalBalance: false,
};

const abiBalancer = [
  {
    inputs: [
      {
        internalType: "enum IVault.SwapKind",
        name: "kind",
        type: "uint8",
      },
      {
        components: [
          {
            internalType: "bytes32",
            name: "poolId",
            type: "bytes32",
          },
          {
            internalType: "uint256",
            name: "assetInIndex",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "assetOutIndex",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "amount",
            type: "uint256",
          },
          {
            internalType: "bytes",
            name: "userData",
            type: "bytes",
          },
        ],
        internalType: "struct IVault.BatchSwapStep[]",
        name: "swaps",
        type: "tuple[]",
      },
      {
        internalType: "contract IAsset[]",
        name: "assets",
        type: "address[]",
      },
      {
        components: [
          {
            internalType: "address",
            name: "sender",
            type: "address",
          },
          {
            internalType: "bool",
            name: "fromInternalBalance",
            type: "bool",
          },
          {
            internalType: "address payable",
            name: "recipient",
            type: "address",
          },
          {
            internalType: "bool",
            name: "toInternalBalance",
            type: "bool",
          },
        ],
        internalType: "struct IVault.FundManagement",
        name: "funds",
        type: "tuple",
      },
    ],
    name: "queryBatchSwap",
    outputs: [
      {
        internalType: "int256[]",
        name: "",
        type: "int256[]",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
];

let pool, contract;

async function getOutAmountUniswapV3(fromAmount, fromCrypto, toCrypto) {
  const amountOut = await contract.callStatic.quoteExactInputSingle(
    fromCrypto.address,
    toCrypto.address,
    pool.fee,
    ethers.utils.parseUnits(fromAmount.toString(), fromCrypto.decimals),
    0
  );
  return ethers.utils.formatUnits(amountOut.toString(), toCrypto.decimals);
}

async function getOutAmountCurve(fromAmount, fromCrypto, toCrypto) {
  const outAmount = await contract.callStatic.get_dy(
    fromCrypto.index,
    toCrypto.index,
    ethers.utils.parseUnits(fromAmount.toString(), fromCrypto.decimals)
  );
  return ethers.utils.formatUnits(outAmount.toString(), toCrypto.decimals);
}

const missedWithV3Quoter = [];
// const missedWithConfigQuoter = [];

const quotersList = [];

async function testGetOutAmountUniswapV3() {
  const pools = await processUniswapV3Config();
  for (const poolData of pools) {
    // if (!quotersList.includes(poolData.quoterAddress)) {
    //   quotersList.push(poolData.quoterAddress);
    // }

    pool = poolData;
    const fromAmount = 1;
    const fromCrypto = pool.tokenA;
    const toCrypto = pool.tokenB;
    // try {
    //   contract = new ethers.Contract(pool.quoterAddress, abi, provider);
    //   const amountOut = await getOutAmountUniswapV3(fromAmount, fromCrypto, toCrypto);
    // } catch (error) {
    //   missedWithConfigQuoter.push(pool);
    // }
    try {
      contract = new ethers.Contract(
        UNISWAP_QUOTER_ADDRESS,
        abiUniswapV3,
        provider
      );
      const amountOut = await getOutAmountUniswapV3(
        fromAmount,
        fromCrypto,
        toCrypto
      );
    } catch (error) {
      missedWithV3Quoter.push(pool);
    }
  }

  //   console.log("Quoters list: ", quotersList);

  console.log("Missed with V3 Quoter: ", missedWithV3Quoter.length);
  //   console.log("Missed with Config Quoter: ", missedWithConfigQuoter.length);
  console.log("Total number of pools: ", pools.length);

  console.log("Missed with V3 Quoter: ", missedWithV3Quoter);
  //   console.log("Missed with Config Quoter: ", missedWithConfigQuoter);
}

missedCurve = [];
async function testGetOutAmountCurve() {
  const pools = await processCurveConfig();
  for (const poolData of pools) {
    pool = poolData;
    const fromAmount = 1;
    const fromCrypto = pool.tokenA;
    const toCrypto = pool.tokenB;
    try {
      contract = new ethers.Contract(pool.poolAddress, abiCurve, provider);
      const amountOut = await getOutAmountCurve(
        fromAmount,
        fromCrypto,
        toCrypto
      );
    } catch (error) {
      missedCurve.push(pool);
    }
  }

  console.log("Missed with Curve: ", missedCurve.length);
  console.log("Total number of pools: ", pools.length);

  console.log("Missed with Curve: ", missedCurve);
}

async function getOutAmountBalancer(fromAmount, fromCrypto, toCrypto) {
  const batchSwapSteps = [
    {
      poolId: pool.poolId,
      assetInIndex: 0,
      assetOutIndex: 1,
      amount: ethers.utils.parseUnits(
        fromAmount.toString(),
        fromCrypto.decimals
      ),
      userData: "0x",
    },
  ];

  const tokenAddresses = [fromCrypto.address, toCrypto.address];

  console.log(
    "queryBatchSwap: ",
    SwapExactIn,
    batchSwapSteps,
    tokenAddresses,
    FUNDS
  );

  const amounts = await contract.callStatic.queryBatchSwap(
    SwapExactIn,
    batchSwapSteps,
    tokenAddresses,
    FUNDS
  );

  return (
    ethers.utils.formatUnits(amounts[1].toString(), toCrypto.decimals) * -1
  );
}

const missedBalancer = [];
async function testGetOutAmountBalancerV2() {
  const pools = await processBalancerConfig();
  for (const poolData of pools) {
    pool = poolData;
    const fromAmount = 1;
    const fromCrypto = pool.tokenA;
    const toCrypto = pool.tokenB;
    try {
      contract = new ethers.Contract(
        BALANCER_VAULT_ADDRESS,
        abiBalancer,
        provider
      );
      const amountOut = await getOutAmountBalancer(
        fromAmount,
        fromCrypto,
        toCrypto
      );
    } catch (error) {
      console.log("Failed above... ------------------------------------------------")
      missedBalancer.push(pool);
    }
  }

  console.log("Missed with Balancer: ", missedBalancer.length);
  console.log("Total number of pools: ", pools.length);

  // console.log("Missed with Balancer: ", missedBalancer);
}

// testGetOutAmountUniswapV3();
// testGetOutAmountCurve();
testGetOutAmountBalancerV2();
