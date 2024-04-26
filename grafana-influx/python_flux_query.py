from influxdb_client import InfluxDBClient, Point
from influxdb_client.client.write_api import SYNCHRONOUS
import os, sys, time
from dotenv import load_dotenv
import csv

load_dotenv()

influxdb_url = os.environ["INFLUXDB_URL"]
org = os.environ["INFLUXDB_ORG"]
token = os.environ["INFLUXDB_TOKEN"]

timeout = 5 * 60 * 1000  # 5 minutes

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

times = []
values = []

for table in result:
    for record in table.records:
        times.append(record.values["_time"])
        values.append(record.values["_value"])
        # if record.values["_field"] == "value":
        #     continue
        # print (record.values)
        # for key in record.values.keys():
        #     print(f"{key}: {record.values[key]}")
        #     if key == "_value":
        #         print(f"{key}: {record.values[key]}")
        # print(f"-------------------")
        # break
    # break

# print("Times:", times)
# print("Values:", values)

twaps = [0, 30*6, 60*6, 120*6]
for twap in twaps:
    avg_values = []
    for i in range(len(values)):
        start_idx = max(0, i - twap)
        avg_value = sum(values[start_idx:i + 1]) / (i - start_idx + 1)
        avg_values.append(avg_value)

    file_path = f"ezETHtwap{int(twap/6)}.csv"
    if(twap == 0):
        file_path = "ezETHbase.csv"
    with open(file_path, mode='w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(["Time", "Value"])
        for i in range(len(times)):
            writer.writerow([times[i], avg_values[i]])

client.close()
print(f"Query execution time: {execution_time:.2f} seconds")
