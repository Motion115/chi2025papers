# read data/layout/grid_position_query_0.json
import json
import matplotlib.pyplot as plt
import numpy as np

with open('./data/layout/grid_positions_query_0.json', 'r') as f:
    data = json.load(f)

with open('./data/present.json', 'r', encoding='utf-8') as f:
    present = json.load(f)

# each key correspond to a x, y coordinate
for key in data:
    x, y = data[key]
    # if distance to 0 is less than 2
    if np.sqrt(x**2 + y**2) < 3:
        # find this id in present
        for d in present:
            if d['sequence'] == int(key):
                # print the text
                print(d['title'])
                print(x, y)

#     plt.scatter(x, y, color='red')

# plt.show()