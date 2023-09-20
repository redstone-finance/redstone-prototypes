import requests
import os
from dotenv import load_dotenv

load_dotenv()

grafana_api_url = os.environ["GRAFANA_API_URL"]
grafana_api_key = os.environ["GRAFANA_API_KEY"]

headers = {
    "Authorization": f"Bearer {grafana_api_key}",
    "Content-Type": "application/json",
}

response = requests.get(f"{grafana_api_url}/api/dashboards/db", headers=headers)

if response.status_code == 200:
    dashboard_data = response.json()
    print("Dashboard list:")
    print(dashboard_data)
    for dashboard in dashboard_data:
        dashboard_id = dashboard["id"]
        dashboard_title = dashboard["title"]
        print(f"Dashboard ID: {dashboard_id}, Title: {dashboard_title}")
else:
    print("Failed to retrieve dashboard list")


dashboard_id_to_check = 17

response = requests.get(f"{grafana_api_url}/dashboards/{dashboard_id_to_check}/permissions", headers=headers)

if response.status_code == 200:
    permissions_data = response.json()
    print("Permissions for Dashboard:")
    print(permissions_data)
else:
    print(f"Failed to retrieve permissions for Dashboard ID {dashboard_id_to_check}")
