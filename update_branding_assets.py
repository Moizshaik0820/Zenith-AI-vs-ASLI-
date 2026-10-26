import os
import qrcode
from pathlib import Path
from PIL import Image, ImageDraw

BASE_DIR = Path(__file__).resolve().parent

def generate_clean_logo():
    # Crisp, standalone hexagonal neural 'Z' emblem (160x160)
    size = 160
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Outer Hexagon with vibrant purple & white gradient feel
    center = size / 2
    pts = [
        (center, 12),
        (size - 16, 44),
        (size - 16, size - 44),
        (center, size - 12),
        (16, size - 44),
        (16, 44)
    ]
    # Fill hexagon with deep purple
    draw.polygon(pts, fill=(124, 58, 237, 240), outline=(255, 255, 255, 255), width=4)
    
    # Inner glowing outline
    inner_pts = [
        (center, 22),
        (size - 24, 50),
        (size - 24, size - 50),
        (center, size - 22),
        (24, size - 50),
        (24, 50)
    ]
    draw.polygon(inner_pts, outline=(196, 181, 253, 200), width=2)
    
    # Bold, futuristic 'Z' in crisp white
    # Top bar: (42, 48) -> (118, 48)
    # Diagonal: (118, 48) -> (42, 112)
    # Bottom bar: (42, 112) -> (118, 112)
    draw.line([(44, 48), (116, 48)], fill=(255, 255, 255, 255), width=10)
    draw.line([(116, 48), (44, 112)], fill=(255, 255, 255, 255), width=10)
    draw.line([(44, 112), (116, 112)], fill=(255, 255, 255, 255), width=10)
    
    logo_path = BASE_DIR / "static" / "images" / "zenith-logo.png"
    img.save(logo_path, "PNG")
    print("Regenerated clean zenith-logo.png")

def generate_official_instagram_qr():
    url = "https://www.instagram.com/zenith_school_of_ai?utm_source=ig_web_button_share_sheet&mdxt=ZDNlZDc0MzIxNw=="
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=3,
    )
    qr.add_data(url)
    qr.make(fit=True)
    # Purple/violet with white background for bright theme compatibility
    qr_img = qr.make_image(fill_color="#6d28d9", back_color="#ffffff").convert("RGB")
    qr_path = BASE_DIR / "static" / "images" / "zenith-instagram-qr.png"
    qr_img.save(qr_path)
    print("Regenerated official zenith-instagram-qr.png")

if __name__ == "__main__":
    generate_clean_logo()
    generate_official_instagram_qr()
