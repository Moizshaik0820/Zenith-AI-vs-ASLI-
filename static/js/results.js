/**
 * AI vs ASLI — Results Logic
 * Features:
 * 1. Mandatory Instagram Follow Modal (White border, Red title, Official IG colors, no description)
 * 2. Focus auto-unlock upon returning from Instagram
 * 3. 5-Second popup modal for the dedicated IG Story Card
 */

document.addEventListener("DOMContentLoaded", () => {
  const revealBtn = document.getElementById("revealScoreBtn");
  const blurredCard = document.getElementById("blurredScoreCard");

  // Follow Modal Elements
  const followModal = document.getElementById("followInstagramModal");
  const btnGoToInsta = document.getElementById("btnGoToInstagram");
  const btnConfirmFollow = document.getElementById("btnConfirmFollowed");

  // 5-Second Story Promo Modal Elements
  const storyModal = document.getElementById("storyPromoModal");
  const btnDismissStory = document.getElementById("btnDismissStoryModal");

  const INSTAGRAM_URL = "https://www.instagram.com/zenith_school_of_ai?utm_source=ig_web_button_share_sheet&mdxt=ZDNlZDc0MzIxNw==";

  let hasClickedFollow = false;
  let hasUnlocked = false;

  // 1. Initial Reveal Click -> Shows Mandatory Follow Modal
  if (revealBtn && followModal) {
    revealBtn.addEventListener("click", () => {
      if (window.soundFx) window.soundFx.click();
      followModal.classList.add("active");
    });
  }

  // 2. Click "Follow @zenith_school_of_ai" button -> Opens Instagram in new tab
  if (btnGoToInsta) {
    btnGoToInsta.addEventListener("click", () => {
      hasClickedFollow = true;
      window.open(INSTAGRAM_URL, "_blank");
      // Enable the confirm button
      if (btnConfirmFollow) {
        btnConfirmFollow.style.display = "block";
      }
    });
  }

  // When user returns to window after visiting Instagram, allow instant unlock
  window.addEventListener("focus", () => {
    if (hasClickedFollow && followModal && followModal.classList.contains("active")) {
      unlockScorecard();
    }
  });

  if (btnConfirmFollow) {
    btnConfirmFollow.addEventListener("click", () => {
      unlockScorecard();
    });
  }

  function unlockScorecard() {
    if (hasUnlocked) return;
    hasUnlocked = true;

    if (followModal) followModal.classList.remove("active");
    if (blurredCard) blurredCard.classList.add("revealed");
    if (window.soundFx) window.soundFx.fanfare();
    if (window.showToast) window.showToast("Score & Reality Report Unlocked! 🎉");

    // Start 5-Second Timer for IG Story Popup Modal
    setTimeout(() => {
      if (storyModal) {
        storyModal.classList.add("active");
        if (window.soundFx) window.soundFx.pop();
      }
    }, 5000);
  }

  // Dismiss Story Promo Modal
  if (btnDismissStory && storyModal) {
    btnDismissStory.addEventListener("click", () => {
      storyModal.classList.remove("active");
    });
  }
});
