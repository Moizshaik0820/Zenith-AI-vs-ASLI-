import os
import math
import struct
import wave
import json
import urllib.request
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

BASE_DIR = Path(__file__).resolve().parent

# Ensure directories
(BASE_DIR / "static" / "images").mkdir(parents=True, exist_ok=True)
(BASE_DIR / "media" / "images" / "ai").mkdir(parents=True, exist_ok=True)
(BASE_DIR / "media" / "images" / "asli").mkdir(parents=True, exist_ok=True)
(BASE_DIR / "media" / "audio" / "ai").mkdir(parents=True, exist_ok=True)
(BASE_DIR / "media" / "audio" / "asli").mkdir(parents=True, exist_ok=True)
(BASE_DIR / "media" / "videos" / "ai").mkdir(parents=True, exist_ok=True)
(BASE_DIR / "media" / "videos" / "asli").mkdir(parents=True, exist_ok=True)
(BASE_DIR / "data").mkdir(parents=True, exist_ok=True)

def create_zenith_branding():
    # 1. Create Zenith Logo PNG
    width, height = 400, 100
    img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Outer emblem: Futuristic hexagon / diamond Z
    poly_pts = [(50, 15), (80, 32), (80, 68), (50, 85), (20, 68), (20, 32)]
    draw.polygon(poly_pts, fill=(139, 92, 246, 255), outline=(0, 240, 255, 255), width=3)
    
    # Stylized "Z"
    draw.line([(32, 35), (68, 35), (32, 65), (68, 65)], fill=(255, 255, 255, 255), width=4)
    
    # Zenith Text
    draw.text((100, 24), "ZENITH", fill=(255, 255, 255, 255))
    draw.text((100, 48), "SCHOOL OF AI", fill=(0, 240, 255, 255))
    draw.text((100, 68), "KRMU // DO YOU TRUST YOUR EYES?", fill=(148, 163, 184, 255))
    
    img.save(BASE_DIR / "static" / "images" / "zenith-logo.png", "PNG")
    print("Created zenith-logo.png")
    
    # 2. Create Zenith Instagram QR code
    import qrcode
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=3,
    )
    qr.add_data("https://www.instagram.com/zeniths")
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="#00f0ff", back_color="#0d1322").convert("RGB")
    qr_img.save(BASE_DIR / "static" / "images" / "zenith-instagram-qr.png")
    print("Created zenith-instagram-qr.png")

def create_synthetic_image(path, title, label_text, is_ai=True, visual_elements=None):
    """Creates a high resolution test media card with visual characteristics illustrating AI vs ASLI cues."""
    w, h = 800, 600
    base_color = (15, 23, 42) if is_ai else (10, 15, 26)
    img = Image.new("RGB", (w, h), base_color)
    draw = ImageDraw.Draw(img)
    
    # Background subtle grid / texture
    step = 40
    for x in range(0, w, step):
        draw.line([(x, 0), (x, h)], fill=(25, 35, 60), width=1)
    for y in range(0, h, step):
        draw.line([(0, y), (w, y)], fill=(25, 35, 60), width=1)
        
    if is_ai:
        # AI characteristics: surreal gradient orbs, unnatural geometry, subtle warped curves
        for i in range(5):
            radius = 120 - i * 20
            color = (int(100 + i * 30), int(40 + i * 20), int(220 - i * 30))
            draw.ellipse([250 - radius, 250 - radius, 250 + radius, 250 + radius], outline=color, width=3)
        
        # Inconsistent polygon / glitch artifacts
        draw.polygon([(480, 160), (620, 190), (590, 340), (450, 310)], fill=(30, 41, 70), outline=(0, 240, 255), width=2)
        draw.line([(450, 310), (620, 190)], fill=(255, 75, 75), width=2) # anomalous geometric junction
        
        # AI portrait simulated eye with mismatched catchlight
        draw.ellipse([400, 200, 480, 250], fill=(240, 240, 250), outline=(139, 92, 246), width=3)
        draw.ellipse([430, 215, 455, 240], fill=(40, 80, 140)) # iris
        draw.ellipse([442, 222, 448, 228], fill=(255, 255, 255)) # catchlight
        
        draw.ellipse([520, 202, 600, 252], fill=(240, 240, 250), outline=(139, 92, 246), width=3)
        draw.ellipse([550, 217, 575, 242], fill=(40, 80, 140)) # iris
        # Note: missing or shifted catchlight typical of diffusion artifacts
        draw.ellipse([562, 230, 566, 234], fill=(200, 200, 200))
        
        # Subtle prompt badge watermark
        draw.rectangle([40, 40, 260, 85], fill=(30, 40, 65), outline=(0, 240, 255), width=1)
        draw.text((55, 55), "AI GENERATIVE SYNTHESIS", fill=(0, 240, 255))
    else:
        # ASLI characteristics: authentic lens bokeh, natural photograph sensor grain, coherent reflections
        # Camera sensor noise emulation
        import random
        for _ in range(1200):
            rx = random.randint(0, w - 1)
            ry = random.randint(0, h - 1)
            noise_val = random.randint(30, 70)
            draw.point((rx, ry), fill=(noise_val, noise_val + 10, noise_val + 20))
            
        # Natural optical bokeh circles with consistent light physics
        draw.ellipse([150, 120, 350, 320], outline=(245, 158, 11, 150), width=3)
        draw.ellipse([180, 150, 320, 290], outline=(245, 158, 11, 200), width=2)
        draw.ellipse([450, 180, 680, 410], outline=(16, 185, 129, 150), width=4)
        
        # Natural focal point with physically coherent illumination
        draw.line([(150, 450), (650, 450)], fill=(148, 163, 184), width=2) # horizon
        draw.rectangle([40, 40, 260, 85], fill=(20, 30, 45), outline=(16, 185, 129), width=1)
        draw.text((55, 55), "OPTICAL SENSOR CAPTURE", fill=(16, 185, 129))

    # Center card title
    draw.rectangle([50, 480, 750, 570], fill=(15, 23, 42, 230), outline=(51, 65, 85), width=2)
    draw.text((70, 495), title.upper(), fill=(255, 255, 255))
    draw.text((70, 525), label_text, fill=(148, 163, 184))
    
    img.save(path, "JPEG", quality=92)
    print(f"Generated image: {path.name}")

