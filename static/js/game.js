/**
 * AI vs ASLI — Gameplay Engine (Points Hidden During Questions!)
 */

class GameEngine {
  constructor() {
    this.sessionId = null;
    this.playerId = localStorage.getItem("zenith_player_id");
    this.nickname = localStorage.getItem("zenith_nickname") || "Detective";
    this.currentIndex = 0;
    this.totalQuestions = 10;
    this.currentQuestion = null;
    this.timerInterval = null;
    this.remainingTime = 10.0;
    this.totalAnswerTime = 10.0;
    this.startTime = null;
    this.isAnsweringLocked = false;
    this.autoAdvanceTimeout = null;
    this.isAudioVideoPlaybackActive = false;
    
    // Zoom/Pan State
    this.zoomScale = 1;
    this.panX = 0;
    this.panY = 0;
    this.isPanning = false;
    this.startPanX = 0;
    this.startPanY = 0;
    
    this.bindDOM();
  }

  bindDOM() {
    this.questionCounterEl = document.getElementById("questionCounter");
    this.categoryTagEl = document.getElementById("categoryTag");
    this.timerDisplayEl = document.getElementById("timerDisplay");
    this.timerBoxEl = document.getElementById("timerBox");
    this.mediaViewportEl = document.getElementById("mediaViewport");
    this.btnAi = document.getElementById("btnAnswerAi");
    this.btnAsli = document.getElementById("btnAnswerAsli");
    this.feedbackDrawerEl = document.getElementById("feedbackDrawer");

    if (this.btnAi) {
      this.btnAi.addEventListener("click", () => this.handleAnswer("AI"));
    }
    if (this.btnAsli) {
      this.btnAsli.addEventListener("click", () => this.handleAnswer("ASLI"));
    }
  }

  init() {
    if (!this.playerId) {
      window.location.href = "/nickname";
      return;
    }

    window.showLoadingScreen(1000, [
      "Calibrating your eyes...",
      "Preparing 10 reality tests...",
      "AI is preparing its best disguises..."
    ], () => {
      this.startSoloSession();
    });
  }

