import requests
import os
from dotenv import load_dotenv

load_dotenv()

grafana_api_url = os.environ["GRAFANA_API_URL"]
grafana_api_key = os.environ["GRAFANA_API_KEY"]
folder_name = "Damian Experiments"


def get_folder_id(folder_name):
    headers = {
        "Authorization": f"Bearer {grafana_api_key}",
        "Content-Type": "application/json",
    }
    response = requests.get(f"{grafana_api_url}/api/folders", headers=headers)

    if response.status_code == 200:
        folders = response.json()
        for folder in folders:
            if folder["title"] == folder_name:
                return folder["id"]
    return None


folder_id = get_folder_id(folder_name)

print(folder_id)