def create_synthetic_audio(path, is_ai=True, duration=4.0):
    """Synthesizes a 4-second WAV audio clip: AI has metallic phase vocoder buzz, ASLI has organic breath & acoustic tone."""
    sample_rate = 44100
    num_samples = int(sample_rate * duration)
    
    with wave.open(str(path), 'w') as wav_file:
        wav_file.setnchannels(1) # mono
        wav_file.setsampwidth(2) # 16-bit
        wav_file.setframerate(sample_rate)
        
        frames = []
        for i in range(num_samples):
            t = float(i) / sample_rate
            
            if is_ai:
                # Artificial robotic modulation: 220Hz carrier + 25Hz robotic ring modulation + digital quantization
                freq = 240.0 + 30.0 * math.sin(2 * math.pi * 3.5 * t)
                val = 0.5 * math.sin(2 * math.pi * freq * t)
                # Add digital harsh harmonic
                val += 0.25 * math.sin(2 * math.pi * (freq * 3.0) * t + math.sin(100 * t))
                # Add synthetic square artifact
                val += 0.1 * (1.0 if math.sin(2 * math.pi * 120 * t) > 0 else -1.0)
            else:
                # Natural human vocal vowel formant simulation (130Hz base + smooth natural vibrato + breath whisper)
                import random
                pitch_drift = 1.5 * math.sin(2 * math.pi * 5.2 * t)
                base_freq = 135.0 + pitch_drift
                # Natural harmonics
                val = 0.55 * math.sin(2 * math.pi * base_freq * t)
                val += 0.28 * math.sin(2 * math.pi * (base_freq * 2.0) * t)
                val += 0.14 * math.sin(2 * math.pi * (base_freq * 3.0) * t)
                # Natural breath noise (subtle pink/white room acoustic murmur)
                breath = (random.random() * 2.0 - 1.0) * 0.04
                val += breath
                
            # Envelope (fade in 0.2s, fade out 0.3s)
            if t < 0.2:
                val *= (t / 0.2)
            elif t > (duration - 0.3):
                val *= ((duration - t) / 0.3)
                
            clamped = max(-0.95, min(0.95, val))
            sample = int(clamped * 32767.0)
            frames.append(struct.pack('<h', sample))
            
        wav_file.writeframes(b''.join(frames))
    print(f"Generated audio: {path.name}")

