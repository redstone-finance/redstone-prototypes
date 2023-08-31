//TODO: refactor balancer V2 how to get amout out?!
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

const DATA_INDEX = 0;

// TODO: correct addresses, its usually multi swap so check which tokens
// exactly do you swap or swap on multiple pools at once...

// TODO: check if correct indexes on given pool...
const addresses = [
  {
    address: "0xe0e8ac08de6708603cfd3d23b613d2f80e3b7afb",
    poolId:
      "0xe0e8ac08de6708603cfd3d23b613d2f80e3b7afb00020000000000000000058a",
    fee: 0.0, //todo: get fee
    fromIndex: 0,
    toIndex: 1,
    cryptoASymbol: "swETH",
    cryptoBSymbol: "wstETH",
  },
  {
    address: "0x60d604890feaa0b5460b28a424407c24fe89374a",
    poolId:
      "0x60d604890feaa0b5460b28a424407c24fe89374a0000000000000000000004fc",
    fee: 0.0, //todo: get fee
    cryptoASymbol: "swETH",
    cryptoBSymbol: "WETH",
    fromIndex: 1,
    toIndex: 2,
  },
  {
    address: "0xc443c15033fcb6cf72cc24f1bda0db070ddd9786",
    poolId:
      "0xc443c15033fcb6cf72cc24f1bda0db070ddd9786000000000000000000000593",
    fee: 0.0, //todo: get fee
    cryptoASymbol: "GHO",
    cryptoBSymbol: "DAI",
    fromIndex: 1,
    toIndex: 2,
  },
  {
    address: "0xc443c15033fcb6cf72cc24f1bda0db070ddd9786",
    poolId:
      "0xc443c15033fcb6cf72cc24f1bda0db070ddd9786000000000000000000000593",
    fee: 0.0, //todo: get fee
    cryptoASymbol: "GHO",
    cryptoBSymbol: "USDC",
    fromIndex: 1,
    toIndex: 2,
  },
  {
    address: "0xcfae6e251369467f465f13836ac8135bd42f8a56",
    poolId:
      "0xcfae6e251369467f465f13836ac8135bd42f8a56000000000000000000000591",
    fee: 0.0, //todo: get fee
    cryptoASymbol: "GHO",
    cryptoBSymbol: "USDT",
    fromIndex: 2,
    toIndex: 3,
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
  "function getPool(bytes32) external view returns (uint8)",
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
    ethers.utils.parseUnits("1", fromCrypto.decimals),
    fromCrypto,
    toCrypto,
    contract
  );

  const firstPriceInSecond = await getOutAmount(
    ethers.utils.parseUnits("1", toCrypto.decimals),
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
      amount: fromAmount,
      userData: "0x",
    },
  ];

  const tokenAddresses = [fromCrypto.address, toCrypto.address];

  const result = await contract.callStatic.queryBatchSwap(
    SwapExactIn,
    batchSwapSteps,
    tokenAddresses,
    FUNDS
  );

  console.log("Query Batch Swap Result:", result);
  //TODO probably return results[1] or also parse it...

  return 0;

  return ethers.utils.formatUnits(outAmount.toString(), toCrypto.decimals);
}

async function calculateSlippage(fromCrypto, toCrypto) {
  const [poolSize, firstPriceInSecond, secondPriceInFirst] =
    await getPricesInEachOther(fromCrypto, toCrypto);
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
