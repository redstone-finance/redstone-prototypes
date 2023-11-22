const ethers = require("ethers");
const MANTA_RPC = "https://pacific-rpc.manta.network/http";
const walletAddress = "0x400f93f5c3a76F5819a1Ca9e697545Abe44eF2e6";

async function checkBalance(walletAddress) {
  const provider = new ethers.providers.JsonRpcProvider(MANTA_RPC);
  const balance = await provider.getBalance(walletAddress);
  console.log("Balance:", ethers.utils.formatEther(balance));
}

function getWalletFromPrivateKey(privateKey, rpcUrl) {
  return new ethers.Wallet(privateKey, rpcUrl);
}

function createWalletWithProvider(rpcUrl) {
  // const wallet = ethers.Wallet.createRandom().connect(rpcUrl);
  const wallet = getWalletFromPrivateKey(
    ethers.Wallet.createRandom().privateKey,
    rpcUrl
  );

  console.log("Wallet address:", wallet.address);
  console.log("Wallet private key:", wallet.privateKey);
}

// createWalletWithProvider(MANTA_RPC);
// checkBalance(walletAddress);

