/**
 * AI vs ASLI — Zenith School of AI
 * Internationalization (i18n) Engine: English <-> Hinglish
 */

const TRANSLATIONS = {
  en: {
    "nav_home": "Home",
    "nav_leaderboard": "Leaderboard",
    "hero_badge": "⚡ Zenith School of AI Campus Experience",
    "hero_tagline": '"Do you trust your eyes?"',
    "hero_hook": "AI can fake a face, a voice, and even reality. Can you spot the difference? Put your perception to the test across synthetic images, neural voice clones, and deepfake videos.",
    "btn_enter_challenge": "🚀 ENTER THE CHALLENGE",
    "btn_how_to_play": "📖 How to Play",
    "rules_title": "📊 Challenge Rules & Scoring Architecture",
    "rule_1_metric": "10",
    "rule_1_desc": "Questions per game across AI images, audio synthesis, and video deepfakes.",
    "rule_2_metric": "+100",
    "rule_2_desc": "Base points awarded for every correct detection of AI or ASLI.",
    "rule_3_metric": "+50",
    "rule_3_desc": "Max speed bonus per correct answer. Faster decisions earn higher rewards.",
    "rule_4_metric": "15s / 10s",
    "rule_4_desc": "15 seconds for images. For audio & video, 10s timer starts strictly after playback.",
    "rule_5_metric": "1,500",
    "rule_5_desc": "Maximum possible score: 10 x (100 base + 50 speed bonus).",
    "rule_6_metric": "0 pts",
    "rule_6_desc": "No negative marking! Incorrect or unanswered questions simply score zero.",
    
    // Nickname
    "nick_title": "Choose Your Identity",
    "nick_subtitle": "Every detective needs a codename in the neural matrix.",
    "nick_suggestions": "AI SUGGESTIONS",
    "nick_refresh": "🔄 Refresh",
    "nick_custom_label": "OR ENTER A CUSTOM CODENAME",
    "nick_preview_lead": "This name will represent you in the arena and on the leaderboard:",
    "nick_btn_submit": "Use this name →",
    
    // Modes
    "modes_title": "Select Challenge Arena",
    "modes_subtitle": "Compete solo, host an auditorium event, or challenge your squad.",
    "mode_big_title": "Play on Big Screen",
    "mode_big_desc": "Designed for college auditoriums, classrooms, and stage projectors. Host the questions on the big screen while students answer on their phones via QR code.",
    "mode_big_btn": "Launch Big Screen Session",
    "mode_solo_title": "Play Alone",
    "mode_solo_desc": "Test your own instincts against 10 randomized AI vs ASLI items. Fast responses earn up to 50 speed bonus points per question. Save your record to the global leaderboard.",
    "mode_solo_btn": "Start Solo Challenge →",
    "mode_friends_title": "Play With Friends",
    "mode_friends_desc": "Create a custom room with a unique code, invite your friends via QR or shareable link, and compete head-to-head in real time.",
    "mode_friends_btn": "Create a Room",
    "mode_have_code": "HAVE A ROOM CODE?",
    "mode_join_btn": "Join",
    
    // Game
    "btn_ai_sub": "Synthetic / Deepfake",
    "btn_asli_sub": "Genuine / Authentic",
    "btn_zoom": "🔍 Zoom & Inspect",
    "audio_play_prompt": "Press Play to Listen",
    "video_play_prompt": "Tap to play video",
    
    // Results
    "results_game_over": "GAME OVER",
    "results_good_job": "GOOD JOB,",
    "results_score_ready": "Your score is ready to reveal.",
    "results_btn_reveal": "✨ SCORE + STANDINGS",
    "results_insta_prompt": "Follow Zenith School of AI on Instagram to unlock your verified score report!",
    "results_btn_insta": "Follow @zenith_school_of_ai →",
    "results_btn_i_followed": "I Followed! Reveal My Score ✨",
    "results_download_btn": "📥 Download Story Graphic (PNG)",
    "results_share_friends": "📤 Share with Friends",
    "results_share_insta": "📸 Share to Instagram Story",
    "results_leaderboard_btn": "🏆 View Leaderboard",
    "results_play_again": "🔄 PLAY AGAIN"
  },
  
  hi: {
    "nav_home": "Home",
    "nav_leaderboard": "Leaderboard",
    "hero_badge": "⚡ Zenith School of AI Campus Experience",
    "hero_tagline": '"Kya aapko apni aankhon par bharosa hai?"',
    "hero_hook": "AI chehra, aawaz aur yahan tak ki reality bhi fake kar sakta hai. Kya aap asli aur nakli ka farq pehchaan sakte ho? Apni detective instincts ka test lo!",
    "btn_enter_challenge": "🚀 CHALLENGE MEIN ENTER KARO",
    "btn_how_to_play": "📖 Kaise Khele",
    "rules_title": "📊 Challenge Ke Niyam & Score Architecture",
    "rule_1_metric": "10",
    "rule_1_desc": "Har game mein 10 sawaal - AI photos, audio aur video deepfakes.",
    "rule_2_metric": "+100",
    "rule_2_desc": "Har sahi detection par +100 base points milenge.",
    "rule_3_metric": "+50",
    "rule_3_desc": "Jitna jaldi jawab doge, utna zyada speed bonus (up to +50 pts).",
    "rule_4_metric": "15s / 10s",
    "rule_4_desc": "Images ke liye 15s. Audio/video ke liye playback ke baad 10s timer shuru hoga.",
    "rule_5_metric": "1,500",
    "rule_5_desc": "Maximum possible score: 10 x (100 base + 50 speed bonus).",
    "rule_6_metric": "0 pts",
    "rule_6_desc": "Koi negative marking nahi hai! Galat answer par seedha 0 points.",
    
    // Nickname
    "nick_title": "Apna Codename Chuno",
    "nick_subtitle": "Har reality detective ka ek solid codename hona chahiye.",
    "nick_suggestions": "AI SUGGESTIONS",
    "nick_refresh": "🔄 Naye Names",
    "nick_custom_label": "YA APNA CUSTOM NAAM LIKHO",
    "nick_preview_lead": "Yeh naam aapke game aur leaderboard par dikhega:",
    "nick_btn_submit": "Yeh Naam Use Karo →",
    
    // Modes
    "modes_title": "Game Mode Chuno",
    "modes_subtitle": "Akele khelo, auditorium mein host karo, ya dosto ke sath room banao.",
    "mode_big_title": "Badi Screen / Projector Par Khelo",
    "mode_big_desc": "College auditorium aur classrooms ke liye - stage screen par sawaal dikhao aur students phone se answer karein.",
    "mode_big_btn": "Big Screen Session Shuru Karo",
    "mode_solo_title": "Akele Khelo (Solo Challenge)",
    "mode_solo_desc": "Apni nazron ka test lo 10 randomized AI vs ASLI sawaalo ke sath. Fast answers par speed bonus pao aur global leaderboard par aao.",
    "mode_solo_btn": "Solo Game Shuru Karo →",
    "mode_friends_title": "Dosto Ke Saath Khelo",
    "mode_friends_desc": "Room code banao, dosto ko QR ya shareable link bhejo aur real-time aamne-saamne compete karo.",
    "mode_friends_btn": "Room Banao",
    "mode_have_code": "ROOM CODE HAI?",
    "mode_join_btn": "Jud Jao",
    
    // Game
    "btn_ai_sub": "Synthetic / Nakli",
    "btn_asli_sub": "Real / Asli",
    "btn_zoom": "🔍 Bada Karke Dekho",
    "audio_play_prompt": "Sunne ke liye Play dabao",
    "video_play_prompt": "Video dekhne ke liye tap karo",
    
    // Results
    "results_game_over": "KHEL KHATAM (GAME OVER)",
    "results_good_job": "SHABASH,",
    "results_score_ready": "Aapka score reveal hone ke liye tayyar hai.",
    "results_btn_reveal": "✨ SCORE + STANDINGS DEKHO",
    "results_insta_prompt": "Apna score aur rank unlock karne ke liye Zenith School of AI ko Instagram par follow karo!",
    "results_btn_insta": "@zenith_school_of_ai Follow Karo →",
    "results_btn_i_followed": "Maine Follow Kar Liya! Score Dikhao ✨",
    "results_download_btn": "📥 Story Graphic Download Karo (PNG)",
    "results_share_friends": "📤 Dosto Ke Sath Share Karo",
    "results_share_insta": "📸 Instagram Story Par Lagao",
    "results_leaderboard_btn": "🏆 Leaderboard Dekho",
    "results_play_again": "🔄 PHIR SE KHELO"
  }
};

