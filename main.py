
import quart 
import var
import client
import os
import discord
import aiohttp
import json
import discordoauth
import urllib.parse
import random 
import datetime
import subprocess

# TODO

def random_color():
    r = lambda: random.randint(0,255)
    return '#%02X%02X%02X' % (r(),r(),r())


PASSWORD = os.getenv("encryption_password")
GETCODE_WEBHOOK = os.getenv("getcode_webhook")
ACCESSREQUESTS_WEBHOOK = os.getenv("accessrequests_webhook")
ERRORS_WEBHOOK = os.getenv("errors_webhook")
OAUTH_CLIENTID = os.getenv("oauth_clientid")
OAUTH_CLIENTSECRET = os.getenv("oauth_clientsecret")
DATABASE_KEY = os.getenv("database_key")
file_server_url = os.getenv("file_server_url")
file_server_port = os.getenv("file_server_port")

MAINID = 368071242189897728

ADMINS = [MAINID]

world : client.rulerearth.World = None

# waiting is a taken name.
# inside nations: config is a taken name. impossible to get anyway
dict_editors = {}

# Dict containing the claims for every naiton.
#{nation:[ {"created":23794, "poly":[[0, 0], [0, 0]]} ]}
dict_claims = {}

strtime = "%d_%m_%y"

app = quart.Quart(__name__)
oauth = discordoauth.Client(OAUTH_CLIENTID, OAUTH_CLIENTSECRET)
scopes = discordoauth.Scopes(identify=True, guilds_members_read=True)

if var.production == False:
    app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
    app.config["TEMPLATES_AUTO_RELOAD"] = True

@app.route("/", methods=["GET"])
async def _index():
    return await quart.render_template("index.html")

@app.route("/time", methods=["GET"])
async def _time():
    return await quart.render_template("time.html")

@app.route("/map", methods=["GET"])
async def _map():
    return await quart.render_template("map.html")

@app.route("/bot", methods=["GET"])
async def _bot():
    return await quart.render_template("bot.html")

@app.route("/timemachine")
async def _timemachine():
    return quart.redirect(file_server_url + ":" + file_server_port)

@app.route("/bot/invite")
async def _bot_invite():
    return quart.redirect(var.bot_invite)

@app.route("/api/time")
async def _api_time():
    t = datetime.datetime.now()
    daysin = (t - datetime.datetime(2022, 1, 1, 0, 0)).days 
    timehou = t.hour
    timemin = t.minute
    timesecond = t.second
    days_in = daysin + timehou / 24 + timemin / 60 / 24 + timesecond / 60 / 60 / 24

    rcyearex = days_in / 30.4375
    rcyears = int(rcyearex)
    rcmonthex = (rcyearex - int(rcyearex)) * 12
    rcmonths = int(rcmonthex)
    rcdayex = (rcmonthex - int(rcmonthex)) * 30.4375
    rcdays = int(rcdayex)
    rchourex = (rcdayex - int(rcdayex)) * 24
    rchours = int(rchourex)
    rcminuteex = (rchourex - int(rchourex)) * 60
    rcminutes = int(rcminuteex)

    return {"time":f"{rcyears:0>4}-{rcmonths+1:0>2}-{rcdays+1:0>2}T{rchours:0>2}:{rcminutes:0>2}:00"}

@app.route("/api/time/convert")
async def _api_time_convert():
    if quart.request.args.get("rltime"):
        t = datetime.datetime.strptime(quart.request.args.get("rltime"), '%Y-%m-%d %H:%M:%S')

        daysin = (t - datetime.datetime(2022, 1, 1, 0, 0)).days 
        timehou = t.hour
        timemin = t.minute
        timesecond = t.second
        days_in = daysin + timehou / 24 + timemin / 60 / 24 + timesecond / 60 / 60 / 24

        rcyearex = days_in / 30.4375
        rcyears = int(rcyearex)
        rcmonthex = (rcyearex - int(rcyearex)) * 12
        rcmonths = int(rcmonthex)
        rcdayex = (rcmonthex - int(rcmonthex)) * 30.4375
        rcdays = int(rcdayex)
        rchourex = (rcdayex - int(rcdayex)) * 24
        rchours = int(rchourex)
        rcminuteex = (rchourex - int(rchourex)) * 60
        rcminutes = int(rcminuteex)

        return {"time":f"{rcyears:0>4}-{rcmonths+1:0>2}-{rcdays+1:0>2}T{rchours:0>2}:{rcminutes:0>2}:00"}
    elif quart.request.args.get("rctime"):
        YEAR = datetime.timedelta(days=365, hours=5, minutes=48, seconds=46)

        year = int(quart.request.args.get("rctime").split("-")[0])
        date = datetime.datetime.strptime("-".join(quart.request.args.get("rctime").split("-")[1:]), '%m-%d %H:%M:%S') 

        delta = (year*YEAR + datetime.timedelta(days=((date.month-1)*30.4375) + (date.day-1), hours=date.hour, minutes=date.minute)) / 12
        delta = delta
        rl_date = datetime.datetime(2022, 1, 1) + delta + datetime.timedelta(minutes=9)

        return {"time":rl_date.isoformat()}

