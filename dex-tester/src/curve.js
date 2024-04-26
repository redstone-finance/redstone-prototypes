const ethers = require("ethers");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../.env") });
const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;
const provider = new ethers.providers.JsonRpcProvider(
  `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`
);

const abi = [
  "function get_dy(int128 i, int128 j, uint256 dx) external view returns (uint256)",
];
const abiV2 = [
  "function get_dy(uint256 i, uint256 j, uint256 dx) external view returns (uint256)",
];

async function getOutAmount(fromAmount, fromCrypto, toCrypto) {
  const outAmount = await contract.callStatic.get_dy(
    fromCrypto.index,
    toCrypto.index,
    ethers.utils.parseUnits(fromAmount.toString(), fromCrypto.decimals)
  );
  return ethers.utils.formatUnits(outAmount.toString(), toCrypto.decimals);
}

const pool = {
  DEX: "curve-crv",
  poolAddress: "0x4ebdf703948ddcea3b11f675b4d1fba9d2414a14",
  tokenA: {
    index: 0,
    decimals: 18,
    symbol: "crvUSD",
  },
  tokenB: {
    index: 2,
    decimals: 18,
    symbol: "CRV",
  },
};

const contract = new ethers.Contract(pool.poolAddress, abiV2, provider);

const fromAmount = 1;
getOutAmount(fromAmount, pool.tokenA, pool.tokenB).then(console.log);
