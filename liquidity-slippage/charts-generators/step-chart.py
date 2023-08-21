import os
import pandas as pd
import matplotlib.pyplot as plt

path = "../results/stepSlippage.csv"
prices = [i/1000 for i in range(1, 1001)]
prices[-1] = 1

def read_data_from_csv(file_path):
    try:
        df = pd.read_csv(file_path)
        return df
    except FileNotFoundError:
        print(f"File {file_path} not found.")
        return None

def toggle_visibility(event, line):
    line.set_visible(not line.get_visible())
    plt.draw()

def generate_plots(df, current_script_directory):
    if df is None or df.empty:
        print("No data to generate plots.")
        return
    
    dex_list = df['DEX'].unique()

    for dex in dex_list:
        dex_data = df[df['DEX'] == dex]
        token_pairs = dex_data[['TokenA', 'TokenB']].drop_duplicates()

        plt.figure(figsize=(10, 6))
        plt.title(f"Slippage Analysis for DEX: {dex}")
        plt.xlabel("Price")
        plt.ylabel("Effective Slippage (%)")

        lines = []

        for index, row in token_pairs.iterrows():
            token_a = row['TokenA']
            token_b = row['TokenB']
            
            pair_data = dex_data[(dex_data['TokenA'] == token_a) & (dex_data['TokenB'] == token_b)]
            col_names_buy = [f"Slip{price}BtoA" for price in prices]
            col_names_sell = [f"Slip{price}AtoB" for price in prices]
            buy_slippages = pair_data[col_names_buy].iloc[0]
            sell_slippages = pair_data[col_names_sell].iloc[0]

            line_buy, = plt.plot(prices, buy_slippages, label=f"Buy - {token_a}/{token_b}")
            line_sell, = plt.plot(prices, sell_slippages, label=f"Sell - {token_a}/{token_b}")
            lines.append((line_buy, line_sell))

            line_buy.set_picker(True) 
            line_sell.set_picker(True) 

            plt.legend()

        # Toggle visibility of lines
        plt.gcf().canvas.mpl_connect('pick_event', lambda event: toggle_visibility(event, event.artist))

        plt.grid(True)
        # plt.show()

        file_path = os.path.join(current_script_directory, f"results/slippage_chart_{dex}.png")
        plt.savefig(file_path)
        plt.close()

if __name__ == "__main__":
    current_script_path = os.path.abspath(__file__)
    current_script_directory = os.path.dirname(current_script_path)
    file_path = os.path.join(current_script_directory, path)
    df = read_data_from_csv(file_path)
    generate_plots(df, current_script_directory)
