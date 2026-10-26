/**
 * AI vs ASLI — Multiplayer & Big Screen Controller (Socket.IO)
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
    this.startTime = null;
    this.timerInterval = null;
    this.totalAnswerTime = 10.0;
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
        console.log("Connected to Zenith Multiplayer Network");
        if (this.roomCode) {
          this.joinRoom();
        }
      });

      this.bindSocketEvents();
    } else if (this.socket.connected) {
      if (this.roomCode) {
        this.joinRoom();
      }
    }
  }

  renderQuickNameEntry() {
    const arena = document.getElementById("multiplayerArena");
    if (!arena) return;

    arena.innerHTML = `
      <div style="max-width:440px; margin:1rem auto; text-align:center; padding:2rem 1.5rem; background:var(--bg-surface); border:1px solid var(--border-subtle); border-radius:var(--radius-lg); box-shadow:var(--shadow-card);">
        <div style="display:inline-flex; align-items:center; gap:0.5rem; background:rgba(124,58,237,0.12); color:var(--zenith-purple); font-weight:800; font-size:0.85rem; padding:0.4rem 1rem; border-radius:9999px; border:1px solid var(--zenith-purple); margin-bottom:1.25rem;">
          🎯 JOINING ROOM: <strong style="letter-spacing:0.05em;">${this.roomCode}</strong>
        </div>

        <h2 style="font-size:1.75rem; font-weight:900; margin-bottom:0.4rem; color:var(--text-main);">
          Enter Your Name
        </h2>
        <p style="color:var(--text-dim); font-size:0.92rem; margin-bottom:1.5rem; line-height:1.5;">
          Enter your name or detective codename to jump right into the live challenge!
        </p>

        <form id="quickJoinForm" style="display:flex; flex-direction:column; gap:1.1rem; text-align:left;">
          <div>
            <label style="display:block; font-size:0.8rem; font-weight:800; color:var(--text-dim); margin-bottom:0.4rem; text-transform:uppercase;">
              Your Name / Codename
            </label>
            <input type="text" id="quickJoinInput" placeholder="e.g. Rahul, Sneha, CyberHawk" maxlength="25" required autofocus value="${(this.nickname && this.nickname !== 'Player') ? this.nickname : ''}" style="width:100%; font-size:1.15rem; font-weight:700; text-align:left; padding:0.85rem 1rem; border-radius:12px; border:2px solid var(--border-subtle); background:var(--bg-card); color:var(--text-main); box-sizing:border-box;">
          </div>

          <div>
            <div style="font-size:0.75rem; font-weight:800; color:var(--text-dim); margin-bottom:0.45rem; text-transform:uppercase;">Or Pick Quick Suggestion:</div>
            <div id="quickChipsContainer" style="display:flex; flex-wrap:wrap; gap:0.4rem;">
              <button type="button" class="btn btn-secondary btn-sm quick-chip" style="font-size:0.8rem; padding:0.35rem 0.65rem;">⚡ Optic Phantom</button>
              <button type="button" class="btn btn-secondary btn-sm quick-chip" style="font-size:0.8rem; padding:0.35rem 0.65rem;">🧠 Neural Ninja</button>
              <button type="button" class="btn btn-secondary btn-sm quick-chip" style="font-size:0.8rem; padding:0.35rem 0.65rem;">🔍 Pattern Pilot</button>
              <button type="button" class="btn btn-secondary btn-sm quick-chip" style="font-size:0.8rem; padding:0.35rem 0.65rem;">👁️ Bio Sentinel</button>
            </div>
          </div>

          <button type="submit" class="btn btn-primary btn-lg" id="btnConfirmQuickJoin" style="margin-top:0.4rem; width:100%; font-size:1.15rem; padding:0.95rem; border-radius:14px; box-shadow:0 4px 20px rgba(124,58,237,0.4);">
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
        window.showToast("Please enter your name!", true);
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
          window.soundFx.click();
          this.renderWaitingRoom();
          this.connectAndJoin();
        } else {
          submitBtn.disabled = false;
          submitBtn.textContent = "JOIN ROOM 🚀";
          window.showToast(data.error || "Failed to set name", true);
        }
      })
      .catch(err => {
        console.error("Join error:", err);
        submitBtn.disabled = false;
        submitBtn.textContent = "JOIN ROOM 🚀";
        window.showToast("Connection issue. Please retry.", true);
      });
    });
  }

  renderWaitingRoom() {
    const arena = document.getElementById("multiplayerArena");
    if (!arena) return;

    arena.innerHTML = `
      <div style="text-align:center; padding:2.5rem 1.5rem; background:var(--bg-surface); border-radius:var(--radius-lg); border:1px solid var(--border-subtle); box-shadow:var(--shadow-subtle); max-width:540px; margin:1rem auto;">
        <div style="font-size:3.5rem; margin-bottom:0.75rem;">⚡</div>
        <h2 style="font-size:1.75rem; font-weight:900; margin-bottom:0.5rem; color:var(--text-main);">
          Connected to Room <span style="color:var(--zenith-purple);">${this.roomCode}</span>
        </h2>
        <div style="display:inline-flex; align-items:center; gap:0.5rem; background:rgba(124,58,237,0.1); border:1px solid var(--zenith-purple); color:var(--zenith-purple); padding:0.4rem 1rem; border-radius:9999px; font-weight:800; font-size:0.95rem; margin-bottom:1.5rem;">
          <span>Player:</span> <strong id="displayName">${this.nickname}</strong>
          <button type="button" id="btnChangePlayerName" style="background:none; border:none; color:var(--text-dim); text-decoration:underline; cursor:pointer; font-size:0.82rem; margin-left:0.4rem; font-weight:700;">(Change)</button>
        </div>
        <p style="color:var(--text-dim); margin-bottom:1.8rem; font-size:1rem; line-height:1.6;">
          Look up at the stage/projector screen!<br>The questions and media will appear there.
        </p>
        <div style="background:var(--bg-card); padding:1rem 1.5rem; border-radius:12px; display:inline-block; font-weight:800; color:var(--zenith-purple); border:1px solid var(--border-subtle);">
          Status: Waiting for host to launch the match...
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
    });

    this.socket.on("player_joined", (data) => {
      this.updateParticipantList(data.participants);
      window.showToast(`${data.nickname} entered the arena!`);
    });

    this.socket.on("join_error", (data) => {
      window.showToast(data.message, true);
      setTimeout(() => { window.location.href = "/modes"; }, 2000);
    });

    this.socket.on("room_game_started", (data) => {
      this.currentQuestion = data.question;
      this.hasAnsweredCurrent = false;
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
        statusEl.innerHTML = `✅ Answer Locked: <strong>${data.chosen_answer}</strong><br><small>Waiting for time to expire...</small>`;
      }
    });

    this.socket.on("reveal_feedback", (data) => {
      this.renderRoomFeedback(data);
    });

    this.socket.on("advance_question", (data) => {
      this.currentQuestion = data.question;
      this.hasAnsweredCurrent = false;
      this.renderRoomQuestion(data.question, data.current_index, data.total_questions);
    });

    this.socket.on("room_game_over", (data) => {
      this.renderRoomGameOver(data.leaderboard);
    });
  }

  updateParticipantList(participants) {
    const listEl = document.getElementById("lobbyPlayersList");
    const countEl = document.getElementById("liveParticipantCount");
    if (countEl) countEl.textContent = participants.length;

    if (listEl) {
      listEl.innerHTML = "";
      participants.forEach(p => {
        const item = document.createElement("div");
        item.className = "lobby-player-badge";
        item.innerHTML = `<span>⚡</span> <span>${p.nickname}</span> ${p.is_host ? '<small style="color:var(--ai-cyan)">(Host)</small>' : ''}`;
        listEl.appendChild(item);
      });
    }
  }

  /* Question Rendering for Host & Player */
  renderRoomQuestion(q, currentIdx, total) {
    const arena = document.getElementById("multiplayerArena");
    if (!arena) return;

    this.clearIntervals();

    if (this.mode === "host") {
      // Big screen view: shows media, question number, and live answer count.
      // ANSWER IS NEVER REVEALED EARLY!
      arena.innerHTML = `
        <div class="question-top-bar">
          <span class="category-tag">${q.category || 'ANALYSIS'}</span>
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
                : `<video src="${q.media_url}" class="question-media-video" autoplay playsinline></video>`
              )
          }
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1rem;">
          <div style="font-size:1.2rem; font-weight:800; color:var(--text-dim);">
            Participants Answering on Phones...
          </div>
          <div id="hostLiveAnswerCount" style="font-size:1.3rem; font-weight:900; color:var(--ai-cyan);">
            0 answered
          </div>
        </div>
      `;

      // Host countdown timer
      this.totalAnswerTime = q.total_time;
      this.startHostCountdown(q.id);

    } else if (this.mode === "room_player") {
      // Mobile participant view: large tactical AI & ASLI buttons!
      arena.innerHTML = `
        <div class="question-top-bar">
          <span class="category-tag">Question ${currentIdx + 1} / ${total}</span>
          <div class="timer-box" id="playerTimerBox">
            <span id="playerTimerDisplay">${q.total_time}.0s</span>
          </div>
        </div>
        <div style="text-align:center; padding:1.5rem 0;">
          <h3 style="font-size:1.5rem; font-weight:800; margin-bottom:0.5rem;">Look at Big Screen!</h3>
          <p style="color:var(--text-dim); font-size:0.95rem;">Lock in your verdict below:</p>
        </div>
        <div class="answers-row">
          <button type="button" class="answer-btn answer-btn-ai" id="roomBtnAi">
            AI <span class="btn-subtext">Synthetic / Fake</span>
          </button>
          <button type="button" class="answer-btn answer-btn-asli" id="roomBtnAsli">
            ASLI <span class="btn-subtext">Real / Genuine</span>
          </button>
        </div>
        <div id="mobileAnswerStatus" style="text-align:center; margin-top:1.5rem; font-size:1.1rem; color:var(--ai-cyan);"></div>
      `;

      const btnAi = document.getElementById("roomBtnAi");
      const btnAsli = document.getElementById("roomBtnAsli");

      btnAi.addEventListener("click", () => this.submitRoomAnswer("AI"));
      btnAsli.addEventListener("click", () => this.submitRoomAnswer("ASLI"));

      this.startTime = Date.now();
      this.totalAnswerTime = q.total_time;
      this.startPlayerCountdown();
    }
  }

  submitRoomAnswer(answer) {
    if (this.hasAnsweredCurrent) return;
    this.hasAnsweredCurrent = true;

    const timeTaken = (Date.now() - this.startTime) / 1000;
    const btnAi = document.getElementById("roomBtnAi");
    const btnAsli = document.getElementById("roomBtnAsli");
    if (btnAi) btnAi.disabled = true;
    if (btnAsli) btnAsli.disabled = true;

    this.socket.emit("submit_room_answer", {
      room_code: this.roomCode,
      player_id: this.playerId,
      question_id: this.currentQuestion.id,
      chosen_answer: answer,
      time_taken: Math.min(this.totalAnswerTime, Math.max(0, timeTaken))
    });

    window.soundFx.click();
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
      }
    }, 100);
  }

  renderRoomFeedback(data) {
    this.clearIntervals();
    const arena = document.getElementById("multiplayerArena");
    if (!arena) return;

    if (this.mode === "host") {
      // Big screen reveals correct answer, explanation, response stats, and live leaderboard!
      arena.innerHTML = `
        <div style="background:var(--bg-surface); padding:2rem; border-radius:var(--radius-lg); border:1px solid var(--border-subtle);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
            <div>
              <span style="font-size:0.9rem; color:var(--text-dim); text-transform:uppercase;">Official Verdict</span>
              <h2 style="font-size:2.5rem; font-weight:900; color:var(--color-success);">
                ${data.correct_answer === 'AI' ? '🤖 GENERATED BY AI' : '📸 ASLI (GENUINE)'}
              </h2>
            </div>
            <button type="button" class="btn btn-primary" id="hostNextBtn">
              NEXT QUESTION →
            </button>
          </div>
          <p style="font-size:1.15rem; line-height:1.6; margin-bottom:1.5rem;">
            <strong>Verification:</strong> ${data.explanation}
          </p>
          <div style="background:rgba(0,0,0,0.3); padding:1rem; border-radius:var(--radius-md); margin-bottom:1.5rem;">
            <span style="font-weight:700;">Room Accuracy:</span>
            <strong style="color:var(--ai-cyan); font-size:1.2rem; margin-left:0.5rem;">${data.room_stats.display}</strong>
          </div>
          <h3 style="font-size:1.3rem; margin-bottom:1rem; color:var(--zenith-violet);">Live Room Standings</h3>
          <div class="room-standings-grid">
            ${data.leaderboard.slice(0, 5).map((p, idx) => `
              <div style="display:flex; justify-content:space-between; padding:0.6rem 1rem; background:rgba(255,255,255,0.05); margin-bottom:0.4rem; border-radius:8px;">
                <span>#${idx + 1} <strong>${p.nickname}</strong></span>
                <span style="color:var(--ai-cyan); font-weight:800;">${p.score} pts</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;

      const btn = document.getElementById("hostNextBtn");
      if (btn) {
        btn.addEventListener("click", () => {
          this.socket.emit("next_room_question", { room_code: this.roomCode });
        });
      }

    } else if (this.mode === "room_player") {
      arena.innerHTML = `
        <div style="text-align:center; padding:2rem 1rem;">
          <h2 style="font-size:2rem; font-weight:900; color:var(--color-success); margin-bottom:1rem;">
            Answer: ${data.correct_answer}
          </h2>
          <p style="color:var(--text-dim); margin-bottom:1.5rem;">${data.explanation}</p>
          <p style="color:var(--ai-cyan); font-weight:700;">Waiting for host to advance...</p>
        </div>
      `;
    }
  }

  renderRoomGameOver(leaderboard) {
    this.clearIntervals();
    const arena = document.getElementById("multiplayerArena");
    if (!arena) return;

    window.soundFx.fanfare();

    arena.innerHTML = `
      <div style="text-align:center; padding:3rem 1.5rem;">
        <h1 class="game-over-title">MATCH COMPLETE</h1>
        <p style="font-size:1.3rem; color:var(--text-dim); margin-bottom:2rem;">Room ${this.roomCode} Final Standings</p>
        <div style="max-width:500px; margin:0 auto 2.5rem;">
          ${leaderboard.map((p, idx) => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:0.8rem 1.2rem; background:${idx === 0 ? 'rgba(251, 191, 36, 0.15)' : 'rgba(255,255,255,0.05)'}; border:1px solid ${idx === 0 ? '#fbbf24' : 'var(--border-subtle)'}; border-radius:10px; margin-bottom:0.5rem;">
              <span style="font-weight:800; font-size:1.1rem;">
                ${idx === 0 ? '👑 #1' : `#${idx + 1}`} ${p.nickname}
              </span>
              <span style="font-size:1.2rem; font-weight:900; color:var(--ai-cyan);">${p.score} pts</span>
            </div>
          `).join('')}
        </div>
        <a href="/modes" class="btn btn-primary">Play Another Match</a>
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
