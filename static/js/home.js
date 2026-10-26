/**
 * AI vs ASLI — Home Page Interactive Controller
 * 1. Hacker Green Matrix Digital Rain Background
 * 2. Standing Upright 3D Rotating Shield on Top-Right Corner
 * 3. Bottom-Left Transparent Meme Popup Entrance & Session Dismissal
 */

document.addEventListener("DOMContentLoaded", () => {
  initMatrixHackerRain();
  initStandingShield();
  initMemePopup();
});

/**
 * 1. Hacker Green Matrix Digital Rain Background
 */
function initMatrixHackerRain() {
  const canvas = document.getElementById("matrixCanvas");
  if (!canvas || canvas.dataset.matrixRunning === "1") return;
  canvas.dataset.matrixRunning = "1";
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  // Digital Rain Characters (Matrix + Binary + Hex + Keywords)
  const chars = "01010101ABCDEF<>/*&%$#@!AIASLIZENITH01";
  const charArray = chars.split("");

  // Column spacing (smaller on mobile for high density)
  const isMobile = window.innerWidth <= 680;
  const fontSize = isMobile ? 14 : 16;
  let columns = Math.floor(width / fontSize);

  // Array storing current y-position of each drop
  let drops = [];
  function resetDrops() {
    columns = Math.floor(width / fontSize);
    drops = [];
    for (let i = 0; i < columns; i++) {
      // Stagger initial drop positions across the screen
      drops[i] = Math.floor(Math.random() * -50);
    }
  }
  resetDrops();

  // Resize handler
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
  const targetFpsInterval = 1000 / 35; // 35 FPS optimal for mobile battery & smooth trails

  function renderMatrix(currentTime) {
    requestAnimationFrame(renderMatrix);

    if (!isTabActive) return;

    const elapsed = currentTime - lastFrameTime;
    if (elapsed < targetFpsInterval) return;
    lastFrameTime = currentTime - (elapsed % targetFpsInterval);

    // Subtle dark fade trail to create phosphor glow effect
    ctx.fillStyle = "rgba(3, 7, 18, 0.085)";
    ctx.fillRect(0, 0, width, height);

    ctx.font = `${fontSize}px monospace`;

    for (let i = 0; i < drops.length; i++) {
      const text = charArray[Math.floor(Math.random() * charArray.length)];
      const x = i * fontSize;
      const y = drops[i] * fontSize;

      // Randomly make the leading head of the stream bright white/cyan
      if (Math.random() > 0.88) {
        ctx.fillStyle = "#86efac"; // Bright green head
      } else {
        ctx.fillStyle = "#10b981"; // Electric hacker green
      }

      ctx.fillText(text, x, y);

      // Reset drop to top with slight randomization once it reaches bottom
      if (y > height && Math.random() > 0.975) {
        drops[i] = 0;
      }

      drops[i]++;
    }
  }

  requestAnimationFrame(renderMatrix);
}

/**
 * 2. Standing Upright 3D Rotating Zenith Shield on Top-Right Corner
 */
function initStandingShield() {
  const container = document.getElementById("standingShield");
  const graphic = document.getElementById("standingShieldGraphic");
  if (!container || !graphic) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Rotation parameters
  const BASE_SPEED = prefersReducedMotion ? 0 : 0.85; // Continuous degrees per frame
  const MAX_SPEED = 24; // Maximum degrees per frame
  const DAMPING = 0.958; // Deceleration rate towards base speed

  let currentAngle = 0;
  let currentSpeed = BASE_SPEED;
  let isDragging = false;
  let startX = 0;
  let lastX = 0;
  let lastTime = 0;
  let dragVelocity = 0;

  // Pointer Down (Mouse, Touch, Stylus)
  container.addEventListener("pointerdown", (e) => {
    if (e.button && e.button !== 0) return;

    isDragging = true;
    container.setPointerCapture(e.pointerId);
    container.classList.add("grabbing");

    startX = e.clientX;
    lastX = e.clientX;
    lastTime = performance.now();
    dragVelocity = 0;
  });

  // Pointer Move
  container.addEventListener("pointermove", (e) => {
    if (!isDragging) return;

    const currentX = e.clientX;
    const deltaX = currentX - lastX;
    const now = performance.now();
    const dt = Math.max(1, now - lastTime);

    // Direct 3D Y-axis rotation response to horizontal drag
    currentAngle += deltaX * 1.1;
    graphic.style.transform = `rotateY(${currentAngle}deg)`;

    // Calculate instantaneous velocity in deg/frame (~16.6ms)
    dragVelocity = (deltaX / dt) * 16.6;

    lastX = currentX;
    lastTime = now;
  });

  // Pointer Up / Cancel
  function onPointerEnd(e) {
    if (!isDragging) return;
    isDragging = false;
    container.classList.remove("grabbing");

    try {
      if (container.hasPointerCapture(e.pointerId)) {
        container.releasePointerCapture(e.pointerId);
      }
    } catch (err) {}

    // Apply clamped velocity to continuous 3D rotation speed
    const boost = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, dragVelocity * 1.25));
    if (Math.abs(boost) > 0.4) {
      currentSpeed = boost;
    }
  }

  container.addEventListener("pointerup", onPointerEnd);
  container.addEventListener("pointercancel", onPointerEnd);

  // Animation Loop (requestAnimationFrame)
  function animateShield() {
    if (!isDragging) {
      // Smoothly decelerate back to BASE_SPEED
      if (Math.abs(currentSpeed - BASE_SPEED) > 0.02) {
        currentSpeed = BASE_SPEED + (currentSpeed - BASE_SPEED) * DAMPING;
      } else {
        currentSpeed = BASE_SPEED;
      }

      currentAngle = (currentAngle + currentSpeed) % 360;
      graphic.style.transform = `rotateY(${currentAngle}deg)`;
    }

    requestAnimationFrame(animateShield);
  }

  animateShield();
}

/**
 * 3. Bottom-Left Transparent Meme Popup Entrance & Session Dismissal
 */
function initMemePopup() {
  const memePopup = document.getElementById("homeMemePopup");
  const closeBtn = document.getElementById("memeCloseBtn");
  if (!memePopup) return;

  // Check if user dismissed it during this session
  try {
    if (sessionStorage.getItem("zenith_meme_closed") === "1") {
      memePopup.style.display = "none";
      return;
    }
  } catch (e) {}

  // Reveal with gentle slide-up animation after homepage elements are ready
  setTimeout(() => {
    memePopup.classList.add("visible");
  }, 650);

  // Dismiss button handler
  if (closeBtn) {
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      memePopup.classList.remove("visible");
      memePopup.classList.add("dismissed");

      try {
        sessionStorage.setItem("zenith_meme_closed", "1");
      } catch (err) {}

      setTimeout(() => {
        memePopup.style.display = "none";
      }, 450);
    });
  }
}
