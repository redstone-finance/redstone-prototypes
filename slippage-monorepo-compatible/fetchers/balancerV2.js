const ethers = require("ethers");
const dotenv = require("dotenv");
const path = require("path");
const { processBalancerConfig } = require("../utils/poolsFromManifest");
const { calculatePoolSlippage } = require("../utils/slippage");

dotenv.config({ path: path.resolve(__dirname, "../.env") });
const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;
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
let pool;

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

async function getOutAmount(fromAmount, fromCrypto, toCrypto) {
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
  const pools = await processBalancerConfig();

  for (const [index, poolData] of pools.entries()) {
    console.log(`Processing pool ${index + 1}/${pools.length}`);
    pool = poolData;
    await findPoolSlippage();
  }
}

findPoolsSlippages().catch((err) => {
  console.error("Error occurred:", err);
});
