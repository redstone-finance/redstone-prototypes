# Gas Costs Calculator

The Gas Costs Calculator is a script that allows you to calculate the cumulative gas costs of all the updates for a given contract address. It works on both the Arbitrum and Ethereum networks.

## Features

- Calculation of cumulative gas costs in ETH and USD for contract updates
- Support for both Arbitrum and Ethereum networks

## Prerequisites

Before running the script, make sure you have the following:

- Node.js installed on your machine
- API keys for Etherscan and Arbiscan (if you don't have them, sign up and obtain the keys)

## Configuration

To maintain the contracts configuration, a simple JSON config file is used. Create a file named `contracts.json` and define the contracts as follows:

```json
[
  {
    "name": "vesta",
    "address": "0x36497bcfea36a3ba831e8322cad35be1663d347c",
    "network": "arbitrum"
  },
  {
    "name": "swell",
    "address": "0x68ba9602B2AeE30847412109D2eE89063bf08Ec2",
    "network": "ethereum"
  }
]
```

Make sure to replace the `address` values with the actual contract addresses you want to calculate gas costs for. Specify the `network` as either "arbitrum" or "ethereum" based on the network the contract is deployed on.

## Usage

1. Clone the repository and navigate to the project directory.
2. Run `npm install` to install the required dependencies.
3. Create a `.env` file in the project directory and add the following environment variables:
   ```
   ETHERSCAN_API_KEY = <Your Etherscan API Key>
   ARBISCAN_API_KEY = <Your Arbiscan API Key>
   ```
   Make sure to replace `<Your Etherscan API Key>` and `<Your Arbiscan API Key>` with your actual API keys.
4. Run the script using the following command:
   ```
   node calculateGasCosts.js <contract-name>
   ```
   Replace `<contract-name>` with the name of the contract from the `contracts.json` file for which you want to calculate gas costs.

The script will calculate the cumulative gas costs of all the updates for the specified contract and display the results grouped by months. It will also provide the average number of transactions per day in each month.

Feel free to modify the `.env.example` file provided in the repository to create your `.env` file and customize the environment variables as needed.

**Note:** The gas costs will be displayed in ETH. Additionally, the script utilizes the Redstone API to provide gas costs in USD.

## License

This project is licensed under the MIT License. See the [LICENSE](../LICENSE) file for details.
