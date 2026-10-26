import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "zenith-ai-vs-asli-secret-key-2026-supersecure")
    DEBUG = os.environ.get("FLASK_DEBUG", "True").lower() in ("true", "1", "yes")
    
    # Database
    DATABASE_PATH = os.environ.get("DATABASE_PATH", str(BASE_DIR / "instance" / "app.db"))
    
    # Media & Data
    MEDIA_FOLDER = BASE_DIR / "media"
    DATA_FOLDER = BASE_DIR / "data"
    QUESTIONS_JSON = os.environ.get("QUESTIONS_JSON", str(BASE_DIR / "data" / "questions.json"))
    
    # Allowed media formats & limits
    ALLOWED_IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "webp", "gif"}
    ALLOWED_AUDIO_EXTENSIONS = {"mp3", "wav", "ogg", "m4a", "aac"}
    ALLOWED_VIDEO_EXTENSIONS = {"mp4", "webm", "ogg"}
    MAX_CONTENT_LENGTH = 32 * 1024 * 1024  # 32 MB max upload
    
    # Official Branding & Social (Updated to Official Zenith Handle & URL)
    INSTAGRAM_HANDLE = "@zenith_school_of_ai"
    INSTAGRAM_URL = os.environ.get(
        "ZENITH_INSTAGRAM_URL", 
        "https://www.instagram.com/zenith_school_of_ai?utm_source=ig_web_button_share_sheet&mdxt=ZDNlZDc0MzIxNw=="
    )
    CAMPAIGN_URL = os.environ.get("CAMPAIGN_URL", "https://zenithschool.ai/")
    ZENITH_WEBSITE_URL = os.environ.get("ZENITH_WEBSITE_URL", "https://zenithschool.ai/")
    
    # Game Settings (6 questions, pure speed-based points, no fixed 100 pts)
    QUESTIONS_PER_GAME = 6
    BASE_POINTS_PER_CORRECT = 0
    MAX_SPEED_BONUS = 100
    IMAGE_TIMER_SECONDS = 15           # Images timer: 15s
    AUDIO_VIDEO_TIMER_SECONDS = 12     # Videos timer: 12s
    FEEDBACK_AUTO_ADVANCE_SECONDS = 10
    MAX_POSSIBLE_SCORE = 600