@app.route("/api/remove_nation", methods=["GET"])
async def _delete_nation():
    global dict_editors 

    nation = quart.request.args.get("nation")
    code = quart.request.args.get("code") or (urllib.parse.unquote(quart.request.cookies.get("code")) if quart.request.cookies.get("code") else None) 

    if int(client.encryption.decode(code, PASSWORD)) not in ADMINS:
        return quart.jsonify({"error":"You do not have permission to use this"})

    if not nation:
        return quart.jsonify({"errror":"nation not provided"})

    if nation not in dict_editors:
        return quart.jsonify({"error":"Nation doesn't exist"})
    
    del dict_editors[nation]
    if nation in dict_claims:
        del dict_claims[nation]
    
    await client.requests.post_json(f"https://helperdata.glitch.me/save{DATABASE_KEY}/rctools/editors.json", {'data':json.dumps(dict_editors)})
    await client.requests.post_json(f"https://helperdata.glitch.me/save{DATABASE_KEY}/rctools/claims.json", {'data':json.dumps(dict_claims)})

    return quart.redirect("/map?admin")

@app.route("/api/move_nation", methods=["GET"])
async def _move_nation():
    global dict_editors 

    old_nation = quart.request.args.get("old_nation")
    new_nation = quart.request.args.get("new_nation")
    code = quart.request.args.get("code") or (urllib.parse.unquote(quart.request.cookies.get("code")) if quart.request.cookies.get("code") else None) 

    if int(client.encryption.decode(code, PASSWORD)) not in ADMINS:
        return quart.jsonify({"error":"You do not have permission to use this"})

    if not old_nation:
        return quart.jsonify({"errror":"old nation not provided"})
    if not new_nation:
        return quart.jsonify({"errror":"new nation not provided"})

    if old_nation not in dict_editors:
        return quart.jsonify({"error":"Nation doesn't exist"})
    
    dict_claims[new_nation] = dict_claims[old_nation]
    dict_editors[new_nation] = dict_editors[old_nation]

    del dict_editors[old_nation]
    if old_nation in dict_claims:
        del dict_claims[old_nation]
    
    await client.requests.post_json(f"https://helperdata.glitch.me/save{DATABASE_KEY}/rctools/editors.json", {'data':json.dumps(dict_editors)})
    await client.requests.post_json(f"https://helperdata.glitch.me/save{DATABASE_KEY}/rctools/claims.json", {'data':json.dumps(dict_claims)})

    return quart.redirect("/map?admin")

@app.route("/api/remove_editor", methods=["GET"])
async def _remove_editor():
    global dict_editors 

    id = quart.request.args.get("id")
    name = quart.request.args.get("name")
    nation = quart.request.args.get("nation")
    code = quart.request.args.get("code") or (urllib.parse.unquote(quart.request.cookies.get("code")) if quart.request.cookies.get("code") else None) 

    if int(client.encryption.decode(code, PASSWORD)) not in ADMINS:
        return quart.jsonify({"error":"You do not have permission to use this"})

    if not (id or name):
        return quart.jsonify({"errror":"id or name not provided"})
    
    if not id:
        for _nation in dict_editors:
            for id2, name2 in dict_editors[_nation].items():
                if name == name2:
                    id = id2 
                    nation = _nation

    del dict_editors[nation][str(id)]

    
    await client.requests.post_json(f"https://helperdata.glitch.me/save{DATABASE_KEY}/rctools/editors.json", {'data':json.dumps(dict_editors)})

    return quart.redirect("/map?admin")
    
