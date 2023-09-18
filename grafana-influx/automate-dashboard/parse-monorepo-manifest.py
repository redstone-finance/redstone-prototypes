import requests
import json

github_user = "redstone-finance"
github_repo = "redstone-oracles-monorepo"
directory_path = "packages/oracle-node/manifests/data-services"
api_url = f"https://api.github.com/repos/{github_user}/{github_repo}/contents/{directory_path}"
manifest_url_prefix = (
    f"https://github.com/{github_user}/{github_repo}/raw/main/{directory_path}/"
)


def get_tokens_from_manifest(json_file_name):
    manifest_url = f"{manifest_url_prefix}{json_file_name}"
    response = requests.get(manifest_url)
    manifest_data = response.json()

    tokens = manifest_data.get("tokens", {})
    token_names = list(tokens.keys())
    return token_names


def get_manifests_from_github():
    response = requests.get(api_url)

    if response.status_code == 200:
        content_data = response.json()

        json_file_names = [
            item["name"] for item in content_data if item["name"].endswith(".json")
        ]

        return json_file_names
    else:
        print("Cannot get content from GitHub API")


json_file_names = get_manifests_from_github()

filenames_with_tokens = {}
for file_name in json_file_names:
    name_without_extension = file_name.split(".")[0]
    filenames_with_tokens[name_without_extension] = get_tokens_from_manifest(file_name)

# print(filenames_with_tokens)

data_service_ids = list(filenames_with_tokens.keys())

data_service_id_variable = {
    "name": "dataServiceId",
    "type": "custom",
    "options": data_service_ids,
    "query": "your_query_here",  # maybe not needed
}

data_feed_ids = []
for data_service_id in data_service_ids:
    data_feed_ids.extend(filenames_with_tokens[data_service_id])
    # data_feed_ids = filenames_with_tokens.get(data_service_id, [])

    data_feed_id_variable = {
        "name": "dataFeedId",
        "type": "custom",
        "options": data_feed_ids,
        "query": "your_query_here",  # maybe not needed
    }
    data_feed_ids.append(data_feed_id_variable)

print(data_service_id_variable)
print(data_feed_ids)

import requests
import json

grafana_api_url = "http://localhost:3000/api"  
grafana_api_key = "YOUR_API_KEY" 
headers = {
    "Authorization": f"Bearer {grafana_api_key}",
    "Content-Type": "application/json",
}

def create_or_update_variables(variables):
    # Endpoint do tworzenia lub aktualizacji zmiennych
    variable_url = f"{grafana_api_url}/variables"

    for variable in variables:
        response = requests.post(variable_url, headers=headers, json=variable)

        if response.status_code == 200:
            print(f"Variable {variable['name']} created/updated successfully.")
        else:
            print(f"Failed to create/update variable {variable['name']}.")

# Przykład zmiennych
data_service_id_variable = {
    "name": "dataServiceId",
    "type": "custom",
    "options": data_service_ids,
    "query": "your_query_here", 
}

data_feed_variables = []

for data_service_id in data_service_ids:
    data_feed_ids = filenames_with_tokens.get(data_service_id, [])
    data_feed_variable = {
        "name": f"dataFeedId_{data_service_id}",
        "type": "custom",
        "options": data_feed_ids,
        "query": "your_query_here",
    }
    data_feed_variables.append(data_feed_variable)

all_variables = [data_service_id_variable] + data_feed_variables

create_or_update_variables(all_variables)




# import requests

# grafana_url = "https://g-770e483fc1.grafana-workspace.eu-west-1.amazonaws.com"
# api_key = "your_api_key_here"

# # Ustawienia zmiennych
# data_service_variable_id = 1  # ID zmiennej "dataServiceId" w Grafanie
# data_feed_variable_id = 2  # ID zmiennej "dataFeedId" w Grafanie

# # Nowe wartości zmiennych
# new_data_service_ids = [1, 2, 3]  # Zaktualizowane identyfikatory data service
# new_data_feed_ids = [4, 5, 6]  # Zaktualizowane identyfikatory data feed

# # Aktualizacja zmiennych na dashboardzie w Grafanie
# headers = {"Authorization": f"Bearer {api_key}"}
# data = {
#     "value": new_data_service_ids,  # Nowa wartość zmiennej "dataServiceId"
#     "global": True,  # Globalna zmiana, dotyczy całego dashboardu
# }
# response = requests.post(
#     f"{grafana_url}/api/variables/{data_service_variable_id}/values",
#     headers=headers,
#     json=data,
# )

# # Analogicznie zaktualizuj zmienną "dataFeedId" w Grafanie

# # Sprawdź odpowiedź od API Grafany i obsłuż ewentualne błędy
# if response.status_code == 200:
#     print("Zmienne zaktualizowane pomyślnie")
# else:
#     print("Błąd podczas aktualizacji zmiennych:", response.text)
