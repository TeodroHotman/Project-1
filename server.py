from importlib import import_module

_flask = import_module('flask')
Flask = _flask.Flask
request = _flask.request
jsonify = _flask.jsonify
import json, os, time

app = Flask(__name__)
DB_FILE = 'submissions.json'

def load_db():
    if os.path.exists(DB_FILE):
        with open(DB_FILE, 'r') as f:
            return json.load(f)
    return []

def save_db(data):
    with open(DB_FILE, 'w') as f:
        json.dump(data, f, indent=2)

@app.route('/check', methods=['POST'])
def check_access():
    """Frontend calls this on page load to see if already submitted."""
    data = request.get_json()
    device_id = data.get('device_id')
    ip = request.headers.get('X-Forwarded-For', request.remote_addr)

    submissions = load_db()
    for s in submissions:
        if s.get('device_id') == device_id or s.get('ip') == ip:
            return jsonify({'allowed': False, 'reason': 'already_submitted'})

    return jsonify({'allowed': True})

@app.route("/api/submit", methods=["POST"])
def submit():
    """Frontend calls this on form submit."""
    data = request.get_json()
    ip = request.headers.get('X-Forwarded-For', request.remote_addr)
    user_agent = request.headers.get('User-Agent', 'unknown')

    record = {
        'ip': ip,
        'device_id': data.get('device_id'),
        'user_agent': user_agent,
        'slider_value': data.get('slider_value'),
        'timestamp': time.time()
    }

    submissions = load_db()
    submissions.append(record)
    save_db(submissions)

    return jsonify({'status': 'success', 'id': len(submissions) - 1})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3000, debug=True)