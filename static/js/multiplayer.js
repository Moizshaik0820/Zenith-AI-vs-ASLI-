/**
 * AI vs ASLI — Multiplayer & Big Screen Controller (Socket.IO)
 * Fixed & Enhanced for seamless QR join, live participant sync & mobile media viewing.
 */

class MultiplayerManager {
  constructor(mode, roomCode) {
    this.mode = mode; // 'host', 'room_player', or 'lobby'
    this.roomCode = roomCode ? roomCode.toUpperCase() : null;
    this.playerId = localStorage.getItem("zenith_player_id");
    this.nickname = localStorage.getItem("zenith_nickname") || "";
    this.socket = null;
    this.currentQuestion = null;
    this.hasAnsweredCurrent = false;
    this.lastChosenAnswer = null;
    this.startTime = null;
    this.timerInterval = null;
    this.totalAnswerTime = 10.0;
  }

  getArena() {
    return document.getElementById("multiplayerArena") || document.querySelector(".host-locked-card") || document.querySelector(".game-locked-stage");
  }

  init() {
    if (this.mode === "room_player") {
      // Direct QR-code or link joiner flow:
      // If user has not set a name yet, prompt them immediately without losing the room code!
      if (!this.playerId || !this.nickname || this.nickname === "Player") {
        this.renderQuickNameEntry();
        return;
      }
      this.renderWaitingRoom();
      this.connectAndJoin();
      return;
    }

    if (this.mode === "host") {
      // Big screen projector host never needs to be kicked to nickname screen
      if (!this.playerId) {
        this.playerId = "host_" + Math.random().toString(36).substring(2, 9);
        try {
          localStorage.setItem("zenith_player_id", this.playerId);
        } catch (e) {}
      }
      if (!this.nickname) {
        this.nickname = "Host";
      }
      this.connectAndJoin();
      return;
    }

    if (!this.playerId) {
      const returnRoom = this.roomCode ? `?room=${this.roomCode}` : '';
      window.location.href = `/nickname${returnRoom}`;
      return;
    }

    this.connectAndJoin();
  }

  connectAndJoin() {
    if (!this.socket) {
      // Connect to Socket.IO
      this.socket = io({ transports: ["websocket", "polling"] });

      this.socket.on("connect", () => {
        console.log("Connected to Zenith Multiplayer Network, joining room:", this.roomCode);
        if (this.roomCode) {
          this.joinRoom();
        }
      });

      this.bindSocketEvents();
    } else {
      if (this.socket.connected) {
        if (this.roomCode) {
          this.joinRoom();
        }
      } else {
        this.socket.once("connect", () => {
          if (this.roomCode) {
            this.joinRoom();
          }
        });
      }
    }
  }