def make_nation(name : str, color : str = None):
    global dict_editors 

    dict_editors[name] = {
            "config":{
                "color":color or random_color()
            }
        }

@app.route("/api/add_editor", methods=["GET"])
async def _add_editor():
    global dict_editors 

    id = quart.request.args.get("id")
    nation = quart.request.args.get("nation")
    code = quart.request.args.get("code") or (urllib.parse.unquote(quart.request.cookies.get("code")) if quart.request.cookies.get("code") else None) 
    name = quart.request.args.get("name")

    adding = True if id else False

    if not id:
        for editors in dict_editors.values():
            for i, n in editors.items():
                if n == name:
                    id = i
    
    if int(client.encryption.decode(code, PASSWORD)) not in ADMINS:
        return quart.jsonify({"error":"You do not have permission to use this"})
    
    if "ENTERNATION" in nation:
        return quart.jsonify({"error":"Enter a nation name.."})

    if not nation:
        return quart.jsonify({"errror":"nation not provided"})
    
    code = urllib.parse.quote(client.encryption.encode(str(id), PASSWORD).decode("utf-8"))

    if adding:
        webhook = discord.Webhook.from_url(GETCODE_WEBHOOK, session=aiohttp.ClientSession())
        await webhook.send(f"{id} (<@{id}>) - `{code}`")

    if nation not in dict_editors:
        found = False
        for nation_obj in world.nations:
            if nation_obj.name == nation and not found:
                found = True
                make_nation(nation, color=nation_obj.color)
        if not found:
            make_nation(nation)
    
    for editors in dict_editors.values():
        if str(id) in editors:
            del editors[str(id)]

    dict_editors[nation][str(id)] = name
    
    await client.requests.post_json(f"https://helperdata.glitch.me/save{DATABASE_KEY}/rctools/editors.json", {'data':json.dumps(dict_editors)})

    return quart.redirect(f"/map?admin&adminCode={code}")

async def get_user(code : str=None, id=None) -> client.types.Editor:
    if not id:
        d = client.encryption.decode(code, PASSWORD)
        id = int(d) if d else None
    
    with open("editors.json") as f:
        j = json.load(f)
    editor = True if id in j or str(id) in j else False
    editor = True if id in ADMINS else editor

    if "waiting" in dict_editors and str(id) in dict_editors["waiting"]:
        return client.types.Editor(id, dict_editors["waiting"][str(id)], None, None, id in ADMINS, editor)

    nat = None
    name = None
    conf = None
    for nation, editors in dict_editors.items():
        if str(id) in editors:   
            nat = nation 
            conf = editors["config"]
            name = editors[str(id)]

    if name and nat:
        return client.types.Editor(id, name, nat, conf, id in ADMINS, editor)
    return client.types.Editor(id, None, None, None, id in ADMINS, editor)
    

@app.route("/api/auth", methods=["GET"])
async def _auth():
    code = quart.request.args.get("code") or (urllib.parse.unquote(quart.request.cookies.get("code")) if quart.request.cookies.get("code") else None) 

    if not code:
        return quart.jsonify({"id":None, "name":None, "nation":None, "admin":None, "global":None})

    decoded = client.encryption.decode(code, PASSWORD)

    try:
        int(decoded)
    except:
        return quart.jsonify({"id":None, "name":None, "nation":None, "admin":None, "global":None})

    user = await get_user(code)
    return quart.jsonify(user.to_dict())

@app.route("/login", methods=["GET"])
async def _login():
    return quart.redirect(oauth.get_oauth_url(scopes, var.address + "/api/oauth"))

@app.route("/logout", methods=["GET"])
async def logout():
    resp = await quart.make_response(quart.redirect("/map"))
    resp.delete_cookie("code")
    return resp    