class I18nManager {
  constructor() {
    this.currentLang = localStorage.getItem("zenith_lang") || "en";
  }

  init() {
    this.applyLanguage(this.currentLang);
  }

  setLanguage(lang) {
    if (lang !== "en" && lang !== "hi") return;
    this.currentLang = lang;
    localStorage.setItem("zenith_lang", lang);
    this.applyLanguage(lang);
    this.updateToggleButtons();
  }

  toggleLanguage() {
    const nextLang = this.currentLang === "en" ? "hi" : "en";
    this.setLanguage(nextLang);
    return nextLang;
  }

  applyLanguage(lang) {
    const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      if (dict[key]) {
        if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
          el.placeholder = dict[key];
        } else {
          el.innerHTML = dict[key];
        }
      }
    });
    this.updateToggleButtons();
  }

  getText(key) {
    const dict = TRANSLATIONS[this.currentLang] || TRANSLATIONS.en;
    return dict[key] || key;
  }

  updateToggleButtons() {
    const btns = document.querySelectorAll(".lang-toggle-btn");
    btns.forEach(btn => {
      const status = btn.querySelector(".lang-status-text");
      const iconSpan = btn.querySelector(".btn-icon");
      if (status) {
        status.textContent = this.currentLang === "en" ? "English (Tap to switch to Hinglish)" : "Hinglish (Tap to switch to English)";
      }
      if (iconSpan) {
        iconSpan.textContent = this.currentLang === "en" ? "🇮🇳" : "🌐";
      } else if (!status) {
        btn.innerHTML = this.currentLang === "en" ? "🇮🇳 Switch to Hinglish" : "🌐 Switch to English";
      }
      btn.setAttribute("title", this.currentLang === "en" ? "Translate to Hinglish" : "Translate to English");
    });
  }
}

window.i18n = new I18nManager();
document.addEventListener("DOMContentLoaded", () => {
  window.i18n.init();
});
