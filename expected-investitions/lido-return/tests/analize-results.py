import pandas as pd


def find_decreasing_values(file_path):
    df = pd.read_csv(file_path)
    df["EndTime"] = pd.to_datetime(df["EndTime"])

    for i in range(len(df) - 1):
        current_row = df.iloc[i]
        next_row = df.iloc[i + 1]

        if current_row["Value"] > next_row["Value"] and next_row["EndTime"].hour != 12:
            print(f"Index: {i}, EndDate bellow: {next_row['EndTime']}")


file_path = "lido-ratio-1h3Y.csv"
find_decreasing_values(file_path)
