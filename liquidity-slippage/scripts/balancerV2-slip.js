const ethers = require("ethers");
const dotenv = require("dotenv");
const path = require("path");
const constants = require("../utils/constants");
const poolsInfo = require("../utils/pools-info");
const {
  getApproximateTokensAmountInPool,
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
let poolId, fromIndex, toIndex, cryptoFromSymbol;
// let tokenAddress;

const balancerVaultABI = require("./BalancerVault.abi.json");
const contract = new ethers.Contract(
  BALANCER_VAULT_ADDRESS,
  balancerVaultABI,
  provider
);

async function getOutAmount(fromAmount, fromCrypto, toCrypto, contract) {
  // let [from, to] = [fromIndex, toIndex];
  // // let tokenAddresses = [fromCrypto.address, toCrypto.address]; 
  // if (fromCrypto.symbol !== cryptoFromSymbol) {
  //   [from, to] = [toIndex, fromIndex];
  //   // tokenAddresses = [toCrypto.address, fromCrypto.address];
  // }

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
  //todo: maybe always the same order - so we can add to poolsInfo or write to let in 

  const amounts = await contract.callStatic.queryBatchSwap(
    SwapExactIn,
    batchSwapSteps,
    tokenAddresses,
    FUNDS
  );

  console.log("FromCrypto:", fromCrypto.symbol);
  // console.log("from:", from);
  // console.log("ToCrypto:", toCrypto.symbol);
  // console.log("to:", to);
  console.log("FromAmount:", fromAmount.toString());
  // console.log("Amount0:", amounts[0].toString());
  console.log("Amount1:", amounts[1].toString());
  console.log("Formatted Amount1:", ethers.utils.formatUnits(amounts[1].toString(), toCrypto.decimals));
  // Amount1: -153 381513897880760078;
  // Amount1: -469 204000479774480495;

  return (
    ethers.utils.formatUnits(amounts[1].toString(), toCrypto.decimals) * -1
  );
}

async function calculateSlippage(pool) {
  console.log(
    `Started calculating slippage on ${DEX} for pool: `,
    pool.poolAddress,
    "...",
    pool.cryptoASymbol,
    pool.cryptoBSymbol
  );
  const fromCrypto = constants[pool.cryptoASymbol];
  const toCrypto = constants[pool.cryptoBSymbol];

  const poolSize = 0;
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
    //todo: maybe pool Id is different than pool address !!
    poolId = pool.poolId;
    // fromIndex = pool.cryptoAIndex;
    // toIndex = pool.cryptoBIndex;
    cryptoFromSymbol = pool.cryptoASymbol;
    // tokenAddresses = pool.tokenAddresses;
    await calculateSlippage(pool);
  }
}

findSlippage().catch((err) => {
  console.error("Error occurred:", err);
});
