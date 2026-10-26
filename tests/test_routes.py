import sys
import unittest
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from app import app

class TestAllRoutes(unittest.TestCase):
    def setUp(self):
        self.app = app
        self.app.config["TESTING"] = True
        self.client = self.app.test_client()

    def test_page_routes(self):
        pages = [
            ("/", 200),
            ("/nickname", 200),
            ("/modes", 200),
            ("/game", 200),
            ("/lobby/ABCDEF", 200),
            ("/game/host/ABCDEF", 200),
            ("/join/ABCDEF", 200),
            ("/leaderboard", 200),
            ("/nonexistent-page-xyz", 404),
        ]
        for url, expected_status in pages:
            res = self.client.get(url)
            self.assertEqual(res.status_code, expected_status, f"Route {url} returned {res.status_code}")

    def test_api_routes(self):
        # Nicknames random
        res = self.client.get("/api/nicknames/random")
        self.assertEqual(res.status_code, 200)

        # Leaderboard
        res = self.client.get("/api/leaderboard/global")
        self.assertEqual(res.status_code, 200)

        # QR Codes
        res = self.client.get("/api/qr/TEST12")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.content_type, "image/png")

        res = self.client.get("/api/qr/instagram")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.content_type, "image/png")

        # Masked media
        res = self.client.get("/api/media/masked/IMG-AI-001")
        self.assertEqual(res.status_code, 200)

if __name__ == "__main__":
    unittest.main()
