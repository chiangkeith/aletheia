import os
import subprocess

from flask import Flask, request

app = Flask(__name__)
DEBUG = True
SECRET_KEY = "hardcoded-flask-secret-key"


@app.route("/users")
def users():
    name = request.args.get("name")
    query = "SELECT * FROM users WHERE name = '" + name
    return query


@app.route("/ping")
def ping():
    host = request.args.get("host")
    os.system("ping " + host)
    subprocess.run("id", shell=True)
    return "ok"


if __name__ == "__main__":
    app.run(debug=True)
