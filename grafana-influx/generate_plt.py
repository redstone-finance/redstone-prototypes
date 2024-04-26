import csv
import datetime
import matplotlib.pyplot as plt

file = 'ezETHbase.csv'
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
plt.xlabel('times')
plt.ylabel('Value USD')
plt.title('ezETH base')
plt.xticks(rotation=45)
plt.grid(True)
plt.savefig('ezETHbase.png')

file = 'ezETHtwap.csv'
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
plt.xlabel('times')
plt.ylabel('Value USD')
plt.title('ezETH twap')
plt.xticks(rotation=45)
plt.grid(True)
plt.savefig('ezETHtwap.png')
