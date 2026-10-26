/**
 * AI vs ASLI — Multiplayer & Big Screen Controller (Socket.IO)
 */

class MultiplayerManager {
  constructor(mode, roomCode) {
    this.mode = mode; // 'host', 'room_player', or 'lobby'
    this.roomCode = roomCode ? roomCode.toUpperCase() : null;
    this.playerId = localStorage.getItem("zenith_player_id");
    this.nickname = localStorage.getItem("zenith_nickname") || "Player";
    this.socket = null;
    this.currentQuestion = null;
    this.hasAnsweredCurrent = false;
    this.startTime = null;
    this.timerInterval = null;
    this.totalAnswerTime = 10.0;
  }

  init() {
    if (!this.playerId) {
      window.location.href = "/nickname";
      return;
    }

    // Connect to Socket.IO
    this.socket = io({ transports: ["websocket", "polling"] });

    this.socket.on("connect", () => {
      console.log("Connected to Zenith Multiplayer Network");
      if (this.roomCode) {
        this.joinRoom();
      }
    });

    this.bindSocketEvents();
  }

  joinRoom() {
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
