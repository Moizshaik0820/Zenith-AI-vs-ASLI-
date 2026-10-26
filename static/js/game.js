/**
 * AI vs ASLI — Gameplay Engine (Points Hidden During Questions!)
 */

class GameEngine {
  constructor() {
    this.sessionId = null;
    this.playerId = localStorage.getItem("zenith_player_id");
    this.nickname = localStorage.getItem("zenith_nickname") || "Detective";
    this.currentIndex = 0;
    this.totalQuestions = 6;
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

    this.swipeableCard = document.getElementById("swipeableCard");
    this.swipeCueAi = document.getElementById("swipeCueAi");
    this.swipeCueAsli = document.getElementById("swipeCueAsli");
    this.gameMemeOverlay = document.getElementById("gameMemeOverlay");
    this.btnNextFromMeme = document.getElementById("btnNextFromMeme");
    this.memeReactionImg = document.getElementById("memeReactionImg");
    this.memeStatusBadge = document.getElementById("memeStatusBadge");
    this.memeScoreEarned = document.getElementById("memeScoreEarned");
    this.memeExplanationText = document.getElementById("memeExplanationText");

    this.initSwipeGestures();
  }

  initSwipeGestures() {
    if (!this.swipeableCard) return;

    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let isDragging = false;
    let isHorizontalGesture = false;

    const onStart = (clientX, clientY) => {
      if (this.isAnsweringLocked || this.zoomScale > 1.05) return;
      startX = clientX;
      startY = clientY;
      currentX = clientX;
      isDragging = true;
      isHorizontalGesture = false;
      this.swipeableCard.classList.add("swiping");
    };

    const onMove = (clientX, clientY) => {
      if (!isDragging || this.isAnsweringLocked) return;
      const dx = clientX - startX;
      const dy = clientY - startY;

      if (!isHorizontalGesture) {
        if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
          isHorizontalGesture = true;
        } else if (Math.abs(dy) > 12) {
          isDragging = false;
          this.resetCardTransform();
          return;
        }
      }

      if (isHorizontalGesture) {
        currentX = clientX;
        const dragDistance = dx;
        const tiltAngle = Math.max(-14, Math.min(14, dragDistance * 0.05));
        this.swipeableCard.style.transform = `translateX(${dragDistance * 0.65}px) rotate(${tiltAngle}deg)`;

        if (dragDistance > 30) {
          this.swipeableCard.classList.add("swipe-right-active");
          this.swipeableCard.classList.remove("swipe-left-active");
          if (this.swipeCueAsli) this.swipeCueAsli.classList.add("show");
          if (this.swipeCueAi) this.swipeCueAi.classList.remove("show");
        } else if (dragDistance < -30) {
          this.swipeableCard.classList.add("swipe-left-active");
          this.swipeableCard.classList.remove("swipe-right-active");
          if (this.swipeCueAi) this.swipeCueAi.classList.add("show");
          if (this.swipeCueAsli) this.swipeCueAsli.classList.remove("show");
        } else {
          this.swipeableCard.classList.remove("swipe-left-active", "swipe-right-active");
          if (this.swipeCueAi) this.swipeCueAi.classList.remove("show");
          if (this.swipeCueAsli) this.swipeCueAsli.classList.remove("show");
        }
      }
    };

    const onEnd = () => {
      if (!isDragging) return;
      isDragging = false;
      this.swipeableCard.classList.remove("swiping");
      const dx = currentX - startX;

      if (isHorizontalGesture && Math.abs(dx) > 55 && !this.isAnsweringLocked) {
        if (dx > 55) {
          this.swipeableCard.style.transform = "translateX(120%) rotate(15deg)";
          setTimeout(() => {
            this.handleAnswer("ASLI");
            this.resetCardTransform();
          }, 180);
          return;
        } else if (dx < -55) {
          this.swipeableCard.style.transform = "translateX(-120%) rotate(-15deg)";
          setTimeout(() => {
            this.handleAnswer("AI");
            this.resetCardTransform();
          }, 180);
          return;
        }
      }

      this.resetCardTransform();
    };