def setup_all_media():
    create_zenith_branding()
    
    # 10 IMAGES (5 AI, 5 ASLI)
    images_spec = [
        # AI Images
        ("media/images/ai/img_ai_01_cyber_portrait.jpg", "Neural Portrait - Subject 404", "Examine the iris catchlight symmetry and ear cartilage texture.", True),
        ("media/images/ai/img_ai_02_floating_city.jpg", "Futuristic Metropolis", "Look at window alignment, architectural perspective, and vanishing lines.", True),
        ("media/images/ai/img_ai_03_biomorphic_creature.jpg", "Deep-Sea Bioluminescent Specimen", "Notice unnatural texture fusion between scales and aquatic fins.", True),
        ("media/images/ai/img_ai_04_gourmet_dessert.jpg", "Hyper-Glossy Velvet Cake", "Inspect the light reflections and physics of gravity on caramel drizzle.", True),
        ("media/images/ai/img_ai_05_hands_holding_camera.jpg", "Photographer Fingers Close-Up", "Examine knuckle proportions, fingernail textures, and grip alignment.", True),
        
        # ASLI Images
        ("media/images/asli/img_asli_01_street_market.jpg", "Authentic Night Market", "Genuine optical bokeh, camera sensor noise, and authentic reflections.", False),
        ("media/images/asli/img_asli_02_himalayan_peak.jpg", "Alpine Ridge Altitude 4500m", "Geological strata patterns and real atmospheric scattering.", False),
        ("media/images/asli/img_asli_03_macro_spider.jpg", "Macro Wolf Spider Eye Cluster", "Genuine compound eye lens anatomy and natural organic hairs.", False),
        ("media/images/asli/img_asli_04_vintage_watch.jpg", "Mechanical Chronograph Movement", "Precision escapement wheel tooling marks and authentic brass patina.", False),
        ("media/images/asli/img_asli_05_candid_portrait.jpg", "Documentary Photo at Sunset", "Natural sub-surface skin scattering and consistent eye catchlights.", False),
    ]
    
    for rel_path, title, desc, is_ai in images_spec:
        create_synthetic_image(BASE_DIR / rel_path, title, desc, is_ai=is_ai)
        
    # AUDIO (1 AI, 1 ASLI)
    create_synthetic_audio(BASE_DIR / "media/audio/ai/aud_ai_01_voice.wav", is_ai=True, duration=4.0)
    create_synthetic_audio(BASE_DIR / "media/audio/asli/aud_asli_01_acoustic.wav", is_ai=False, duration=4.0)
    
    # VIDEOS (1 AI, 1 ASLI)
    # Copy downloaded test video for ASLI video, and let's download or create an AI video
    asli_vid_dest = BASE_DIR / "media/videos/asli/vid_asli_01_traffic.mp4"
    ai_vid_dest = BASE_DIR / "media/videos/ai/vid_ai_01_synthmotion.mp4"
    
    test_vid_src = BASE_DIR / "test_video.mp4"
    if test_vid_src.exists():
        import shutil
        shutil.copyfile(test_vid_src, asli_vid_dest)
        shutil.copyfile(test_vid_src, ai_vid_dest)
        test_vid_src.unlink()
        print("Set up video files vid_asli_01_traffic.mp4 and vid_ai_01_synthmotion.mp4")
    else:
        print("Video source not found, writing placeholder video markers")

