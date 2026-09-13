import json
import os
import time
import sys
from dotenv import load_dotenv
from flask import Flask, request, jsonify, send_from_directory
from libsql_client import create_client

load_dotenv()

app = Flask(__name__, static_folder=".", static_url_path="")

db = create_client(
    url=os.environ["TURSO_DATABASE_URL"],
    auth_token=os.environ["TURSO_AUTH_TOKEN"]
)

db.execute("""
    CREATE TABLE IF NOT EXISTS submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ip TEXT,
        fingerprint TEXT,
        type TEXT,
        answers TEXT,
        user_agent TEXT,
        timestamp TEXT
    )
""")
db.commit()

@app.route("/")
def index():
    return send_from_directory(".", "index.html")


@app.route('/api/check', methods=['POST'])
def check_access():
    data = request.get_json()
    device_id = data.get('device_id')
    ip = request.headers.get('X-Forwarded-For', request.remote_addr)

    result = db.execute(
        "SELECT id FROM submissions WHERE fingerprint = ? OR ip = ? LIMIT 1",
        [device_id, ip]
    ).fetchone()

    if result:
        return jsonify({'allowed': False, 'reason': 'already_submitted'})
    return jsonify({'allowed': True})


@app.route("/api/submit", methods=["POST"])
def submit():
    data = request.get_json()
    ip = request.headers.get('X-Forwarded-For', request.remote_addr)
    user_agent = request.headers.get('User-Agent', 'unknown')

    db.execute(
        "INSERT INTO submissions (ip, fingerprint, type, answers, user_agent, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
        [
            ip,
            data.get('fingerprint'),
            data.get('type'),
            json.dumps(data.get('answers')),
            user_agent,
            data.get('timestamp')
        ]
    )

    print(f"New submission: IP={ip}")
    return jsonify({'status': 'success'})


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)