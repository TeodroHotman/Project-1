import json
import os
import time
import sys

from flask import Flask, request, jsonify, send_from_directory

app = Flask(__name__, static_folder=".", static_url_path="")

DB_FILE = 'submissions.json'


def load_db():
    if os.path.exists(DB_FILE):
        with open(DB_FILE, 'r') as f:
            return json.load(f)
    return []


def save_db(data):
    with open(DB_FILE, 'w') as f:
        json.dump(data, f, indent=2)


@app.route("/")
def index():
    return send_from_directory(".", "index.html")


@app.route('/api/check', methods=['POST'])
def check_access():
    data = request.get_json()
    device_id = data.get('device_id')
    ip = request.headers.get('X-Forwarded-For', request.remote_addr)

    submissions = load_db()
    for s in submissions:
        if s.get('fingerprint') == device_id or s.get('ip') == ip:
            return jsonify({'allowed': False, 'reason': 'already_submitted'})

    return jsonify({'allowed': True})


@app.route("/api/submit", methods=["POST"])
def submit():
    data = request.get_json()
    ip = request.headers.get('X-Forwarded-For', request.remote_addr)
    user_agent = request.headers.get('User-Agent', 'unknown')

    record = {
        'ip': ip,
        'fingerprint': data.get('fingerprint'),
        'type': data.get('type'),
        'answers': data.get('answers'),
        'user_agent': user_agent,
        'timestamp': data.get('timestamp')
    }

    submissions = load_db()
    submissions.append(record)
    save_db(submissions)

    print(f"New submission: IP={ip}, Type={record['type']}")

    return jsonify({'status': 'success', 'id': len(submissions) - 1})


if __name__ == "__main__":
    port = 5000
    print(f"\n{'='*40}")
    print(f" Server running on port {port}")
    print(f" Use your Codespace URL to access it")
    print(f"{'='*40}\n")
    app.run(host='0.0.0.0', port=port, debug=True)