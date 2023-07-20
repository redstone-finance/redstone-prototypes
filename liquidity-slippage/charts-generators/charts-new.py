import os
import pandas as pd
import matplotlib.pyplot as plt

path = "../results/slippage.csv"
# Change this manually according to the data in the csv file or ../utils/constants.js
pricesUnrelated = ['1e4', '1e6', '1e8']
pricesRelated = ['1e-3', '1e-2', '1e-1']

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
    
    dex_list = df['DEX'].unique()
    colors = ['blue', 'green', 'red', 'purple', 'orange', 'brown', 'pink', 'gray', 'olive']

    # Charts for unrelated prices
    for dex in dex_list:
        data = df[df['DEX'] == dex]

        plt.figure(figsize=(10, 6))
        plt.title(f'Charts for DEX: {dex} - pricesUnrelated')
        plt.xlabel('Pool Size')
        plt.ylabel('Slippage')
        color_num = 0

        for priceKey in pricesUnrelated:
            AtoB = f'Slip{priceKey}AtoB'
            BtoA = f'Slip{priceKey}BtoA'
            plt.plot(data['Pool Size'], data[AtoB], label=f'{priceKey} AtoB', color=colors[color_num], linestyle='dashed')
            plt.plot(data['Pool Size'], data[BtoA], label=f'{priceKey} BtoA', color=colors[color_num], linestyle='dotted')
            color_num += 1

        plt.legend(loc='upper right')
        plt.grid()
        plt.show()

    # Charts for pool size related prices
    for dex in dex_list:
        data = df[df['DEX'] == dex]

        plt.figure(figsize=(10, 6))
        plt.title(f'Charts for DEX: {dex} - pricesRelated')
        plt.xlabel('Pool Size')
        plt.ylabel('Slippage')
        color_num = 0

        for priceKey in pricesRelated:
            AtoB = f'SlipRelated{priceKey}AtoB'
            BtoA = f'SlipRelated{priceKey}BtoA'
            plt.plot(data['Pool Size'], data[AtoB], label=f'Related {priceKey} AtoB', color=colors[color_num], linestyle='solid')
            plt.plot(data['Pool Size'], data[BtoA], label=f'Related {priceKey} BtoA', color=colors[color_num], linestyle='dashdot')
            color_num += 1
            
        plt.legend(loc='upper right')
        plt.grid()
        plt.show()

if __name__ == "__main__":
    current_script_path = os.path.abspath(__file__)
    current_script_directory = os.path.dirname(current_script_path)
    file_path = os.path.join(current_script_directory, path)
    df = read_data_from_csv(file_path)
    generate_plots(df)