    this.swipeableCard.addEventListener("touchstart", (e) => {
      if (e.touches.length === 1) {
        onStart(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    this.swipeableCard.addEventListener("touchmove", (e) => {
      if (e.touches.length === 1) {
        onMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    this.swipeableCard.addEventListener("touchend", onEnd);
    this.swipeableCard.addEventListener("touchcancel", onEnd);
  }

  resetCardTransform() {
    if (!this.swipeableCard) return;
    this.swipeableCard.style.transform = "";
    this.swipeableCard.classList.remove("swipe-left-active", "swipe-right-active", "swiping");
    if (this.swipeCueAi) this.swipeCueAi.classList.remove("show");
    if (this.swipeCueAsli) this.swipeCueAsli.classList.remove("show");
  }

  init() {
    if (!this.playerId) {
      window.location.href = "/nickname";
      return;
    }

    window.showLoadingScreen(1000, [
      "Calibrating your eyes...",
      "Preparing 6 reality tests...",
      "AI is preparing its best disguises..."
    ], () => {
      this.startSoloSession();
    });
  }

  startSoloSession() {
    this.isAdvancing = false;
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
        try {
          localStorage.setItem("zenith_last_session_id", data.session_id);
        } catch (e) {}
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
    this.isAdvancing = false;
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
        <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></span>
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
    const isLastQuestion = (this.currentIndex >= this.totalQuestions - 1) || Boolean(res.is_game_over);

    // Meme Selection (Right memes vs Wrong memes)
    const correctMemes = [
      "/static/images/meme-correct.webp",
      "/static/images/meme-chaliye-shuru.webp"
    ];
    const wrongMemes = [
      "/static/images/meme-wrong.webp",
      "/static/images/meme-i-saw-that.webp"
    ];

    const chosenMeme = res.is_correct
      ? correctMemes[Math.floor(Math.random() * correctMemes.length)]
      : wrongMemes[Math.floor(Math.random() * wrongMemes.length)];

    if (this.memeReactionImg) {
      this.memeReactionImg.src = chosenMeme;
    }

    if (this.memeStatusBadge) {
      if (res.is_correct) {
        this.memeStatusBadge.textContent = isHinglish ? "SAHI JAWAAB! 🎯" : "SPOT ON! 🎯";
        this.memeStatusBadge.className = "meme-status-badge correct";
      } else {
        this.memeStatusBadge.textContent = res.is_unanswered
          ? (isHinglish ? "TIME KHATAM! ⏰" : "TIME EXPIRED! ⏰")
          : (isHinglish ? "GALAT JAWAAB! 💀" : "DECEIVED BY AI! 💀");
        this.memeStatusBadge.className = "meme-status-badge incorrect";
      }
    }

    if (this.memeScoreEarned) {
      if (res.is_correct) {
        this.memeScoreEarned.textContent = `+${res.points_awarded || 0} PTS (Speed Bonus)`;
        this.memeScoreEarned.className = "meme-score-earned correct";
      } else {
        this.memeScoreEarned.textContent = "0 PTS";
        this.memeScoreEarned.className = "meme-score-earned incorrect";
      }
    }

    if (this.memeExplanationText) {
      this.memeExplanationText.innerHTML = `<strong>Actual: ${res.correct_answer}</strong> — ${res.explanation || ""}`;
    }

    if (this.btnNextFromMeme) {
      this.btnNextFromMeme.textContent = isLastQuestion
        ? (isHinglish ? "FINAL RESULTS DEKHO →" : "VIEW FINAL RESULTS →")
        : (isHinglish ? "NEXT QUESTION →" : "NEXT QUESTION →");

      this.btnNextFromMeme.onclick = () => {
        if (this.gameMemeOverlay) this.gameMemeOverlay.style.display = "none";
        this.advanceToNext(isLastQuestion);
      };
    }

    // Display Meme Popup Modal
    if (this.gameMemeOverlay) {
      setTimeout(() => {
        this.gameMemeOverlay.style.display = "flex";
      }, 350);
    }
  }

  advanceToNext(isGameOver) {
    if (this.isAdvancing) return;
    this.isAdvancing = true;

    if (this.autoAdvanceTimeout) {
      clearInterval(this.autoAdvanceTimeout);
      this.autoAdvanceTimeout = null;
    }

    const btnNext = document.getElementById("nextQuestionBtn");
    if (btnNext) {
      btnNext.disabled = true;
      btnNext.style.pointerEvents = "none";
    }

    const shouldFinish = isGameOver || (this.currentIndex >= (this.totalQuestions - 1));

    if (shouldFinish) {
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
    if (this.currentIndex >= this.totalQuestions) {
      window.location.href = `/results/${this.sessionId}`;
      return;
    }

    fetch(`/api/game/${this.sessionId}/question/${this.currentIndex}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === "success" && data.question) {
          this.currentQuestion = data.question;
          this.renderQuestion(this.currentQuestion);
        } else if (data.status === "game_over" || data.is_game_over) {
          window.location.href = `/results/${this.sessionId}`;
        } else {
          window.showToast("Failed to load next question", true);
        }
      })
      .catch(err => {
        console.error("Next question error:", err);
        window.showToast("Connection issue, retrying...", true);
      })
      .finally(() => {
        this.isAdvancing = false;
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
