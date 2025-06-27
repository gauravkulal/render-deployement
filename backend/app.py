import os
from flask import Flask, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask import abort

# Absolute path to the frontend folder
FRONTEND_FOLDER = os.path.abspath(os.path.join(os.path.dirname(__file__), '../frontend'))

app = Flask(
    __name__,
    static_folder=os.path.join(FRONTEND_FOLDER, 'scripts'),  # Serve JS from /scripts
    static_url_path='/scripts'
)
CORS(app)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

from models import db
db.init_app(app)

from routes import bp
app.register_blueprint(bp)

with app.app_context():
    db.create_all()

# Serve index.html at root
@app.route('/')
def serve_index():
    return send_from_directory(FRONTEND_FOLDER, 'index.html')

# ... all your previous code ...

# Serve CSS files
@app.route('/styles/<path:path>')
def serve_styles(path):
    return send_from_directory(os.path.join(FRONTEND_FOLDER, 'styles'), path)

# Serve home.html
@app.route('/home.html')
def serve_home():
    return send_from_directory(FRONTEND_FOLDER, 'home.html')

from flask import request

@app.errorhandler(404)
def not_found(e):
    if request.path.startswith('/api/'):
        return {"error": "API endpoint not found"}, 404
    return send_from_directory(FRONTEND_FOLDER, 'index.html')

if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0", port=5000)