import uuid
import json
import html
import random
from flask import Blueprint, request, jsonify, session, send_file, abort, url_for
from config import Config
from models import get_db
from services.question_service import QuestionService
from services.scoring_service import ScoringService
from services.leaderboard_service import LeaderboardService
from services.media_service import MediaService

api_bp = Blueprint("api", __name__, url_prefix="/api")

NICKNAME_BANK = [
    "Pixel Detective", "Reality Hacker", "Neural Ninja", "Fake Finder",
    "Vision Wizard", "Deepfake Slayer", "Glitch Hunter", "Truth Seeker",
    "Cyber Sleuth", "Matrix Bender", "Prompt Hunter", "Turing Tester",
    "Bio Scanner", "Ghost Catcher", "Synthetic Sensei", "Artifact Ace",
    "Chrono Spotter", "Optic Phantom", "Diffusion Diver", "Zero Day Zen",
    "Quantum Quark", "Voxel Vanguard", "Pixel Paladin", "Iris Inspector",
    "Bokeh Bandit", "Frequency Fox", "Pattern Pilot", "Echo Eagle",
    "Syntax Samurai", "Logic Legend"
]

@api_bp.route("/nicknames/random", methods=["GET"])
def get_random_nicknames():
    chosen = random.sample(NICKNAME_BANK, 3)
    return jsonify({"nicknames": chosen})

@api_bp.route("/player/init", methods=["POST"])
def init_player():
    data = request.get_json(silent=True) or {}
    raw_nick = data.get("nickname", "").strip()
    if not raw_nick:
        return jsonify({"error": "Nickname is required"}), 400
        
    # Enforce 25 chars max, sanitize
    safe_nick = html.escape(raw_nick[:25])
    player_id = data.get("player_id") or session.get("player_id") or str(uuid.uuid4())
    
    conn = get_db()
    with conn:
        conn.execute(
            """INSERT INTO players (id, nickname, last_active)
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(id) DO UPDATE SET nickname = excluded.nickname, last_active = CURRENT_TIMESTAMP""",
            (player_id, safe_nick)
        )
    conn.close()
    
    session["player_id"] = player_id
    session["nickname"] = safe_nick
    
    return jsonify({
        "status": "success",
        "player_id": player_id,
        "nickname": safe_nick
    })

@api_bp.route("/game/solo/start", methods=["POST"])
def start_solo_game():
    data = request.get_json(silent=True) or {}
    player_id = data.get("player_id") or session.get("player_id")
    nickname = data.get("nickname") or session.get("nickname", "Anonymous Detective")
    
    if not player_id:
        player_id = str(uuid.uuid4())
        session["player_id"] = player_id
        session["nickname"] = nickname
        conn = get_db()
        with conn:
            conn.execute("INSERT OR IGNORE INTO players (id, nickname) VALUES (?, ?)", (player_id, nickname))
        conn.close()
        
    # Select 10 questions
    question_ids = QuestionService.select_game_questions(Config.QUESTIONS_PER_GAME)
    if not question_ids:
        return jsonify({"error": "No questions available in question bank"}), 500
        
    session_id = str(uuid.uuid4())
    
    conn = get_db()
    with conn:
        conn.execute(
            """INSERT INTO game_sessions 
            (id, player_id, nickname, mode, status, questions_sequence, current_question_index)
            VALUES (?, ?, ?, 'solo', 'in_progress', ?, 0)""",
            (session_id, player_id, nickname, json.dumps(question_ids))
        )
    conn.close()
    
    # Get first question sanitized
    first_q_id = question_ids[0]
    first_q = QuestionService.get_question_by_id(first_q_id)
    sanitized_q = QuestionService.sanitize_question_for_client(first_q, 0, len(question_ids))
    
    return jsonify({
        "status": "success",
        "session_id": session_id,
        "player_id": player_id,
        "nickname": nickname,
        "current_index": 0,
        "total_questions": len(question_ids),
        "question": sanitized_q
    })

@api_bp.route("/game/<session_id>/question/<int:index>", methods=["GET"])
def get_game_question(session_id, index):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM game_sessions WHERE id = ?", (session_id,))
    sess = cursor.fetchone()
    conn.close()
    
    if not sess:
        return jsonify({"error": "Game session not found"}), 404
        
    questions_list = json.loads(sess["questions_sequence"])
    if index < 0 or index >= len(questions_list):
        return jsonify({"error": "Question index out of range"}), 400
        
    q_id = questions_list[index]
    raw_q = QuestionService.get_question_by_id(q_id)
    if not raw_q:
        return jsonify({"error": "Question record not found"}), 404
        
    sanitized = QuestionService.sanitize_question_for_client(raw_q, index, len(questions_list))
    return jsonify({
        "status": "success",
        "session_id": session_id,
        "current_index": index,
        "total_questions": len(questions_list),
        "question": sanitized
    })

