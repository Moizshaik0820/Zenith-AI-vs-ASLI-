/**
 * AI vs ASLI — Nickname Selection Logic & Meme Popup Controller
 */

document.addEventListener("DOMContentLoaded", () => {
  const customInput = document.getElementById("customNicknameInput");
  const refreshBtn = document.getElementById("refreshNicknamesBtn");
  const suggestionsContainer = document.getElementById("nicknameSuggestions");
  const submitBtn = document.getElementById("confirmNicknameBtn");
  const previewName = document.getElementById("previewNicknameText");
  const form = document.getElementById("nicknameForm");

  // Load initial nicknames
  fetchSuggestions();

  // Refresh handler
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      window.soundFx.click();
      refreshBtn.classList.add("spinning");
      fetchSuggestions(() => {
        setTimeout(() => refreshBtn.classList.remove("spinning"), 400);
      });
    });
  }

  // Input change updates preview (if present)
  if (customInput) {
    customInput.addEventListener("input", (e) => {
      const val = e.target.value.trim();
      if (previewName) previewName.textContent = val || "Your Nickname";
    });
  }

  // Handle form submit
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = customInput.value.trim();
      if (!name) {
        window.showToast("Please pick or type a nickname!", true);
        customInput.focus();
        return;
      }

      if (name.length < 2 || name.length > 25) {
        window.showToast("Nickname must be between 2 and 25 characters", true);
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = "Setting Identity...";

      // Register with server
      fetch("/api/player/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: name,
          player_id: localStorage.getItem("zenith_player_id") || null
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.status === "success") {
          localStorage.setItem("zenith_player_id", data.player_id);
          localStorage.setItem("zenith_nickname", data.nickname);
          window.soundFx.click();
          
          const urlParams = new URLSearchParams(window.location.search);
          const targetRoom = urlParams.get("room") || urlParams.get("room_code");
          if (targetRoom) {
            window.location.href = `/lobby/${targetRoom.toUpperCase()}`;
          } else {
            window.location.href = "/modes";
          }
        } else {
          submitBtn.disabled = false;
          submitBtn.textContent = "Use this name →";
          window.showToast(data.error || "Failed to set nickname", true);
        }
      })
      .catch(err => {
        submitBtn.disabled = false;
        submitBtn.textContent = "Use this name →";
        window.showToast("Connection error. Please try again.", true);
      });
    });
  }

  function fetchSuggestions(cb) {
    fetch("/api/nicknames/random")
      .then(res => res.json())
      .then(data => {
        if (data.nicknames && suggestionsContainer) {
          suggestionsContainer.innerHTML = "";
          data.nicknames.forEach(nick => {
            const pill = document.createElement("button");
            pill.type = "button";
            pill.className = "nickname-pill-btn";
            pill.textContent = nick;
            pill.addEventListener("click", () => {
              window.soundFx.click();
              customInput.value = nick;
              if (previewName) previewName.textContent = nick;
              // Highlight active pill
              document.querySelectorAll(".nickname-pill-btn").forEach(p => p.classList.remove("active"));
              pill.classList.add("active");
            });
            suggestionsContainer.appendChild(pill);
          });
        }
        if (cb) cb();
      })
      .catch(err => {
        console.error("Failed to fetch nicknames:", err);
        if (cb) cb();
      });
  }

  // Initialize "I SAW THAT!" Meme Popup on Codename Page
  initNicknameMemePopup();
});

function initNicknameMemePopup() {
  const memePopup = document.getElementById("nicknameMemePopup");
  const closeBtn = document.getElementById("nicknameMemeCloseBtn");
  if (!memePopup) return;

  try {
    if (sessionStorage.getItem("zenith_nick_meme_closed") === "1") {
      memePopup.style.display = "none";
      return;
    }
  } catch (e) {}

  setTimeout(() => {
    memePopup.classList.add("visible");
  }, 700);

  if (closeBtn) {
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      memePopup.classList.remove("visible");
      memePopup.classList.add("dismissed");
      try {
        sessionStorage.setItem("zenith_nick_meme_closed", "1");
      } catch (err) {}
    });
  }
}