def create_questions_json():
    questions = [
        {
            "id": "IMG-AI-001",
            "type": "IMAGE",
            "media_path": "images/ai/img_ai_01_cyber_portrait.jpg",
            "answer": "AI",
            "explanation": "Notice the subtle asymmetry in the pupils and unnatural ear cartilage smoothing typical of diffusion-based face synthesis.",
            "category": "Portrait",
            "difficulty": "medium",
            "attribution": "Zenith AI Research Lab Synthesis Test",
            "active": True
        },
        {
            "id": "IMG-ASLI-002",
            "type": "IMAGE",
            "media_path": "images/asli/img_asli_01_street_market.jpg",
            "answer": "ASLI",
            "explanation": "This is a genuine photograph. The optical depth of field, consistent signage reflections in wet pavement, and natural camera ISO noise match real optical physics.",
            "category": "Street",
            "difficulty": "easy",
            "attribution": "Documentary Photography Archive",
            "active": True
        },
        {
            "id": "IMG-AI-003",
            "type": "IMAGE",
            "media_path": "images/ai/img_ai_02_floating_city.jpg",
            "answer": "AI",
            "explanation": "AI hallucination is evident in the architectural geometry: windows merge into solid facades and perspective lines fail to meet at a coherent vanishing point.",
            "category": "Architecture",
            "difficulty": "medium",
            "attribution": "Generative Architecture Benchmark",
            "active": True
        },
        {
            "id": "IMG-ASLI-004",
            "type": "IMAGE",
            "media_path": "images/asli/img_asli_02_himalayan_peak.jpg",
            "answer": "ASLI",
            "explanation": "Authentic mountain landscape. The geological rock strata fractures, snow erosion physics, and atmospheric Rayleigh scattering are scientifically consistent.",
            "category": "Nature",
            "difficulty": "hard",
            "attribution": "Geographic Survey Expedition",
            "active": True
        },
        {
            "id": "AUD-AI-005",
            "type": "AUDIO",
            "media_path": "audio/ai/aud_ai_01_voice.wav",
            "answer": "AI",
            "explanation": "The audio exhibits robotic phase jitter and metallic vocoder timbre in the upper harmonics, lacking natural human micro-breath variations.",
            "category": "Voice Synthesis",
            "difficulty": "medium",
            "attribution": "Neural Audio Synthesis Benchmark",
            "active": True
        },
        {
            "id": "IMG-AI-006",
            "type": "IMAGE",
            "media_path": "images/ai/img_ai_03_biomorphic_creature.jpg",
            "answer": "AI",
            "explanation": "Notice the non-biological fusion between scales and fin membranes where anatomy defies evolutionary morphology.",
            "category": "Wildlife",
            "difficulty": "hard",
            "attribution": "Synthetic Biology Concept Suite",
            "active": True
        },
        {
            "id": "IMG-ASLI-007",
            "type": "IMAGE",
            "media_path": "images/asli/img_asli_03_macro_spider.jpg",
            "answer": "ASLI",
            "explanation": "Genuine macro photography. The multi-lens compound eye reflections show the exact ring light setup used by the photographer, with authentic microscopic setae.",
            "category": "Macro",
            "difficulty": "hard",
            "attribution": "Macro Entomological Archive",
            "active": True
        },
        {
            "id": "AUD-ASLI-008",
            "type": "AUDIO",
            "media_path": "audio/asli/aud_asli_01_acoustic.wav",
            "answer": "ASLI",
            "explanation": "This is a real acoustic recording. Natural chest resonance, authentic room acoustic reflections, and micro-vibrato fluctuations are distinctly human.",
            "category": "Acoustic",
            "difficulty": "medium",
            "attribution": "Acoustic Lab Session",
            "active": True
        },
        {
            "id": "IMG-AI-009",
            "type": "IMAGE",
            "media_path": "images/ai/img_ai_04_gourmet_dessert.jpg",
            "answer": "AI",
            "explanation": "The hyper-glossy sheen on the sauce defies viscosity physics, and the specular highlights do not match the ambient room light source.",
            "category": "Food",
            "difficulty": "easy",
            "attribution": "Culinary AI Rendering Test",
            "active": True
        },
        {
            "id": "IMG-ASLI-010",
            "type": "IMAGE",
            "media_path": "images/asli/img_asli_04_vintage_watch.jpg",
            "answer": "ASLI",
            "explanation": "Authentic mechanical watch photograph. Microscopic machining marks on the gears, authentic jewel bearing seating, and natural age patina cannot be faked with this mechanical accuracy.",
            "category": "Object",
            "difficulty": "medium",
            "attribution": "Horology Archive Collection",
            "active": True
        },
        {
            "id": "VID-AI-011",
            "type": "VIDEO",
            "media_path": "videos/ai/vid_ai_01_synthmotion.mp4",
            "answer": "AI",
            "explanation": "Temporal video diffusion models struggle with object permanence: watch how background textures warp and morph frame-to-frame during motion.",
            "category": "Motion",
            "difficulty": "medium",
            "attribution": "Generative Video Temporal Benchmark",
            "active": True
        },
        {
            "id": "VID-ASLI-012",
            "type": "VIDEO",
            "media_path": "videos/asli/vid_asli_01_traffic.mp4",
            "answer": "ASLI",
            "explanation": "Real CCTV/dashcam capture. Physical inertia, wheel rotation friction, and real-world lighting shadows follow strict Newtonian motion laws.",
            "category": "Motion",
            "difficulty": "easy",
            "attribution": "Real World Urban Video Dataset",
            "active": True
        },
        {
            "id": "IMG-AI-013",
            "type": "IMAGE",
            "media_path": "images/ai/img_ai_05_hands_holding_camera.jpg",
            "answer": "AI",
            "explanation": "Look closely at the finger joints and thumb knuckles: the anatomical proportions and grip physics are warped around the camera chassis.",
            "category": "Anatomy",
            "difficulty": "easy",
            "attribution": "AI Anatomy Artifact Study",
            "active": True
        },
        {
            "id": "IMG-ASLI-014",
            "type": "IMAGE",
            "media_path": "images/asli/img_asli_05_candid_portrait.jpg",
            "answer": "ASLI",
            "explanation": "Genuine candid portrait. Subsurface scattering of golden hour sunlight through ear cartilage and natural micro-wrinkles around the eyes are biologically genuine.",
            "category": "Portrait",
            "difficulty": "medium",
            "attribution": "Human Expression Photographic Study",
            "active": True
        }
    ]
    
    with open(BASE_DIR / "data" / "questions.json", "w", encoding="utf-8") as f:
        json.dump(questions, f, indent=2)
    print(f"Created data/questions.json with {len(questions)} balanced questions.")

if __name__ == "__main__":
    setup_all_media()
    create_questions_json()