@api_bp.route("/game/<session_id>/answer", methods=["POST"])
def submit_answer(session_id):
    data = request.get_json(silent=True) or {}
    question_id = data.get("question_id")
    chosen_answer = data.get("chosen_answer", "").strip().upper() # "AI", "ASLI", or "UNANSWERED"
    time_taken = float(data.get("time_taken", 10.0))
    
    if not question_id:
        return jsonify({"error": "Missing question_id"}), 400
        
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM game_sessions WHERE id = ?", (session_id,))
    sess = cursor.fetchone()
    if not sess:
        conn.close()
        return jsonify({"error": "Session not found"}), 404
        
    # Check if answer was already submitted for this question
    cursor.execute(
        "SELECT id FROM session_answers WHERE session_id = ? AND question_id = ?",
        (session_id, question_id)
    )
    if cursor.fetchone():
        conn.close()
        return jsonify({"error": "Answer already locked for this question"}), 400
        
    # Fetch real question
    real_q = QuestionService.get_question_by_id(question_id)
    if not real_q:
        conn.close()
        return jsonify({"error": "Invalid question ID"}), 404
        
    # Calculate score
    total_time = Config.IMAGE_TIMER_SECONDS if real_q["type"] == "IMAGE" else Config.AUDIO_VIDEO_TIMER_SECONDS
    is_correct, base_points, speed_bonus, points_awarded = ScoringService.evaluate_answer(
        chosen_answer=chosen_answer,
        correct_answer=real_q["answer"],
        time_taken=time_taken,
        total_time=total_time
    )
    
    is_unanswered = chosen_answer in ("UNANSWERED", "TIMEOUT", "NONE", "")
    is_incorrect = not is_correct and not is_unanswered
    
    # Record answer in database
    with conn:
        conn.execute(
            """INSERT INTO session_answers
            (session_id, player_id, question_id, chosen_answer, is_correct, time_taken, speed_bonus, points_awarded)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                session_id,
                sess["player_id"],
                question_id,
                chosen_answer if not is_unanswered else "UNANSWERED",
                1 if is_correct else 0,
                time_taken,
                speed_bonus,
                points_awarded
            )
        )
        
        new_score = sess["score"] + points_awarded
        new_speed_bonus = sess["speed_bonus_total"] + speed_bonus
        new_correct = sess["correct_count"] + (1 if is_correct else 0)
        new_incorrect = sess["incorrect_count"] + (1 if is_incorrect else 0)
        new_unanswered = sess["unanswered_count"] + (1 if is_unanswered else 0)
        new_time_taken = sess["total_time_taken"] + time_taken
        new_index = sess["current_question_index"] + 1
        
        questions_list = json.loads(sess["questions_sequence"])
        is_game_over = (new_index >= len(questions_list))
        
        status = "completed" if is_game_over else "in_progress"
        completed_at = "CURRENT_TIMESTAMP" if is_game_over else None
        
        if is_game_over:
            conn.execute(
                """UPDATE game_sessions SET
                    score = ?, speed_bonus_total = ?, correct_count = ?,
                    incorrect_count = ?, unanswered_count = ?, total_time_taken = ?,
                    current_question_index = ?, status = 'completed', completed_at = CURRENT_TIMESTAMP
                WHERE id = ?""",
                (new_score, new_speed_bonus, new_correct, new_incorrect, new_unanswered, new_time_taken, new_index, session_id)
            )
        else:
            conn.execute(
                """UPDATE game_sessions SET
                    score = ?, speed_bonus_total = ?, correct_count = ?,
                    incorrect_count = ?, unanswered_count = ?, total_time_taken = ?,
                    current_question_index = ?
                WHERE id = ?""",
                (new_score, new_speed_bonus, new_correct, new_incorrect, new_unanswered, new_time_taken, new_index, session_id)
            )
    conn.close()
    
    # Aggregate stats
    stats = QuestionService.get_question_stats(question_id)
    
    return jsonify({
        "status": "success",
        "is_correct": is_correct,
        "is_unanswered": is_unanswered,
        "correct_answer": real_q["answer"],
        "explanation": real_q["explanation"],
        "base_points": base_points,
        "speed_bonus": speed_bonus,
        "points_awarded": points_awarded,
        "current_score": new_score,
        "next_index": new_index,
        "is_game_over": is_game_over,
        "stats": stats
    })

@api_bp.route("/media/masked/<question_id>", methods=["GET"])
def get_masked_media(question_id):
    """
    Serves question media without exposing whether it is in ai/ or asli/ folder.
    Protected against directory traversal.
    """
    q = QuestionService.get_question_by_id(question_id)
    if not q:
        abort(404, "Question not found")
        
    safe_path = MediaService.get_safe_media_path(q["media_path"])
    return send_file(str(safe_path))

@api_bp.route("/leaderboard/global", methods=["GET"])
def get_global_leaderboard():
    leaderboard = LeaderboardService.get_global_leaderboard(limit=50)
    current_session_id = request.args.get("session_id")
    player_standing = None
    if current_session_id:
        player_standing = LeaderboardService.get_player_standing(current_session_id)
    return jsonify({
        "status": "success",
        "leaderboard": leaderboard,
        "player_standing": player_standing
    })

@api_bp.route("/leaderboard/room/<room_code>", methods=["GET"])
def get_room_leaderboard(room_code):
    leaderboard = LeaderboardService.get_room_leaderboard(room_code.upper())
    return jsonify({
        "status": "success",
        "room_code": room_code.upper(),
        "leaderboard": leaderboard
    })

@api_bp.route("/qr/<room_code>", methods=["GET"])
def get_room_qr(room_code):
    """Generates dynamic QR code PNG image pointing to the player join page."""
    join_url = f"{request.host_url.rstrip('/')}/join/{room_code.upper()}"
    buf = MediaService.generate_qr_png_bytes(join_url)
    return send_file(buf, mimetype="image/png")

@api_bp.route("/qr/instagram", methods=["GET"])
def get_instagram_qr():
    """Generates official Zenith Instagram QR code PNG."""
    buf = MediaService.generate_qr_png_bytes(Config.INSTAGRAM_URL)
    return send_file(buf, mimetype="image/png")
