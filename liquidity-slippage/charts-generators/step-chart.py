import os
import pandas as pd
import matplotlib.pyplot as plt
import sys

path = "../results/step2Slippage.csv"
prices = [i/1000 for i in range(1, 2001)]
prices = [int(i) if i.is_integer() else i for i in prices]

graphs = {}

def read_data_from_csv(file_path):
    try:
        df = pd.read_csv(file_path)
        return df
    except FileNotFoundError:
        print(f"File {file_path} not found.")
        return None

def on_pick(event):
    legend = event.artist
    isVisible = legend.get_visible()
    graphs[legend].set_visible(not isVisible)
    legend.set_visible(not isVisible)
    plt.draw()

def generate_plots(df, current_script_directory):
    if df is None or df.empty:
        print("No data to generate plots.")
        return
    
    dex_list = df['DEX'].unique()

    for dex in dex_list:
        dex_data = df[df['DEX'] == dex]
        token_pairs = dex_data[['TokenA', 'TokenB']]

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
            
            lines.append(line_buy)
            lines.append(line_sell)
            
        legend = plt.legend()
        for legline in legend.get_lines():
            legline.set_picker(True)
            legline.set_pickradius(10)
            graphs[legline] = lines.pop(0)       

        plt.grid(True)
        file_path = os.path.join(current_script_directory, f"results2/slippage_chart_{dex}.png")
        plt.savefig(file_path)

        plt.connect('pick_event', on_pick)
        if "-s" in sys.argv: 
            plt.show()
        
        plt.close()

if __name__ == "__main__":
    current_script_path = os.path.abspath(__file__)
    current_script_directory = os.path.dirname(current_script_path)
    file_path = os.path.join(current_script_directory, path)
    df = read_data_from_csv(file_path)
    generate_plots(df, current_script_directory)
