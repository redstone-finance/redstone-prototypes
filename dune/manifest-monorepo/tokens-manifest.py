import os
import json
import csv

repo_path = "../../../redstone-monorepo-priv/"
folder_path = "packages/on-chain-relayer/relayer-manifests"
output_csv_file = "tokens_in_manifest.csv"


def extract_price_feed_keys(data):
    keys = []
    if "priceFeeds" in data:
        keys.extend(data["priceFeeds"].keys())
    return keys


keys_list = []
for filename in os.listdir(f"{repo_path}{folder_path}"):
    if filename.endswith(".json"):
        with open(f"{repo_path}{folder_path}/{filename}", "r") as file:
            data = json.load(file)
            keys_list.extend(extract_price_feed_keys(data))


existing_tokens = set()
if os.path.exists(output_csv_file):
    with open(output_csv_file, mode="r") as existing_csv_file:
        reader = csv.reader(existing_csv_file)
        next(reader)
        existing_tokens = set(row[0] for row in reader)

new_tokens = set(keys_list) - existing_tokens
with open(output_csv_file, mode="a", newline="") as csv_file:
    writer = csv.writer(csv_file)
    for new_token in new_tokens:
        writer.writerow([new_token])

print(f"Written {len(new_tokens)} new tokens to {output_csv_file}")
