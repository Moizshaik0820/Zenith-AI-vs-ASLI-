import os
import shutil
import logging
from pathlib import Path
from config import Config

logger = logging.getLogger(__name__)

class ResourceSyncService:
    """
    Automated synchronization service for external resources (images, videos, memes).
    If an external folder (e.g. S:\resources or Config.EXTERNAL_RESOURCES_DIR) exists,
    it automatically copies new or updated media into the web app's directories.
    """

    @staticmethod
    def sync_all(source_base: Path = None) -> dict:
        if source_base is None:
            source_base = Config.EXTERNAL_RESOURCES_DIR
            
        if not source_base or not source_base.exists():
            return {"synced": False, "reason": f"External resources folder not mounted: {source_base}"}
            
        dest_media = Config.MEDIA_FOLDER
        dest_static = Config.STATIC_FOLDER / "memes"
        
        # Mapping definition: (source subfolder relative to source_base, destination directory)
        mappings = [
            (source_base / "Images" / "ai", dest_media / "images" / "ai"),
            (source_base / "Images" / "real", dest_media / "images" / "real"),
            (source_base / "video" / "ai", dest_media / "videos" / "ai"),
            (source_base / "video" / "real", dest_media / "videos" / "real"),
            (source_base / "meme" / "correct", dest_static / "correct"),
            (source_base / "meme" / "wrong", dest_static / "wrong"),
        ]
        
        # Also check for alternate case/folder names (e.g. 'images', 'Videos', 'memes')
        alt_mappings = [
            (source_base / "images" / "ai", dest_media / "images" / "ai"),
            (source_base / "images" / "real", dest_media / "images" / "real"),
            (source_base / "videos" / "ai", dest_media / "videos" / "ai"),
            (source_base / "videos" / "real", dest_media / "videos" / "real"),
            (source_base / "memes" / "correct", dest_static / "correct"),
            (source_base / "memes" / "wrong", dest_static / "wrong"),
        ]
        
        all_mappings = mappings + [m for m in alt_mappings if m not in mappings]
        
        files_synced = 0
        categories_checked = 0
        
        for src, dst in all_mappings:
            if not src.exists() or not src.is_dir():
                continue
            dst.mkdir(parents=True, exist_ok=True)
            categories_checked += 1
            
            for file_path in src.iterdir():
                if file_path.is_file():
                    target_path = dst / file_path.name
                    # Sync if target doesn't exist or size is different
                    try:
                        if not target_path.exists() or target_path.stat().st_size != file_path.stat().st_size:
                            shutil.copy2(file_path, target_path)
                            files_synced += 1
                    except Exception as e:
                        logger.warning(f"Error copying {file_path} to {target_path}: {e}")
                        
        return {
            "synced": True,
            "categories_checked": categories_checked,
            "files_synced": files_synced
        }
