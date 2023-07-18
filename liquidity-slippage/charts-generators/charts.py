import os
import pandas as pd
import matplotlib.pyplot as plt
path = "../results/slippage.csv"

def read_data_from_csv(file_path):
    try:
        df = pd.read_csv(file_path)
        return df
    except FileNotFoundError:
        print(f"File {file_path} not found.")
        return None

def generate_plots(df):
    if df is None or df.empty:
        print("No data to generate plots.")
        return

    # Generating plot 1 - Price TokenA in TokenB
    plt.figure(figsize=(10, 6))
    plt.plot(df["DEX"], df["Price Token A in B"], marker="o", linestyle="-")
    plt.xlabel("DEX")
    plt.ylabel("Price TokenA in TokenB")
    plt.title("Price TokenA in TokenB for different DEX")
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.show()

    # Generating plot 2 - Price TokenB in TokenA
    plt.figure(figsize=(10, 6))
    plt.plot(df["DEX"], df["Price Token B in A"], marker="o", linestyle="-")
    plt.xlabel("DEX")
    plt.ylabel("Price TokenB in TokenA")
    plt.title("Price TokenB in TokenA for different DEX")
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.show()

    # Generating plot 3 - Pool Size
    plt.figure(figsize=(10, 6))
    plt.bar(df["DEX"], df["Pool Size"])
    plt.xlabel("DEX")
    plt.ylabel("Pool Size")
    plt.title("Pool Size for different DEX")
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.show()

    # Generating plot 4 - Slippages
    plt.figure(figsize=(10, 6))
    plt.plot(df["DEX"], df["Slip 10e-4"], marker="o", linestyle="-", label="Slip 10e-4")
    plt.plot(df["DEX"], df["Slip 10e-6"], marker="o", linestyle="-", label="Slip 10e-6")
    plt.plot(df["DEX"], df["Slip 10e-8"], marker="o", linestyle="-", label="Slip 10e-8")
    plt.xlabel("DEX")
    plt.ylabel("Slippage")
    plt.title("Slippages for different DEX")
    plt.legend()
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.show()

if __name__ == "__main__":
    current_script_path = os.path.abspath(__file__)
    current_script_directory = os.path.dirname(current_script_path)
    file_path = os.path.join(current_script_directory, path)
    df = read_data_from_csv(file_path)
    generate_plots(df)
