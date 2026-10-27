import random
import logging
from pathlib import Path
from config import Config

logger = logging.getLogger(__name__)

class MemeService:
    """
    Service for discovering and serving answer reaction memes.
    Dynamically scans static/memes/correct and static/memes/wrong so that any
    new meme image added to these folders automatically becomes available.
    """

    ALLOWED_MEME_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}

    @staticmethod
    def get_memes(meme_type: str = "correct") -> list:
        norm_type = "correct" if str(meme_type).lower() in ("correct", "right", "true", "sahi") else "wrong"
        target_dir = Config.STATIC_FOLDER / "memes" / norm_type
        
        memes = []
        if target_dir.exists() and target_dir.is_dir():
            for f in sorted(target_dir.iterdir()):
                if f.is_file() and f.suffix.lower() in MemeService.ALLOWED_MEME_EXTENSIONS:
                    memes.append(f"/static/memes/{norm_type}/{f.name}")
                    
        # Fallbacks if folder is empty or not yet populated
        if not memes:
            if norm_type == "correct":
                memes = [
                    "/static/images/meme-correct.webp",
                    "/static/images/meme-chaliye-shuru.webp"
                ]
            else:
                memes = [
                    "/static/images/meme-wrong.webp",
                    "/static/images/meme-i-saw-that.webp"
                ]
                
        return memes

    @staticmethod
    def get_random_meme(is_correct: bool = True) -> str:
        meme_type = "correct" if is_correct else "wrong"
        pool = MemeService.get_memes(meme_type)
        return random.choice(pool) if pool else "/static/images/meme-correct.webp"

    @staticmethod
    def get_all_memes() -> dict:
        return {
            "correct": MemeService.get_memes("correct"),
            "wrong": MemeService.get_memes("wrong")
        }
