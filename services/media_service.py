import io
import os
import qrcode
from pathlib import Path
from werkzeug.utils import secure_filename
from werkzeug.security import safe_join
from flask import send_file, abort
from config import Config

class MediaService:
    @staticmethod
    def get_safe_media_path(relative_path: str) -> Path:
        """
        Safely resolves a relative media path within Config.MEDIA_FOLDER.
        Prevents directory traversal attacks.
        """
        clean_rel = relative_path.replace("\\", "/").lstrip("/")
        base_dir = os.path.abspath(Config.MEDIA_FOLDER)
        resolved = safe_join(base_dir, clean_rel)
        if not resolved:
            abort(404, "Invalid media path traversal detected")
        resolved_path = Path(resolved).resolve()
        
        # Verify resolved path starts with base_dir
        if not str(resolved_path).startswith(base_dir):
            abort(403, "Access to file outside media directory is prohibited")
            
        if not resolved_path.exists() or not resolved_path.is_file():
            abort(404, "Requested media file not found")
            
        return resolved_path

    @staticmethod
    def is_allowed_file(filename: str, media_type: str) -> bool:
        ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
        media_type = media_type.upper()
        if media_type == 'IMAGE':
            return ext in Config.ALLOWED_IMAGE_EXTENSIONS
        elif media_type == 'AUDIO':
            return ext in Config.ALLOWED_AUDIO_EXTENSIONS
        elif media_type == 'VIDEO':
            return ext in Config.ALLOWED_VIDEO_EXTENSIONS
        return False

    @staticmethod
    def save_uploaded_media(uploaded_file, media_type: str, answer_tag: str) -> str:
        """
        Saves uploaded file into appropriate subdirectory (e.g. media/images/ai/filename).
        Returns the relative path suitable for questions.json/database.
        """
        filename = secure_filename(uploaded_file.filename)
        if not filename:
            raise ValueError("Invalid file name")
            
        ext = filename.rsplit('.', 1)[-1].lower()
        sub_folder = media_type.lower() + "s" # 'images', 'audio', 'videos'
        tag_folder = answer_tag.lower() # 'ai' or 'asli'
        
        target_dir = Config.MEDIA_FOLDER / sub_folder / tag_folder
        target_dir.mkdir(parents=True, exist_ok=True)
        
        import uuid
        unique_name = f"{media_type.lower()}_{tag_folder}_{uuid.uuid4().hex[:8]}.{ext}"
        target_path = target_dir / unique_name
        uploaded_file.save(str(target_path))
        
        rel_path = f"{sub_folder}/{tag_folder}/{unique_name}"
        return rel_path

    @staticmethod
    def generate_qr_png_bytes(data: str) -> io.BytesIO:
        """Generates a high-quality PNG QR code for any URL/string."""
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=8,
            border=2,
        )
        qr.add_data(data)
        qr.make(fit=True)
        img = qr.make_image(fill_color="#00f0ff", back_color="#0d1322").convert("RGB")
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        buf.seek(0)
        return buf
