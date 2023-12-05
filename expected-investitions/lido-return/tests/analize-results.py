import pandas as pd


def find_decreasing_values(file_path):
    shift = 2
    df = pd.read_csv(file_path)
    df["EndTime"] = pd.to_datetime(df["EndTime"])

    prev_update = 20
    for i in range(len(df) - 1):
        current_row = df.iloc[i]
        next_row = df.iloc[i + 1]

        if current_row["Value"] < next_row["Value"]:
            print(f"ERROR Index: {i+shift}, EndDate above: {next_row['EndTime']}")

        if current_row["Value"] > next_row["Value"]:
            if prev_update < 20:
                print(f"ERROR: prev_update < 20h Index: {i+shift}, EndDate above: {next_row['EndTime']}")
            prev_update = 0
            if next_row["EndTime"].hour != 12:
                print(f"Not between 12:00-1:00 PM Index: {i+shift}, EndDate bellow: {next_row['EndTime']}")

        prev_update += 1


file_path = "lido-ratio-1h3Y.csv"
find_decreasing_values(file_path)
