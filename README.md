# ⚡ AI vs ASLI — Zenith School of AI
> **Tagline:** *"Do you trust your eyes?"*  
> **Host / Organizer:** Zenith School of AI (K.R. Mangalam University - KRMU)  
> **Campaign Website:** [play.zenith.ai](https://play.zenith.ai)  
> **Official Instagram:** [@zeniths](https://www.instagram.com/zeniths)  
> **Academic Credential:** B.Tech in AI + Mini-MBA | One Degree. KRMU.

---

## 🌟 1. Project Overview

**AI vs ASLI** is a college AI-awareness challenge web application designed and built for college events, auditoriums, classrooms, and online viral sharing.

As generative AI models (diffusion image generators, neural voice synthesizers, temporal video models) become indistinguishable from physical reality, **AI vs ASLI** challenges players to put their biological instincts to the test.

### Key Game Features:
- **Dual Visual Identity:** Balanced, vibrant Gen Z futuristic aesthetic with electric cyan (`#00f0ff`), violet (`#8b5cf6`), coral (`#ff5757`), and deep space navy (`#080c18`).
- **Interactive Split AI vs ASLI Preview:** Drag-to-compare interactive slider demonstrating synthetic diffusion artifacts vs optical sensor capture.
- **Dynamic Codename Generator:** 3 refreshable nickname suggestions per set with zero page reload + custom codename support.
- **3 Challenge Arenas:**
  1. **Play Alone (Solo):** 10 randomized, balanced challenges across Image, Audio, and Video with real-time speed bonuses and persistent global ranking.
  2. **Play on Big Screen (Host Mode):** Designed for auditorium stage projectors. Host displays questions and countdown on the big screen, students scan the dynamic QR code on their phones to join and lock in answers. Host screen shows live answer counters with **strict anti-spoiler protection** (correct answers are never revealed early).
  3. **Play With Friends:** Private multiplayer rooms with 6-character room codes, shareable URLs, live waiting lobby, and synchronized Socket.IO transitions.
- **Multi-Media Challenge Types:**
  - **IMAGE:** 10-second answer countdown. Includes an interactive **Magnifying Glass Modal** supporting zoom in/out, pan, and reset without stopping the running answer timer or submitting answers accidentally.
  - **AUDIO:** Custom waveform visualizer. Answer buttons are locked during playback; 5-second countdown starts **only after playback finishes**.
  - **VIDEO:** Responsive video player with mobile autoplay restriction handling; 5-second answer countdown begins **only after video finishes**.
- **Deterministic Server-Side Scoring:**
  - Base points: `+100` per correct answer.
  - Speed bonus: `floor(50 * remaining_time / total_answer_time)` (up to `+50` points).
  - Maximum possible score: `1,500` points (10 x 150).
  - No negative marking.
- **Score-Reveal Experience:**
  - Initial blurred scorecard prevents spoilers until player taps **"SCORE + STANDINGS"**.
  - Detailed breakdown: Final score, accuracy %, correct/incorrect/unanswered counts, speed bonus, rank, and personalized compliments.
- **Downloadable 9:16 Instagram Story Result Graphic:**
  - Generated on high-resolution HTML5 Canvas (`1080 x 1920` vertical format).
  - Contains official Zenith School of AI branding, title, tagline, score, accuracy, rank, compliment, `@zeniths`, `play.zenith.ai`, and verified Instagram QR code.
  - One-click **Download PNG** button.
  - Native **Web Share API** integration with clipboard/guide fallback.
- **Persistent Leaderboard:**
  - SQLite persistent database with deterministic ranking (`score DESC`, `correct_count DESC`, `total_time_taken ASC`).
  - Glowing top-3 podium (1st Gold, 2nd Silver, 3rd Bronze).
  - Player's own position pinned and highlighted even if outside the top 10.
- **Admin Mission Control:**
  - Protected admin panel for managing the question bank.
  - Upload new images, audio, and videos directly through the browser without modifying Python or JavaScript source code.
  - Toggle active/inactive questions and delete items with automatic JSON & SQLite database synchronization.

---

## 🛠️ 2. Technology Stack

- **Backend:** Python 3, Flask, Flask-SocketIO, SQLite3.
- **Frontend:** HTML5, CSS3 (Modern CSS Grid, Flexbox, Custom Properties), Vanilla JavaScript (ES6+), Web Audio API (for zero-dependency sound synthesis), HTML5 Canvas.
- **Real-Time Communication:** WebSockets via Flask-SocketIO and Simple-WebSocket.
- **Security & Media:** Werkzeug security (`safe_join`, `secure_filename`), Pillow, qrcode.

---

## 📁 3. Folder Structure

```
ai-vs-asli/
├── app.py                      # Flask application factory, SocketIO runner, error handlers
├── config.py                   # Environment configuration & game rules constants
├── models.py                   # SQLite database schema, initialization & demo seeding
├── requirements.txt            # Python dependencies
├── .env.example                # Example environment configuration
├── README.md                   # Complete documentation & operations manual
├── create_initial_assets.py    # Script that generated starter media & branding assets
│
├── routes/
│   ├── __init__.py
│   ├── pages.py                # Page routes (Landing, Nickname, Modes, Game, Results, Leaderboard, Admin)
│   ├── api.py                  # REST API (nicknames, game session, answers, masked media, QR codes, leaderboards)
│   ├── admin.py                # Admin authentication and question CRUD
│   └── multiplayer.py          # Socket.IO event handlers for Big Screen & Friend rooms
│
├── services/
│   ├── __init__.py
│   ├── question_service.py     # Question bank loader, balancing algorithm, data sanitization
│   ├── scoring_service.py      # Server-side score & speed bonus calculation
│   ├── leaderboard_service.py  # Global & room rankings, player standing, compliments
│   └── media_service.py        # Safe media streaming, path traversal protection, QR code generation
│
├── templates/
│   ├── base.html               # Shared layout, Zenith header, audio toggle, footer
│   ├── index.html              # Landing page with interactive split slider & game rules
│   ├── nickname.html           # Nickname selector with 3 refreshable pills & custom input
│   ├── modes.html              # Game mode selection cards (Big Screen, Solo, Friends)
│   ├── game.html               # Gameplay arena (Solo, Host projector, Mobile player)
│   ├── lobby.html              # Friends multiplayer lobby with copy code & QR modal
│   ├── results.html            # Game over, blurred score reveal & 9:16 story card canvas
│   ├── leaderboard.html        # Hall of fame podium & ranked table
│   ├── admin.html              # Mission control question manager & upload form
│   ├── 404.html                # Custom 404 error page
│   └── 500.html                # Custom 500 error page
│
├── static/
│   ├── css/
│   │   ├── styles.css          # Design system, variables, header, footer, split preview, modal
│   │   ├── game.css            # 10-segment bar, timers, dual buttons, magnifier, audio/video player
│   │   └── results.css         # Blurred score card, metrics, 9:16 story canvas preview
│   ├── js/
│   │   ├── app.js              # SoundEffects synthesizer (Web Audio API), split slider, loading overlay
│   │   ├── nickname.js         # Nickname suggestion fetcher, refresh spinner, validation
│   │   ├── game.js             # Solo game lifecycle, countdown timers, magnifier, answer locking
│   │   ├── multiplayer.js      # Socket.IO client, host synchronization, mobile controller
│   │   ├── results.js          # Score reveal unblur, 1080x1920 canvas story card renderer, PNG export
│   │   └── leaderboard.js      # Podium renderer, tab switcher, player standing highlight
│   └── images/
│       ├── zenith-logo.png     # Official Zenith School of AI brand logo
│       └── zenith-instagram-qr.png # Official Zenith Instagram QR code
│
├── media/                      # Uploaded question media
│   ├── images/
│   │   ├── ai/                 # Synthetic / diffusion test images
│   │   └── asli/               # Real / authentic photographs
│   ├── audio/
│   │   ├── ai/                 # Neural vocoder / phase jitter test WAV clips
│   │   └── asli/               # Real human vocal / acoustic test WAV clips
│   └── videos/
│       ├── ai/                 # Generative video test MP4 clips
│       └── asli/               # Real world CCTV / dashcam test MP4 clips
│
├── data/
│   └── questions.json          # Documented question bank JSON schema
│
├── instance/
│   └── app.db                  # Persistent SQLite database
│
└── tests/
    ├── test_game.py            # Unit tests for scoring, selection, sanitization, tiebreakers, traversal
    ├── test_full_game_flow.py  # End-to-end 10-question solo match & admin upload test
    └── test_routes.py          # Route status code & MIME verification tests
```

---

## 🚀 4. Setup and Run Commands

### Prerequisites
- Python 3.10+ (tested with Python 3.14)
- Web browser (Chrome, Firefox, Safari, Edge)

### Step 1: Clone / Navigate to Project Directory
```powershell
cd C:\Users\moizs\.gemini\antigravity\scratch\ai-vs-asli
```

### Step 2: Set up Virtual Environment
```powershell
python -m venv .venv
.\.venv\Scripts\activate
```

### Step 3: Install Dependencies
```powershell
pip install -r requirements.txt
```

### Step 4: Configure Environment Variables (Optional)
Copy `.env.example` to `.env`:
```powershell
copy .env.example .env
```
Default credentials:
- **Admin Username:** `admin`
- **Admin Password:** `zenith2026`
- **Port:** `5000`

### Step 5: Start Application
```powershell
python app.py
```
Open your browser and navigate to:
**`http://127.0.0.1:5000`**

---

## 🧪 5. Running Automated Tests

Run the test suite:
```powershell
# Run core unit tests (scoring, question balancing, security, ranking)
.\.venv\Scripts\python.exe tests/test_game.py

# Run full end-to-end 10-question match & admin flow
.\.venv\Scripts\python.exe tests/test_full_game_flow.py

# Run route verification tests
.\.venv\Scripts\python.exe tests/test_routes.py
```

---

## 🎮 6. How to Play & Test Multiplayer

### A. Testing Solo Challenge
1. Open `http://127.0.0.1:5000` and click **"ENTER THE CHALLENGE"**.
2. Pick a codename or click **Refresh** for new suggestions.
3. Select **"Play Alone"**.
4. Analyze the media. Click **"🔍 Zoom & Inspect"** on images to pan and zoom into micro-textures.
5. Tap **AI** or **ASLI** to lock in your answer.
6. Observe your points, speed bonus, explanation, and global consensus stats.
7. After question 10, click **"SCORE + STANDINGS"** to reveal your score, download your 9:16 Instagram Story card as a PNG, and check your rank on the leaderboard.

### B. Testing Big Screen Auditorium Mode (Host + Mobile Player)
1. In Browser Tab 1:
   - Navigate to `/modes` and click **"Launch Big Screen Session"**.
   - Note the 6-character room code (e.g. `K9W4XP`) and the large join QR code.
2. In Browser Tab 2 (or on your smartphone connected to the same network):
   - Navigate to `http://<your-ip>:5000/join/K9W4XP` or enter the room code in the Join box.
   - Enter your nickname (e.g. `MobileDetective`).
3. Back in Tab 1 (Host screen):
   - Watch `MobileDetective` appear live in the connected participants list.
   - Click **"START MATCH ▶"**.
4. Notice synchronization:
   - Host screen displays the media and countdown timer without revealing the answer.
   - Host screen shows live answer counters (`1 answered`).
   - Mobile screen lets the player tap **AI** or **ASLI** to lock in their verdict.
   - When the countdown finishes, both screens reveal the verdict, explanation, and live standings!

---

## 🛡️ 7. Admin Mission Control (Adding Media Without Code Changes)

1. Open `http://127.0.0.1:5000/admin`.
2. Enter the admin credentials:
   - **Username:** `admin`
   - **Password:** `zenith2026` (or configured `ADMIN_PASSWORD` in `.env`)
3. Use the form to add a challenge item:
   - **Media Type:** Select `IMAGE`, `AUDIO`, or `VIDEO`.
   - **Ground Truth:** Select `AI` (Synthetic) or `ASLI` (Genuine).
   - **Upload File:** Select a valid file from your computer (PNG, JPG, WebP, MP3, WAV, OGG, MP4, WebM).
   - **Explanation:** Enter the exact visual or acoustic cues (e.g. *"Look at the ear cartilage symmetry"* or *"Notice the temporal warping in background windows"*).
   - **Category & Difficulty:** e.g. *Portrait*, *Medium*.
4. Click **"Upload & Save Question"**.
5. The media file is securely saved to `media/`, added to the SQLite database, and automatically synchronized to `data/questions.json`.
6. You can preview, disable, or delete questions directly from the admin table at any time.

---

## 🌐 8. Production Deployment Guide

For deploying to production (Ubuntu / Linux VPS / AWS / DigitalOcean):

### 1. Install System Dependencies
```bash
sudo apt update && sudo apt install -y python3 python3-pip python3-venv nginx
```

### 2. Set Up Virtual Environment & Dependencies
```bash
git clone <repo-url> /opt/ai-vs-asli
cd /opt/ai-vs-asli
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt gunicorn eventlet
```

### 3. Environment Variables
Create `/opt/ai-vs-asli/.env`:
```ini
SECRET_KEY=generate-a-strong-random-key-here
FLASK_DEBUG=False
ADMIN_USERNAME=zenith_admin
ADMIN_PASSWORD=create-a-strong-production-password
BASE_URL=https://play.zenith.ai
```

### 4. Systemd Service File (`/etc/systemd/system/aivsasli.service`)
```ini
[Unit]
Description=AI vs ASLI Web Application
After=network.target

[Service]
User=www-data
WorkingDirectory=/opt/ai-vs-asli
Environment="PATH=/opt/ai-vs-asli/.venv/bin"
ExecStart=/opt/ai-vs-asli/.venv/bin/gunicorn --worker-class eventlet -w 1 --bind 127.0.0.1:5000 app:app

[Install]
WantedBy=multi-user.target
```
Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable aivsasli
sudo systemctl start aivsasli
```

### 5. Nginx Reverse Proxy Configuration
```nginx
server {
    listen 80;
    server_name play.zenith.ai;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support for Socket.IO
    location /socket.io {
        proxy_pass http://127.0.0.1:5000/socket.io;
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```
Secure with SSL using Let's Encrypt:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d play.zenith.ai
```

---

## 🔒 9. Security, Anti-Cheat, and Privacy

- **Server-Side Ground Truth:** Ground truth answers and file paths revealing "ai" or "asli" are never delivered in initial question payloads.
- **Masked Media Endpoint (`/api/media/masked/<question_id>`):** Media files are served via masked routes with directory traversal prevention (`werkzeug.security.safe_join`).
- **Answer Locking:** Once an answer is submitted or time expires, the server locks that question ID in `session_answers`. Multiple submissions for the same question are rejected with HTTP 400.
- **Deterministic Server-Side Scoring:** Scores and speed bonuses are calculated strictly on the server based on received timestamps; the browser's score is never trusted.
- **Privacy Notice:** Nicknames and scores are collected solely for challenge ranking and campus engagement. No personal data, passwords, or emails are collected from students for casual gameplay.

---

## 🎓 10. University Credentials & Attribution

- **Organizer:** Zenith School of AI  
- **University:** K.R. Mangalam University (KRMU)  
- **Program:** B.Tech in Computer Science & Engineering (AI & ML) + Mini-MBA  
- **Instagram Handle:** [@zeniths](https://www.instagram.com/zeniths)  
- **Official QR Destination:** `https://www.instagram.com/zeniths`  
- **Campaign Website:** `https://play.zenith.ai`  
- *"Built by Zenith School of AI first-years with AI agents."*
