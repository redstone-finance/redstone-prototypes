# InfluxDB Flux Query Python Script

This Python script is designed to run InfluxDB Flux queries from the command line. It reads Flux query commands from a file, executes them against an InfluxDB instance, and prints the query results.

## Prerequisites

Before you can use this script, make sure you have the following prerequisites installed:

- Python 3.x
- InfluxDB Python Client (`influxdb-client`)
- Python `dotenv` library (for loading environment variables)

You can install the required libraries using pip:

```bash
pip install influxdb-client python-dotenv
```

## Usage

To use this script, follow these steps:

1. Clone or download this repository to your local machine.

2. Create a `.env` file in the project directory and define the following environment variables:

   - `INFLUXDB_URL`: The URL of your InfluxDB instance.
   - `INFLUXDB_ORG`: The name of your InfluxDB organization.
   - `INFLUXDB_TOKEN`: The authentication token for accessing InfluxDB.

3. Create a Flux query file with your Flux query commands. The file should be saved in the `flux-queries` directory. For example, you can create a file named `my_query.flux` in the `flux-queries` directory.

4. Run the script with the following command, providing the query file as an argument:

   ```bash
   python3 python_flux_query.py my_query
   ```

   Replace `my_query` with the name of your Flux query file (without the `.flux` extension).

5. The script will read the query from the file, execute it against InfluxDB, and print the query results.

## Example

Here is an example of how to use the script:

Suppose you have a Flux query file named `my_query.flux` in the `flux-queries` directory. You can run the script as follows:

```bash
python3 python_flux_query.py my_query
```

The script will execute the Flux query defined in `my_query.flux` against your InfluxDB instance and display the results in the terminal.

Feel free to customize the script and Flux queries according to your specific requirements.
