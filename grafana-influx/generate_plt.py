import csv
import datetime
import matplotlib.pyplot as plt
import glob

files = glob.glob('*.csv') # Finds all csv files in current folder

for file in files:
    times = []
    values = []
    with open(file, newline='') as csvfile:
        reader = csv.reader(csvfile)
        next(reader)
        for row in reader:
            times.append(datetime.datetime.strptime(row[0], '%Y-%m-%d %H:%M:%S%z'))
            values.append(float(row[1])) 

    plt.figure(figsize=(30, 6))
    plt.plot(times, values, marker='o', linestyle='-')
    plt.xlabel('Time')
    plt.ylabel('Value USD')
    plt.title(file[:-4])
    plt.xticks(rotation=45)
    plt.grid(True)
    plt.savefig(file[:-4] + '.png')
    plt.close()
