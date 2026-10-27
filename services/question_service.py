import json
import random
import os
import re
import logging
from pathlib import Path
from config import Config
from models import get_db
from services.resource_sync_service import ResourceSyncService

logger = logging.getLogger(__name__)

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
    def auto_discover_questions():
        """
        Dynamically auto-discovers all media in media/images and media/videos:
        - Auto-syncs from S:\resources (or Config.EXTERNAL_RESOURCES_DIR) if mounted.
        - Subfolder 'ai' -> Answer: AI
        - Subfolder 'real' or 'asli' -> Answer: ASLI
        - Automatically registers any new media into the SQLite database.
        - Preserves custom metadata for existing questions.
        """
        try:
            ResourceSyncService.sync_all()
        except Exception as e:
            logger.warning(f"ResourceSyncService.sync_all warning: {e}")

        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT media_path, id FROM questions")
        existing_paths = {row["media_path"].replace("\\", "/").lower(): row["id"] for row in cursor.fetchall()}

        new_entries = []
        for type_folder, q_type in [("images", "IMAGE"), ("videos", "VIDEO")]:
            type_dir = Config.MEDIA_FOLDER / type_folder
            if not type_dir.exists():
                continue

            for answer_folder in ["ai", "real", "asli"]:
                ans_dir = type_dir / answer_folder
                if not ans_dir.exists():
                    continue

                ans = "AI" if answer_folder == "ai" else "ASLI"
                for file_path in ans_dir.iterdir():
                    if not file_path.is_file():
                        continue

                    # Check allowed extensions
                    ext = file_path.suffix.lower().lstrip(".")
                    if q_type == "IMAGE" and ext not in Config.ALLOWED_IMAGE_EXTENSIONS:
                        continue
                    if q_type == "VIDEO" and ext not in Config.ALLOWED_VIDEO_EXTENSIONS:
                        continue

                    rel_path = f"{type_folder}/{answer_folder}/{file_path.name}".replace("\\", "/")
                    if rel_path.lower() in existing_paths:
                        continue

                    # Generate clean, unique ID
                    clean_name = re.sub(r"[^a-zA-Z0-9]+", "_", file_path.stem).strip("_").upper()
                    prefix = "IMG" if q_type == "IMAGE" else "VID"
                    q_id = f"{prefix}-{ans}-{clean_name}"
                    
                    # Ensure ID uniqueness in batch
                    base_id = q_id
                    suffix_counter = 1
                    while any(e[0] == q_id for e in new_entries) or q_id in existing_paths.values():
                        q_id = f"{base_id}_{suffix_counter}"
                        suffix_counter += 1

                    category = "Visual Turing Test" if q_type == "IMAGE" else "Video Deepfake Benchmark"
                    if ans == "AI":
                        explanation = "AI-Generated Media: Synthetic artifacting, algorithmic hallucination, or unnatural boundary smoothing detected."
                    else:
                        explanation = "Authentic Reality: Natural optical depth, consistent physics, and authentic camera sensor characteristics."

                    new_entries.append((
                        q_id,
                        q_type,
                        rel_path,
                        ans,
                        explanation,
                        category,
                        "medium",
                        "Zenith AI vs ASLI Media Corpus",
                        1
                    ))

        if new_entries:
            with conn:
                conn.executemany(
                    """INSERT OR IGNORE INTO questions
                    (id, type, media_path, answer, explanation, category, difficulty, attribution, active)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    new_entries
                )
            logger.info(f"Auto-discovered and registered {len(new_entries)} new media questions.")

        # Clean up any obsolete questions whose media file does not exist on disk
        cursor.execute("SELECT id, media_path FROM questions")
        obsolete_ids = []
        for row in cursor.fetchall():
            m_path = Config.MEDIA_FOLDER / row["media_path"].replace("\\", "/")
            if not m_path.exists():
                obsolete_ids.append((row["id"],))
        if obsolete_ids:
            with conn:
                cursor.executemany("DELETE FROM questions WHERE id = ?", obsolete_ids)
            logger.info(f"Purged {len(obsolete_ids)} obsolete questions whose files no longer exist.")

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
    def select_game_questions(count=6, num_images=4, num_videos=2) -> list:
        """
        Randomly chooses 6 questions: exactly 4 images and 2 videos (balanced between AI and ASLI):
        - 4 Images: 2 AI + 2 ASLI
        - 2 Videos: 1 AI + 1 ASLI
        - Total: 6 questions (3 AI, 3 ASLI)
        - Shuffles order to avoid predictability.
        - Verified that media file exists on disk.
        """
        # Auto-discover any new files on disk first
        try:
            QuestionService.auto_discover_questions()
        except Exception as e:
            logger.warning(f"auto_discover_questions warning: {e}")

        all_qs = QuestionService.get_all_questions(active_only=True)
        
        # Verify media file exists on disk and is IMAGE or VIDEO
        valid_qs = []
        for q in all_qs:
            q_type = str(q.get("type", "")).upper()
            if q_type not in ("IMAGE", "VIDEO"):
                continue
            full_path = Config.MEDIA_FOLDER / q["media_path"].replace("\\", "/")
            if full_path.exists():
                valid_qs.append(q)
                
        if len(valid_qs) < count:
            selected = valid_qs
            random.shuffle(selected)
            return [q["id"] for q in selected]

        # Categorize valid questions by media type and answer
        image_ai = [q for q in valid_qs if q["type"] == "IMAGE" and q["answer"] == "AI"]
        image_asli = [q for q in valid_qs if q["type"] == "IMAGE" and q["answer"] == "ASLI"]
        video_ai = [q for q in valid_qs if q["type"] == "VIDEO" and q["answer"] == "AI"]
        video_asli = [q for q in valid_qs if q["type"] == "VIDEO" and q["answer"] == "ASLI"]

        # 1. Select 4 Images (target: 2 AI, 2 ASLI)
        half_img = num_images // 2
        ai_img_count = min(len(image_ai), half_img)
        asli_img_count = min(len(image_asli), num_images - ai_img_count)
        if ai_img_count + asli_img_count < num_images:
            ai_img_count = min(len(image_ai), num_images - asli_img_count)

        selected_images = []
        if image_ai and ai_img_count > 0:
            selected_images.extend(random.sample(image_ai, ai_img_count))
        if image_asli and asli_img_count > 0:
            selected_images.extend(random.sample(image_asli, asli_img_count))

        # Fallback if image pools were smaller than num_images
        all_images = [q for q in valid_qs if q["type"] == "IMAGE" and q not in selected_images]
        while len(selected_images) < num_images and all_images:
            pick = random.choice(all_images)
            selected_images.append(pick)
            all_images.remove(pick)

        # 2. Select 2 Videos (target: 1 AI, 1 ASLI)
        half_vid = num_videos // 2
        ai_vid_count = min(len(video_ai), half_vid)
        asli_vid_count = min(len(video_asli), num_videos - ai_vid_count)
        if ai_vid_count + asli_vid_count < num_videos:
            ai_vid_count = min(len(video_ai), num_videos - asli_vid_count)

        selected_videos = []
        if video_ai and ai_vid_count > 0:
            selected_videos.extend(random.sample(video_ai, ai_vid_count))
        if video_asli and asli_vid_count > 0:
            selected_videos.extend(random.sample(video_asli, asli_vid_count))

        # Fallback if video pools were smaller than num_videos
        all_videos = [q for q in valid_qs if q["type"] == "VIDEO" and q not in selected_videos]
        while len(selected_videos) < num_videos and all_videos:
            pick = random.choice(all_videos)
            selected_videos.append(pick)
            all_videos.remove(pick)

        # 3. Combine and ensure total count
        combined = selected_images + selected_videos
        remaining_all = [q for q in valid_qs if q not in combined]
        while len(combined) < count and remaining_all:
            pick = random.choice(remaining_all)
            combined.append(pick)
            remaining_all.remove(pick)

        # Shuffle so video questions appear at unpredictable positions
        random.shuffle(combined)
        return [q["id"] for q in combined]

    @staticmethod
    def sanitize_question_for_client(question: dict, index: int, total: int = 6) -> dict:
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
