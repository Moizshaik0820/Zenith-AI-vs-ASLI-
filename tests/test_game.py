import sys
import unittest
import json
from pathlib import Path

# Add project root to path
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from app import app, create_app
from config import Config
from models import get_db, init_db
from services.scoring_service import ScoringService
from services.question_service import QuestionService
from services.leaderboard_service import LeaderboardService
from services.media_service import MediaService
from routes.multiplayer import generate_room_code

class TestAiVsAsliGame(unittest.TestCase):

    def setUp(self):
        self.app = app
        self.app.config["TESTING"] = True
        self.client = self.app.test_client()

    def test_scoring_formula(self):
        """Verify deterministic speed-based scoring formula (fixed 100 pts removed)."""
        # 1. Correct with maximum remaining time (instant answer: 100 pts)
        is_corr, base, bonus, total = ScoringService.evaluate_answer("AI", "AI", time_taken=0.0, total_time=10.0)
        self.assertTrue(is_corr)
        self.assertEqual(base, 0)
        self.assertEqual(bonus, 100)
        self.assertEqual(total, 100)

        # 2. Correct with 5 seconds remaining out of 10s -> floor(100 * 5 / 10) = 50 pts
        is_corr, base, bonus, total = ScoringService.evaluate_answer("ASLI", "ASLI", time_taken=5.0, total_time=10.0)
        self.assertTrue(is_corr)
        self.assertEqual(base, 0)
        self.assertEqual(bonus, 50)
        self.assertEqual(total, 50)

        # 3. Correct with 0 seconds remaining (at deadline) -> min speed floor = 10 pts
        is_corr, base, bonus, total = ScoringService.evaluate_answer("AI", "AI", time_taken=10.0, total_time=10.0)
        self.assertTrue(is_corr)
        self.assertEqual(base, 0)
        self.assertEqual(bonus, 10)
        self.assertEqual(total, 10)

        # 4. Incorrect answer -> 0 points
        is_corr, base, bonus, total = ScoringService.evaluate_answer("AI", "ASLI", time_taken=2.0, total_time=10.0)
        self.assertFalse(is_corr)
        self.assertEqual(total, 0)

        # 5. Unanswered or timeout -> 0 points
        is_corr, base, bonus, total = ScoringService.evaluate_answer("UNANSWERED", "AI", time_taken=10.0, total_time=10.0)
        self.assertFalse(is_corr)
        self.assertEqual(total, 0)

    def test_question_selection_and_balancing(self):
        """Verifies that 6 questions are selected, balanced between AI and ASLI, without duplicates."""
        selected_ids = QuestionService.select_game_questions(Config.QUESTIONS_PER_GAME)
        self.assertEqual(len(selected_ids), 6)
        self.assertEqual(len(set(selected_ids)), 6, "Duplicate question IDs found in selection!")

        # Check balance
        ai_count = 0
        asli_count = 0
        for q_id in selected_ids:
            q = QuestionService.get_question_by_id(q_id)
            if q["answer"] == "AI":
                ai_count += 1
            elif q["answer"] == "ASLI":
                asli_count += 1

        self.assertEqual(ai_count, 3, f"Expected 3 AI questions, got {ai_count}")
        self.assertEqual(asli_count, 3, f"Expected 3 ASLI questions, got {asli_count}")

    def test_question_sanitization(self):
        """Verifies that questions sent to client never expose ground truth answer or raw paths."""
        raw_q = QuestionService.get_question_by_id("IMG-AI-AI_1")
        self.assertIsNotNone(raw_q)

        sanitized = QuestionService.sanitize_question_for_client(raw_q, index=0, total=10)
        self.assertNotIn("answer", sanitized, "Security leak: answer exposed in client payload!")
        self.assertNotIn("explanation", sanitized, "Security leak: explanation exposed before lock!")
        self.assertNotIn("ai/", sanitized["media_url"].lower(), "Security leak: folder path exposes answer!")
        self.assertNotIn("asli/", sanitized["media_url"].lower(), "Security leak: folder path exposes answer!")
        self.assertTrue(sanitized["media_url"].startswith("/api/media/masked/"))

    def test_solo_game_flow_and_anti_cheat_lock(self):
        """Verifies starting a game session, answering, and preventing duplicate answers."""
        # 1. Start solo game
        res = self.client.post("/api/game/solo/start", json={"nickname": "TestDetector"})
        data = json.loads(res.data)
        self.assertEqual(res.status_code, 200)
        session_id = data["session_id"]
        first_q = data["question"]
        q_id = first_q["id"]

        # 2. Submit answer
        ans_res = self.client.post(f"/api/game/{session_id}/answer", json={
            "question_id": q_id,
            "chosen_answer": "AI",
            "time_taken": 2.5
        })
        ans_data = json.loads(ans_res.data)
        self.assertEqual(ans_res.status_code, 200)
        self.assertIn("is_correct", ans_data)
        self.assertIn("explanation", ans_data)
        self.assertIn("stats", ans_data)

        # 3. Attempt to submit again for same question (anti-cheat lock)
        dup_res = self.client.post(f"/api/game/{session_id}/answer", json={
            "question_id": q_id,
            "chosen_answer": "ASLI",
            "time_taken": 1.0
        })
        self.assertEqual(dup_res.status_code, 400, "Cheating allowed: multiple answers accepted for same question!")

    def test_leaderboard_ranking_policy(self):
        """Verifies ranking policy: 1. Score DESC, 2. Correct DESC, 3. Time ASC."""
        leaderboard = LeaderboardService.get_global_leaderboard(limit=10)
        self.assertGreater(len(leaderboard), 0)

        for i in range(len(leaderboard) - 1):
            curr = leaderboard[i]
            nxt = leaderboard[i + 1]
            if curr["score"] == nxt["score"]:
                if curr["correct_count"] == nxt["correct_count"]:
                    self.assertLessEqual(curr["total_time_taken"], nxt["total_time_taken"])
                else:
                    self.assertGreaterEqual(curr["correct_count"], nxt["correct_count"])
            else:
                self.assertGreater(curr["score"], nxt["score"])

    def test_media_path_traversal_protection(self):
        """Verifies path traversal attempts are safely rejected."""
        with self.assertRaises(Exception):
            MediaService.get_safe_media_path("../../config.py")

        with self.assertRaises(Exception):
            MediaService.get_safe_media_path("../../../../etc/passwd")

    def test_room_code_generation(self):
        """Verifies room codes are 6 characters and avoid confusing letters (0, O, 1, I)."""
        for _ in range(20):
            code = generate_room_code(6)
            self.assertEqual(len(code), 6)
            self.assertTrue(code.isalnum())
            self.assertNotIn("0", code)
            self.assertNotIn("O", code)
            self.assertNotIn("1", code)
            self.assertNotIn("I", code)

    def test_room_qr_endpoint(self):
        """Verifies QR code endpoint generates valid PNG with robust host resolution."""
        # 1. Standard request
        res = self.client.get("/api/qr/TEST99")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.mimetype, "image/png")
        self.assertGreater(len(res.data), 100)

        # 2. Render proxy headers with comma-separated proto
        res2 = self.client.get(
            "/api/qr/TEST99",
            headers={
                "X-Forwarded-Proto": "https, http",
                "X-Forwarded-Host": "vs-asli.onrender.com"
            }
        )
        self.assertEqual(res2.status_code, 200)
        self.assertEqual(res2.mimetype, "image/png")

    def test_join_room_page_contains_arena(self):
        """Verifies /join/<room_code> page contains #multiplayerArena for participant controller."""
        res = self.client.get("/join/TEST99")
        self.assertEqual(res.status_code, 200)
        html = res.data.decode("utf-8")
        self.assertIn('id="multiplayerArena"', html)
        self.assertIn("TEST99", html)

if __name__ == "__main__":
    unittest.main()
