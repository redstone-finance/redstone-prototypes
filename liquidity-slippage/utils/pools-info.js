const poolsInfo = {
  "Uniswap V3": [
    {
      poolAddress: "0x9a772018fbd77fcd2d25657e5c547baff3fd7d16",
      cryptoASymbol: "WBTC",
      cryptoBSymbol: "USDC",
      fee: (0.05 / 100) * 1e6,
    },
    {
      poolAddress: "0x11950d141ecb863f01007add7d1a342041227b58",
      cryptoASymbol: "PEPE",
      cryptoBSymbol: "WETH",
      fee: (0.3 / 100) * 1e6,
    },
    {
      poolAddress: "0x127452f3f9cdc0389b0bf59ce6131aa3bd763598",
      cryptoASymbol: "SOL",
      cryptoBSymbol: "WETH",
      fee: (0.3 / 100) * 1e6,
    },
    {
      poolAddress: "0xa344855388c9f2760e998eb2207b58de6e7d0360",
      cryptoASymbol: "ALPH",
      cryptoBSymbol: "USDT",
      fee: (1 / 100) * 1e6,
    },
    {
      poolAddress: "0x59354356ec5d56306791873f567d61ebf11dfbd5",
      cryptoASymbol: "ARB",
      cryptoBSymbol: "WETH",
      fee: (0.3 / 100) * 1e6,
    },
  ],
  "Uniswap V2": [
    {
      poolAddress: "0xa7480aafa8ad2af3ce24ac6853f960ae6ac7f0c4",
      cryptoASymbol: "ATOR",
      cryptoBSymbol: "WETH",
    },
    {
      poolAddress: "0x2a6c340bcbb0a79d3deecd3bc5cbc2605ea9259f",
      cryptoASymbol: "$PAAL",
      cryptoBSymbol: "WETH",
    },
    {
      poolAddress: "0x8c894d91748a42fc68f681090db06720779a7347",
      cryptoASymbol: "RSTK",
      cryptoBSymbol: "WETH",
    },
    {
      poolAddress: "0x6577ecf1a0d82659d5d892b76d2a8e902fb1f31b",
      cryptoASymbol: "$Reach",
      cryptoBSymbol: "WETH",
    },
  ],
  SushiSwap: [
    {
      poolAddress: "0xc3f279090a47e80990fe3a9c30d24cb117ef91a8",
      cryptoASymbol: "ALCX",
      cryptoBSymbol: "WETH",
    },
    {
      poolAddress: "0xc40d16476380e4037e6b1a2594caf6a6cc8da967",
      cryptoASymbol: "LINK",
      cryptoBSymbol: "WETH",
    },
    {
      poolAddress: "0x3d3f13f2529ec3c84b2940155effbf9b39a8f3ec",
      cryptoASymbol: "THOR",
      cryptoBSymbol: "WETH",
    },
    {
      poolAddress: "0xa914a9b9e03b6af84f9c6bd2e0e8d27d405695db",
      cryptoASymbol: "FOLD",
      cryptoBSymbol: "WETH",
    },
    {
      poolAddress: "0xd75ea151a61d06868e31f8988d28dfe5e9df57b4",
      cryptoASymbol: "AAVE",
      cryptoBSymbol: "WETH",
    },
    {
      poolAddress: "0x05767d9ef41dc40689678ffca0608878fb3de906",
      cryptoASymbol: "CVX",
      cryptoBSymbol: "WETH",
    },
  ],
  Curve: [
    // {
    //   poolAddress: "0x9d8108ddd8ad1ee89d527c0c9e928cb9d2bba2d3",
    //   cryptoASymbol: "mkUSD",
    //   cryptoBSymbol: "PRISMA",
    // },
    // {
    //   poolAddress: "0x6bfe880ed1d639bf80167b93cc9c56a39c1ba2dc",
    //   cryptoASymbol: "MATIC",
    //   cryptoBSymbol: "WETH",
    // },
    // {
    //   poolAddress: "0x9409280dc1e6d33ab7a8c6ec03e5763fb61772b5",
    //   cryptoASymbol: "LDO",
    //   cryptoBSymbol: "WETH",
    // },
    {
      poolAddress: "0x3b21c2868b6028cfb38ff86127ef22e68d16d53b",
      cryptoASymbol: "PRISMA",
      cryptoBSymbol: "cvxPrisma",
    },
    // {
    //   poolAddress: "0x752ebeb79963cf0732e9c0fec72a49fd1defaeac",
    //   cryptoASymbol: "T",
    //   cryptoBSymbol: "WETH",
    // },
    {
      poolAddress: "0x9978c6b08d28d3b74437c917c5dd7c026df9d55c",
      cryptoASymbol: "LUSD",
      cryptoBSymbol: "crvUSD",
    },
  ],
  "Balancer V2": [
    // {
    //   poolAddress: "0x3fa8c89704e5d07565444009e5d9e624b40be813",
    //   poolId:
    //     "0x3fa8c89704e5d07565444009e5d9e624b40be813000000000000000000000599",
    //   cryptoASymbol: "GHO",
    //   cryptoAIndex: 0,
    //   cryptoBSymbol: "LUSD",
    //   cryptoBIndex: 1,
    //   tokenAddresses: [
    //     "0x40D16FC0246aD3160Ccc09B8D0D3A2cD28aE6C2f",
    //     "0x5f98805A4E8be255a32880FDeC7F6728C6568bA0",
    //   ],
    // },
    // {
    //   poolAddress: "0x8353157092ed8be69a9df8f95af097bbf33cb2af",
    //   poolId:
    //     "0x8353157092ed8be69a9df8f95af097bbf33cb2af0000000000000000000005d9",
    //   cryptoASymbol: "GHO",
    //   cryptoAIndex: 0,
    //   cryptoBSymbol: "USDT",
    //   cryptoBIndex: 1,
    //   tokenAddresses: [
    //     "0x40D16FC0246aD3160Ccc09B8D0D3A2cD28aE6C2f",
    //     "0xdac17f958d2ee523a2206206994597c13d831ec7",
    //   ],
    // },
    {
      poolId: "0x8353157092ed8be69a9df8f95af097bbf33cb2af0000000000000000000005d9",
      cryptoASymbol: "GHO",
      cryptoBSymbol: "USDC",
    }

    //     USDT: {
    //   GHO: {
    //     baseTokenDecimals: 18,
    //     pairedTokenDecimals: 6,
    //     swaps: [
    //       {
    //         poolId:
    //           "0x8353157092ed8be69a9df8f95af097bbf33cb2af0000000000000000000005d9",
    //         assetInIndex: 0,
    //         assetOutIndex: 1,
    //         amount: BIGGER_AMOUNT.toString(),
    //         userData: "0x",
    //       },
    //     ],
    //     tokenAddresses: [
    //       "0x40d16fc0246ad3160ccc09b8d0d3a2cd28ae6c2f",
    //       "0xdac17f958d2ee523a2206206994597c13d831ec7",
    //     ],
    //   },
    // },
    // {
    //   poolAddress: "0x3fa8c89704e5d07565444009e5d9e624b40be813",
    //   cryptoASymbol: "GHO",
    //   cryptoBSymbol: "LUSD",
    // },
    // {
    //   poolAddress: "0x3fa8c89704e5d07565444009e5d9e624b40be813",
    //   cryptoASymbol: "GHO",
    //   cryptoBSymbol: "LUSD",
    // },
    // {
    //   poolAddress: "0x3fa8c89704e5d07565444009e5d9e624b40be813",
    //   cryptoASymbol: "GHO",
    //   cryptoBSymbol: "LUSD",
    // },
    // {
    //   poolAddress: "0x3fa8c89704e5d07565444009e5d9e624b40be813",
    //   cryptoASymbol: "GHO",
    //   cryptoBSymbol: "LUSD",
    // },
  ],

  // Add more DEX and pools as needed
};

module.exports = {
  poolsInfo,
};
