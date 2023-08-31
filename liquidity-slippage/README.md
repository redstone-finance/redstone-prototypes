# Liquidity - Slippage correlation

How easy is to manipulate the pools on different DEXes? How much slippage can be caused by a single transaction? How much liquidity is needed to cause a significant slippage? This repository contains a set of scripts that can be used to answer these questions.

## Usage and Installation

Use the following command to install the dependencies:

```bash
npm start
```

To generate a new set of data, change the parameters in the script file (change DATA_INDEX to a new value) and run the script with the following command:

```bash
node scripts/curve-slip.js
```

Feel free to replace curve-slip.js with any other script from the scripts folder.

To generate charts run the following command:

```bash
python3 charts-generators/step-chart.py
```

Use -s flag in command above to show interactive plots.

## Results

The CSV results of the scripts are stored in the results folder. After generating plots can be found in charts-generators/results2 location.

## Contributions

Contributions to this repository are welcome. If you would like to contribute by adding new prototypes, programs, or scripts, please fork the repository and submit a pull request with your changes.

## License

This repository is licensed under the MIT License. See the [LICENSE](LICENSE) file for more information.

For more information about Redstone Finance and its projects, visit the [Redstone Finance GitHub](https://github.com/redstone-finance) page.
