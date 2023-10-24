const ethers = require("ethers");

async function processBlocks(provider, startBlock, endBlock) {
  const blockPromises = [];
  for (let blockNumber = startBlock; blockNumber <= endBlock; blockNumber++) {
    const blockPromise = provider.getBlockWithTransactions(blockNumber);
    blockPromises.push(blockPromise);
  }
  const blocksData = await Promise.all(blockPromises);

  console.log(
    `Processed blocks from ${startBlock} to ${endBlock} for ${provider.connection.url}`
  );
  return blocksData;
}

exports.handler = async (event, context) => {
  // List of RPC URLs for the chains you want to sync
  const rpcUrls = [
    // "https://arbitrum-one.blastapi.io/6ebaff4b-205e-4027-8cdc-10c3bacc8abb",
    // "https://arb1.arbitrum.io/rpc",
    // "https://arb-mainnet-public.unifra.io",
    "https://arbitrum.meowrpc.com/",
  ];

  // Initialize InfluxDB or your preferred database connection here
  // const influx = new InfluxDB(...);
  const currentTime = new Date();
  console.log(`Starting sync process at ${currentTime}`);
  for (const rpcUrl of rpcUrls) {
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

    const latestBlockNumber = await provider.getBlockNumber();
    console.log(`Latest block number for ${rpcUrl}: ${latestBlockNumber}`);

    const startBlockNumber = latestBlockNumber - 300000; // TODO: save the last synced block number in your database
    const batchSize = 150;

    for (let i = startBlockNumber; i <= latestBlockNumber; i += batchSize) {
      const endBlock = Math.min(i + batchSize - 1, latestBlockNumber);
      const blocksData = await processBlocks(provider, i, endBlock);

      for (const blockData of blocksData) {
        //timestamp of block
        // console.log(blockData.timestamp);

        // console.log(`Processing block ${blockData.number}`);
        // console.log(`Block data: ${JSON.stringify(blockData, null, 2)}`);
        // break;
        // console.log(`Block data: ${blockData}`);
        for (const tx of blockData.transactions) {
          if (tx.data && tx.data.includes("0x000002ed57011e0000")) {
            // Transaction contains the specified marker
            const timestamp = new Date(blockData.timestamp * 1000); // Convert timestamp to Date

            console.log(`Transaction hash: ${tx.hash}`);
            console.log(`Transaction data: ${tx.data}`);
            console.log(`Transaction timestamp: ${timestamp}`);

            // Save block number, timestamp, and transaction data to InfluxDB
            // influx.writePoints([...]);

            // Or add the transaction to a list for further processing
          }
        }
      }
      const passedTime = (new Date() - currentTime) / 1000;
      console.log(`Time passed: ${passedTime}`);
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Sync process completed." }),
  };
};

exports.handler();

// Block data: {
//   "hash": "0x7821972504e0d726196ec6960f964c57eff6d6b970fd6375341305516de0a272",
//   "parentHash": "0xfad5e1c7ba4cbcc5d140ea2b9baea3e240f8a404ab101dbc92076d8c491d74c4",
//   "number": 143541689,
//   "timestamp": 1698151891,
//   "nonce": "0x0000000000116b64",
//   "difficulty": 1,
//   "gasLimit": {
//     "type": "BigNumber",
//     "hex": "0x04000000000000"
//   },
//   "gasUsed": {
//     "type": "BigNumber",
//     "hex": "0x1daa59"
//   },
//   "miner": "0xA4b000000000000000000073657175656e636572",
//   "extraData": "0x0ddabce0828433fbb434824cd41eb0203094ad8d95683076623e28e46a465dcd",
//   "transactions": [
//     {
//       "hash": "0xaef953d18efd79f05b32da14d3da22cc857fc3a5449c3f41dc1306dcfc9d4538",
//       "type": 106,
//       "accessList": null,
//       "blockHash": "0x7821972504e0d726196ec6960f964c57eff6d6b970fd6375341305516de0a272",
//       "blockNumber": 143541689,
//       "transactionIndex": 0,
//       "confirmations": 1,
//       "from": "0x00000000000000000000000000000000000A4B05",
//       "gasPrice": {
//         "type": "BigNumber",
//         "hex": "0x00"
//       },
//       "gasLimit": {
//         "type": "BigNumber",
//         "hex": "0x00"
//       },
//       "to": "0x00000000000000000000000000000000000A4B05",
//       "value": {
//         "type": "BigNumber",
//         "hex": "0x00"
//       },
//       "nonce": 0,
//       "data": "0x6bf6a42d0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000119120800000000000000000000000000000000000000000000000000000000088e45b90000000000000000000000000000000000000000000000000000000000000000",
//       "r": "0x0000000000000000000000000000000000000000000000000000000000000000",
//       "s": "0x0000000000000000000000000000000000000000000000000000000000000000",
//       "v": 0,
//       "creates": null,
//       "chainId": 42161
//     },
//     {
//       "hash": "0x325f1a37f5163e1fff710a6d2da2f3c4fc0b245436773e5bcccf856d66c3b1ab",
//       "type": 0,
//       "accessList": null,
//       "blockHash": "0x7821972504e0d726196ec6960f964c57eff6d6b970fd6375341305516de0a272",
//       "blockNumber": 143541689,
//       "transactionIndex": 1,
//       "confirmations": 1,
//       "from": "0x21C3de23d98Caddc406E3d31b25e807aDDF33633",
//       "gasPrice": {
//         "type": "BigNumber",
//         "hex": "0x07270e00"
//       },
//       "gasLimit": {
//         "type": "BigNumber",
//         "hex": "0xaa3dac"
//       },
//       "to": "0xD56e4eAb23cb81f43168F9F45211Eb027b9aC7cc",
//       "value": {
//         "type": "BigNumber",
//         "hex": "0x00"
//       },
//       "nonce": 400576,
//       "data": "0xb143044b000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000006e0000000000000000000000004d73adb72bc3dd368966edd0f0b2148401a178e200000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000006538123000000000000000000000000000000000000000000000000000000000000001600000000000000000000000000000000000000000000000000000000000000084704316e500000000000000000000000000000000000000000000000000000000000000b83da1354fb15b9890d3aa68626bb2457b2d6c61c8c1f51eb24dcea66f3dbe29f3000000000000000000000000000000000000000000000000000000000000000a3da1354fb15b9890d3aa68626bb2457b2d6c61c8c1f51eb24dcea66f3dbe29f300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008242c256e2ce230e77a106b196d7243ec5189420dafad9abe5d83b30f762ee299f2c0ef6194495bda7e52892e1a659841962670e3ab304c51f9414ae99b2fa278d1c66cbb2f7a046ee17ba9d09eec1f523747d81616c5f14e81805f50eadff9ce2b52ac51eaed4ce158a69906784c3ed6f338d4d8ae87e1fb2df90fccfb0125337071c000000000000000000000000000000000000000000000000000000000000",
//       "r": "0xd3fabeede895b802627f7becaa10385280a7b806c6e38bb90fe1c0607a176e3e",
//       "s": "0x021d441550d4d7abcbdff3169d0f4c36a31997e3c1e33f9afe48282975ed55db",
//       "v": 84357,
//       "creates": null,
//       "chainId": 42161
//     }
//   ],
//   "baseFeePerGas": {
//     "type": "BigNumber",
//     "hex": "0x05f5e100"
//   },
//   "_difficulty": {
//     "type": "BigNumber",
//     "hex": "0x01"
//   }
// }
