from influxdb_client import InfluxDBClient, Point
from influxdb_client.client.write_api import SYNCHRONOUS
import os, sys, time
from dotenv import load_dotenv

load_dotenv()

influxdb_url = os.environ["INFLUXDB_URL"]
org = os.environ["INFLUXDB_ORG"]
token = os.environ["INFLUXDB_TOKEN"]

timeout = 3 * 60 * 1000  # 3 minutes

if len(sys.argv) < 2:
    print("Usage: python3 python_flux_query.py <query_file>")
    sys.exit(1)
flux_query_file = f"flux-queries/{sys.argv[1]}.flux"


with open(flux_query_file, "r") as file:
    flux_query = file.read()

client = InfluxDBClient(url=influxdb_url, org=org, token=token, timeout=timeout)

query_api = client.query_api()

start_time = time.time()
result = query_api.query(org=org, query=flux_query)
end_time = time.time()
execution_time = end_time - start_time

for table in result:
    for record in table.records:
        # if record.values["_field"] == "value":
        #     continue
        # print (record.values)
        for key in record.values.keys():
            print(f"{key}: {record.values[key]}")
        print(f"-------------------")
        # break
    # break

client.close()
print(f"Query execution time: {execution_time:.2f} seconds")
