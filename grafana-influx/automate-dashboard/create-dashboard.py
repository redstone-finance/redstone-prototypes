import requests, os, re
from dotenv import load_dotenv

load_dotenv()

grafana_api_url = os.environ["GRAFANA_API_URL"]
grafana_api_key = os.environ["GRAFANA_API_KEY"]


panelFiles = ["basic-health", "advanced-health"]
queryVariableFiles = ["queryRelayerName", "queryDataServiceId", "queryFeedIdCommon"]
includeWindowPeriod = True
overwritePerviousDashboard = True


panelQueries = {}
for panelFile in panelFiles:
    panelFilePath = f"../flux-queries/{panelFile}.flux"
    with open(panelFilePath, "r") as file:
        panelQueries[panelFile] = file.read()

panels = []
for name, query in panelQueries.items():
    panel = {
        "title": name,
        "type": "timeseries",
        "datasource": "InfluxDB",
        "targets": [{"query": query}],
        "gridPos": {"x": 0, "y": 0, "w": 24, "h": 9},
    }
    panels.append(panel)


queryVariables = {}
for queryVariableFile in queryVariableFiles:
    queryVariableFilePath = f"../flux-queries/{queryVariableFile}.flux"
    with open(queryVariableFilePath, "r") as file:
        queryVariables[queryVariableFile] = file.read()

templating_variables = []
for name, query in queryVariables.items():
    label = " ".join(re.findall(r"[A-Z][a-z]*", name))
    templating_variable = {
        "datasource": "InfluxDB",
        "definition": f"Query {label} from DB",
        "includeAll": False,
        "label": label,
        "multi": False,
        "name": name,
        "query": query,
        "type": "query",
    }
    templating_variables.append(templating_variable)

window_period = {
    "current": {"text": "1h", "value": "1h"},
    "label": "window Period",
    "name": "windowPeriod",
    "query": "1h",
    "type": "textbox",
}

if includeWindowPeriod:
    templating_variables.append(window_period)


dashboard = {
    "dashboard": {
        "title": "Grafana API big",
        "panels": panels,
        "templating": {
            "list": templating_variables,
        },
        "time": {"from": "now-60d", "to": "now"},
    },
    "folderId": 17,
    "overwrite": overwritePerviousDashboard,
}

headers = {
    "Authorization": f"Bearer {grafana_api_key}",
    "Content-Type": "application/json",
}

grafana_api_url += "/api/dashboards/db"

response = requests.post(grafana_api_url, headers=headers, json=dashboard)

if response.status_code == 200:
    print("Dashboard successfully created.")
else:
    print("Error while creating dashboard.")
    print(response)