@app.route("/api/oauth", methods=["GET"])
async def _oauth():
    global dict_editors 

    if quart.request.args.get("error"):
        return quart.redirect("/map")
    
    code = quart.request.args.get("code")
    s = oauth.new_session(code, scopes, var.address + "/api/oauth")

    try:
        user = await s.fetch_user()
    except:
        usr = await get_user(code)

        with open("errors.txt", "a") as f:
            f.write(f"`{usr.id}` (<@{usr.id}>) attempted a login but failed. Their code is `{code}`")
        
        # Attempt a reload on replit
        subprocess.Popen(["kill", "1"])

        return quart.redirect("/map?loginerror")

    code = urllib.parse.quote(client.encryption.encode(str(user.id), PASSWORD).decode("utf-8"))

    resp = await quart.make_response(quart.redirect("/map?login"))
    resp.set_cookie("code", code, max_age=8_760*3600)


    if not (await get_user(id=int(user.id))).nation:
        minecraft_name = user.name 

        try:
            member = await s.fetch_member_information(732023183485567006)
            minecraft_name : str = member.nick or member.user.name
        except KeyError:
            pass

        for nation in world.nations:
            if nation.leader == minecraft_name:
                if nation not in dict_editors:
                    make_nation(nation.name, color=nation.color)

                dict_editors[nation.name][str(user.id)] = minecraft_name
    
                await client.requests.post_json(f"https://helperdata.glitch.me/save{DATABASE_KEY}/rctools/editors.json", {'data':json.dumps(dict_editors)})

                return resp

        maincode = urllib.parse.quote(client.encryption.encode(str(MAINID), PASSWORD).decode("utf-8"))

        if "waiting" not in dict_editors:
            dict_editors["waiting"] = {}
        dict_editors["waiting"][str(user.id)] = minecraft_name
        await client.requests.post_json(f"https://helperdata.glitch.me/save{DATABASE_KEY}/rctools/editors.json", {'data':json.dumps(dict_editors)})

        webhook = discord.Webhook.from_url(ACCESSREQUESTS_WEBHOOK, session=aiohttp.ClientSession())
        await webhook.send(f"<@{MAINID}>: {user.id} (<@{user.id}>) requested access. Their code is `{code}`.\nAdd them with this link {var.address}/api/add_editor?code={maincode}&id={user.id}&name={urllib.parse.quote(minecraft_name)}&nation=`ENTERNATIONHERE`")

        return resp

    resp = await quart.make_response(quart.redirect("/map?login"))
    resp.set_cookie("code", code, max_age=8_760*3600)

    return resp

async def get_claims() -> dict:
    with open("editors.json") as f:
        j = json.load(f)

    resp = {"nations":{}, "claims":{}}
    post = False
    
    for nation in dict_claims:
        print([n.name for n in world.nations])
        if nation not in [n.name for n in world.nations] and nation not in dict_editors:
            make_nation(nation)
            post = True 

    for name, nation in dict_editors.items():
        if "config" in nation:
            resp["nations"][name] = nation["config"]
            resp["nations"][name]["world"] = False 

    for nation in world.nations:
        resp["nations"][nation.name] = {"color":nation.color, "world":True}

    resp["claims"] = dict_claims
    resp["editors"] = {k:{k2:v2 for k2, v2 in v.items() if k2 != "config"} for k, v in dict_editors.items()}
    for admin in ADMINS:
        j.append(str(admin))
    resp["global_editors"] = j

    if post:
        await client.requests.post_json(f"https://helperdata.glitch.me/save{DATABASE_KEY}/rctools/editors.json", {'data':json.dumps(dict_editors)})

    return resp

@app.route("/api/claims", methods=["PUT"])
async def _put_claim():
    global dict_claims 

    code = quart.request.args.get("code") or (urllib.parse.unquote(quart.request.cookies.get("code")) if quart.request.cookies.get("code") else None) 

    user = await get_user(code)
    data = await quart.request.json 
    nation = data["nation"]

    if not user.editor and user.nation != nation:
        return quart.jsonify({"error":"You do not have permission to perform this action"})

    if nation not in dict_claims:
        dict_claims[nation] = []
    dict_claims[nation].append({
        "layer":data["layer"],
        "time":str(datetime.datetime.now().timestamp()),
        "label":data["label"] if "label" in data else None
    })

    await client.requests.post_json(f"https://helperdata.glitch.me/save{DATABASE_KEY}/rctools/claims.json", {'data':json.dumps(dict_claims)})

    return quart.jsonify(await get_claims())

