import time
import json
import random
import string
from flask import request
from flask_socketio import emit, join_room, leave_room
from models import get_db
from config import Config
from services.question_service import QuestionService
from services.scoring_service import ScoringService
from services.leaderboard_service import LeaderboardService

# Memory store for active room answer tracking during answering phase
active_room_answers = {} # room_code -> { question_id -> { player_id -> answer_dict } }
revealed_questions = set() # (room_code, question_id) to prevent duplicate reveals

def generate_room_code(length=6):
    chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" # Exclude confusing chars 0/O, 1/I
    return "".join(random.choice(chars) for _ in range(length))

def register_multiplayer_events(socketio):
    def reveal_question(room_code, question_id):
        key = (room_code, question_id)
        if key in revealed_questions:
            return
        revealed_questions.add(key)
        
        real_q = QuestionService.get_question_by_id(question_id)
        if not real_q:
            return
            
        answers_dict = active_room_answers.get(room_code, {}).get(question_id, {})
        total_in_room = len(answers_dict)
        correct_in_room = sum(1 for a in answers_dict.values() if a.get("is_correct"))
        
        room_correct_pct = int(round((correct_in_room / total_in_room) * 100)) if total_in_room > 0 else 50
        room_incorrect_pct = 100 - room_correct_pct
        
        # Get live room leaderboard
        room_leaderboard = LeaderboardService.get_room_leaderboard(room_code)
        
        socketio.emit("reveal_feedback", {
            "question_id": question_id,
            "correct_answer": real_q["answer"],
            "explanation": real_q["explanation"],
            "room_stats": {
                "total_answered": total_in_room,
                "correct_pct": room_correct_pct,
                "incorrect_pct": room_incorrect_pct,
                "display": f"{room_correct_pct}% CORRECT | {room_incorrect_pct}% INCORRECT"
            },
            "leaderboard": room_leaderboard
        }, to=room_code)

    @socketio.on("create_room")
    def handle_create_room(data):
        player_id = (data.get("player_id") or "").strip()
        if not player_id:
            player_id = f"p_{generate_room_code(8).lower()}"
            
        nickname = (data.get("nickname") or "Host").strip()[:25]
        mode = data.get("mode", "friends") # "friends" or "big_screen"
        
        room_code = generate_room_code()
        questions = QuestionService.select_game_questions(Config.QUESTIONS_PER_GAME)
        
        conn = get_db()
        with conn:
            conn.execute(
                """INSERT INTO rooms 
                (code, host_player_id, host_nickname, mode, status, questions_sequence, current_question_index)
                VALUES (?, ?, ?, ?, 'waiting', ?, 0)""",
                (room_code, player_id, nickname, mode, json.dumps(questions))
            )
            # Add host as participant
            conn.execute(
                """INSERT OR REPLACE INTO room_participants
                (room_code, player_id, nickname, is_host)
                VALUES (?, ?, ?, 1)""",
                (room_code, player_id, nickname)
            )
        conn.close()
        
        join_room(room_code)
        active_room_answers[room_code] = {}
        
        emit("room_created", {
            "status": "success",
            "room_code": room_code,
            "player_id": player_id,
            "mode": mode,
            "host_nickname": nickname,
            "join_url": f"/lobby/{room_code}" if mode == "friends" else f"/join/{room_code}"
        })

    @socketio.on("join_room")
    def handle_join_room(data):
        room_code = data.get("room_code", "").strip().upper()
        player_id = (data.get("player_id") or "").strip()
        if not player_id:
            player_id = f"p_{generate_room_code(8).lower()}"
            
        nickname = (data.get("nickname") or "Anonymous").strip()[:25]
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM rooms WHERE code = ?", (room_code,))
        room = cursor.fetchone()
        
        if not room:
            conn.close()
            emit("join_error", {"message": f"Room '{room_code}' was not found. Please verify code."})
            return
            
        if room["status"] == "finished":
            conn.close()
            emit("join_error", {"message": f"Room '{room_code}' has already ended."})
            return
            
        # Check if player is the designated host
        is_host = 1 if (player_id and player_id == room["host_player_id"]) else 0
        with conn:
            conn.execute(
                """INSERT OR REPLACE INTO room_participants
                (room_code, player_id, nickname, is_host)
                VALUES (?, ?, ?, ?)""",
                (room_code, player_id, nickname, is_host)
            )
            
        # Fetch current player list
        cursor.execute("SELECT player_id, nickname, is_host FROM room_participants WHERE room_code = ?", (room_code,))
        participants = [dict(r) for r in cursor.fetchall()]

        # Check if match is already in progress and retrieve current question
        current_question = None
        questions_list = json.loads(room["questions_sequence"]) if room["questions_sequence"] else []
        if room["status"] == "playing" and questions_list:
            curr_idx = room["current_question_index"]
            if curr_idx < len(questions_list):
                raw_q = QuestionService.get_question_by_id(questions_list[curr_idx])
                current_question = QuestionService.sanitize_question_for_client(raw_q, curr_idx, len(questions_list))
                
        conn.close()
        
        join_room(room_code)
        
        emit("joined_successfully", {
            "room_code": room_code,
            "player_id": player_id,
            "nickname": nickname,
            "is_host": bool(is_host),
            "mode": room["mode"],
            "status": room["status"],
            "participants": participants,
            "current_index": room["current_question_index"],
            "total_questions": len(questions_list),
            "current_question": current_question
        })
        
        # Broadcast to room that player joined
        emit("player_joined", {
            "player_id": player_id,
            "nickname": nickname,
            "count": len(participants),
            "participants": participants
        }, to=room_code)

    @socketio.on("start_room_game")
    def handle_start_room_game(data):
        room_code = data.get("room_code", "").strip().upper()
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM rooms WHERE code = ?", (room_code,))
        room = cursor.fetchone()
        if not room:
            conn.close()
            return
            
        questions_list = json.loads(room["questions_sequence"])
        first_q_id = questions_list[0]
        raw_q = QuestionService.get_question_by_id(first_q_id)
        sanitized = QuestionService.sanitize_question_for_client(raw_q, 0, len(questions_list))
        
        with conn:
            conn.execute("UPDATE rooms SET status = 'playing', current_question_index = 0 WHERE code = ?", (room_code,))
        conn.close()
        
        if room_code not in active_room_answers:
            active_room_answers[room_code] = {}
        active_room_answers[room_code][first_q_id] = {}
        
        emit("room_game_started", {
            "current_index": 0,
            "total_questions": len(questions_list),
            "question": sanitized
        }, to=room_code)

    @socketio.on("submit_room_answer")
    def handle_submit_room_answer(data):
        room_code = data.get("room_code", "").strip().upper()
        player_id = data.get("player_id")
        question_id = data.get("question_id")
        chosen_answer = data.get("chosen_answer", "").strip().upper()
        time_taken = float(data.get("time_taken", 10.0))
        
        if room_code not in active_room_answers:
            active_room_answers[room_code] = {}
        if question_id not in active_room_answers[room_code]:
            active_room_answers[room_code][question_id] = {}
            
        # Check if already answered
        if player_id in active_room_answers[room_code][question_id]:
            return # Ignore duplicate submissions
            
        real_q = QuestionService.get_question_by_id(question_id)
        if not real_q:
            return
            
        total_time = Config.IMAGE_TIMER_SECONDS if real_q["type"] == "IMAGE" else Config.AUDIO_VIDEO_TIMER_SECONDS
        is_correct, base_points, speed_bonus, points_awarded = ScoringService.evaluate_answer(
            chosen_answer=chosen_answer,
            correct_answer=real_q["answer"],
            time_taken=time_taken,
            total_time=total_time
        )
        
        record = {
            "player_id": player_id,
            "chosen_answer": chosen_answer,
            "is_correct": is_correct,
            "points_awarded": points_awarded,
            "speed_bonus": speed_bonus,
            "time_taken": time_taken
        }
        active_room_answers[room_code][question_id][player_id] = record
        
        # Update participant score in DB
        conn = get_db()
        with conn:
            conn.execute(
                """UPDATE room_participants SET
                    score = score + ?,
                    speed_bonus_total = speed_bonus_total + ?,
                    correct_count = correct_count + (CASE WHEN ? = 1 THEN 1 ELSE 0 END)
                WHERE room_code = ? AND player_id = ?""",
                (points_awarded, speed_bonus, 1 if is_correct else 0, room_code, player_id)
            )
        
        # Count total answered so far for this question
        total_answers = len(active_room_answers[room_code][question_id])
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as count FROM room_participants WHERE room_code = ?", (room_code,))
        total_participants = cursor.fetchone()["count"]
        conn.close()
        
        # Send confirmation to the specific player
        emit("answer_acknowledged", {
            "question_id": question_id,
            "chosen_answer": chosen_answer,
            "points_awarded": points_awarded,
            "speed_bonus": speed_bonus
        })
        
        # Broadcast count of submitted answers to the room
        emit("live_answer_count", {
            "question_id": question_id,
            "answered_count": total_answers,
            "total_participants": total_participants
        }, to=room_code)
        
        # If all participants in the room have answered, reveal feedback immediately!
        if total_answers >= total_participants and total_participants > 0:
            reveal_question(room_code, question_id)

    @socketio.on("end_question_phase")
    def handle_end_question_phase(data):
        """Host or timer calls this when answer timer runs out. Reveals correct answer & stats!"""
        room_code = data.get("room_code", "").strip().upper()
        question_id = data.get("question_id")
        reveal_question(room_code, question_id)

    @socketio.on("next_room_question")
    def handle_next_room_question(data):
        room_code = data.get("room_code", "").strip().upper()
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM rooms WHERE code = ?", (room_code,))
        room = cursor.fetchone()
        if not room:
            conn.close()
            return
            
        questions_list = json.loads(room["questions_sequence"])
        next_idx = room["current_question_index"] + 1
        
        if next_idx >= len(questions_list):
            # Game Over for Room!
            with conn:
                conn.execute("UPDATE rooms SET status = 'finished' WHERE code = ?", (room_code,))
            conn.close()
            
            final_leaderboard = LeaderboardService.get_room_leaderboard(room_code)
            emit("room_game_over", {
                "room_code": room_code,
                "leaderboard": final_leaderboard
            }, to=room_code)
            return
            
        with conn:
            conn.execute("UPDATE rooms SET current_question_index = ? WHERE code = ?", (next_idx, room_code))
        conn.close()
        
        next_q_id = questions_list[next_idx]
        raw_q = QuestionService.get_question_by_id(next_q_id)
        sanitized = QuestionService.sanitize_question_for_client(raw_q, next_idx, len(questions_list))
        
        if room_code not in active_room_answers:
            active_room_answers[room_code] = {}
        active_room_answers[room_code][next_q_id] = {}
        
        emit("advance_question", {
            "current_index": next_idx,
            "total_questions": len(questions_list),
            "question": sanitized
        }, to=room_code)
