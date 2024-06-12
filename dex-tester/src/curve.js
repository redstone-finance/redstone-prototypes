const ethers = require("ethers");
const dotenv = require("dotenv");
const path = require("path");

// dotenv.config({ path: path.resolve(__dirname, "../.env") });
// const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;
// const provider = new ethers.providers.JsonRpcProvider(
//   `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`
// );
const providerUrl = "https://eth-pokt.nodies.app";
const provider = new ethers.providers.JsonRpcProvider(providerUrl);

const abi = [
  "function get_dy_underlying(int128 i, int128 j, uint256 dx) external view returns (uint256)",
];
const abiV2 = [
  "function get_dy(uint256 i, uint256 j, uint256 dx) external view returns (uint256)",
];

async function getOutAmount(fromAmount, fromCrypto, toCrypto) {
  const outAmount = await contract.callStatic.get_dy_underlying(
    fromCrypto.index,
    toCrypto.index,
    ethers.utils.parseUnits(fromAmount.toString(), fromCrypto.decimals)
  );
  return ethers.utils.formatUnits(outAmount.toString(), toCrypto.decimals);
}

// const pool = {
//   DEX: "curve-crv",
//   poolAddress: "0x4ebdf703948ddcea3b11f675b4d1fba9d2414a14",
//   tokenA: {
//     index: 0,
//     decimals: 18,
//     symbol: "crvUSD",
//   },
//   tokenB: {
//     index: 2,
//     decimals: 18,
//     symbol: "wstETH",
//   },
// };

// https://curve.fi/#/ethereum/pools/factory-stable-ng-31/deposit
// Fee: 0.02%
// DAO Fee: 0.01% 
const pool = {
  DEX: "curve-crv",
  poolAddress: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
  tokenA: {
    index: 0,
    decimals: 18,
    symbol: "WETH",
  },
  tokenB: {
    index: 1,
    decimals: 18,
    symbol: "pxETH",
  },
};

const contract = new ethers.Contract(pool.poolAddress, abi, provider);
// const contract = new ethers.Contract(pool.poolAddress, abiV2, provider);

const fromAmount = 1;
// getOutAmount(fromAmount, pool.tokenA, pool.tokenB).then(console.log);
// getOutAmount(fromAmount, pool.tokenB, pool.tokenA).then(console.log);
async function test() {
  const r1 = await getOutAmount(fromAmount, pool.tokenA, pool.tokenB);
  const r2 = await getOutAmount(fromAmount, pool.tokenB, pool.tokenA);
  console.log(r1, r2);
  const multi = r1 * r2;
  console.log("Multi: ", multi);
  const sqrt_multi = Math.sqrt(multi);
  console.log("Sqrt: ", sqrt_multi);
  const fee = (fromAmount - sqrt_multi) / fromAmount;
  console.log("Fee: ", fee);
  const feePercent = fee * 100;
  console.log("Fee %: ", feePercent);
}
test();
