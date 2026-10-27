import unittest
import json
from pathlib import Path
from app import app
from config import Config
from services.question_service import QuestionService
from services.meme_service import MemeService
from services.resource_sync_service import ResourceSyncService

class TestResourcesAndMedia(unittest.TestCase):
    def setUp(self):
        self.app = app
        self.app.config["TESTING"] = True
        self.client = self.app.test_client()

    def test_question_composition_4_images_2_videos(self):
        """Verifies games select exactly 4 images and 2 videos, balanced 3 AI and 3 ASLI."""
        q_ids = QuestionService.select_game_questions(count=6, num_images=4, num_videos=2)
        self.assertEqual(len(q_ids), 6)

        types = []
        answers = []
        for q_id in q_ids:
            q = QuestionService.get_question_by_id(q_id)
            self.assertIsNotNone(q, f"Question {q_id} should exist")
            types.append(q["type"])
            answers.append(q["answer"])

        self.assertEqual(types.count("IMAGE"), 4, f"Expected 4 images, got: {types}")
        self.assertEqual(types.count("VIDEO"), 2, f"Expected 2 videos, got: {types}")
        self.assertEqual(answers.count("AI"), 3, f"Expected 3 AI questions, got: {answers}")
        self.assertEqual(answers.count("ASLI"), 3, f"Expected 3 ASLI questions, got: {answers}")

    def test_meme_service_correct_and_wrong(self):
        """Verifies memes are correctly chosen based on is_correct."""
        correct_meme = MemeService.get_random_meme(is_correct=True)
        wrong_meme = MemeService.get_random_meme(is_correct=False)

        self.assertTrue(
            "/memes/correct/" in correct_meme or "meme-correct" in correct_meme,
            f"Expected correct meme, got: {correct_meme}"
        )
        self.assertTrue(
            "/memes/wrong/" in wrong_meme or "meme-wrong" in wrong_meme or "meme-i-saw-that" in wrong_meme,
            f"Expected wrong meme, got: {wrong_meme}"
        )

    def test_answer_api_returns_reaction_meme(self):
        """Verifies answer API includes dynamic reaction meme matching answer result."""
        # 1. Init player
        res_init = self.client.post("/api/player/init", json={"nickname": "MediaTester"})
        player_id = res_init.get_json()["player_id"]

        # 2. Start game
        res_start = self.client.post("/api/game/solo/start", json={"player_id": player_id, "nickname": "MediaTester"})
        start_data = res_start.get_json()
        session_id = start_data["session_id"]
        q = start_data["question"]

        # 3. Answer question
        ans_res = self.client.post(f"/api/game/{session_id}/answer", json={
            "question_id": q["id"],
            "chosen_answer": "AI",
            "time_taken": 2.5
        })
        self.assertEqual(ans_res.status_code, 200)
        ans_data = ans_res.get_json()

        self.assertIn("meme_url", ans_data)
        self.assertTrue(len(ans_data["meme_url"]) > 0)
        if ans_data["is_correct"]:
            self.assertTrue("/memes/correct/" in ans_data["meme_url"] or "meme-correct" in ans_data["meme_url"])
        else:
            self.assertTrue("/memes/wrong/" in ans_data["meme_url"] or "meme-wrong" in ans_data["meme_url"])

    def test_resource_sync_handles_absent_path_gracefully(self):
        """Verifies ResourceSyncService fails gracefully when directory is not mounted."""
        result = ResourceSyncService.sync_all(source_base=Path("Z:/nonexistent_folder_xyz"))
        self.assertFalse(result["synced"])
