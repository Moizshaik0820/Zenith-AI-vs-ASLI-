/**
 * AI vs ASLI — Dedicated Instagram Story Card Logic
 * High-Resolution 9:16 Canvas Generator, Download & Sharing
 */

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("resultStoryCanvas");
  const downloadBtn = document.getElementById("downloadCardBtn");
  const shareInstaBtn = document.getElementById("shareInstaBtn");
  const playAgainBtn = document.getElementById("playAgainBtn");
  const instaGuideModal = document.getElementById("instaGuideModal");

  if (!canvas) return;

  const sessionData = {
    nickname: canvas.dataset.nickname || "Detective",
    score: parseInt(canvas.dataset.score || "0", 10),
    correct: parseInt(canvas.dataset.correct || "0", 10),
    incorrect: parseInt(canvas.dataset.incorrect || "0", 10),
    unanswered: parseInt(canvas.dataset.unanswered || "0", 10),
    accuracy: parseInt(canvas.dataset.accuracy || "0", 10),
    rank: parseInt(canvas.dataset.rank || "1", 10),
    totalPlayers: parseInt(canvas.dataset.totalPlayers || "1", 10),
    compliment: canvas.dataset.compliment || "Sharp Eye! Great reality discernment."
  };

  // Render the canvas immediately
  renderStoryCanvas(canvas, sessionData);

  // 1. Download Story Graphic (PNG)
  if (downloadBtn) {
    downloadBtn.addEventListener("click", () => {
      if (window.soundFx) window.soundFx.click();
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `AI_vs_ASLI_Result_${sessionData.nickname.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        if (window.showToast) window.showToast("Story card saved as PNG!");
      }, "image/png");
    });
  }

  // 2. Share to Instagram Story
  if (shareInstaBtn) {
    shareInstaBtn.addEventListener("click", async () => {
      if (window.soundFx) window.soundFx.click();
      if (navigator.share) {
        try {
          canvas.toBlob(async (blob) => {
            const filesArray = [new File([blob], "ai_vs_asli_result.png", { type: "image/png" })];
            if (navigator.canShare && navigator.canShare({ files: filesArray })) {
              await navigator.share({
                title: "AI vs ASLI Challenge",
                text: `I scored ${sessionData.score}/600 on AI vs ASLI by Zenith School of AI! Do you trust your eyes?`,
                files: filesArray
              });
              return;
            }
            if (instaGuideModal) instaGuideModal.classList.add("active");
          });
        } catch (err) {
          if (instaGuideModal) instaGuideModal.classList.add("active");
        }
      } else {
        if (instaGuideModal) instaGuideModal.classList.add("active");
      }
    });
  }

  // 3. Play Again
  if (playAgainBtn) {
    playAgainBtn.addEventListener("click", () => {
      if (window.soundFx) window.soundFx.click();
      window.location.href = "/nickname";
    });
  }
});

/**
 * High-Resolution 9:16 Canvas Graphic (1080 x 1920)
 * Scaled for 6 questions / 600 points
 */
function renderStoryCanvas(canvas, data) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const w = 1080;
  const h = 1920;
  canvas.width = w;
  canvas.height = h;

  // 1. Background: Deep Purple & Midnight Slate Gradient
  const bgGrad = ctx.createLinearGradient(0, 0, w, h);
  bgGrad.addColorStop(0, "#170f2e");
  bgGrad.addColorStop(0.5, "#0e0b1f");
  bgGrad.addColorStop(1, "#080612");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Subtle neural geometric accents
  ctx.strokeStyle = "rgba(168, 85, 247, 0.12)";
  ctx.lineWidth = 2;
  const step = 90;
  for (let x = 0; x < w; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // 2. Top Header Brand Bar
  const shieldImg = new Image();
  shieldImg.src = "/static/images/zenith-shield.png";
  shieldImg.onload = () => {
    ctx.drawImage(shieldImg, 90, 85, 100, 100);
  };

  ctx.textAlign = "left";
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 44px -apple-system, sans-serif";
  ctx.fillText("Zenith School of AI", 215, 130);

  ctx.fillStyle = "#a855f7";
  ctx.font = "600 28px -apple-system, sans-serif";
  ctx.fillText("AI vs ASLI Reality Discernment", 215, 170);

  // 3. Central Hero Score Card
  const cardX = 90;
  const cardY = 440;
  const cardW = w - 180;
  const cardH = 880;

  ctx.fillStyle = "rgba(23, 19, 48, 0.95)";
  ctx.strokeStyle = "rgba(168, 85, 247, 0.4)";
  ctx.lineWidth = 4;
  roundRect(ctx, cardX, cardY, cardW, cardH, 36, true, true);

  // Verdict Headline
  ctx.textAlign = "center";
  ctx.fillStyle = "#e11d48";
  ctx.font = "900 46px -apple-system, sans-serif";
  ctx.fillText("I CAN TRUST MY EYES", w / 2, 530);

  // Player Nickname
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 44px -apple-system, sans-serif";
  ctx.fillText(`Detective: ${data.nickname}`, w / 2, 600);

  // Big Score Display
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 135px -apple-system, sans-serif";
  ctx.fillText(`${data.score}`, w / 2, 745);

  ctx.fillStyle = "#a855f7";
  ctx.font = "800 38px -apple-system, sans-serif";
  ctx.fillText("/ 600 POINTS", w / 2, 805);

  // 4. Metrics Row
  const statY = 860;
  const statW = 260;
  const statH = 125;
  const gap = (cardW - 3 * statW) / 4;

  drawStatBox(ctx, cardX + gap, statY, statW, statH, "ACCURACY", `${data.accuracy}% (${data.correct}/6)`);
  drawStatBox(ctx, cardX + 2 * gap + statW, statY, statW, statH, "INCORRECT", `${data.incorrect}`);
  drawStatBox(ctx, cardX + 3 * gap + 2 * statW, statY, statW, statH, "GLOBAL RANK", `#${data.rank} of ${data.totalPlayers}`);

  // 5. Compliment Box
  const compBoxY = 1030;
  const compBoxW = cardW - 80;
  const compBoxH = 240;
  const compBoxX = cardX + 40;

  ctx.fillStyle = "rgba(14, 11, 31, 0.8)";
  ctx.strokeStyle = "rgba(168, 85, 247, 0.3)";
  ctx.lineWidth = 2;
  roundRect(ctx, compBoxX, compBoxY, compBoxW, compBoxH, 20, true, true);

  // Compliment Header Tag
  ctx.fillStyle = "#a855f7";
  ctx.font = "800 24px -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("OFFICIAL VERDICT", compBoxX + compBoxW / 2, compBoxY + 45);

  // Multi-line wrapped compliment
  ctx.fillStyle = "#f8fafc";
  ctx.font = "italic 30px -apple-system, sans-serif";
  wrapText(ctx, `"${data.compliment}"`, compBoxX + compBoxW / 2, compBoxY + 105, compBoxW - 60, 42);

  // 6. Lower Section & Official Zenith Instagram Info
  const lowerY = 1370;
  ctx.fillStyle = "rgba(23, 19, 48, 0.9)";
  ctx.strokeStyle = "rgba(168, 85, 247, 0.25)";
  ctx.lineWidth = 2;
  roundRect(ctx, 90, lowerY, w - 180, 440, 30, true, true);

  const qrImg = new Image();
  qrImg.src = "/api/qr/instagram";
  qrImg.onload = () => {
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, 140, lowerY + 60, 200, 200, 16, true, false);
    ctx.drawImage(qrImg, 145, lowerY + 65, 190, 190);

    ctx.textAlign = "left";
    ctx.fillStyle = "#ffffff";
    ctx.font = "800 36px -apple-system, sans-serif";
    ctx.fillText("Follow on Instagram", 380, lowerY + 115);

    ctx.fillStyle = "#e11d48";
    ctx.font = "bold 32px -apple-system, sans-serif";
    ctx.fillText("@zenith_school_of_ai", 380, lowerY + 165);

    ctx.fillStyle = "#c4b5fd";
    ctx.font = "600 28px -apple-system, sans-serif";
    ctx.fillText("play.zenith.ai", 380, lowerY + 215);

    ctx.fillStyle = "#f8fafc";
    ctx.font = "700 28px -apple-system, sans-serif";
    ctx.fillText("B.Tech in AI + Mini-MBA", 380, lowerY + 260);

    ctx.fillStyle = "#a855f7";
    ctx.font = "800 26px -apple-system, sans-serif";
    ctx.fillText("One Degree. KRMU.", 380, lowerY + 300);

    ctx.textAlign = "center";
    ctx.fillStyle = "#94a3b8";
    ctx.font = "600 24px -apple-system, sans-serif";
    ctx.fillText("Built by Zenith School of AI first-years with AI agents.", w / 2, lowerY + 395);
  };
}

function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

function drawStatBox(ctx, x, y, w, h, label, val) {
  ctx.fillStyle = "rgba(14, 11, 31, 0.75)";
  ctx.strokeStyle = "rgba(168, 85, 247, 0.25)";
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 18, true, true);

  ctx.textAlign = "center";
  ctx.fillStyle = "#c4b5fd";
  ctx.font = "700 22px -apple-system, sans-serif";
  ctx.fillText(label, x + w / 2, y + 42);

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 34px -apple-system, sans-serif";
  ctx.fillText(val, x + w / 2, y + 92);
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  ctx.textAlign = "center";

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}
