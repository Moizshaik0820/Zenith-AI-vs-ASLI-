import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
os.chdir(str(BASE_DIR))

# Safe stdout/stderr handling for detached / WMI / background execution on Windows
class SafeWriter:
    def __init__(self, filename):
        self.filename = str(filename)
        self._file = None
        
    def _get_file(self):
        if self._file is None or self._file.closed:
            try:
                self._file = open(self.filename, "a", encoding="utf-8", buffering=1)
            except Exception:
                pass
        return self._file

    def write(self, s):
        try:
            f = self._get_file()
            if f:
                f.write(s)
                f.flush()
        except Exception:
            pass

    def flush(self):
        try:
            f = self._get_file()
            if f:
                f.flush()
        except Exception:
            pass

try:
    if sys.stdout is None:
        sys.stdout = SafeWriter(BASE_DIR / "server_stdout.log")
    else:
        sys.stdout.write("")
except Exception:
    sys.stdout = SafeWriter(BASE_DIR / "server_stdout.log")

try:
    if sys.stderr is None:
        sys.stderr = SafeWriter(BASE_DIR / "server_stderr.log")
    else:
        sys.stderr.write("")
except Exception:
    sys.stderr = SafeWriter(BASE_DIR / "server_stderr.log")

from flask import Flask, render_template
from flask_socketio import SocketIO
from werkzeug.middleware.proxy_fix import ProxyFix
from config import Config
from models import init_db, seed_demo_leaderboard
from services.question_service import QuestionService
from routes.pages import pages_bp
from routes.api import api_bp
from routes.multiplayer import register_multiplayer_events

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Initialize DB & Seed
    init_db()
    seed_demo_leaderboard()
    QuestionService.sync_questions_from_json()
    
    # Register blueprints (Admin removed as requested)
    app.register_blueprint(pages_bp)
    app.register_blueprint(api_bp)

    # Reverse proxy support (Render / HTTPS)
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)
    
    # Error handlers
    @app.errorhandler(404)
    def page_not_found(e):
        return render_template("404.html"), 404
        
    @app.errorhandler(500)
    def internal_server_error(e):
        return render_template("500.html"), 500
        
    return app

app = create_app()
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")
register_multiplayer_events(socketio)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"[AI vs ASLI] Server running on http://127.0.0.1:{port}")
    socketio.run(app, host="0.0.0.0", port=port, debug=False, allow_unsafe_werkzeug=True)
