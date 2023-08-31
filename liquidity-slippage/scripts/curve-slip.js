const ethers = require("ethers");
const dotenv = require("dotenv");
const path = require("path");
const constants = require("../utils/constants");
const {
  calculatePoolSize,
  calculateAndWriteToCSV,
  amountTradeXSlippage,
} = require("../utils/common");

dotenv.config({ path: path.resolve(__dirname, "../.env") });
const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;

const DATA_INDEX = 0;

const provider = new ethers.providers.JsonRpcProvider(
  `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`
);
const DEX = "Curve";

const addresses = [
  {
    address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
    fee: 0.00015,
    cryptoASymbol: "DAI",
    cryptoBSymbol: "USDC",
  },
  {
    address: "0x0CD6f267b2086bea681E922E19D40512511BE538",
    fee: 0.00015,
    cryptoASymbol: "crvUSD",
    cryptoBSymbol: "FRAX",
  },
  {
    address: "0xDcEF968d416a41Cdac0ED8702fAC8128A64241A2",
    fee: 0.00015,
    cryptoASymbol: "FRAX",
    cryptoBSymbol: "USDC",
  },
  {
    address: "0x4dece678ceceb27446b35c672dc7d61f30bad69e",
    fee: 0.00015,
    cryptoASymbol: "crvUSD",
    cryptoBSymbol: "USDC",
  },
  {
    address: "0xa1f8a6807c402e4a15ef4eba36528a3fed24e577",
    fee: 0.0003,
    cryptoASymbol: "FRXETH",
    cryptoBSymbol: "ETH",
  },
];
// More can be found:
// redstone-oracles-monorepo/packages/oracle-node/src/fetchers/curve/curve-fetchers-config.ts

const { address, fee, cryptoASymbol, cryptoBSymbol } = addresses[DATA_INDEX];
const cryptoA = constants[cryptoASymbol];
const cryptoB = constants[cryptoBSymbol];

let fromIndex = -1;
let toIndex = -1;

const abi = [
  "function get_dy(int128 i, int128 j, uint256 dx) external view returns (uint256)",
  "function coins(uint256 i) external view returns (address)",
  "function balances(uint256 i) external view returns (uint256)",
];

const contract = new ethers.Contract(address, abi, provider);

async function getPricesInEachOther(fromCrypto, toCrypto) {
  const [balanceFrom, balanceTo] = await Promise.all([
    contract.balances(fromIndex),
    contract.balances(toIndex),
  ]);

  const poolSize = await calculatePoolSize(
    ethers.utils.formatUnits(balanceFrom.toString(), fromCrypto.decimals),
    ethers.utils.formatUnits(balanceTo.toString(), toCrypto.decimals),
    fromCrypto,
    toCrypto
  );

  const secondPriceInFirst = await contract.callStatic.get_dy(
    fromIndex,
    toIndex,
    ethers.utils.parseUnits("1", fromCrypto.decimals)
  );

  const firstPriceInSecond = await contract.callStatic.get_dy(
    toIndex,
    fromIndex,
    ethers.utils.parseUnits("1", toCrypto.decimals)
  );

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
  const outAmount = await contract.get_dy(
    from,
    to,
    ethers.utils.parseUnits(fromAmount.toString(), fromCrypto.decimals)
  );
  return ethers.utils.formatUnits(outAmount.toString(), toCrypto.decimals);
}

async function calculateSlippage(fromCrypto, toCrypto) {
  const [poolSize, firstPriceInSecond, secondPriceInFirst] =
    await getPricesInEachOther(fromCrypto, toCrypto);
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
  let i = 0;
  while (fromIndex === -1 || toIndex === -1) {
    const coinAddress = await contract.coins(i);
    if (coinAddress.toLowerCase() === cryptoA.address.toLowerCase())
      fromIndex = i;
    if (coinAddress.toLowerCase() === cryptoB.address.toLowerCase())
      toIndex = i;
    if (i++ > 5) {
      console.log("Wrong pool address");
      return;
    }
  }
  await calculateSlippage(cryptoA, cryptoB);
}

findSlippage().catch((err) => {
  console.error("Error occurred:", err);
});
