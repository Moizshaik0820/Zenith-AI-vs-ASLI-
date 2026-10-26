import json
import random
import os
from pathlib import Path
from config import Config
from models import get_db

class QuestionService:
    @staticmethod
    def sync_questions_from_json():
        """Reads data/questions.json and populates the SQLite questions table if empty or updated."""
        json_path = Path(Config.QUESTIONS_JSON)
        if not json_path.exists():
            return
            
        with open(json_path, "r", encoding="utf-8") as f:
            questions = json.load(f)
            
        conn = get_db()
        with conn:
            for q in questions:
                conn.execute(
                    """INSERT OR REPLACE INTO questions 
                    (id, type, media_path, answer, explanation, category, difficulty, attribution, active)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (
                        q["id"],
                        q["type"].upper(),
                        q["media_path"],
                        q["answer"].upper(),
                        q.get("explanation", ""),
                        q.get("category", "General"),
                        q.get("difficulty", "medium"),
                        q.get("attribution", ""),
                        1 if q.get("active", True) else 0
                    )
                )
        conn.close()

    @staticmethod
    def get_all_questions(active_only=True):
        conn = get_db()
        cursor = conn.cursor()
        if active_only:
            cursor.execute("SELECT * FROM questions WHERE active = 1")
        else:
            cursor.execute("SELECT * FROM questions")
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return rows

    @staticmethod
    def get_question_by_id(question_id: str):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM questions WHERE id = ?", (question_id,))
        row = cursor.fetchone()
        conn.close()
        return dict(row) if row else None

    @staticmethod
    def select_game_questions(count=6) -> list:
        """
        Randomly chooses 6 eligible questions (Image and Video only, no audio) from the bank:
        - Balances AI and ASLI answers as closely as possible.
        - Checks media asset exists on disk.
        - Shuffles order to avoid predictability.
        """
        all_qs = QuestionService.get_all_questions(active_only=True)
        
        # Verify media file exists AND is image or video (NO audio per instruction)
        valid_qs = []
        for q in all_qs:
            q_type = str(q.get("type", "")).upper()
            if q_type not in ("IMAGE", "VIDEO"):
                continue
            full_path = Config.MEDIA_FOLDER / q["media_path"].replace("\\", "/")
            if full_path.exists():
                valid_qs.append(q)
                
        if len(valid_qs) < count:
            # Fallback if fewer than count questions available
            selected = valid_qs
            random.shuffle(selected)
            return [q["id"] for q in selected]

        ai_pool = [q for q in valid_qs if q["answer"].upper() == "AI"]
        asli_pool = [q for q in valid_qs if q["answer"].upper() == "ASLI"]
        
        half = count // 2
        ai_count = min(len(ai_pool), half)
        asli_count = min(len(asli_pool), count - ai_count)
        
        # In case one pool is short, fill remainder from the other
        if ai_count + asli_count < count:
            ai_count = min(len(ai_pool), count - asli_count)
            asli_count = min(len(asli_pool), count - ai_count)
            
        selected_ai = random.sample(ai_pool, ai_count)
        selected_asli = random.sample(asli_pool, asli_count)
        
        combined = selected_ai + selected_asli
        
        # If still short (e.g. fewer total available), fill from remaining valid
        remaining = [q for q in valid_qs if q not in combined]
        while len(combined) < count and remaining:
            choice = random.choice(remaining)
            combined.append(choice)
            remaining.remove(choice)
            
        random.shuffle(combined)
        return [q["id"] for q in combined]

    @staticmethod
    def sanitize_question_for_client(question: dict, index: int, total: int = 10) -> dict:
        """
        Never reveals the answer, explanation, or file path in client metadata.
        """
        q_type = question["type"].upper()
        total_time = Config.IMAGE_TIMER_SECONDS if q_type == "IMAGE" else Config.AUDIO_VIDEO_TIMER_SECONDS
        
        return {
            "id": question["id"],
            "index": index + 1,
            "total": total,
            "type": q_type,
            "media_url": f"/api/media/masked/{question['id']}",
            "category": question.get("category", "Observation"),
            "difficulty": question.get("difficulty", "medium"),
            "total_time": total_time,
            "is_av": (q_type in ("AUDIO", "VIDEO"))
        }

    @staticmethod
    def get_question_stats(question_id: str) -> dict:
        """
        Calculates real, aggregate percentage correct vs incorrect from database records.
        """
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            """SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct
            FROM session_answers 
            WHERE question_id = ? AND chosen_answer != 'UNANSWERED'""",
            (question_id,)
        )
        row = cursor.fetchone()
        conn.close()
        
        total = row["total"] if row and row["total"] else 0
        correct = row["correct"] if row and row["correct"] else 0
        
        if total == 0:
            # Baseline benchmark if no answers recorded yet
            return {
                "total_answers": 0,
                "correct_pct": 50,
                "incorrect_pct": 50,
                "display": "50% CORRECT | 50% INCORRECT (Initial Baseline)"
            }
            
        correct_pct = int(round((correct / total) * 100))
        incorrect_pct = 100 - correct_pct
        return {
            "total_answers": total,
            "correct_pct": correct_pct,
            "incorrect_pct": incorrect_pct,
            "display": f"{correct_pct}% CORRECT | {incorrect_pct}% INCORRECT"
        }
