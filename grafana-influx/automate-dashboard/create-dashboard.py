import requests
import json
import os, sys
from dotenv import load_dotenv

load_dotenv()

grafana_api_url = os.environ["GRAFANA_API_URL"]
grafana_api_key = os.environ["GRAFANA_API_KEY"]


# # Definicja dashboardu w formie JSON z użyciem .flux
# dashboard = {
#     "dashboard": {
#         "title": "InfluxDB Dashboard",
#         "panels": [
#             {
#                 "title": "CPU Usage",
#                 "type": "graph",
#                 "datasource": "InfluxDB Datasource",
#                 "targets": [
#                     {
#                         "query": 'from(bucket: "telegraf/autogen") '
#                                   '|> range(start: v.timeRangeStart, stop: v.timeRangeStop) '
#                                   '|> filter(fn: (r) => r._measurement == "cpu" and r._field == "usage_system" and r.host =~ /^$host$/) '
#                                   '|> mean()'
#                     }
#                 ]
#             },
#             {
#                 "title": "Memory Usage",
#                 "type": "graph",
#                 "datasource": "InfluxDB Datasource",
#                 "targets": [
#                     {
#                         "query": 'from(bucket: "telegraf/autogen") '
#                                   '|> range(start: v.timeRangeStart, stop: v.timeRangeStop) '
#                                   '|> filter(fn: (r) => r._measurement == "mem" and r._field == "used_percent" and r.host =~ /^$host$/) '
#                                   '|> mean()'
#                     }
#                 ]
#             }
#         ],
#         "templating": [
#             {
#                 "name": "host",
#                 "type": "query",
#                 "query": 'from(bucket: "telegraf/autogen") |> range(start: -1h) |> group() |> distinct(column: "host")'
#             }
#         ]
#     },
#     "overwrite": False
# }

# # Tworzenie dashboardu za pomocą API Grafany
# headers = {
#     "Authorization": f"Bearer {GRAFANA_API_KEY}",
#     "Content-Type": "application/json"
# }

# response = requests.post(GRAFANA_API_URL, headers=headers, json=dashboard)

# if response.status_code == 200:
#     print("Dashboard został utworzony.")
# else:
#     print("Wystąpił problem podczas tworzenia dashboardu.")
