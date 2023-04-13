from distutils.dir_util import copy_tree
import datetime
import requests
import os
import json
import renderer
import sys



base = "https://map.rulercraft.com"

file_server_url = os.getenv("file_server_url")
port = os.getenv("file_server_port")

def full_backup():
    # To make a backup:
    # 1: Copy the "templates" folder and name suitably
    # 2: Edit standalone/config.js 
    # 3: Download town data /tiles/_markers_/marker_RulerEarth.json
    # 4 Download /up/configuration and edit
    # 5: Import tiles

    strtime = "%d_%m_%y"
    dir = "backup_" + datetime.datetime.now().strftime(strtime)
    backup_path = "./backups/" + dir

    # Dont replace towny data if it exists already
    if not os.path.exists(backup_path + "/tiles/_markers_/marker_RulerEarth.json"):
        #1
        copy_tree("./template", backup_path)

        #2 
        with open(backup_path + "/standalone/config.js", "w") as f:
            f.write(f"""
        var config = {{
            url : {{
            configuration: 'up/configuration',
            update: '/up_replacer',
            sendmessage: 'up/sendmessage',
            login: 'up/login',
            register: 'up/register',
            tiles: '{file_server_url}:{port}/{dir}/tiles/',
            markers: '{file_server_url}:{port}/{dir}/tiles/'
            }}
        }};
            """)

        #3
        r = requests.get(base + "/tiles/_markers_/marker_RulerEarth.json")
        filename = backup_path + "/tiles/_markers_/marker_RulerEarth.json"

        os.makedirs(os.path.dirname(filename), exist_ok=True)

        with open(filename, "wb") as f:
            f.write(r.content)

        #4
        r = requests.get(base + "/up/configuration")
        filename = backup_path + "/up/configuration"

        j = r.json()
        j["components"] = [
            {
            "show-mcr": False,
            "label": "Location",
            "type": "coord",
            "show-chunk": False,
            "hidey": True
            }
        ]
        j["worlds"][0]["maps"][0]["image-format"] = "png"
        j["worlds"][0]["maps"][0]["mapzoomin"] = -1

        os.makedirs(os.path.dirname(filename), exist_ok=True)
        with open(filename, "w") as f:
            json.dump(j, f, indent=4)
    
    renderer.new_render(dir)
    
def partial_backup():
    strtime = "%d_%m_%y_%H_00"

    backup_path = f"./partial_backups/partial_backup_{datetime.datetime.now().strftime(strtime)}"

    r = requests.get(base + "/tiles/_markers_/marker_RulerEarth.json")
    filename = backup_path + "/tiles/_markers_/marker_RulerEarth.json"

    os.makedirs(os.path.dirname(filename), exist_ok=True)

    with open(filename, "wb") as f:
        f.write(r.content)

if "full_backup" in sys.argv:
    full_backup()
elif "partial_backup" in sys.argv:
    partial_backup()