  renderQuickNameEntry() {
    const arena = this.getArena();
    if (!arena) return;

    arena.innerHTML = `
      <div style="max-width:440px; margin:0 auto; text-align:center; padding:1.5rem 1rem; width:100%; box-sizing:border-box;">
        <div style="display:inline-flex; align-items:center; gap:0.5rem; background:rgba(225,29,72,0.14); color:#fb7185; font-weight:800; font-size:0.85rem; padding:0.4rem 1rem; border-radius:9999px; border:1px solid rgba(225,29,72,0.4); margin-bottom:1rem;">
          🎯 JOINING ROOM: <strong style="letter-spacing:0.05em; color:#ffffff;">${this.roomCode}</strong>
        </div>

        <h2 style="font-size:1.6rem; font-weight:900; margin-bottom:0.35rem; color:#ffffff;">
          Enter Your Name
        </h2>
        <p style="color:var(--text-dim); font-size:0.88rem; margin-bottom:1.25rem; line-height:1.45;">
          Enter your detective codename to jump right into the live challenge!
        </p>

        <form id="quickJoinForm" style="display:flex; flex-direction:column; gap:1rem; text-align:left;">
          <div>
            <label style="display:block; font-size:0.78rem; font-weight:800; color:var(--text-dim); margin-bottom:0.4rem; text-transform:uppercase; letter-spacing:0.05em;">
              Your Name / Codename
            </label>
            <input 
              type="text" 
              id="quickJoinInput" 
              placeholder="e.g. Rahul, Sneha, CyberHawk" 
              maxlength="25" 
              required 
              autofocus 
              value="${(this.nickname && this.nickname !== 'Player') ? this.nickname : ''}" 
              style="width:100%; font-size:1.05rem; font-weight:700; text-align:left; padding:0.8rem 1rem; border-radius:12px; border:1.5px solid rgba(255,255,255,0.2); background:rgba(3,7,18,0.7); color:#ffffff; box-sizing:border-box; outline:none;"
            >
          </div>

          <div>
            <div style="font-size:0.75rem; font-weight:800; color:var(--text-dim); margin-bottom:0.4rem; text-transform:uppercase;">Quick Suggestions:</div>
            <div id="quickChipsContainer" style="display:flex; flex-wrap:wrap; gap:0.4rem;">
              <button type="button" class="quick-chip" style="font-size:0.8rem; padding:0.35rem 0.65rem; border-radius:999px; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.18); color:#ffffff; cursor:pointer;">⚡ Optic Phantom</button>
              <button type="button" class="quick-chip" style="font-size:0.8rem; padding:0.35rem 0.65rem; border-radius:999px; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.18); color:#ffffff; cursor:pointer;">🧠 Neural Ninja</button>
              <button type="button" class="quick-chip" style="font-size:0.8rem; padding:0.35rem 0.65rem; border-radius:999px; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.18); color:#ffffff; cursor:pointer;">🔍 Pattern Pilot</button>
              <button type="button" class="quick-chip" style="font-size:0.8rem; padding:0.35rem 0.65rem; border-radius:999px; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.18); color:#ffffff; cursor:pointer;">👁️ Bio Sentinel</button>
            </div>
          </div>

          <button type="submit" class="btn btn-primary" id="btnConfirmQuickJoin" style="margin-top:0.4rem; width:100%; font-size:1.1rem; padding:0.85rem; border-radius:12px; font-weight:900; background:#e11d48; border:none; color:#ffffff; box-shadow:0 4px 18px rgba(225,29,72,0.45); cursor:pointer;">
            JOIN ROOM 🚀
          </button>
        </form>
      </div>
    `;

    const form = document.getElementById("quickJoinForm");
    const input = document.getElementById("quickJoinInput");
    const submitBtn = document.getElementById("btnConfirmQuickJoin");

    document.querySelectorAll(".quick-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        input.value = chip.textContent.replace(/^[^\w]+/, "").trim();
        input.focus();
      });
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = input.value.trim();
      if (!name) {
        if (typeof window.showToast === "function") window.showToast("Please enter your name!", true);
        input.focus();
        return;
      }
      submitBtn.disabled = true;
      submitBtn.textContent = "Joining Room...";

