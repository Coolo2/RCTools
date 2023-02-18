
# For second render, use a list of locations generated from the first one: eg, ["/32_-1/200_168.png"]

import typing
import os
import requests
import math

def new_render(dir):
    base = "https://map.rulercraft.com"
    #

    # must be multiples of 32
    lims = {
            "x":[-608, 608], "y":[-288, 288]
    }

    totals = [0] * 6

    s = requests.Session()

    for zoom in range(5, -1, -1):
        steps = 2 ** zoom
        for y in range(lims["y"][0], lims["y"][1]+1, steps):
            for x in range(lims["x"][0], lims["x"][1]+1, steps):
                totals[zoom] += 1

    total_to_download = totals[5] + totals[4] + totals[3] + totals[2] + totals[1]
    total_downloaded = 0

    # Doesnt render zoom level 0
    for zoom in range(5, 0, -1):
        steps = 2 ** zoom 
        counter = 0

        for y in range(lims["y"][0], lims["y"][1]+1, steps):
            for x in range(lims["x"][0], lims["x"][1]+1, steps):
                counter += 1
                image_path = '/tiles/RulerEarth/flat/%d_%d/%s%d_%d.png' % (math.floor(x/32), math.floor(y/32), ('' if zoom == 0 else ('z' * zoom) + '_'), x, y)
                filename = f"./backups/{dir}" + image_path 
                url = base + image_path
                if not os.path.exists(filename):
                    print(f"Downloading zoom {zoom} - {counter}/{totals[zoom]} - {(counter/totals[zoom])*100:,.2f}%")
                    r = s.get(url)

                    os.makedirs(os.path.dirname(filename), exist_ok=True)
                    with open(filename, "wb") as f:
                        f.write(r.content)
            
            with open(f"./backups/{dir}/progress.txt", "w") as f:
                f.write(str(((total_downloaded+counter)/total_to_download)*100)[:5])

        total_downloaded += counter
        print(counter, "tiles")
    