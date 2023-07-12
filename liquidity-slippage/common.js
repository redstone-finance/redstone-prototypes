const ethers = require("ethers");
const redstone = require("redstone-api");
const dotenv = require("dotenv");

dotenv.config();

const provider = new ethers.providers.JsonRpcProvider(
  `https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`
);

async function calculatePoolSize(
  token0Amount,
  token1Amount,
  token0Symbol,
  token1Symbol
) {
  const [token0PriceInUSD, token1PriceInUSD] = await Promise.all([
    redstone.getPrice(token0Symbol),
    redstone.getPrice(token1Symbol),
  ]);
  const poolSize = (
    token0Amount * token0PriceInUSD.value +
    token1Amount * token1PriceInUSD.value
  ).toFixed(2);
  const formattedPoolSize = parseFloat(poolSize).toLocaleString();
  console.log(
    `Pool size: ${formattedPoolSize} USD (may contain unclaimed fees)`
  );
  return poolSize;
}

function calcPriceSecondInFirst(
  token0Amount,
  token1Amount,
  token0Decimals,
  token1Decimals
) {
  const secondPriceInFirst = token0Amount
    .mul(ethers.utils.parseUnits("1", token1Decimals))
    .div(token1Amount);
  return ethers.utils.formatUnits(
    secondPriceInFirst.toString(),
    token0Decimals
  );
}

async function getApproximateTokensAmountInPool(
  poolAddress,
  fromCrypto,
  toCrypto
) {
  const ERC20Abi = [
    "function balanceOf(address account) external view returns (uint256)",
  ];
  let ERC20Contract = new ethers.Contract(
    fromCrypto.address,
    ERC20Abi,
    provider
  );
  const amountFrom = await ERC20Contract.balanceOf(poolAddress);
  ERC20Contract = new ethers.Contract(toCrypto.address, ERC20Abi, provider);
  const amountTo = await ERC20Contract.balanceOf(poolAddress);
  await calculatePoolSize(
    ethers.utils.formatUnits(amountFrom.toString(), fromCrypto.decimals),
    ethers.utils.formatUnits(amountTo.toString(), toCrypto.decimals),
    fromCrypto.symbol,
    toCrypto.symbol
  );
}

module.exports = {
  calculatePoolSize,
  calcPriceSecondInFirst,
  getApproximateTokensAmountInPool,
};
