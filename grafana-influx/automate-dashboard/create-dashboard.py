# import requests
# import os
# from dotenv import load_dotenv

# load_dotenv()

# grafana_api_url = os.environ["GRAFANA_API_URL"]
# grafana_api_key = os.environ["GRAFANA_API_KEY"]

# file_name1 = "basic-health"
# flux_query_file1 = f"../flux-queries/{file_name1}.flux"
# with open(flux_query_file1, "r") as file:
#     flux_query1 = file.read()
#     flux_query2 = file.read()


# dashboard2 = {
#     "dashboard": {
#         "title": "Test Api Dashboard 2",
#     },
#     "folderId": 17,
#     "overwrite": False,
# }

# dashboard = {
#     "dashboard": {
#         "title": "Grafana API test Dashboard",
#         "panels": [
#             {
#                 "title": "Test Panel 1",
#                 "type": "graph",
#                 "datasource": "InfluxDB Datasource",
#                 "targets": [{"query": flux_query1}],
#             },
#             # {
#             #     "title": "Test Panel 2",
#             #     "type": "graph",
#             #     "datasource": "InfluxDB Datasource",
#             #     "targets": [{"query": flux_query2}],
#             # },
#         ],
#         # "templating": [
#         #     {
#         #         "name": "Example variable",
#         #         "type": "query",
#         #         "query": 'from(bucket: "redstone")'
#         #         "|> range(start: -1m)"
#         #         '|> filter(fn: (r) => r["_measurement"] == "dataPackages")'
#         #         '|> keep(columns: ["dataServiceId"])'
#         #         "|> group()"
#         #         '|> distinct(column: "dataServiceId")'
#         #         '|> yield(name: "dataServiceId")'
#         #         # "query": 'from(bucket: "telegraf/autogen") |> range(start: -1h) |> group() |> distinct(column: "host")'
#         #     }
#         # ],
#     },
#     "folderId": 17,
#     "overwrite": False,
# }

# https://oidc.eu-west-1.amazonaws.com/authorize?client_id
# redirect_uri=https%3A%2F%2Fg-770e483fc1.grafana-workspace.eu-west-1.amazonaws.com%2Fsso%2Ffederate&response_type=code&state=QUFBQURtdGxlUzB4TlRZNE9UVXhPREkzUEdtTm1wM25mUldjYldBa0VXbzhsVTdHR2VzRlpabGduSklpOEpXeDFZbGFfVlB1UWtOSHBmOHh5SzlRaEJTNjBxU1RjZi1RM2NkQmk0X3V6YjNtcm04MzcxUDZVQUYyN0ZjaG9vY1N4ODR5WU15aFF4dkgtS1NpOEoxekptVll2bXhqbVdfcWhrTGo1UVc3eE1Xck53a2ROQnZ2akY0R1FTbFVLVmlHSE9wWDJ4cjFMSEExVTR5cWo2QWVqWXhnbTZCNlNxdGJBSERpNExlZFNtaW5NNEFQRURLZWpuek0
# MSZQsnKDloF8Np6FmH2wdmV1LXdlc3QtMQ
# MSZQsnKDloF8Np6FmH2wdmV1LXdlc3QtMQ
# https://oidc.eu-west-1.amazonaws.com/authorize?client_id=MSZQsnKDloF8Np6FmH2wdmV1LXdlc3QtMQ

# headers = {
#     "Authorization": f"Bearer {grafana_api_key}",
#     "Content-Type": "application/json",
# }

# grafana_api_url += "/api/dashboards/db"

# response = requests.post(grafana_api_url, headers=headers, json=dashboard2)

# if response.status_code == 200:
#     print("Dashboard successfully created.")
# else:
#     print("Error while creating dashboard.")
#     print(response)


import requests, os
from dotenv import load_dotenv

load_dotenv()

grafana_api_url = os.environ["GRAFANA_API_URL"]
grafana_api_key = os.environ["GRAFANA_API_KEY"]

dashboard = {
    "dashboard": {
        "title": "Test Api Dashboard",
    },
    "folderId": 17,
    "overwrite": True,
}

headers = {
    "Authorization": f"Bearer {grafana_api_key}",
    "Content-Type": "application/json",
    "Accept": "application/json",
}

grafana_api_url += "/api/dashboards/db"

response = requests.post(grafana_api_url, headers=headers, json=dashboard)

if response.status_code == 200:
    print("Dashboard successfully created.")
else:
    print("Error while creating dashboard.")
    print(response)
