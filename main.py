
import quart 
import var
import logging

app = quart.Quart(__name__)

logging.getLogger('quart.serving').setLevel(logging.ERROR)

if var.production == False:
    app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
    app.config["TEMPLATES_AUTO_RELOAD"] = True

@app.route("/", methods=["GET"])
async def _index():
    return await quart.render_template("index.html")

@app.route("/time", methods=["GET"])
async def _time():
    return await quart.render_template("time.html")

app.run(host="0.0.0.0", port=var.port, use_reloader=False)