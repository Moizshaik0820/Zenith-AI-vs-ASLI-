/**
 * AI vs ASLI — Leaderboard Logic
 */

document.addEventListener("DOMContentLoaded", () => {
  const globalPodiumEl = document.getElementById("podiumContainer");
  const rankingsTableBody = document.getElementById("rankingsTableBody");
  const playerStandingCard = document.getElementById("playerStandingCard");
  const roomSearchInput = document.getElementById("roomSearchInput");
  const roomSearchBtn = document.getElementById("roomSearchBtn");
  const tabGlobal = document.getElementById("tabGlobalLeaderboard");
  const tabRoom = document.getElementById("tabRoomLeaderboard");

  const currentSessionId = new URLSearchParams(window.location.search).get("session_id") || localStorage.getItem("zenith_last_session_id");

  loadGlobalLeaderboard();

  if (tabGlobal && tabRoom) {
    tabGlobal.addEventListener("click", () => {
      tabGlobal.classList.add("active");
      tabRoom.classList.remove("active");
      loadGlobalLeaderboard();
    });

    tabRoom.addEventListener("click", () => {
      tabRoom.classList.add("active");
      tabGlobal.classList.remove("active");
      const code = roomSearchInput ? roomSearchInput.value.trim() : "";
      if (code) {
        loadRoomLeaderboard(code);
      } else {
        rankingsTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-dim);">Enter a room code above to view its live standings.</td></tr>`;
        globalPodiumEl.innerHTML = "";
      }
    });
  }

  if (roomSearchBtn && roomSearchInput) {
    roomSearchBtn.addEventListener("click", () => {
      const code = roomSearchInput.value.trim().toUpperCase();
      if (!code) {
        window.showToast("Enter a 6-character room code", true);
        return;
      }
      tabRoom.classList.add("active");
      tabGlobal.classList.remove("active");
      loadRoomLeaderboard(code);
    });
  }

  function loadGlobalLeaderboard() {
    const url = currentSessionId 
      ? `/api/leaderboard/global?session_id=${encodeURIComponent(currentSessionId)}` 
      : `/api/leaderboard/global`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.status === "success") {
          renderPodium(data.leaderboard.slice(0, 3));
          renderRankingsTable(data.leaderboard, data.player_standing);
          if (data.player_standing && playerStandingCard) {
            renderPlayerStanding(data.player_standing);
          }
        }
      })
      .catch(err => console.error("Leaderboard fetch error:", err));
  }

  function loadRoomLeaderboard(roomCode) {
    fetch(`/api/leaderboard/room/${roomCode}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === "success") {
          renderPodium(data.leaderboard.slice(0, 3));
          renderRankingsTable(data.leaderboard, null);
        } else {
          window.showToast("Room leaderboard not found", true);
        }
      })
      .catch(err => console.error("Room leaderboard fetch error:", err));
  }

  function renderPodium(top3) {
    if (!globalPodiumEl) return;
    if (!top3 || top3.length === 0) {
      globalPodiumEl.innerHTML = "";
      return;
    }

    // Positions: 2nd (Silver), 1st (Gold), 3rd (Bronze)
    const first = top3[0] || null;
    const second = top3[1] || null;
    const third = top3[2] || null;

    globalPodiumEl.innerHTML = `
      <div class="podium-stage">
        <!-- 2nd Place -->
        ${second ? `
          <div class="podium-col col-silver">
            <div class="podium-rank-tag">#2 Second</div>
            <div class="podium-avatar"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>
            <div class="podium-nick">${second.nickname}</div>
            <div class="podium-score">${second.score} pts</div>
            <div class="podium-block block-silver"></div>
          </div>
        ` : '<div class="podium-col col-empty"></div>'}

        <!-- 1st Place (Center & Tallest) -->
        ${first ? `
          <div class="podium-col col-gold">
            <div class="podium-crown"><svg width="32" height="32" viewBox="0 0 24 24" fill="#f59e0b" stroke="#b45309" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg></div>
            <div class="podium-rank-tag">#1 First</div>
            <div class="podium-avatar"><svg width="24" height="24" viewBox="0 0 24 24" fill="#f59e0b" stroke="#b45309" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg></div>
            <div class="podium-nick">${first.nickname}</div>
            <div class="podium-score">${first.score} pts</div>
            <div class="podium-block block-gold"></div>
          </div>
        ` : '<div class="podium-col col-empty"></div>'}

        <!-- 3rd Place -->
        ${third ? `
          <div class="podium-col col-bronze">
            <div class="podium-rank-tag">#3 Third</div>
            <div class="podium-avatar"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>
            <div class="podium-nick">${third.nickname}</div>
            <div class="podium-score">${third.score} pts</div>
            <div class="podium-block block-bronze"></div>
          </div>
        ` : '<div class="podium-col col-empty"></div>'}
      </div>
    `;
  }

  function renderRankingsTable(list, currentStanding) {
    if (!rankingsTableBody) return;
    rankingsTableBody.innerHTML = "";

    if (!list || list.length === 0) {
      rankingsTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem;">No scores recorded yet. Be the first to play!</td></tr>`;
      return;
    }

    list.forEach(item => {
      const isCurrent = currentStanding && (item.id === currentStanding.id || item.player_id === currentStanding.player_id);
      const tr = document.createElement("tr");
      if (isCurrent) tr.className = "current-player-row";

      tr.innerHTML = `
        <td class="rank-col">
          item.rank <= 3 ? `#${item.rank}` : `#${item.rank}`
        </td>
        <td class="player-col">
          <strong>${item.nickname}</strong>
          ${isCurrent ? ' <span class="badge-you">(You)</span>' : ''}
        </td>
        <td class="score-col"><strong>${item.score}</strong> pts</td>
        <td>${item.accuracy_pct !== undefined ? item.accuracy_pct + '%' : (item.correct_count + '/10')}</td>
        <td>+${item.speed_bonus_total || 0} pts</td>
        <td class="time-col">${item.total_time_taken ? item.total_time_taken + 's' : '-'}</td>
      `;
      rankingsTableBody.appendChild(tr);
    });
  }

  function renderPlayerStanding(standing) {
    playerStandingCard.innerHTML = `
      <div class="player-standing-box">
        <div class="standing-left">
          <span class="standing-label">Your Current Standing</span>
          <h3 class="standing-rank">Rank #${standing.rank} <small>of ${standing.total_players}</small></h3>
          <p class="standing-compliment">${standing.compliment}</p>
        </div>
        <div class="standing-right">
          <div class="standing-score">${standing.score} pts</div>
          <div class="standing-meta">${standing.accuracy_pct}% Accuracy (${standing.correct_count}/10 Correct)</div>
        </div>
      </div>
    `;
    playerStandingCard.style.display = "block";
  }
});
