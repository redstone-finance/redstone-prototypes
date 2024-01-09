const ethers = require("ethers");
const dotenv = require("dotenv");
const path = require("path");

// Infura or other provider's project ID
dotenv.config({ path: path.resolve(__dirname, "../.env") });
const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;
const provider = new ethers.providers.JsonRpcProvider(
  `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`
);

// Balancer Vault ABI
const balancerVaultABI = require("./BalancerVault.abi.json");

// Balancer Vault Address
const balancerVaultAddress = "0xBA12222222228d8Ba445958a75a0704d566BF2C8";
// 0xba12222222228d8ba445958a75a0704d566bf2c8;

// Create an instance of the Balancer Vault contract
const balancerVault = new ethers.Contract(
  balancerVaultAddress,
  balancerVaultABI,
  provider
);

// Function to get the amount of Token B for a given amount of Token A
async function getAmountOut(poolId, tokenIn, tokenOut, amountIn) {
  // Construct the swap request
  const swaps = [
    {
      poolId:
        "0x3fa8c89704e5d07565444009e5d9e624b40be813000000000000000000000599",
      assetInIndex: 0,
      assetOutIndex: 1,
      amount: amountIn.toString(),
      userData: "0x",
    },
  ];

  //   const singleSwap = {
  //     poolId: poolId,
  //     kind: 0, // SwapKind.GivenIn
  //     assetIn: tokenIn,
  //     assetOut: tokenOut,
  //     amount: amountIn,
  //     userData: "0x",
  //   };
  const funds = {
    sender: "0x0000000000000000000000000000000000000000", // Dummy address, not used in 'view' functions
    recipient: "0x0000000000000000000000000000000000000000", // Dummy address, not used in 'view' functions
    fromInternalBalance: false,
    toInternalBalance: false,
  };
  // Call the `queryBatchSwap` function
  try {
    const amounts = await balancerVault.callStatic.queryBatchSwap(
      0, // SwapType.SwapExactIn
      swaps,
      [tokenIn, tokenOut],
      funds
    );
    const result = ethers.utils.formatUnits(amounts[1].toString(), 18) * -1;
    console.log("result: ", result);
    return result;
  } catch (error) {
    console.error("Error:", error);
  }
}

// Example usage
const poolId =
  "0x3fa8c89704e5d07565444009e5d9e624b40be813000000000000000000000599"; // Replace with the actual pool ID
//GHO to LUSD
const tokenInAddress = "0x40D16FC0246aD3160Ccc09B8D0D3A2cD28aE6C2f"; // Replace with the address of Token A
const tokenOutAddress = "0x5f98805A4E8be255a32880FDeC7F6728C6568bA0"; // Replace with the address of Token B
const amountIn = ethers.utils.parseUnits("1", 18); // Replace '1.0' with the amount of Token A and '18' with its decimals

getAmountOut(poolId, tokenInAddress, tokenOutAddress, amountIn)
  .then((amountOut) => console.log(`Amount of Token B: ${amountOut}`))
  .catch((error) => console.error(error));