@app.route("/api/claims", methods=["DELETE"])
async def _delete_claim():
    global dict_claims 

    code = quart.request.args.get("code") or (urllib.parse.unquote(quart.request.cookies.get("code")) if quart.request.cookies.get("code") else None) 

    user = await get_user(code)
    data = await quart.request.json 

    for feature in data["layer"]["features"]:
        for nation, claims in dict_claims.items():
            if not user.editor and user.nation != nation:
                continue

            removeIndexes = []

            for i, claim in enumerate(claims):
                if claim["layer"]["geometry"]["coordinates"] == feature["geometry"]["coordinates"]:
                    removeIndexes.append(i)
            
            for i in removeIndexes:
                del claims[i]
    
    await client.requests.post_json(f"https://helperdata.glitch.me/save{DATABASE_KEY}/rctools/claims.json", {'data':json.dumps(dict_claims)})

    return quart.jsonify(await get_claims())

@app.route("/api/claims", methods=["PATCH"])
async def _edit_claims():
    global dict_claims 

    code = quart.request.args.get("code") or (urllib.parse.unquote(quart.request.cookies.get("code")) if quart.request.cookies.get("code") else None) 

    user = await get_user(code)
    data = await quart.request.json 
    nation = data["nation"]

    if not user.editor and user.nation != nation:
        return quart.jsonify({"error":"You do not have permission to perform this action"})
    
    dict_claims[nation] = []
    for layer in data["layers"]:
        
        dict_claims[nation].append({
            "user":layer["properties"]["name"],
            "layer":layer,
            "time":str(datetime.datetime.now().timestamp()),
            "label":layer["label"] if "label" in layer else None
        })

    
    await client.requests.post_json(f"https://helperdata.glitch.me/save{DATABASE_KEY}/rctools/claims.json", {'data':json.dumps(dict_claims)})

    return quart.jsonify(await get_claims())

@app.route("/api/claims", methods=["GET"])
async def _get_claims():
    return quart.jsonify(await get_claims())

@app.route("/map/screenshot")
async def _map_image_refresh():
    
    async with aiohttp.ClientSession() as session:
        async with session.get(url=f"https://api.webrender.co/render?url={var.address}/map?instant") as r:
            j = await r.json()
        
        async with session.get(j["images"][1]) as resp:
            f = open("./static/images/map_screenshot.png", "wb")
            
            f.write(await resp.read())

            f.close()
    
    return await quart.send_file("./static/images/map_screenshot.png")

# Backups 

file_server = file_server_url + ":" + file_server_port

@app.route("/api/backups")
async def _backups():
    
    return await fetch_url(file_server + "/api/backups")

async def fetch_url(url : str):
    async with aiohttp.ClientSession(trust_env=True) as session:
        async with session.get(url, ssl=False) as resp:
            return (await resp.read(), resp.status, resp.headers.items())

@app.route("/up_replacer", methods=["GET"])
async def up_replacer():
    return {}

@app.route("/timemachine/<directory>/")
async def _timemachine_directory_slash(directory):
    return await fetch_url(file_server + "/" + directory + "/index.html")

@app.route("/timemachine/<directory>/<path:file>")
async def _backup_file(directory, file):
    return await fetch_url(file_server + "/" + directory + "/" + file)

@app.route("/timemachine/partial_backup/<directory>/<full_directory>/")
async def _timemachine_partialdirectory_slash(directory, full_directory):
    print(file_server + "/partial_backup/" + directory + "/" + full_directory + "/index.html")
    return await fetch_url(file_server + "/partial_backup/" + directory + "/" + full_directory + "/index.html")

@app.route("/timemachine/partial_backup/<directory>/<full_directory>/<path:file>")
async def _backup_partialfile(directory, full_directory, file):
    return await fetch_url(file_server + "/partial_backup/" + directory + "/" + full_directory + "/" + file)

@app.route ("/url/<path:url>")
async def _url(url):
    return await fetch_url(url)

@app.before_serving
async def startup():
    global dict_editors 
    global dict_claims 
    global world
    
    dict_editors = await client.requests.get_json("https://helperdata.glitch.me/view/rctools/editors.json")
    dict_claims = await client.requests.get_json("https://helperdata.glitch.me/view/rctools/claims.json")

    rulerearth = await client.requests.get_json("https://map.rulercraft.com/tiles/_markers_/marker_RulerEarth.json")
    world = client.rulerearth.World(rulerearth)


    

app.run(host="0.0.0.0", port=var.port, use_reloader=False)