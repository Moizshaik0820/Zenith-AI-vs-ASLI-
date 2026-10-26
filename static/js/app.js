/**
 * AI vs ASLI — Zenith School of AI
 * Global Application Framework, Theme Controller & Sound Synthesizer
 */

class SoundEffects {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem("zenith_sound_muted") === "true";
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem("zenith_sound_muted", this.muted ? "true" : "false");
    this.updateToggleIcons();
    return this.muted;
  }

  updateToggleIcons() {
    const btns = document.querySelectorAll(".sound-toggle-btn");
    btns.forEach(btn => {
      const statusEl = btn.querySelector(".sound-status-text");
      const iconEl = btn.querySelector(".btn-icon");
      if (statusEl) {
        statusEl.textContent = this.muted ? "Muted (Tap to enable)" : "Enabled (Tap to mute)";
      }
      if (iconEl) {
        iconEl.innerHTML = this.muted ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>' : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>';
      } else if (!statusEl) {
        btn.innerHTML = this.muted ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>' : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>';
      }
      btn.setAttribute("title", this.muted ? "Unmute Audio FX" : "Mute Audio FX");
    });
  }

  playTone(freq, type = "sine", duration = 0.15, gainVal = 0.1) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio playback notice:", e);
    }
  }

  click() {
    this.playTone(800, "triangle", 0.05, 0.05);
  }

  tick() {
    this.playTone(600, "sine", 0.04, 0.03);
  }

  correct() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, "sine", 0.25, 0.12);
      }, idx * 75);
    });
  }

  incorrect() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    [220, 180].forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, "sawtooth", 0.2, 0.15);
      }, idx * 120);
    });
  }

  fanfare() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, "triangle", 0.4, 0.15);
      }, i * 140);
    });
  }
}

window.soundFx = new SoundEffects();

// Permanent Global Dark Mode Theme Enforcer
class ThemeManager {
  constructor() {
    this.theme = "dark";
  }

  init() {
    this.applyTheme("dark");
  }

  toggleTheme() {
    // Light theme removed across the entire website per instructions
    this.applyTheme("dark");
    return "dark";
  }

  applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", "dark");
    try {
      localStorage.setItem("zenith_theme", "dark");
    } catch(e) {}
  }
}

window.themeManager = new ThemeManager();

