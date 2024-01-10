const ethers = require("ethers");
const dotenv = require("dotenv");
const path = require("path");
const constants = require("../utils/constants");
const poolsInfo = require("../utils/pools-info");
const {
  amountTradeXSlippageIndependent,
} = require("../utils/common");

dotenv.config({ path: path.resolve(__dirname, "../.env") });
const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;
const provider = new ethers.providers.JsonRpcProvider(
  `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`
);

const DEX = "Balancer V2";
const BALANCER_VAULT_ADDRESS = "0xBA12222222228d8Ba445958a75a0704d566BF2C8";
const SwapExactIn = 0;

const AddressZero = "0x0000000000000000000000000000000000000000";
const FUNDS = {
  sender: AddressZero,
  recipient: AddressZero,
  fromInternalBalance: false,
  toInternalBalance: false,
};
let poolId;

const balancerVaultABI = [
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
  balancerVaultABI,
  provider
);

async function getOutAmount(fromAmount, fromCrypto, toCrypto, contract) {
  const batchSwapSteps = [
    {
      poolId: poolId,
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

  const amounts = await contract.callStatic.queryBatchSwap(
    SwapExactIn,
    batchSwapSteps,
    tokenAddresses,
    FUNDS
  );
  
  // console.log("fromCrypto: ", fromCrypto.symbol);
  // console.log("amounts1: ", amounts[1].toString());
  // console.log("formatted amounts1: ", ethers.utils.formatUnits(amounts[1].toString(), toCrypto.decimals) * -1);

  return (
    ethers.utils.formatUnits(amounts[1].toString(), toCrypto.decimals) * -1
  );
}

async function calculateSlippage(pool) {
  console.log(
    `Started calculating slippage on ${DEX} for pool: `,
    pool.poolId.slice(0, 42), // pool address is first 20 bytes of poolId
    "...",
    pool.cryptoASymbol,
    pool.cryptoBSymbol
  );
  const fromCrypto = constants[pool.cryptoASymbol];
  const toCrypto = constants[pool.cryptoBSymbol];

  const poolSize = pool.poolSize;
  await amountTradeXSlippageIndependent(
    DEX,
    fromCrypto,
    toCrypto,
    poolSize,
    getOutAmount,
    contract
  );
}

async function findSlippage() {
  const pools = poolsInfo.poolsInfo[DEX];
  for (const pool of pools) {
    poolId = pool.poolId;
    await calculateSlippage(pool);
  }
}

findSlippage().catch((err) => {
  console.error("Error occurred:", err);
});
