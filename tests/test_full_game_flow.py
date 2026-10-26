import sys
import unittest
import json
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from app import app
from config import Config
from models import get_db

class TestFullGameFlow(unittest.TestCase):
    def setUp(self):
        self.app = app
        self.app.config["TESTING"] = True
        self.client = self.app.test_client()

    def test_complete_6_question_game_and_results(self):
        """Simulates an entire 6-question match and verifies results and leaderboard persistence."""
        # 1. Nickname init
        nick_res = self.client.post("/api/player/init", json={"nickname": "E2ETester"})
        self.assertEqual(nick_res.status_code, 200)
        player_data = json.loads(nick_res.data)
        player_id = player_data["player_id"]

        # 2. Start game
        start_res = self.client.post("/api/game/solo/start", json={
            "player_id": player_id,
            "nickname": "E2ETester"
        })
        self.assertEqual(start_res.status_code, 200)
        start_data = json.loads(start_res.data)
        session_id = start_data["session_id"]
        self.assertEqual(start_data["total_questions"], 6)

        curr_q = start_data["question"]

        # 3. Play through all 6 questions
        for idx in range(6):
            # Answer question
            ans_res = self.client.post(f"/api/game/{session_id}/answer", json={
                "question_id": curr_q["id"],
                "chosen_answer": "AI",
                "time_taken": 2.0
            })
            self.assertEqual(ans_res.status_code, 200)
            ans_data = json.loads(ans_res.data)

            if idx < 5:
                self.assertFalse(ans_data["is_game_over"])
                next_res = self.client.get(f"/api/game/{session_id}/question/{idx + 1}")
                self.assertEqual(next_res.status_code, 200)
                curr_q = json.loads(next_res.data)["question"]
            else:
                self.assertTrue(ans_data["is_game_over"], "Game should be over after question 6!")

        # 4. Check results page loads successfully
        res_page = self.client.get(f"/results/{session_id}")
        self.assertEqual(res_page.status_code, 200)
        self.assertIn(b"GAME OVER", res_page.data)
        self.assertIn(b"E2ETester", res_page.data)

        # 5. Check global leaderboard contains this session
        lb_res = self.client.get(f"/api/leaderboard/global?session_id={session_id}")
        self.assertEqual(lb_res.status_code, 200)
        lb_data = json.loads(lb_res.data)
        self.assertIsNotNone(lb_data["player_standing"])
        self.assertEqual(lb_data["player_standing"]["nickname"], "E2ETester")
        self.assertGreaterEqual(lb_data["player_standing"]["score"], 0)

if __name__ == "__main__":
    unittest.main()
