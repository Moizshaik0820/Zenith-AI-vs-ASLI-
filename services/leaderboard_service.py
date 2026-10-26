from models import get_db

class LeaderboardService:
    @staticmethod
    def get_global_leaderboard(limit: int = 50):
        """
        Fetches the persistent global leaderboard.
        Ordered by:
        1. score DESC
        2. correct_count DESC
        3. total_time_taken ASC
        4. completed_at ASC
        5. id ASC
        """
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            """SELECT 
                id,
                player_id,
                nickname,
                score,
                correct_count,
                incorrect_count,
                unanswered_count,
                speed_bonus_total,
                ROUND(total_time_taken, 1) as total_time_taken,
                completed_at,
                ROUND((CAST(correct_count AS FLOAT) / 10.0) * 100) as accuracy_pct
            FROM game_sessions
            WHERE status = 'completed'
            ORDER BY 
                score DESC, 
                correct_count DESC, 
                total_time_taken ASC,
                completed_at ASC,
                id ASC
            LIMIT ?""",
            (limit,)
        )
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        
        # Assign rank indices 1, 2, 3...
        for idx, row in enumerate(rows):
            row["rank"] = idx + 1
            
        return rows

    @staticmethod
    def get_player_standing(session_id: str):
        """
        Calculates a player's exact rank and standing in the global leaderboard even if outside top 10.
        """
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM game_sessions WHERE id = ?", (session_id,))
        session = cursor.fetchone()
        if not session:
            conn.close()
            return None
            
        session_data = dict(session)
        
        # Calculate rank by counting how many completed sessions are strictly better
        cursor.execute(
            """SELECT COUNT(*) as better_count FROM game_sessions
            WHERE status = 'completed' AND (
                score > ? OR
                (score = ? AND correct_count > ?) OR
                (score = ? AND correct_count = ? AND total_time_taken < ?) OR
                (score = ? AND correct_count = ? AND total_time_taken = ? AND completed_at < ?)
            )""",
            (
                session_data["score"],
                session_data["score"], session_data["correct_count"],
                session_data["score"], session_data["correct_count"], session_data["total_time_taken"],
                session_data["score"], session_data["correct_count"], session_data["total_time_taken"], session_data["completed_at"]
            )
        )
        better_count = cursor.fetchone()["better_count"]
        rank = better_count + 1
        
        cursor.execute("SELECT COUNT(*) as total_count FROM game_sessions WHERE status = 'completed'")
        total_players = cursor.fetchone()["total_count"]
        conn.close()
        
        session_data["rank"] = rank
        session_data["total_players"] = max(1, total_players)
        session_data["accuracy_pct"] = int(round((session_data["correct_count"] / 10.0) * 100))
        session_data["compliment"] = LeaderboardService.get_personalized_compliment(
            session_data["score"], session_data["correct_count"]
        )
        return session_data

    @staticmethod
    def get_room_leaderboard(room_code: str):
        """Fetches live scores of all participants in a multiplayer room."""
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            """SELECT 
                player_id,
                nickname,
                score,
                correct_count,
                speed_bonus_total,
                is_host
            FROM room_participants
            WHERE room_code = ?
            ORDER BY score DESC, correct_count DESC, speed_bonus_total DESC""",
            (room_code,)
        )
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        for idx, r in enumerate(rows):
            r["rank"] = idx + 1
        return rows

    @staticmethod
    def get_personalized_compliment(score: int, correct_count: int) -> str:
        if score >= 1350:
            return "Neural Visionary: Flawless perception! Your biological sensors cut right through generative deepfakes."
        elif score >= 1100:
            return "Pixel Detective: Elite observation skills! You spotted subtle lighting discrepancies and uncanny artifacts."
        elif score >= 850:
            return "Glitch Hunter: Solid reality radar! You caught the majority of algorithmic tells."
        elif score >= 550:
            return "Cyber Apprentice: Promising instincts! Generative AI models are evolving, but with training your eyes will catch them all."
        else:
            return "Reality Seeker: AI got the best of you this round! Remember: trust nothing, observe everything."
