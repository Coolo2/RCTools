
import quart 
import os
import typing
import datetime
from quart_cors import cors
import prune
import asyncio
import subprocess
import make_backup

from dotenv import load_dotenv

load_dotenv()  # take environment variables from .env.

strtime = "%d_%m_%y"
port = os.getenv("file_server_port")

production = False
app = quart.Quart(__name__, static_url_path='/', 
            static_folder='./backups')
app = cors(app, allow_origin=["http://192.168.0.104:8000", "http://localhost:35599", "http://localhost:25599", "http://rctimemachine.ddns.net:35599", "http://rctimemachine.ddns.net:25599"], allow_credentials=True)

if production == False:
    app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
    app.config["TEMPLATES_AUTO_RELOAD"] = True

@app.route("/")
async def _home():
    return await quart.render_template("timemachine.html")

@app.route("/timemachine/partial_backup/<partial_backup>/<full_backup>/<path:file>")
async def _partial_backup(partial_backup, full_backup, file):
    
    if file == "standalone/config.js":
        return f"""
var config = {{
    url : {{
     configuration: 'up/configuration',
     update: '/up_replacer',
     sendmessage: 'up/sendmessage',
     login: 'up/login',
     register: 'up/register',
     tiles: 'http://rctimemachine.ddns.net:{port}/{full_backup}/tiles/',
     markers: 'http://rctimemachine.ddns.net:{port}/timemachine/partial_backup/{partial_backup}/{full_backup}/tiles/'
    }}
}};
        """
    if file == "tiles/_markers_/marker_RulerEarth.json":
        return await quart.send_file("./partial_backups/" + partial_backup + "/" + file)

    return await quart.send_file("./backups/" + full_backup + "/" + file)

def nearest(items, pivot) -> datetime.datetime:
    return min(items, key=lambda x: abs(x - pivot))


@app.route("/api/backups")
async def _backups():
    backups = os.listdir("backups")
    partial_backups = os.listdir("partial_backups")

    formatted : typing.List[dict] = []

    full_dates : typing.List[datetime.datetime] = []

    backups = list(sorted(backups, key=lambda x: datetime.datetime.strptime(x.replace("backup_", ""), strtime), reverse=True))
    partial_backups = list(sorted(partial_backups, key=lambda x: datetime.datetime.strptime(x.replace("partial_backup_", ""), "%d_%m_%y_%H_%M"), reverse=True))

    for backup in backups:
        date = datetime.datetime.strptime(backup.replace("backup_", ""), strtime)

        with open(f"./backups/{backup}/progress.txt", "r") as f:
            s = f.read()
            percent_complete = float(s) if s != "" else 0

        full_dates.append(date)

        formatted.append(
            {
                "type":"full",
                "formatted_date":date.strftime("%A, %d %B %Y"),
                "days_since":(datetime.datetime.now().date() - date.date()).days,
                "directory":backup,
                "timestamp":date.timestamp(),
                "percent_complete":percent_complete
            }
        )
        
    for backup in partial_backups:
        date = datetime.datetime.strptime(backup.replace("partial_backup_", ""), "%d_%m_%y_%H_%M")
        
        formatted.append(
            {
                "type":"partial",
                "formatted_date":date.strftime("%A, %d %B %Y at %H:%M"),
                "hours_since":int((datetime.datetime.now() - date).total_seconds()/3600),
                "directory":backup,
                "nearest_full":"backup_" + nearest(full_dates, date).strftime(strtime),
                "timestamp":date.timestamp()
            }
        )
    
    formatted = list(sorted(formatted, key=lambda x: x["timestamp"], reverse=True))
    
    return formatted

@app.route("/up_replacer", methods=["GET"])
async def up_replacer():
    return {}

@app.route("/timemachine/<directory>/")
async def _timemachine_directory_slash(directory):
    return await quart.send_file("./backups/" + directory + "/index.html")

@app.route("/timemachine/<directory>/<path:file>")
async def _backup_file(directory, file):
    return await quart.send_file("./backups/" + directory + "/" + file)

@app.route("/timemachine/partial_backup/<directory>/<full_directory>/")
async def _timemachine_partialdirectory_slash(directory, full_directory):
    return await quart.send_file("./backups/" + full_directory + "/index.html")

async def _prune():

    while True:
        prune.prune()

        # Create new backup if needed
        subprocess.Popen(["python", "make_backup.py", "full_backup"])
        
        
        # Create new partial backup if needed
        partial_backups = os.listdir("partial_backups")
        if "partial_backup_" + datetime.datetime.now().strftime("%d_%m_%y_%H_00") not in partial_backups:
            make_backup.partial_backup()
        
        await asyncio.sleep(1800)

@app.before_serving
async def startup():
    app.add_background_task(_prune)

app.run(host="0.0.0.0", port=int(port), use_reloader=False)