import os
import json
import uuid
from pathlib import Path
from flask import Blueprint, request, jsonify, session, render_template, redirect, url_for, flash
from config import Config
from models import get_db
from services.question_service import QuestionService
from services.media_service import MediaService

admin_bp = Blueprint("admin", __name__, url_prefix="/admin")

def is_admin_authenticated():
    return session.get("is_admin", False) is True

@admin_bp.route("/login", methods=["POST"])
def login():
    username = request.form.get("username", "").strip()
    password = request.form.get("password", "").strip()
    
    if username == Config.ADMIN_USERNAME and password == Config.ADMIN_PASSWORD:
        session["is_admin"] = True
        session.permanent = True
        return jsonify({"status": "success", "message": "Authenticated"})
    return jsonify({"status": "error", "message": "Invalid administrator credentials"}), 401

@admin_bp.route("/logout", methods=["POST", "GET"])
def logout():
    session.pop("is_admin", None)
    return redirect(url_for("pages.admin"))

@admin_bp.route("/questions", methods=["GET"])
def list_questions():
    if not is_admin_authenticated():
        return jsonify({"error": "Unauthorized"}), 401
    questions = QuestionService.get_all_questions(active_only=False)
    return jsonify({"status": "success", "questions": questions})

@admin_bp.route("/questions/add", methods=["POST"])
def add_question():
    if not is_admin_authenticated():
        return jsonify({"error": "Unauthorized"}), 401
        
    q_type = request.form.get("type", "IMAGE").strip().upper()
    answer = request.form.get("answer", "AI").strip().upper()
    explanation = request.form.get("explanation", "").strip()
    category = request.form.get("category", "General").strip()
    difficulty = request.form.get("difficulty", "medium").strip().lower()
    attribution = request.form.get("attribution", "").strip()
    
    if q_type not in ("IMAGE", "AUDIO", "VIDEO"):
        return jsonify({"error": "Invalid media type. Must be IMAGE, AUDIO, or VIDEO."}), 400
    if answer not in ("AI", "ASLI"):
        return jsonify({"error": "Answer must be AI or ASLI"}), 400
    if not explanation:
        return jsonify({"error": "Explanation is required"}), 400
        
    media_file = request.files.get("media_file")
    if not media_file or not media_file.filename:
        return jsonify({"error": "A media file is required"}), 400
        
    if not MediaService.is_allowed_file(media_file.filename, q_type):
        return jsonify({"error": f"File extension not permitted for {q_type}."}), 400
        
    # Save file
    try:
        rel_media_path = MediaService.save_uploaded_media(media_file, q_type, answer)
    except Exception as e:
        return jsonify({"error": f"Failed to save file: {str(e)}"}), 500
        
    # Generate question ID
    q_id = f"{q_type[:3]}-{answer[:2]}-{uuid.uuid4().hex[:6].upper()}"
    
    conn = get_db()
    with conn:
        conn.execute(
            """INSERT INTO questions
            (id, type, media_path, answer, explanation, category, difficulty, attribution, active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)""",
            (q_id, q_type, rel_media_path, answer, explanation, category, difficulty, attribution)
        )
    conn.close()
    
    # Sync back to JSON so data persists
    _sync_db_to_json()
    
    return jsonify({"status": "success", "id": q_id, "message": "Question added successfully!"})

@admin_bp.route("/questions/toggle/<question_id>", methods=["POST"])
def toggle_question(question_id):
    if not is_admin_authenticated():
        return jsonify({"error": "Unauthorized"}), 401
        
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT active FROM questions WHERE id = ?", (question_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "Question not found"}), 404
        
    new_active = 0 if row["active"] == 1 else 1
    with conn:
        conn.execute("UPDATE questions SET active = ? WHERE id = ?", (new_active, question_id))
    conn.close()
    
    _sync_db_to_json()
    return jsonify({"status": "success", "active": new_active})

@admin_bp.route("/questions/delete/<question_id>", methods=["POST"])
def delete_question(question_id):
    if not is_admin_authenticated():
        return jsonify({"error": "Unauthorized"}), 401
        
    conn = get_db()
    with conn:
        conn.execute("DELETE FROM questions WHERE id = ?", (question_id,))
    conn.close()
    
    _sync_db_to_json()
    return jsonify({"status": "success", "message": "Question deleted"})

def _sync_db_to_json():
    """Syncs the current state of SQLite questions back to data/questions.json."""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM questions ORDER BY created_at ASC")
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        for r in rows:
            r["active"] = bool(r.get("active", 1))
        with open(Config.QUESTIONS_JSON, "w", encoding="utf-8") as f:
            json.dump(rows, f, indent=2)
    except Exception as e:
        print(f"Failed to sync questions to JSON: {e}")