document.addEventListener("DOMContentLoaded", () => {
  window.soundFx.updateToggleIcons();
  window.themeManager.init();
  initGlobalMatrixHackerRain();

  // Sound toggle buttons
  document.querySelectorAll(".sound-toggle-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      window.soundFx.toggleMute();
    });
  });

  // Theme toggle buttons
  document.querySelectorAll(".theme-toggle-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      window.themeManager.toggleTheme();
    });
  });

  // Language toggle buttons
  document.querySelectorAll(".lang-toggle-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      if (window.i18n) {
        window.i18n.toggleLanguage();
      }
    });
  });

  // Mobile Quick Preferences Popover Controller
  const prefTrigger = document.getElementById("mobilePrefTriggerBtn");
  const prefPopover = document.getElementById("mobileVerticalPopover");
  if (prefTrigger && prefPopover) {
    prefTrigger.addEventListener("click", (e) => {
      e.stopPropagation();
      prefPopover.classList.toggle("active");
    });
    document.addEventListener("click", (e) => {
      if (!prefPopover.contains(e.target) && e.target !== prefTrigger) {
        prefPopover.classList.remove("active");
      }
    });
  }

  // Universal 3-Line Menu Drawer Controller
  const menuBtn = document.getElementById("siteMenuToggle");
  const drawer = document.getElementById("siteNavDrawer");
  const backdrop = document.getElementById("drawerBackdrop");
  const closeBtn = document.getElementById("drawerCloseBtn");

  const openDrawer = () => {
    if (menuBtn) {
      menuBtn.classList.add("active");
      menuBtn.setAttribute("aria-expanded", "true");
    }
    if (drawer) {
      drawer.classList.add("active");
      drawer.setAttribute("aria-hidden", "false");
    }
    if (backdrop) backdrop.classList.add("active");
    document.body.style.overflow = "hidden";
  };

  const closeDrawer = () => {
    if (menuBtn) {
      menuBtn.classList.remove("active");
      menuBtn.setAttribute("aria-expanded", "false");
    }
    if (drawer) {
      drawer.classList.remove("active");
      drawer.setAttribute("aria-hidden", "true");
    }
    if (backdrop) backdrop.classList.remove("active");
    document.body.style.overflow = "";
  };

  if (menuBtn) {
    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (drawer && drawer.classList.contains("active")) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });
  }

  if (closeBtn) closeBtn.addEventListener("click", closeDrawer);
  if (backdrop) backdrop.addEventListener("click", closeDrawer);

  // Close drawer on pressing Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && drawer && drawer.classList.contains("active")) {
      closeDrawer();
    }
  });

  // Close drawer when clicking any page link inside
  if (drawer) {
    drawer.querySelectorAll(".drawer-nav-item, .btn-drawer-cta").forEach(link => {
      link.addEventListener("click", () => {
        closeDrawer();
      });
    });
  }

  // Interactive Circular Loupes on Homepage Sandbox (Image 3)
  const initHomeLoupe = (wrapId, imgId, loupeId, toggleId) => {
    const wrap = document.getElementById(wrapId);
    const img = document.getElementById(imgId);
    const loupe = document.getElementById(loupeId);
    const toggle = document.getElementById(toggleId);
    if (!wrap || !img || !loupe || !toggle) return;

    let isLensActive = true;
    const zoom = 2.5;
    const radius = 88;

    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      isLensActive = !isLensActive;
      toggle.classList.toggle("off", !isLensActive);
      const textSpan = toggle.querySelector(".lens-pill-text");
      if (textSpan) textSpan.textContent = isLensActive ? "ON" : "OFF";
      if (!isLensActive) {
        loupe.style.display = "none";
      }
      if (window.soundFx) window.soundFx.click();
    });

    const updateLoupe = (clientX, clientY, isTouch = false) => {
      if (!isLensActive) return;
      const rect = img.getBoundingClientRect();
      const wrapRect = wrap.getBoundingClientRect();

      if (
        clientX < rect.left ||
        clientX > rect.right ||
        clientY < rect.top ||
        clientY > rect.bottom
      ) {
        loupe.style.display = "none";
        return;
      }

      const imgX = clientX - rect.left;
      const imgY = clientY - rect.top;
      const wrapX = clientX - wrapRect.left;
      const wrapY = isTouch ? (clientY - wrapRect.top - 65) : (clientY - wrapRect.top);

      loupe.style.left = `${wrapX}px`;
      loupe.style.top = `${wrapY}px`;
      loupe.style.display = "block";

      const bgW = rect.width * zoom;
      const bgH = rect.height * zoom;
      const bgX = (imgX * zoom) - radius;
      const bgY = (imgY * zoom) - radius;

      loupe.style.backgroundImage = `url("${img.src}")`;
      loupe.style.backgroundSize = `${bgW}px ${bgH}px`;
      loupe.style.backgroundPosition = `-${bgX}px -${bgY}px`;
    };

    wrap.addEventListener("mousemove", (e) => updateLoupe(e.clientX, e.clientY, false));
    wrap.addEventListener("mouseleave", () => { loupe.style.display = "none"; });
    wrap.addEventListener("touchstart", (e) => {
      if (e.touches && e.touches.length > 0) updateLoupe(e.touches[0].clientX, e.touches[0].clientY, true);
    }, { passive: true });
    wrap.addEventListener("touchmove", (e) => {
      if (e.touches && e.touches.length > 0) updateLoupe(e.touches[0].clientX, e.touches[0].clientY, true);
    }, { passive: true });
    wrap.addEventListener("touchend", () => { loupe.style.display = "none"; });
  };

  initHomeLoupe("homeLensWrapper1", "homeSampleImg1", "homeLoupe1", "homeLensToggle1");
  initHomeLoupe("homeLensWrapper2", "homeSampleImg2", "homeLoupe2", "homeLensToggle2");
});

