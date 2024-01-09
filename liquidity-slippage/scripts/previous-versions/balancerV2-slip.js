const ethers = require("ethers");
const dotenv = require("dotenv");
const path = require("path");
const redstone = require("redstone-api");
const constants = require("../utils/constants");
const {
  calculateAndWriteToCSV,
  getApproximateTokensAmountInPool,
  amountTradeXSlippage,
} = require("../utils/common");

dotenv.config({ path: path.resolve(__dirname, "../.env") });
const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;

const DATA_INDEX = 1;
const DEX = "Balancer V2";

const [DEFAULT_DECIMALS, BIGGER_DECIMALS, SMALLER_DECIMALS] = [15, 21, 10];
const DEFAULT_AMOUNT = ethers.utils
  .parseUnits("1", DEFAULT_DECIMALS)
  .toString();
const BIGGER_AMOUNT = ethers.utils.parseUnits("1", BIGGER_DECIMALS).toString();
const SMALLER_AMOUNT = ethers.utils
  .parseUnits("1", SMALLER_DECIMALS)
  .toString();

const addresses = [
  {
    address: "0x0e3a2a1f2146d86a604adc220b4967a898d7fe07", //todo
    poolId:
      "0xe7e2c68d3b13d905bbb636709cf4dfd21076b9d20000000000000000000005ca",
    fee: 0.002, //todo: get fee
    fromIndex: 0,
    toIndex: 1,
    cryptoASymbol: "swETH",
    cryptoBSymbol: "WETH",
    //works on default amount
  },
  {
    address: "0x0e3a2a1f2146d86a604adc220b4967a898d7fe07", //todo
    poolId:
      "0x5c6ee304399dbdb9c8ef030ab642b10820db8f56000200000000000000000014",
    fee: 0.002, //todo: get fee
    fromIndex: 0,
    toIndex: 1,
    cryptoASymbol: "BAL",
    cryptoBSymbol: "WETH",
    //works on default amount
  },

  {
    //todo: maybe different amount to get spot price
    address: "0xe0e8ac08de6708603cfd3d23b613d2f80e3b7afb", // todo
    poolId:
      "0xe0e8ac08de6708603cfd3d23b613d2f80e3b7afb00020000000000000000058a",
    fee: 0.002, //todo: get fee
    fromIndex: 0,
    toIndex: 1,
    cryptoASymbol: "swETH",
    cryptoBSymbol: "wstETH",
    //works on smaller amount
  },
];

const {
  address,
  poolId,
  fee,
  cryptoASymbol,
  cryptoBSymbol,
  fromIndex,
  toIndex,
} = addresses[DATA_INDEX];

const cryptoA = constants[cryptoASymbol];
const cryptoB = constants[cryptoBSymbol];

console.log("Crypto A:", cryptoA);
console.log("Crypto B:", cryptoB);

const provider = new ethers.providers.JsonRpcProvider(
  `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`
);

const BALANCER_VAULT_ADDRESS = "0xBA12222222228d8Ba445958a75a0704d566BF2C8";
const SwapExactIn = 0;
const AddressZero = "0x0000000000000000000000000000000000000000";
const FUNDS = {
  sender: AddressZero,
  recipient: AddressZero,
  fromInternalBalance: false,
  toInternalBalance: false,
};

