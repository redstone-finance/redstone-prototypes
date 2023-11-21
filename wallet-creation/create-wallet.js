const ethers = require("ethers");
const MANTA_RPC = "https://pacific-rpc.manta.network/http";

function createMantaWallet(rpcUrl) {
  const wallet = new ethers.Wallet(
    ethers.Wallet.createRandom().privateKey,
    rpcUrl
  );
  console.log("Wallet address:", wallet.address);
  console.log("Wallet private key:", wallet.privateKey);
}

createMantaWallet(MANTA_RPC);