// Microcopy loader manager
window.showLoadingScreen = function(durationMs, customMessages, onComplete) {
  const overlay = document.getElementById("globalLoadingOverlay");
  const textEl = document.getElementById("loadingMicrocopy");
  if (!overlay || !textEl) {
    if (onComplete) onComplete();
    return;
  }

  const defaultMessages = [
    "Scanning reality...",
    "Calibrating your eyes...",
    "The truth is loading...",
    "AI is getting suspicious...",
    "Trust nothing. Observe everything."
  ];

  const messages = customMessages || defaultMessages;
  overlay.classList.add("active");
  textEl.textContent = messages[Math.floor(Math.random() * messages.length)];

  let interval = setInterval(() => {
    textEl.textContent = messages[Math.floor(Math.random() * messages.length)];
  }, 900);

  setTimeout(() => {
    clearInterval(interval);
    overlay.classList.remove("active");
    if (onComplete) onComplete();
  }, durationMs || 1000);
};

// Toast notification helper
window.showToast = function(msg, isError = false) {
  const toast = document.createElement("div");
  toast.style.position = "fixed";
  toast.style.bottom = "24px";
  toast.style.left = "50%";
  toast.style.transform = "translateX(-50%)";
  toast.style.background = isError ? "rgba(220, 38, 38, 0.95)" : "rgba(124, 58, 237, 0.95)";
  toast.style.color = "#fff";
  toast.style.boxShadow = "0 8px 30px rgba(0, 0, 0, 0.3)";
  toast.style.padding = "0.75rem 1.6rem";
  toast.style.borderRadius = "9999px";
  toast.style.fontSize = "0.95rem";
  toast.style.fontWeight = "800";
  toast.style.zIndex = "9999";
  toast.style.transition = "opacity 0.3s ease";
  toast.textContent = msg;

  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 2800);
};

/**
 * Universal Hacker Green Matrix Digital Rain Background
 * Automatically activates on any page having <canvas id="matrixCanvas">
 */
function initGlobalMatrixHackerRain() {
  const canvas = document.getElementById("matrixCanvas");
  if (!canvas || canvas.dataset.matrixRunning === "1") return;
  canvas.dataset.matrixRunning = "1";
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  const chars = "01010101ABCDEF<>/*&%$#@!AIASLIZENITH01";
  const charArray = chars.split("");

  const isMobile = window.innerWidth <= 680;
  const fontSize = isMobile ? 14 : 16;
  let columns = Math.floor(width / fontSize);

  let drops = [];
  function resetDrops() {
    columns = Math.floor(width / fontSize);
    drops = [];
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.floor(Math.random() * -50);
    }
  }
  resetDrops();

  window.addEventListener("resize", () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    resetDrops();
  });

  let isTabActive = true;
  document.addEventListener("visibilitychange", () => {
    isTabActive = !document.hidden;
  });

  let lastFrameTime = performance.now();
  const targetFpsInterval = 1000 / 35;

  function renderMatrix(currentTime) {
    requestAnimationFrame(renderMatrix);
    if (!isTabActive) return;

    const elapsed = currentTime - lastFrameTime;
    if (elapsed < targetFpsInterval) return;
    lastFrameTime = currentTime - (elapsed % targetFpsInterval);

    ctx.fillStyle = "rgba(3, 7, 18, 0.085)";
    ctx.fillRect(0, 0, width, height);

    ctx.font = `${fontSize}px monospace`;

    for (let i = 0; i < drops.length; i++) {
      const text = charArray[Math.floor(Math.random() * charArray.length)];
      const x = i * fontSize;
      const y = drops[i] * fontSize;

      if (Math.random() > 0.88) {
        ctx.fillStyle = "#86efac";
      } else {
        ctx.fillStyle = "#10b981";
      }

      ctx.fillText(text, x, y);

      if (y > height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }
  }

  requestAnimationFrame(renderMatrix);
}
