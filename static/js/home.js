/**
 * AI vs ASLI — Home Page Interactive Controller
 * 1. Interactive 360° Rotating Zenith Shield with Drag Physics & Momentum
 * 2. Floating Meme Entrance & Dismissal
 */

document.addEventListener("DOMContentLoaded", () => {
  initRotatingShield();
  initMemePopup();
});

/**
 * 1. Interactive Rotating Zenith Shield
 */
function initRotatingShield() {
  const container = document.getElementById("interactiveShield");
  const graphic = document.getElementById("shieldGraphic");
  if (!container || !graphic) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Rotation parameters
  const BASE_SPEED = prefersReducedMotion ? 0 : 0.22; // Degrees per frame
  const MAX_SPEED = 18; // Maximum degrees per frame
  const DECELERATION = 0.965; // Damping factor

  let currentAngle = 0;
  let currentSpeed = BASE_SPEED;
  let isDragging = false;
  let lastPointerAngle = 0;
  let lastTimestamp = 0;
  let dragVelocity = 0;
  let animationFrameId = null;

  // Get center point of the shield container
  function getCenter() {
    const rect = container.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
  }

  // Calculate angle from center to client coordinates
  function calculateAngle(clientX, clientY, center) {
    return Math.atan2(clientY - center.y, clientX - center.x) * (180 / Math.PI);
  }

  // Pointer Down (Mouse, Touch, Pen)
  container.addEventListener("pointerdown", (e) => {
    // Only respond to primary button
    if (e.button && e.button !== 0) return;
    
    isDragging = true;
    container.setPointerCapture(e.pointerId);
    container.classList.add("grabbing");

    const center = getCenter();
    lastPointerAngle = calculateAngle(e.clientX, e.clientY, center);
    lastTimestamp = performance.now();
    dragVelocity = 0;
  });

  // Pointer Move
  container.addEventListener("pointermove", (e) => {
    if (!isDragging) return;

    const center = getCenter();
    const newAngle = calculateAngle(e.clientX, e.clientY, center);
    const now = performance.now();
    const dt = Math.max(1, now - lastTimestamp);

    // Shortest angular distance between -180 and 180
    let delta = newAngle - lastPointerAngle;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;

    currentAngle = (currentAngle + delta) % 360;
    graphic.style.transform = `rotate(${currentAngle}deg)`;

    // Calculate velocity (deg/frame ~ 16.6ms)
    dragVelocity = (delta / dt) * 16.6;

    lastPointerAngle = newAngle;
    lastTimestamp = now;
  });

  // Pointer Up / Cancel
  function endDrag(e) {
    if (!isDragging) return;
    isDragging = false;
    container.classList.remove("grabbing");
    try {
      if (container.hasPointerCapture(e.pointerId)) {
        container.releasePointerCapture(e.pointerId);
      }
    } catch (err) {}

    // Apply clamped velocity to continuous speed
    const boost = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, dragVelocity));
    if (Math.abs(boost) > 0.5) {
      currentSpeed = boost;
    }
  }

  container.addEventListener("pointerup", endDrag);
  container.addEventListener("pointercancel", endDrag);

  // Animation Loop (requestAnimationFrame)
  function animate() {
    if (!isDragging) {
      // Gradually decelerate towards BASE_SPEED
      if (Math.abs(currentSpeed - BASE_SPEED) > 0.01) {
        currentSpeed = BASE_SPEED + (currentSpeed - BASE_SPEED) * DECELERATION;
      } else {
        currentSpeed = BASE_SPEED;
      }

      currentAngle = (currentAngle + currentSpeed) % 360;
      graphic.style.transform = `rotate(${currentAngle}deg)`;
    }

    animationFrameId = requestAnimationFrame(animate);
  }

  // Start continuous rotation
  animate();

  // Cleanup if page changes
  window.addEventListener("beforeunload", () => {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
  });
}

/**
 * 2. Floating Meme Popup
 */
function initMemePopup() {
  const memePopup = document.getElementById("homeMemePopup");
  const closeBtn = document.getElementById("memeCloseBtn");
  if (!memePopup) return;

  // Check if user dismissed it during this session
  try {
    if (sessionStorage.getItem("zenith_meme_dismissed") === "1") {
      memePopup.style.display = "none";
      return;
    }
  } catch (e) {}

  // Reveal with gentle entrance animation after hero is visible
  setTimeout(() => {
    memePopup.classList.add("visible");
  }, 750);

  // Close handler
  if (closeBtn) {
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      memePopup.classList.remove("visible");
      memePopup.classList.add("dismissed");
      try {
        sessionStorage.setItem("zenith_meme_dismissed", "1");
      } catch (err) {}
      setTimeout(() => {
        memePopup.style.display = "none";
      }, 400);
    });
  }
}
