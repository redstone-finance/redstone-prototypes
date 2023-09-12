from influxdb_client import InfluxDBClient, Point
from influxdb_client.client.write_api import SYNCHRONOUS
import os
from dotenv import load_dotenv

load_dotenv()

influxdb_url = os.environ["INFLUXDB_URL"]
org = os.environ["INFLUXDB_ORG"]
token = os.environ["INFLUXDB_TOKEN"]

timeout = 100000 # 100 seconds

with open('query.flux', 'r') as file:
    flux_query = file.read()

client = InfluxDBClient(url=influxdb_url, org=org, token=token, timeout=timeout)

query = flux_query

query_api = client.query_api()
result = query_api.query(org=org, query=query)

for table in result:
    for record in table.records:
        print(f"Another Record:")
        # print (record.values)
        for key in record.values.keys():
            print(f"{key}: {record.values[key]}")

client.close()