  startSoloSession() {
    fetch("/api/game/solo/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        player_id: this.playerId,
        nickname: this.nickname
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.status === "success") {
        this.sessionId = data.session_id;
        this.totalQuestions = data.total_questions;
        this.currentIndex = data.current_index;
        this.currentQuestion = data.question;
        this.renderQuestion(this.currentQuestion);
      } else {
        window.showToast(data.error || "Failed to start game", true);
      }
    })
    .catch(err => {
      console.error("Start error:", err);
      window.showToast("Failed to connect to game server", true);
    });
  }

  renderQuestion(q) {
    this.isAnsweringLocked = false;
    this.clearIntervals();
    this.feedbackDrawerEl.style.display = "none";
    this.feedbackDrawerEl.innerHTML = "";
    
    // Reset buttons
    this.btnAi.disabled = false;
    this.btnAsli.disabled = false;
    this.btnAi.className = "answer-btn answer-btn-ai";
    this.btnAsli.className = "answer-btn answer-btn-asli";

    // Progress updates (NO POINTS DISPLAYED!)
    const questionWord = (window.i18n && window.i18n.currentLang === "hi") ? "Sawaal" : "Question";
    const ofWord = (window.i18n && window.i18n.currentLang === "hi") ? "/" : "of";
    this.questionCounterEl.textContent = `${questionWord} ${q.index} ${ofWord} ${q.total}`;
    this.categoryTagEl.textContent = q.category || "OBSERVATION";
    this.updateProgressSegments(q.index - 1);

    // Media Setup
    this.renderMedia(q);
  }

  renderMedia(q) {
    this.mediaViewportEl.innerHTML = "";
    this.timerBoxEl.classList.remove("urgent");

    // Remove any previous media controls bar outside viewport
    const oldControls = document.getElementById("gameMediaControlsBar");
    if (oldControls) oldControls.remove();

    if (q.type === "IMAGE") {
      this.isAudioVideoPlaybackActive = false;
      this.totalAnswerTime = q.total_time || 15.0;
      this.remainingTime = this.totalAnswerTime;
      this.updateTimerDisplay(this.totalAnswerTime);

      // 1. Image lens container
      const lensWrap = document.createElement("div");
      lensWrap.className = "image-lens-wrapper";

      const img = document.createElement("img");
      img.src = q.media_url;
      img.alt = "Analyze this visual micro-texture";
      img.className = "question-media-img";

      const loupe = document.createElement("div");
      loupe.className = "magnifier-circle-loupe";
      loupe.setAttribute("aria-hidden", "true");

      lensWrap.appendChild(img);
      lensWrap.appendChild(loupe);
      this.mediaViewportEl.appendChild(lensWrap);

      // 2. Media Controls Bar with ON/OFF Pill Toggle (Image 3)
      const controlsBar = document.createElement("div");
      controlsBar.className = "media-controls-bar";
      controlsBar.id = "gameMediaControlsBar";

      const toggleBtn = document.createElement("button");
      toggleBtn.type = "button";
      toggleBtn.className = "lens-toggle-pill";
      toggleBtn.innerHTML = `
        <span>🔍</span>
        <span class="lens-pill-text">ON</span>
        <span class="lens-pill-switch"></span>
      `;

      const hint = document.createElement("span");
      hint.className = "lens-hint-label";
      const hintText = (window.i18n && window.i18n.currentLang === "hi") 
        ? "Photo par ghumao deepfake anomalies dhoondne ke liye" 
        : "Move cursor or drag finger to inspect AI artifacts";
      hint.textContent = hintText;

      controlsBar.appendChild(toggleBtn);
      controlsBar.appendChild(hint);

      // Insert controls directly below the media viewport
      this.mediaViewportEl.parentNode.insertBefore(controlsBar, this.mediaViewportEl.nextSibling);

      // 3. Initialize In-situ Loupe logic
      this.setupCircularLoupe(lensWrap, img, loupe, toggleBtn);

      this.startCountdown();

    } else if (q.type === "AUDIO") {
      this.isAudioVideoPlaybackActive = true;
      this.btnAi.disabled = true;
      this.btnAsli.disabled = true;
      this.totalAnswerTime = q.total_time || 10.0;
      this.remainingTime = this.totalAnswerTime;
      const listenPrompt = (window.i18n && window.i18n.currentLang === "hi") ? "Pehle audio suno..." : "Listen first...";
      this.timerDisplayEl.textContent = listenPrompt;

      const wrap = document.createElement("div");
      wrap.className = "audio-player-wrap";

      const waveWrap = document.createElement("div");
      waveWrap.className = "waveform-visualizer";
      for (let i = 0; i < 24; i++) {
        const bar = document.createElement("div");
        bar.className = "wave-bar";
        waveWrap.appendChild(bar);
      }
      wrap.appendChild(waveWrap);

      const controls = document.createElement("div");
      controls.className = "audio-controls";

      const playBtn = document.createElement("button");
      playBtn.type = "button";
      playBtn.className = "audio-play-btn";
      playBtn.innerHTML = "▶";

      const statusText = document.createElement("span");
      statusText.className = "audio-status-text";
      statusText.textContent = (window.i18n && window.i18n.currentLang === "hi") ? "Sunne ke liye Play dabao" : "Press Play to Listen";

      controls.appendChild(playBtn);
      controls.appendChild(statusText);
      wrap.appendChild(controls);

      const audio = new Audio(q.media_url);
      let isPlaying = false;
      let waveAnim = null;

      const animateWave = () => {
        const bars = waveWrap.querySelectorAll(".wave-bar");
        bars.forEach(b => {
          b.style.height = `${Math.floor(8 + Math.random() * 45)}px`;
        });
        if (isPlaying) {
          waveAnim = requestAnimationFrame(animateWave);
        }
      };

      playBtn.addEventListener("click", () => {
        if (!isPlaying) {
          audio.play().then(() => {
            isPlaying = true;
            playBtn.innerHTML = "⏸";
            statusText.textContent = (window.i18n && window.i18n.currentLang === "hi") ? "Audio chal raha hai..." : "Playing clip...";
            animateWave();
          }).catch(() => {
            statusText.textContent = "Playback error. Tap to retry.";
          });
        } else {
          audio.pause();
          isPlaying = false;
          playBtn.innerHTML = "▶";
          statusText.textContent = "Paused";
          cancelAnimationFrame(waveAnim);
        }
      });

      audio.addEventListener("ended", () => {
        isPlaying = false;
        cancelAnimationFrame(waveAnim);
        playBtn.disabled = true;
        playBtn.style.opacity = "0.5";
        statusText.textContent = (window.i18n && window.i18n.currentLang === "hi") ? "Audio khatam! Ab jawab do:" : "Audio finished! Make your call:";
        this.isAudioVideoPlaybackActive = false;
        this.btnAi.disabled = false;
        this.btnAsli.disabled = false;
        this.startCountdown();
      });

      this.mediaViewportEl.appendChild(wrap);

    } else if (q.type === "VIDEO") {
      this.isAudioVideoPlaybackActive = true;
      this.btnAi.disabled = true;
      this.btnAsli.disabled = true;
      this.totalAnswerTime = q.total_time || 10.0;
      this.remainingTime = this.totalAnswerTime;
      this.timerDisplayEl.textContent = (window.i18n && window.i18n.currentLang === "hi") ? "Pehle video dekho..." : "Watch first...";

      const wrap = document.createElement("div");
      wrap.className = "video-player-wrap";

      const video = document.createElement("video");
      video.src = q.media_url;
      video.className = "question-media-video";
      video.playsInline = true;

      const overlay = document.createElement("div");
      overlay.className = "video-play-overlay";
      const vidText = (window.i18n && window.i18n.currentLang === "hi") ? "Video dekhne ke liye tap karo" : "Tap to play video";
      overlay.innerHTML = `<div class="video-play-btn">▶</div><p style="color:#fff; font-weight:700;">${vidText}</p>`;

      overlay.addEventListener("click", () => {
        overlay.style.display = "none";
        video.play().catch(() => {
          overlay.style.display = "flex";
          overlay.innerHTML = `<p style="color:#fff;">Tap again to play</p>`;
        });
      });

      video.addEventListener("ended", () => {
        this.isAudioVideoPlaybackActive = false;
        this.btnAi.disabled = false;
        this.btnAsli.disabled = false;
        this.startCountdown();
      });

      wrap.appendChild(video);
      wrap.appendChild(overlay);
      this.mediaViewportEl.appendChild(wrap);
    }
  }

  startCountdown() {
    this.startTime = Date.now();
    this.remainingTime = this.totalAnswerTime;
    this.updateTimerDisplay(this.remainingTime);

    this.timerInterval = setInterval(() => {
      const elapsed = (Date.now() - this.startTime) / 1000;
      this.remainingTime = Math.max(0, this.totalAnswerTime - elapsed);
      this.updateTimerDisplay(this.remainingTime);

      if (this.remainingTime <= 3.0 && this.remainingTime > 0) {
        this.timerBoxEl.classList.add("urgent");
        window.soundFx.tick();
      }

      if (this.remainingTime <= 0) {
        clearInterval(this.timerInterval);
        this.handleTimeout();
      }
    }, 100);
  }

  updateTimerDisplay(sec) {
    this.timerDisplayEl.textContent = `${sec.toFixed(1)}s`;
  }

  handleAnswer(chosen) {
    if (this.isAnsweringLocked || this.isAudioVideoPlaybackActive) return;
    this.isAnsweringLocked = true;
    clearInterval(this.timerInterval);
    
    this.btnAi.disabled = true;
    this.btnAsli.disabled = true;
    
    const timeTaken = (Date.now() - this.startTime) / 1000;
    this.submitAnswerToServer(chosen, timeTaken);
  }

  handleTimeout() {
    if (this.isAnsweringLocked) return;
    this.isAnsweringLocked = true;
    this.btnAi.disabled = true;
    this.btnAsli.disabled = true;
    this.submitAnswerToServer("UNANSWERED", this.totalAnswerTime);
  }

  submitAnswerToServer(chosenAnswer, timeTaken) {
    fetch(`/api/game/${this.sessionId}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question_id: this.currentQuestion.id,
        chosen_answer: chosenAnswer,
        time_taken: Math.min(this.totalAnswerTime, Math.max(0, timeTaken))
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.status === "success") {
        this.renderFeedback(data, chosenAnswer);
      } else {
        window.showToast(data.error || "Submission error", true);
      }
    })
    .catch(err => {
      console.error("Answer submission error:", err);
      window.showToast("Failed to verify answer with server", true);
    });
  }

  renderFeedback(res, chosenAnswer) {
    // NOTICE: Live points are NOT shown during the quiz as requested!
    if (res.is_correct) {
      window.soundFx.correct();
      if (chosenAnswer === "AI") this.btnAi.classList.add("selected-correct");
      if (chosenAnswer === "ASLI") this.btnAsli.classList.add("selected-correct");
      this.markSegmentState(this.currentIndex, true);
    } else {
      window.soundFx.incorrect();
      if (chosenAnswer === "AI") this.btnAi.classList.add("selected-incorrect");
      if (chosenAnswer === "ASLI") this.btnAsli.classList.add("selected-incorrect");
      if (res.correct_answer === "AI") this.btnAi.classList.add("reveal-actual");
      if (res.correct_answer === "ASLI") this.btnAsli.classList.add("reveal-actual");
      this.markSegmentState(this.currentIndex, false);
    }

    const isHinglish = window.i18n && window.i18n.currentLang === "hi";
    const isUnanswered = res.is_unanswered;
    let statusClass = res.is_correct ? "correct" : (isUnanswered ? "unanswered" : "incorrect");
    let statusText = res.is_correct 
      ? (isHinglish ? "🎯 Sahi Pehchaana! (Correct)" : "🎯 Spot On! Correct Detection") 
      : (isUnanswered ? (isHinglish ? "⌛ Time Khatam Ho Gaya!" : "⌛ Time Expired!") : (isHinglish ? "❌ AI Ne Dhokha De Diya!" : "❌ Deceived by the Fake!"));

    const nextBtnText = res.is_game_over 
      ? (isHinglish ? "FINAL RESULTS DEKHO" : "VIEW FINAL RESULTS")
      : (isHinglish ? "AGLA SAWAAL →" : "NEXT QUESTION →");

    const autoAdvanceText = isHinglish ? "Auto-advancing in 10s..." : "Auto-advancing in 10s...";

    this.feedbackDrawerEl.innerHTML = `
      <div class="feedback-status-row">
        <div class="feedback-status-title ${statusClass}">${statusText}</div>
      </div>
      <p class="feedback-explanation"><strong>Verification:</strong> ${res.explanation}</p>
      <div class="feedback-next-row">
        <span class="auto-timer-note" id="autoAdvanceNote">${autoAdvanceText}</span>
        <button type="button" class="btn btn-primary btn-sm" id="nextQuestionBtn">
          ${nextBtnText}
        </button>
      </div>
    `;

    this.feedbackDrawerEl.style.display = "block";

    const btnNext = document.getElementById("nextQuestionBtn");
    btnNext.addEventListener("click", () => {
      this.advanceToNext(res.is_game_over);
    });

    let countdown = 10;
    const noteEl = document.getElementById("autoAdvanceNote");
    const interval = setInterval(() => {
      countdown--;
      if (noteEl) noteEl.textContent = `Auto-advancing in ${countdown}s...`;
      if (countdown <= 0) {
        clearInterval(interval);
        this.advanceToNext(res.is_game_over);
      }
    }, 1000);
    this.autoAdvanceTimeout = interval;
  }

  advanceToNext(isGameOver) {
    if (this.autoAdvanceTimeout) {
      clearInterval(this.autoAdvanceTimeout);
      this.autoAdvanceTimeout = null;
    }

    if (isGameOver) {
      window.showLoadingScreen(1200, [
        "Reviewing your instincts...",
        "Comparing your answers...",
        "Preparing your reality report..."
      ], () => {
        window.location.href = `/results/${this.sessionId}`;
      });
      return;
    }

    this.currentIndex++;
    fetch(`/api/game/${this.sessionId}/question/${this.currentIndex}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === "success") {
          this.currentQuestion = data.question;
          this.renderQuestion(this.currentQuestion);
        } else {
          window.showToast("Failed to load next question", true);
        }
      })
      .catch(err => {
        console.error("Next question error:", err);
      });
  }

  updateProgressSegments(activeIdx) {
    const segments = document.querySelectorAll(".progress-segment");
    segments.forEach((seg, idx) => {
      if (idx === activeIdx) {
        seg.classList.add("current");
      } else {
        seg.classList.remove("current");
      }
    });
  }

  markSegmentState(idx, isCorrect) {
    const segments = document.querySelectorAll(".progress-segment");
    if (segments[idx]) {
      segments[idx].classList.remove("current");
      segments[idx].classList.add(isCorrect ? "past-correct" : "past-incorrect");
    }
  }

  clearIntervals() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.autoAdvanceTimeout) clearInterval(this.autoAdvanceTimeout);
  }

  setupCircularLoupe(wrapper, img, loupe, toggleBtn) {
    let isLensActive = true;
    const zoom = 2.5;
    const radius = 88; // 176px circle diameter / 2

    toggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      isLensActive = !isLensActive;
      toggleBtn.classList.toggle("off", !isLensActive);
      const textSpan = toggleBtn.querySelector(".lens-pill-text");
      if (textSpan) textSpan.textContent = isLensActive ? "ON" : "OFF";
      if (!isLensActive) {
        loupe.style.display = "none";
      }
      if (window.soundFx) window.soundFx.click();
    });

    const updateLoupePosition = (clientX, clientY, isTouch = false) => {
      if (!isLensActive) return;
      const rect = img.getBoundingClientRect();
      const wrapRect = wrapper.getBoundingClientRect();

      // Check if pointer is inside image display rectangle
      if (
        clientX < rect.left ||
        clientX > rect.right ||
        clientY < rect.top ||
        clientY > rect.bottom
      ) {
        loupe.style.display = "none";
        return;
      }

      // Coordinates relative to the image itself
      const imgX = clientX - rect.left;
      const imgY = clientY - rect.top;

      // Coordinates relative to the wrapper
      const wrapX = clientX - wrapRect.left;
      const wrapY = isTouch ? (clientY - wrapRect.top - 65) : (clientY - wrapRect.top);

      loupe.style.left = `${wrapX}px`;
      loupe.style.top = `${wrapY}px`;
      loupe.style.display = "block";

      // Zoom calculations
      const bgW = rect.width * zoom;
      const bgH = rect.height * zoom;
      const bgX = (imgX * zoom) - radius;
      const bgY = (imgY * zoom) - radius;

      loupe.style.backgroundImage = `url("${img.src}")`;
      loupe.style.backgroundSize = `${bgW}px ${bgH}px`;
      loupe.style.backgroundPosition = `-${bgX}px -${bgY}px`;
    };

    wrapper.addEventListener("mousemove", (e) => {
      updateLoupePosition(e.clientX, e.clientY, false);
    });

    wrapper.addEventListener("mouseleave", () => {
      loupe.style.display = "none";
    });

    // Mobile touch events for smooth tactile phone inspection
    wrapper.addEventListener("touchstart", (e) => {
      if (e.touches && e.touches.length > 0) {
        updateLoupePosition(e.touches[0].clientX, e.touches[0].clientY, true);
      }
    }, { passive: true });

    wrapper.addEventListener("touchmove", (e) => {
      if (e.touches && e.touches.length > 0) {
        updateLoupePosition(e.touches[0].clientX, e.touches[0].clientY, true);
      }
    }, { passive: true });

    wrapper.addEventListener("touchend", () => {
      loupe.style.display = "none";
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("gameArenaSolo")) {
    window.gameEngine = new GameEngine();
    window.gameEngine.init();
  }
});
