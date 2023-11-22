const networks = [
  {
    chainName: "arbitrum",
    rpcUrl: "https://arbitrum.meowrpc.com/",
  },
  {
    chainName: "ethereum",
    rpcUrl: "https://rpc.builder0x69.io",
  },
  {
    chainName: "avalanche",
    rpcUrl: "https://api.avax.network/ext/bc/C/rpc",
  },
  //TODO: add more chains and replace rpcUrls in above to better ones
];

module.exports = {
  networks,
};