      fetch("/api/player/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: name,
          player_id: this.playerId || localStorage.getItem("zenith_player_id") || null
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.status === "success") {
          this.playerId = data.player_id;
          this.nickname = data.nickname;
          try {
            localStorage.setItem("zenith_player_id", data.player_id);
            localStorage.setItem("zenith_nickname", data.nickname);
          } catch (err) {}
          if (window.soundFx && typeof window.soundFx.click === "function") {
            window.soundFx.click();
          }
          this.renderWaitingRoom();
          this.connectAndJoin();
        } else {
          submitBtn.disabled = false;
          submitBtn.textContent = "JOIN ROOM 🚀";
          if (typeof window.showToast === "function") window.showToast(data.error || "Failed to set name", true);
        }
      })
      .catch(err => {
        console.error("Join error:", err);
        submitBtn.disabled = false;
        submitBtn.textContent = "JOIN ROOM 🚀";
        if (typeof window.showToast === "function") window.showToast("Connection issue. Please retry.", true);
      });
    });
  }

  renderWaitingRoom() {
    const arena = this.getArena();
    if (!arena) return;

    arena.innerHTML = `
      <div style="text-align:center; padding:1.8rem 1rem; width:100%; box-sizing:border-box;">
        <div style="font-size:3rem; margin-bottom:0.5rem; animation: pulseCurrent 1.5s infinite;">⚡</div>
        <h2 style="font-size:1.6rem; font-weight:900; margin-bottom:0.4rem; color:#ffffff;">
          Connected to Room <span class="host-code-red">${this.roomCode}</span>
        </h2>
        <div style="display:inline-flex; align-items:center; gap:0.4rem; background:rgba(124,58,237,0.15); border:1.5px solid #a855f7; color:#ffffff; padding:0.35rem 0.9rem; border-radius:9999px; font-weight:800; font-size:0.9rem; margin-bottom:1.2rem;">
          <span style="color:#a855f7;">Player:</span> <strong id="displayName">${this.nickname}</strong>
          <button type="button" id="btnChangePlayerName" style="background:none; border:none; color:var(--text-dim); text-decoration:underline; cursor:pointer; font-size:0.78rem; margin-left:0.35rem; font-weight:700;">(Change)</button>
        </div>
        <p style="color:var(--text-dim); margin-bottom:1.4rem; font-size:0.95rem; line-height:1.5;">
          Look up at the stage/projector screen!<br>The challenge will launch as soon as the host starts.
        </p>
        <div style="background:rgba(34,197,94,0.12); padding:0.85rem 1.25rem; border-radius:12px; display:inline-block; font-weight:800; color:#34d399; border:1px solid rgba(34,197,94,0.35);">
          Status: Ready & Waiting for Host ▶
        </div>
      </div>
    `;

    const changeBtn = document.getElementById("btnChangePlayerName");
    if (changeBtn) {
      changeBtn.addEventListener("click", () => {
        this.renderQuickNameEntry();
      });
    }
  }

  joinRoom() {
    if (!this.socket || !this.roomCode) return;
    this.socket.emit("join_room", {
      room_code: this.roomCode,
      player_id: this.playerId,
      nickname: this.nickname
    });
  }

  bindSocketEvents() {
    this.socket.on("joined_successfully", (data) => {
      console.log("Room joined:", data);
      this.updateParticipantList(data.participants);

      // If match is already in progress when user joins, render the active question immediately!
      if (data.status === "playing" && data.current_question) {
        this.currentQuestion = data.current_question;
        this.hasAnsweredCurrent = false;
        this.renderRoomQuestion(data.current_question, data.current_index || 0, data.total_questions || 6);
      }
    });

    this.socket.on("player_joined", (data) => {
      this.updateParticipantList(data.participants);
      if (typeof window.showToast === "function") {
        window.showToast(`${data.nickname} entered the arena!`);
      }
    });

    this.socket.on("join_error", (data) => {
      if (typeof window.showToast === "function") {
        window.showToast(data.message, true);
      }
      setTimeout(() => { window.location.href = "/modes"; }, 2500);
    });

    this.socket.on("room_game_started", (data) => {
      this.currentQuestion = data.question;
      this.hasAnsweredCurrent = false;
      this.lastChosenAnswer = null;
      this.renderRoomQuestion(data.question, data.current_index, data.total_questions);
    });

    this.socket.on("live_answer_count", (data) => {
      const counterEl = document.getElementById("hostLiveAnswerCount");
      if (counterEl) {
        counterEl.textContent = `${data.answered_count} answered`;
      }
    });

    this.socket.on("answer_acknowledged", (data) => {
      this.hasAnsweredCurrent = true;
      const statusEl = document.getElementById("mobileAnswerStatus");
      if (statusEl) {
        statusEl.innerHTML = `✅ Verdict Recorded: <strong style="color:#ffffff;">${data.chosen_answer}</strong><br><small style="color:var(--text-dim);">Waiting for timer to expire...</small>`;
      }
    });

    this.socket.on("reveal_feedback", (data) => {
      this.renderRoomFeedback(data);
    });

    this.socket.on("advance_question", (data) => {
      this.currentQuestion = data.question;
      this.hasAnsweredCurrent = false;
      this.lastChosenAnswer = null;
      this.renderRoomQuestion(data.question, data.current_index, data.total_questions);
    });

    this.socket.on("room_game_over", (data) => {
      this.renderRoomGameOver(data.leaderboard);
    });
  }

  updateParticipantList(participants) {
    if (!participants) return;
    const listEl = document.getElementById("lobbyPlayersList");
    const countEl = document.getElementById("liveParticipantCount");
    if (countEl) countEl.textContent = participants.length;

    if (listEl) {
      listEl.innerHTML = "";
      participants.forEach(p => {
        const item = document.createElement("div");
        item.className = "lobby-player-badge";
        item.innerHTML = `<span>⚡</span> <span>${p.nickname}</span> ${p.is_host ? '<small style="color:#fb7185;">(Host)</small>' : ''}`;
        listEl.appendChild(item);
      });
    }
  }

  /* Question Rendering for Host & Player */
  renderRoomQuestion(q, currentIdx, total) {
    const arena = this.getArena();
    if (!arena) return;

    this.clearIntervals();

    if (this.mode === "host") {
      // Big screen view: shows media, question number, and live answer count.
      arena.innerHTML = `
        <div class="question-top-bar">
          <span class="category-tag">${q.category || 'DEEPFAKE ANALYSIS'}</span>
          <div class="question-counter-badge">Question ${currentIdx + 1} of ${total}</div>
          <div class="timer-box" id="hostTimerBox">
            <span id="hostTimerDisplay">${q.total_time}.0s</span>
          </div>
        </div>
        <div class="media-container" style="max-height: 520px;">
          ${q.type === 'IMAGE' 
            ? `<img src="${q.media_url}" class="question-media-img" alt="Inspect media">` 
            : (q.type === 'AUDIO' 
                ? `<div class="audio-player-wrap"><audio src="${q.media_url}" controls autoplay style="width:80%"></audio></div>`
                : `<video src="${q.media_url}" class="question-media-video" autoplay muted playsinline loop></video>`
              )
          }
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1rem;">
          <div style="font-size:1.15rem; font-weight:800; color:var(--text-dim);">
            Audience Voting on Phones...
          </div>
          <div id="hostLiveAnswerCount" style="font-size:1.3rem; font-weight:900; color:#34d399;">
            0 answered
          </div>
        </div>
      `;

      // Host countdown timer
      this.totalAnswerTime = q.total_time;
      this.startHostCountdown(q.id);

    } else if (this.mode === "room_player") {
      // Mobile participant view: includes question media preview and large tactical AI & ASLI buttons!
      arena.innerHTML = `
        <div class="question-top-bar" style="margin-bottom:0.4rem;">
          <span class="category-tag">Question ${currentIdx + 1} / ${total}</span>
          <div class="timer-box" id="playerTimerBox">
            <span id="playerTimerDisplay">${q.total_time}.0s</span>
          </div>
        </div>
        
        <div class="mobile-media-preview-box" style="margin: 0.5rem 0 0.75rem; border-radius: 14px; overflow: hidden; background: #000; border: 1.5px solid rgba(255,255,255,0.18); max-height: 220px; display: flex; align-items: center; justify-content: center;">
          ${q.type === 'IMAGE' 
            ? `<img src="${q.media_url}" style="max-height: 220px; max-width: 100%; object-fit: contain; display: block;" alt="Question Preview">` 
            : (q.type === 'AUDIO' 
                ? `<div style="padding:1.5rem; text-align:center; width:100%;"><span style="font-size:2.5rem;">🎧</span><p style="color:var(--text-dim); margin-top:0.5rem; font-size:0.85rem;">Audio playing on Big Screen</p></div>`
                : `<video src="${q.media_url}" style="max-height: 220px; max-width: 100%; object-fit: contain; display: block;" autoplay muted playsinline loop></video>`
              )
          }
        </div>

        <div style="text-align:center; margin-bottom:0.4rem;">
          <h3 style="font-size:1.1rem; font-weight:800; margin:0 0 0.15rem; color:#ffffff;">Cast Your Verdict</h3>
          <p style="color:var(--text-dim); font-size:0.8rem; margin:0;">Inspect above or look at big screen, then tap below:</p>
        </div>

        <div class="answers-row" style="margin-top:0.4rem;">
          <button type="button" class="answer-btn answer-btn-ai room-player-btn" id="roomBtnAi">
            AI <span class="btn-subtext">Synthetic / Fake</span>
          </button>
          <button type="button" class="answer-btn answer-btn-asli room-player-btn" id="roomBtnAsli">
            ASLI <span class="btn-subtext">Real / Genuine</span>
          </button>
        </div>
        
        <div id="mobileAnswerStatus" style="text-align:center; margin-top:0.75rem; font-size:0.92rem; font-weight:700; color:var(--ai-cyan); min-height: 22px;"></div>
      `;

      const btnAi = document.getElementById("roomBtnAi");
      const btnAsli = document.getElementById("roomBtnAsli");

      if (btnAi) btnAi.addEventListener("click", () => this.submitRoomAnswer("AI"));
      if (btnAsli) btnAsli.addEventListener("click", () => this.submitRoomAnswer("ASLI"));

      this.startTime = Date.now();
      this.totalAnswerTime = q.total_time;
      this.startPlayerCountdown();
    }
  }

  submitRoomAnswer(answer) {
    if (this.hasAnsweredCurrent) return;
    this.hasAnsweredCurrent = true;
    this.lastChosenAnswer = answer;

    const timeTaken = (Date.now() - this.startTime) / 1000;
    const btnAi = document.getElementById("roomBtnAi");
    const btnAsli = document.getElementById("roomBtnAsli");

    if (answer === "AI") {
      if (btnAi) {
        btnAi.style.background = "#7c3aed";
        btnAi.style.color = "#ffffff";
        btnAi.style.borderColor = "#a855f7";
        btnAi.style.boxShadow = "0 0 25px rgba(168, 85, 247, 0.6)";
      }
      if (btnAsli) {
        btnAsli.style.opacity = "0.45";
        btnAsli.disabled = true;
      }
    } else {
      if (btnAsli) {
        btnAsli.style.background = "#e11d48";
        btnAsli.style.color = "#ffffff";
        btnAsli.style.borderColor = "#fb7185";
        btnAsli.style.boxShadow = "0 0 25px rgba(225, 29, 72, 0.6)";
      }
      if (btnAi) {
        btnAi.style.opacity = "0.45";
        btnAi.disabled = true;
      }
    }

    const statusEl = document.getElementById("mobileAnswerStatus");
    if (statusEl) {
      statusEl.innerHTML = `🔒 Verdict Locked: <strong>${answer}</strong>`;
    }

    this.socket.emit("submit_room_answer", {
      room_code: this.roomCode,
      player_id: this.playerId,
      question_id: this.currentQuestion.id,
      chosen_answer: answer,
      time_taken: Math.min(this.totalAnswerTime, Math.max(0, timeTaken))
    });

    if (window.soundFx && typeof window.soundFx.click === "function") {
      window.soundFx.click();
    }
  }

  startHostCountdown(questionId) {
    this.startTime = Date.now();
    let remaining = this.totalAnswerTime;

    this.timerInterval = setInterval(() => {
      const elapsed = (Date.now() - this.startTime) / 1000;
      remaining = Math.max(0, this.totalAnswerTime - elapsed);
      const display = document.getElementById("hostTimerDisplay");
      if (display) display.textContent = `${remaining.toFixed(1)}s`;

      if (remaining <= 0) {
        clearInterval(this.timerInterval);
        // Time expired: host requests reveal from server
        this.socket.emit("end_question_phase", {
          room_code: this.roomCode,
          question_id: questionId
        });
      }
    }, 100);
  }

  startPlayerCountdown() {
    let remaining = this.totalAnswerTime;
    this.timerInterval = setInterval(() => {
      const elapsed = (Date.now() - this.startTime) / 1000;
      remaining = Math.max(0, this.totalAnswerTime - elapsed);
      const display = document.getElementById("playerTimerDisplay");
      if (display) display.textContent = `${remaining.toFixed(1)}s`;

      if (remaining <= 0) {
        clearInterval(this.timerInterval);
        const btnAi = document.getElementById("roomBtnAi");
        const btnAsli = document.getElementById("roomBtnAsli");
        if (btnAi) btnAi.disabled = true;
        if (btnAsli) btnAsli.disabled = true;
      }
    }, 100);
  }

  renderRoomFeedback(data) {
    this.clearIntervals();
    const arena = this.getArena();
    if (!arena) return;

    if (this.mode === "host") {
      // Big screen reveals correct answer, explanation, response stats, and live leaderboard!
      arena.innerHTML = `
        <div style="background:rgba(15,23,42,0.85); padding:1.5rem; border-radius:18px; border:1px solid rgba(255,255,255,0.15); width:100%; box-sizing:border-box;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.2rem; flex-wrap:wrap; gap:0.5rem;">
            <div>
              <span style="font-size:0.85rem; color:var(--text-dim); text-transform:uppercase; font-weight:800; letter-spacing:0.05em;">Official Verdict</span>
              <h2 style="font-size:2.2rem; font-weight:900; color:${data.correct_answer === 'AI' ? '#a855f7' : '#e11d48'}; margin:0.2rem 0 0;">
                ${data.correct_answer === 'AI' ? '🤖 GENERATED BY AI' : '📸 ASLI (REAL)'}
              </h2>
            </div>
            <button type="button" class="btn btn-primary" id="hostNextBtn" style="padding:0.75rem 1.4rem; font-size:1.05rem; font-weight:900; background:#e11d48; border:none; border-radius:12px; cursor:pointer;">
              NEXT QUESTION →
            </button>
          </div>

          <p style="font-size:1.05rem; line-height:1.55; margin-bottom:1.2rem; background:rgba(0,0,0,0.3); padding:0.85rem 1rem; border-radius:12px; border:1px solid rgba(255,255,255,0.1);">
            <strong style="color:#ffffff;">Verification:</strong> <span style="color:rgba(255,255,255,0.9);">${data.explanation}</span>
          </p>

          <div style="background:rgba(0,0,0,0.3); padding:0.85rem 1.2rem; border-radius:12px; margin-bottom:1.2rem; display:flex; justify-content:space-between; align-items:center;">
            <span style="font-weight:700; color:var(--text-dim);">Audience Accuracy:</span>
            <strong style="color:#34d399; font-size:1.15rem;">${data.room_stats ? data.room_stats.display : ''}</strong>
          </div>

          <h3 style="font-size:1.15rem; margin-bottom:0.75rem; color:#ffffff; font-weight:800;">Live Room Standings</h3>
          <div class="room-standings-grid" style="max-height:180px; overflow-y:auto;">
            ${(data.leaderboard || []).slice(0, 6).map((p, idx) => `
              <div style="display:flex; justify-content:space-between; align-items:center; padding:0.55rem 0.9rem; background:rgba(255,255,255,0.06); margin-bottom:0.35rem; border-radius:8px;">
                <span style="font-weight:700;">#${idx + 1} <strong>${p.nickname}</strong></span>
                <span style="color:#fbbf24; font-weight:800;">${p.score} pts</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;

      const btn = document.getElementById("hostNextBtn");
      if (btn) {
        btn.addEventListener("click", () => {
          if (window.soundFx && typeof window.soundFx.click === "function") {
            window.soundFx.click();
          }
          this.socket.emit("next_room_question", { room_code: this.roomCode });
        });
      }

    } else if (this.mode === "room_player") {
      const chosen = this.lastChosenAnswer;
      const isCorrect = chosen && (chosen === data.correct_answer);
      arena.innerHTML = `
        <div style="text-align:center; padding:1.2rem 0.5rem; width:100%; box-sizing:border-box;">
          <div style="font-size:2.5rem; margin-bottom:0.3rem;">${isCorrect ? '🎯' : '⚡'}</div>
          
          <div style="display:inline-block; padding:0.35rem 0.9rem; border-radius:999px; font-weight:900; font-size:0.85rem; margin-bottom:0.65rem; background:${isCorrect ? 'rgba(34,197,94,0.2)' : 'rgba(225,29,72,0.2)'}; color:${isCorrect ? '#4ade80' : '#fb7185'}; border:1px solid ${isCorrect ? '#22c55e' : '#e11d48'};">
            ${isCorrect ? 'YOU WERE CORRECT!' : (chosen ? 'YOU WERE FOOLED!' : 'TIME EXPIRED')}
          </div>

          <h2 style="font-size:1.6rem; font-weight:900; color:${data.correct_answer === 'AI' ? '#a855f7' : '#e11d48'}; margin-bottom:0.5rem;">
            Answer: ${data.correct_answer === 'AI' ? '🤖 GENERATED BY AI' : '📸 ASLI (REAL)'}
          </h2>

          <p style="color:rgba(255,255,255,0.85); font-size:0.88rem; line-height:1.5; margin-bottom:1rem; background:rgba(0,0,0,0.35); padding:0.75rem; border-radius:10px; border:1px solid rgba(255,255,255,0.1);">
            ${data.explanation}
          </p>

          <div style="color:var(--text-dim); font-size:0.82rem; font-weight:700;">
            Waiting for host to launch next question...
          </div>
        </div>
      `;
    }
  }

  renderRoomGameOver(leaderboard) {
    this.clearIntervals();
    const arena = this.getArena();
    if (!arena) return;

    if (window.soundFx && typeof window.soundFx.fanfare === "function") {
      window.soundFx.fanfare();
    }

    arena.innerHTML = `
      <div style="text-align:center; padding:1.5rem 0.5rem; width:100%; box-sizing:border-box;">
        <h1 style="font-family:var(--font-chunky, 'Lilita One', sans-serif); font-size:2.2rem; color:#e11d48; margin:0 0 0.35rem; letter-spacing:0.04em;">
          CHALLENGE COMPLETE
        </h1>
        <p style="font-size:0.95rem; color:var(--text-dim); margin-bottom:1.2rem;">
          Room <span class="host-code-red">${this.roomCode}</span> Final Standings
        </p>
        <div style="width:100%; max-width:440px; margin:0 auto 1.5rem; max-height:260px; overflow-y:auto;">
          ${(leaderboard || []).map((p, idx) => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:0.65rem 1rem; background:${idx === 0 ? 'rgba(251, 191, 36, 0.15)' : 'rgba(255,255,255,0.05)'}; border:1.5px solid ${idx === 0 ? '#fbbf24' : 'rgba(255,255,255,0.12)'}; border-radius:10px; margin-bottom:0.4rem;">
              <span style="font-weight:800; font-size:0.95rem; color:#ffffff;">
                ${idx === 0 ? '👑 #1' : `#${idx + 1}`} ${p.nickname} ${p.player_id === this.playerId ? '<small style="color:#34d399">(You)</small>' : ''}
              </span>
              <span style="font-size:1.05rem; font-weight:900; color:${idx === 0 ? '#fbbf24' : '#a855f7'};">${p.score} pts</span>
            </div>
          `).join('')}
        </div>
        <a href="/modes" class="btn btn-primary" style="padding:0.75rem 1.6rem; border-radius:999px; font-weight:800; text-decoration:none; display:inline-block; background:#e11d48; border:none; color:#ffffff; box-shadow:0 4px 18px rgba(225,29,72,0.45);">
          Play Another Match 🚀
        </a>
      </div>
    `;
  }

  clearIntervals() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
}

window.MultiplayerManager = MultiplayerManager;
