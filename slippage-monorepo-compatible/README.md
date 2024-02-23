# Slippage Analysis Tool

This project is designed to analyze slippage on various decentralized exchanges (DEXs) within the Ethereum ecosystem. It leverages the `redstone-api` and other libraries to fetch pool data, calculate slippage, and generate comprehensive reports.

## Getting Started

### Prerequisites

- Node.js (recommended version 14 or higher)
- npm (comes with Node.js)

### Setup

1. Clone the repository and navigate into the `redstone-prototypes` directory:

```bash
cd home/
git clone [URL_TO_REDSTONE_MONOREPO_PRIV]
git clone [URL_TO_REDSTONE_PROTOTYPES]
cd redstone-prototypes/
```

2. Install the required npm packages:

```bash
npm install
```

3. Configure your environment variables:

Copy the `.env.example` file to a new file named `.env` and fill in the required API keys and settings.

Example `.env` content:

```plaintext
RESULTS_VERSION="2"
INFURA_PROJECT_ID="your_infura_project_id_here"
```

Replace `"your_infura_project_id_here"` with your actual Infura project ID and add

### Running the Scripts

To run a specific script (e.g., `curve.js`):

```bash
node fetchers/curve.js
```

To run the entire analysis and generate reports for all configured DEXs:

```bash
npm start
```

This command sequentially executes all scripts in the `fetchers` and `results-aggregators` directories, generating new folders and CSV files for each DEX.

### Project Structure

- `fetchers/`: Contains scripts to fetch pool data from various DEXs.
- `results-aggregators/`: Contains scripts to process fetched data and generate reports.
- `utils/`: Contains utility functions used by the fetchers and results aggregators.
- `testers/`: Contains scripts to test the fetchers and results aggregators.
- `results-csv-VERSION/`: Contains the generated CSV files for each DEX.
- `.env`: Configuration file for environment variables.
- `package.json`: Defines npm dependencies and scripts for the project.
- `README.md`: Project documentation.
- `runScripts.js`: Script to run all fetchers and results aggregators sequentially.

## Contributing

Contributions to improve the tool are welcome. Please consider submitting a pull request or opening an issue for any bugs or feature suggestions.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
