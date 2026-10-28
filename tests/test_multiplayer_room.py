import unittest
import json
from app import app, socketio
from models import get_db, init_db
from services.question_service import QuestionService
from services.leaderboard_service import LeaderboardService

class TestMultiplayerRoomFlow(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = app
        cls.socketio = socketio
        cls.app.config["TESTING"] = True
        cls.client = cls.app.test_client()
        init_db()

    def test_room_check_api_nonexistent(self):
        """Verifies checking a nonexistent room code returns 404 with exists: False."""
        res = self.client.get("/api/room/check/NONEX9")
        self.assertEqual(res.status_code, 404)
        data = res.get_json()
        self.assertFalse(data["exists"])

    def test_room_creation_and_joining_and_leaderboard(self):
        """
        Tests complete multiplayer room flow:
        - Host creates room
        - Friend checks and joins room
        - Game starts with synchronized questions
        - Both submit answers
        - Leaderboard only contains participants from that room
        """
        socket_host = self.socketio.test_client(self.app)
        socket_friend = self.socketio.test_client(self.app)
        
        # 1. Host creates room
        socket_host.emit("create_room", {
            "player_id": "host_p1",
            "nickname": "HostPlayer",
            "mode": "friends"
        })
        received = socket_host.get_received()
        created_event = next(e for e in received if e["name"] == "room_created")
        room_code = created_event["args"][0]["room_code"]
        self.assertTrue(len(room_code) >= 6)
        
        # 2. Verify /api/room/check/<room_code>
        res = self.client.get(f"/api/room/check/{room_code}")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["exists"])
        self.assertEqual(data["mode"], "friends")
        self.assertEqual(data["host_nickname"], "HostPlayer")

        # 3. Friend joins room
        socket_friend.emit("join_room", {
            "room_code": room_code,
            "player_id": "friend_p2",
            "nickname": "FriendPlayer"
        })
        received_friend = socket_friend.get_received()
        joined_event = next(e for e in received_friend if e["name"] == "joined_successfully")
        self.assertEqual(joined_event["args"][0]["room_code"], room_code)
        self.assertFalse(joined_event["args"][0]["is_host"])
        self.assertEqual(len(joined_event["args"][0]["participants"]), 2)

        # Host receives player_joined notification
        host_events = socket_host.get_received()
        player_joined_event = next(e for e in host_events if e["name"] == "player_joined")
        self.assertEqual(player_joined_event["args"][0]["nickname"], "FriendPlayer")

        # 4. Host starts game
        socket_host.emit("start_room_game", {"room_code": room_code})
        
        # Both host and friend receive room_game_started with the exact same first question
        host_started = next(e for e in socket_host.get_received() if e["name"] == "room_game_started")
        friend_started = next(e for e in socket_friend.get_received() if e["name"] == "room_game_started")
        
        q_host = host_started["args"][0]["question"]
        q_friend = friend_started["args"][0]["question"]
        self.assertEqual(q_host["id"], q_friend["id"])
        self.assertEqual(q_host["type"], q_friend["type"])
        self.assertEqual(q_host["media_url"], q_friend["media_url"])

        # 5. Both submit answers
        # Fetch real answer for scoring check
        real_q = QuestionService.get_question_by_id(q_host["id"])
        correct_ans = real_q["answer"]
        wrong_ans = "ASLI" if correct_ans == "AI" else "AI"

        # Host answers correctly fast (time=1.5s)
        socket_host.emit("submit_room_answer", {
            "room_code": room_code,
            "player_id": "host_p1",
            "question_id": q_host["id"],
            "chosen_answer": correct_ans,
            "time_taken": 1.5
        })

        # Friend answers incorrectly (time=4.0s)
        socket_friend.emit("submit_room_answer", {
            "room_code": room_code,
            "player_id": "friend_p2",
            "question_id": q_host["id"],
            "chosen_answer": wrong_ans,
            "time_taken": 4.0
        })

        # 6. Verify room leaderboard
        leaderboard = LeaderboardService.get_room_leaderboard(room_code)
        self.assertEqual(len(leaderboard), 2)
        # Host should be #1 with positive score, Friend should be #2 with 0 score
        self.assertEqual(leaderboard[0]["player_id"], "host_p1")
        self.assertTrue(leaderboard[0]["score"] > 0)
        self.assertEqual(leaderboard[1]["player_id"], "friend_p2")
        self.assertEqual(leaderboard[1]["score"], 0)

        socket_host.disconnect()
        socket_friend.disconnect()

if __name__ == "__main__":
    unittest.main()
