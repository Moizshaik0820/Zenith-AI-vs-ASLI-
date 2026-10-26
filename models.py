import sqlite3
import os
import json
from datetime import datetime
from config import Config

def get_db():
    os.makedirs(os.path.dirname(Config.DATABASE_PATH), exist_ok=True)
    conn = sqlite3.connect(Config.DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    conn = get_db()
    with conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS players (
            id TEXT PRIMARY KEY,
            nickname TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS questions (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL, -- 'IMAGE', 'AUDIO', 'VIDEO'
            media_path TEXT NOT NULL,
            answer TEXT NOT NULL, -- 'AI' or 'ASLI'
            explanation TEXT NOT NULL,
            category TEXT,
            difficulty TEXT DEFAULT 'medium',
            attribution TEXT,
            active INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS game_sessions (
            id TEXT PRIMARY KEY,
            player_id TEXT NOT NULL,
            nickname TEXT NOT NULL,
            mode TEXT NOT NULL DEFAULT 'solo', -- 'solo', 'room_player', 'host'
            room_code TEXT,
            status TEXT NOT NULL DEFAULT 'in_progress', -- 'in_progress', 'completed'
            questions_sequence TEXT NOT NULL, -- JSON string of question IDs
            current_question_index INTEGER DEFAULT 0,
            score INTEGER DEFAULT 0,
            correct_count INTEGER DEFAULT 0,
            incorrect_count INTEGER DEFAULT 0,
            unanswered_count INTEGER DEFAULT 0,
            speed_bonus_total INTEGER DEFAULT 0,
            total_time_taken REAL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP,
            FOREIGN KEY (player_id) REFERENCES players(id)
        );

        CREATE TABLE IF NOT EXISTS session_answers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            player_id TEXT NOT NULL,
            question_id TEXT NOT NULL,
            chosen_answer TEXT NOT NULL, -- 'AI', 'ASLI', 'UNANSWERED'
            is_correct INTEGER NOT NULL DEFAULT 0,
            time_taken REAL NOT NULL DEFAULT 0,
            speed_bonus INTEGER NOT NULL DEFAULT 0,
            points_awarded INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(session_id, question_id),
            FOREIGN KEY (session_id) REFERENCES game_sessions(id)
        );

        CREATE TABLE IF NOT EXISTS rooms (
            code TEXT PRIMARY KEY,
            host_player_id TEXT NOT NULL,
            host_nickname TEXT NOT NULL,
            mode TEXT NOT NULL DEFAULT 'friends', -- 'friends' or 'big_screen'
            status TEXT NOT NULL DEFAULT 'waiting', -- 'waiting', 'playing', 'finished'
            questions_sequence TEXT NOT NULL, -- JSON array of question IDs
            current_question_index INTEGER DEFAULT 0,
            question_phase TEXT DEFAULT 'answering', -- 'media_playing', 'answering', 'feedback'
            phase_start_time REAL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS room_participants (
            room_code TEXT NOT NULL,
            player_id TEXT NOT NULL,
            nickname TEXT NOT NULL,
            score INTEGER DEFAULT 0,
            correct_count INTEGER DEFAULT 0,
            speed_bonus_total INTEGER DEFAULT 0,
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_host INTEGER DEFAULT 0,
            PRIMARY KEY(room_code, player_id),
            FOREIGN KEY (room_code) REFERENCES rooms(code) ON DELETE CASCADE
        );
        """)
    conn.close()

def seed_demo_leaderboard():
    """Seeds a few realistic, clearly labeled demo records if DB is empty to demonstrate the podium & rankings."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as cnt FROM game_sessions WHERE status = 'completed'")
    count = cursor.fetchone()["cnt"]
    if count == 0:
        demo_players = [
            ("demo-p1", "NeuralNinja [Demo]", 1420, 10, 0, 0, 420, 18.4),
            ("demo-p2", "PixelDetective [Demo]", 1310, 9, 1, 0, 410, 24.2),
            ("demo-p3", "GlitchHunter [Demo]", 1180, 8, 2, 0, 380, 28.5),
            ("demo-p4", "RealityHacker [Demo]", 1050, 7, 3, 0, 350, 32.1),
            ("demo-p5", "FakeFinder [Demo]", 920, 6, 4, 0, 320, 35.8),
            ("demo-p6", "CyberSleuth [Demo]", 840, 6, 4, 0, 240, 41.0),
            ("demo-p7", "VisionWizard [Demo]", 730, 5, 5, 0, 230, 44.5)
        ]
        with conn:
            for pid, nick, score, corr, incorr, unans, sb, time_taken in demo_players:
                conn.execute(
                    "INSERT OR IGNORE INTO players (id, nickname) VALUES (?, ?)",
                    (pid, nick)
                )
                conn.execute(
                    """INSERT OR IGNORE INTO game_sessions 
                    (id, player_id, nickname, mode, status, questions_sequence, score, correct_count, incorrect_count, unanswered_count, speed_bonus_total, total_time_taken, completed_at)
                    VALUES (?, ?, ?, 'solo', 'completed', '[]', ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)""",
                    (f"demo-sess-{pid}", pid, nick, score, corr, incorr, unans, sb, time_taken)
                )
    conn.close()