const BPoolABI = [
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

const contract = new ethers.Contract(
  BALANCER_VAULT_ADDRESS,
  BPoolABI,
  provider
);

async function getPricesInEachOther(fromCrypto, toCrypto) {
  // const poolSize = await getApproximateTokensAmountInPool(
  //   address,
  //   fromCrypto,
  //   toCrypto
  // );
  const poolSize = 0;

  const secondPriceInFirst = await getOutAmount(
    ethers.utils.parseUnits("1", fromCrypto.decimals).toString(),
    fromCrypto,
    toCrypto,
    contract
  );

  const firstPriceInSecond = await getOutAmount(
    ethers.utils.parseUnits("1", toCrypto.decimals).toString(),
    toCrypto,
    fromCrypto,
    contract
  );

  // TODO: maybe parse Units, maybe not....
  return [
    poolSize,
    ethers.utils.formatUnits(
      firstPriceInSecond.toString(),
      fromCrypto.decimals
    ),
    ethers.utils.formatUnits(secondPriceInFirst.toString(), toCrypto.decimals),
  ];
}

async function getOutAmount(fromAmount, fromCrypto, toCrypto, contract) {
  let [from, to] = [fromIndex, toIndex];
  if (fromCrypto.symbol !== cryptoASymbol) {
    [from, to] = [toIndex, fromIndex];
  }

  const batchSwapSteps = [
    {
      poolId: poolId,
      assetInIndex: from,
      assetOutIndex: to,
      amount: DEFAULT_AMOUNT, //todo: change to fromAmount
      amount: fromAmount, // TODO: maybe change to string..
      userData: "0x",
    },
  ];

  // const batchSwapStepsToRemove = [
  //   {
  //     poolId:
  //       "0x02d928e68d8f10c0358566152677db51e1e2dc8c00000000000000000000051e",
  //     assetInIndex: 0,
  //     assetOutIndex: 1,
  //     amount: DEFAULT_AMOUNT,
  //     userData: "0x",
  //   },
  //   {
  //     poolId:
  //       "0x60d604890feaa0b5460b28a424407c24fe89374a0000000000000000000004fc",
  //     assetInIndex: 1,
  //     assetOutIndex: 2,
  //     amount: "0",
  //     userData: "0x",
  //   },
  // ];
  // const tokenAddressesToRemove = [
  //   "0xf951e335afb289353dc249e82926178eac7ded78",
  //   "0x60d604890feaa0b5460b28a424407c24fe89374a",
  //   "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  // ];

  // console.log("Query Batch Swap Params:", {
  //   SwapExactIn,
  //   batchSwapStepsToRemove,
  //   tokenAddressesToRemove,
  //   FUNDS,
  // });

  // const result2 = await contract.callStatic.queryBatchSwap(
  //   SwapExactIn,
  //   batchSwapStepsToRemove,
  //   tokenAddressesToRemove,
  //   FUNDS
  // );
  // console.log("Query Batch Swap Result2:", result2);
  // return;

  const tokenAddresses = [fromCrypto.address, toCrypto.address];

  console.log("Query Batch Swap Params:", {
    SwapExactIn,
    batchSwapSteps,
    tokenAddresses,
    FUNDS,
  });

  const result = await contract.callStatic.queryBatchSwap(
    SwapExactIn,
    batchSwapSteps,
    tokenAddresses,
    FUNDS
  );

  console.log("Query Batch Swap Result:", result);
  console.log("Results 0:", result[0].toString());
  console.log("Results 1:", result[1].toString());
  //TODO probably return results[1] or also parse it...

  return result[1];

  return ethers.utils.formatUnits(outAmount.toString(), toCrypto.decimals);
}

async function calculateSlippage(fromCrypto, toCrypto) {
  const [poolSize, firstPriceInSecond, secondPriceInFirst] =
    await getPricesInEachOther(fromCrypto, toCrypto);

  console.log("Pool size:", poolSize);
  console.log("First price in second:", firstPriceInSecond);
  console.log("Second price in first:", secondPriceInFirst);
  return;

  // calculateAndWriteToCSV(
  // DEX,
  // fromCrypto,
  // toCrypto,
  // poolSize,
  // secondPriceInFirst,
  // firstPriceInSecond,
  // fee,
  // getOutAmount,
  // contract
  // );
  amountTradeXSlippage(
    DEX,
    fromCrypto,
    toCrypto,
    poolSize,
    secondPriceInFirst,
    firstPriceInSecond,
    fee,
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
