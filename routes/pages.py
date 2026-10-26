from flask import Blueprint, render_template, request, redirect, url_for, session
from config import Config
from services.question_service import QuestionService
from services.leaderboard_service import LeaderboardService
from models import get_db

pages_bp = Blueprint("pages", __name__)

@pages_bp.route("/")
def index():
    return render_template(
        "index.html",
        title="AI vs ASLI | Zenith School of AI",
        tagline="Do you trust your eyes?",
        instagram_handle=Config.INSTAGRAM_HANDLE,
        instagram_url=Config.INSTAGRAM_URL,
        campaign_url=Config.CAMPAIGN_URL
    )

@pages_bp.route("/how-to-play")
@pages_bp.route("/guide")
def guide():
    return render_template(
        "guide.html",
        title="How to Play & AI Detection Guide | AI vs ASLI",
        instagram_handle=Config.INSTAGRAM_HANDLE,
        instagram_url=Config.INSTAGRAM_URL
    )

@pages_bp.route("/about")
def about():
    return render_template(
        "about.html",
        title="About Zenith School of AI | K.R. Mangalam University",
        campaign_url=Config.CAMPAIGN_URL
    )

@pages_bp.route("/nickname")
def nickname():
    return render_template("nickname.html", title="Select Player Nickname | AI vs ASLI")

@pages_bp.route("/modes")
def modes():
    return render_template("modes.html", title="Select Game Mode | AI vs ASLI")

@pages_bp.route("/game")
def solo_game():
    return render_template("game.html", title="Solo Challenge | AI vs ASLI", mode="solo")

@pages_bp.route("/lobby/<room_code>")
def lobby(room_code):
    return render_template(
        "lobby.html",
        title=f"Room {room_code.upper()} Lobby | AI vs ASLI",
        room_code=room_code.upper()
    )

@pages_bp.route("/game/host/<room_code>")
def host_game(room_code):
    return render_template(
        "game.html",
        title=f"Big Screen Host [{room_code.upper()}] | AI vs ASLI",
        mode="host",
        room_code=room_code.upper()
    )

@pages_bp.route("/join/<room_code>")
def join_room(room_code):
    return render_template(
        "game.html",
        title=f"Playing in Room {room_code.upper()} | AI vs ASLI",
        mode="room_player",
        room_code=room_code.upper()
    )

@pages_bp.route("/results/<session_id>")
def results(session_id):
    standing = LeaderboardService.get_player_standing(session_id)
    if not standing:
        return redirect(url_for("pages.index"))
        
    return render_template(
        "results.html",
        title="Challenge Report | AI vs ASLI",
        session_id=session_id,
        standing=standing,
        instagram_handle=Config.INSTAGRAM_HANDLE,
        instagram_url=Config.INSTAGRAM_URL,
        campaign_url=Config.CAMPAIGN_URL
    )

@pages_bp.route("/story/<session_id>")
def story(session_id):
    standing = LeaderboardService.get_player_standing(session_id)
    if not standing:
        return redirect(url_for("pages.index"))
        
    return render_template(
        "story.html",
        title="Official Instagram Story Card | AI vs ASLI",
        session_id=session_id,
        standing=standing,
        instagram_handle=Config.INSTAGRAM_HANDLE,
        instagram_url=Config.INSTAGRAM_URL,
        campaign_url=Config.CAMPAIGN_URL
    )

@pages_bp.route("/leaderboard")
def leaderboard():
    return render_template(
        "leaderboard.html",
        title="Hall of Fame & Leaderboard | AI vs ASLI"
    )
