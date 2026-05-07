(() => {
  console.log("SPACE TYPING: CANVAS ASTEROIDS LOADED");

  const panel = document.getElementById("gamePanel");
  const bg = document.getElementById("starsBg");
  const canvas = document.getElementById("gameCanvas");
  const bgCtx = bg?.getContext("2d");
  const ctx = canvas?.getContext("2d");

  const input = document.getElementById("typeInput");
  const startBtn = document.getElementById("startBtn");
  const restartBtn = document.getElementById("restartBtn");

  const scoreEl = document.getElementById("score");
  const diffLabel = document.getElementById("diffLabel");
  const livesHud = document.getElementById("livesHud");

  if (!panel || !bg || !canvas || !bgCtx || !ctx || !input || !startBtn || !restartBtn) {
    console.warn("SPACE TYPING: missing elements");
    return;
  }

  // ===== WORDS from json_script =====
  let WORDS = ["space", "typing", "rocket"];
  const wordsNode = document.getElementById("space-words");

  if (wordsNode) {
    try {
      const parsed = JSON.parse(wordsNode.textContent);

      if (Array.isArray(parsed) && parsed.length) {
        WORDS = parsed;
      }
    } catch (e) {
      console.warn("Failed to parse words JSON:", e);
    }
  }

  // ===== difficulty =====
  const DIFFICULTY_PRESETS = {
    easy: { spawnMs: 1500, speed: 55, lives: 5 },
    normal: { spawnMs: 1100, speed: 75, lives: 3 },
    hard: { spawnMs: 850, speed: 95, lives: 2 },
  };

  const DIFF_LABELS = {
    easy: "легко",
    normal: "нормально",
    hard: "важко",
  };

  let difficulty = "easy";

  // ===== state =====
  let W = 0;
  let H = 0;
  let dpr = 1;

  let running = false;
  let allowResize = true;

  let score = 0;
  let lives = 5;
  let maxLives = 5;

  let spawnIntervalMs = 1500;
  let baseSpeed = 55;

  let asteroids = [];
  let explosions = [];

  let spawnTimer = null;
  let lastFrame = null;
  let animationFrameId = null;

  // ===== layout lock =====
  function lockGamePanelSize() {
    const r = panel.getBoundingClientRect();

    panel.style.width = Math.floor(r.width) + "px";
    panel.style.height = Math.floor(r.height) + "px";
    panel.style.minHeight = Math.floor(r.height) + "px";
    panel.style.position = "relative";
    panel.style.overflow = "hidden";

    bg.style.position = "absolute";
    bg.style.left = "0";
    bg.style.top = "0";
    bg.style.display = "block";

    canvas.style.position = "absolute";
    canvas.style.left = "0";
    canvas.style.top = "0";
    canvas.style.display = "block";
  }

  function unlockGamePanelSize() {
    panel.style.width = "";
    panel.style.height = "";
    panel.style.minHeight = "";
  }

  // ===== resize =====
  function resizeToPanel() {
    const r = panel.getBoundingClientRect();

    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    W = Math.max(1, Math.floor(r.width));
    H = Math.max(1, Math.floor(r.height));

    bg.width = Math.floor(W * dpr);
    bg.height = Math.floor(H * dpr);
    bg.style.width = W + "px";
    bg.style.height = H + "px";
    bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    buildStars();
  }

  const ro = new ResizeObserver(() => {
    if (!allowResize) return;
    resizeToPanel();
  });

  ro.observe(panel);

  window.addEventListener(
    "resize",
    () => {
      if (!allowResize) return;
      resizeToPanel();
    },
    { passive: true }
  );

  // ===== HUD =====
  function renderLives() {
    if (!livesHud) return;

    livesHud.innerHTML = "";

    for (let i = 0; i < maxLives; i++) {
      const span = document.createElement("span");
      span.className = "life" + (i < lives ? "" : " off");
      span.textContent = "❤️";
      livesHud.appendChild(span);
    }
  }

  function updateScore() {
    if (scoreEl) {
      scoreEl.textContent = String(score);
    }
  }

  function updateHud() {
    updateScore();

    if (diffLabel) {
      diffLabel.textContent = DIFF_LABELS[difficulty] || difficulty;
    }

    renderLives();
  }

  function loseLifeAnimated() {
    if (lives <= 0) return;

    const hearts = livesHud ? Array.from(livesHud.querySelectorAll(".life")) : [];
    const idx = lives - 1;

    lives -= 1;

    if (hearts[idx]) {
      hearts[idx].classList.add("pop");

      setTimeout(() => {
        renderLives();
      }, 170);
    } else {
      renderLives();
    }
  }

  function applyDifficulty() {
    const p = DIFFICULTY_PRESETS[difficulty] || DIFFICULTY_PRESETS.easy;

    maxLives = p.lives;
    lives = p.lives;
    spawnIntervalMs = p.spawnMs;
    baseSpeed = p.speed;

    updateHud();
  }

  // ===== stars background =====
  let stars = [];

  function buildStars() {
    stars = [];

    const count = Math.floor((W * H) / 9000);

    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 0.6 + Math.random() * 1.6,
        a: 0.3 + Math.random() * 0.7,
      });
    }

    drawStars();
  }

  function drawStars() {
    bgCtx.clearRect(0, 0, W, H);

    bgCtx.fillStyle = "#05060b";
    bgCtx.fillRect(0, 0, W, H);

    for (const s of stars) {
      bgCtx.fillStyle = `rgba(255,255,255,${s.a})`;
      bgCtx.beginPath();
      bgCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      bgCtx.fill();
    }
  }

  // ===== asteroids =====
  function randWord() {
    return WORDS[Math.floor(Math.random() * WORDS.length)];
  }

  function createAsteroidShape() {
    const bumps = 10;
    const shape = [];

    for (let i = 0; i <= bumps; i++) {
      const angle = (i / bumps) * Math.PI * 2;
      const offset = 0.92 + Math.sin(angle * 3) * 0.05 + Math.random() * 0.03;

      shape.push({
        angle,
        offset,
      });
    }

    return shape;
  }

  function spawnAsteroid() {
    const text = randWord();
    const r = 34 + Math.random() * 24;

    const minX = r;
    const maxX = Math.max(r, W - r);
    const x = minX + Math.random() * Math.max(1, maxX - minX);

    // Важливо: метеорит завжди створюється вище видимої області
    const y = -r - 20;

    asteroids.push({
      text,
      x,
      y,
      r,
      vy: baseSpeed + Math.random() * 25,
      rot: Math.random() * Math.PI * 2,
      vr: (-0.7 + Math.random() * 1.4) * 0.6,
      shape: createAsteroidShape(),
    });
  }

  // ===== explosion particles =====
  function boom(x, y) {
    const parts = [];
    const n = 26 + Math.floor(Math.random() * 18);

    for (let i = 0; i < n; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = 60 + Math.random() * 180;

      parts.push({
        x,
        y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp,
        life: 0.35 + Math.random() * 0.35,
        age: 0,
        r: 1.5 + Math.random() * 2.8,
      });
    }

    explosions.push({ parts });
  }

  // ===== draw asteroid look =====
  function drawAsteroid(a) {
    ctx.save();

    ctx.translate(a.x, a.y);
    ctx.rotate(a.rot);

    const grad = ctx.createRadialGradient(
      -a.r * 0.2,
      -a.r * 0.2,
      a.r * 0.2,
      0,
      0,
      a.r
    );

    grad.addColorStop(0, "rgba(255,255,255,0.20)");
    grad.addColorStop(0.35, "rgba(255,255,255,0.08)");
    grad.addColorStop(1, "rgba(0,0,0,0.22)");

    ctx.fillStyle = grad;
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.lineWidth = 1;

    ctx.beginPath();

    for (let i = 0; i < a.shape.length; i++) {
      const point = a.shape[i];

      const rr = a.r * point.offset;
      const px = Math.cos(point.angle) * rr;
      const py = Math.sin(point.angle) * rr;

      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }

    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.rotate(-a.rot);

    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.font = "800 18px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const maxW = a.r * 1.7;
    let size = 18;

    while (ctx.measureText(a.text).width > maxW && size > 12) {
      size -= 1;
      ctx.font = `800 ${size}px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
    }

    ctx.fillText(a.text, 0, 1);

    ctx.restore();
  }

  function drawExplosions(dt) {
    for (let i = explosions.length - 1; i >= 0; i--) {
      const ex = explosions[i];
      const parts = ex.parts;

      for (let j = parts.length - 1; j >= 0; j--) {
        const p = parts[j];

        p.age += dt;

        if (p.age >= p.life) {
          parts.splice(j, 1);
          continue;
        }

        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 260 * dt;

        const k = 1 - p.age / p.life;
        const alpha = Math.max(0, k);

        ctx.fillStyle = `rgba(255,255,255,${0.85 * alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (parts.length === 0) {
        explosions.splice(i, 1);
      }
    }
  }

  // ===== game loop =====
  function clearGame() {
    ctx.clearRect(0, 0, W, H);
  }

  function gameOver() {
    running = false;
    allowResize = true;

    unlockGamePanelSize();

    if (spawnTimer) {
      clearInterval(spawnTimer);
      spawnTimer = null;
    }

    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }

    input.blur();

    setTimeout(() => {
      alert(`Гру завершено! Рахунок: ${score}`);
    }, 60);
  }

  function tick(ts) {
    if (!running) return;

    if (lastFrame == null) {
      lastFrame = ts;
    }

    const dt = Math.min(0.033, (ts - lastFrame) / 1000);
    lastFrame = ts;

    clearGame();

    for (const a of asteroids) {
      a.y += a.vy * dt;
      a.rot += a.vr * dt;
      drawAsteroid(a);
    }

    drawExplosions(dt);

    const missed = asteroids.filter((a) => a.y - a.r > H);

    if (missed.length) {
      asteroids = asteroids.filter((a) => a.y - a.r <= H);

      loseLifeAnimated();
      updateHud();

      if (lives <= 0) {
        gameOver();
        return;
      }
    }

    animationFrameId = requestAnimationFrame(tick);
  }

  function startSpawner() {
    if (spawnTimer) {
      clearInterval(spawnTimer);
    }

    spawnTimer = setInterval(() => {
      if (running) {
        spawnAsteroid();
      }
    }, spawnIntervalMs);
  }

  function startGame() {
    if (running) return;

    allowResize = true;
    resizeToPanel();
    lockGamePanelSize();

    allowResize = false;
    running = true;
    lastFrame = null;

    input.focus();

    if (asteroids.length === 0) {
      spawnAsteroid();
    }

    startSpawner();

    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }

    animationFrameId = requestAnimationFrame(tick);
  }

  function resetState() {
    running = false;
    allowResize = true;

    unlockGamePanelSize();
    resizeToPanel();

    score = 0;
    asteroids = [];
    explosions = [];
    lastFrame = null;

    if (spawnTimer) {
      clearInterval(spawnTimer);
      spawnTimer = null;
    }

    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }

    input.value = "";

    applyDifficulty();
    clearGame();
  }

  function onConfirmWord() {
    const typed = input.value.trim();

    if (!typed) return;

    const idx = asteroids.findIndex((a) => a.text === typed);

    if (idx !== -1) {
      const a = asteroids[idx];

      boom(a.x, a.y);
      asteroids.splice(idx, 1);

      score += 1;
      updateScore();
    }

    input.value = "";
  }

  // ===== events =====
  startBtn.addEventListener("click", startGame);

  restartBtn.addEventListener("click", () => {
    resetState();
    startGame();
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onConfirmWord();
    }
  });

  const form = input.closest("form");

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
    });
  }

  document.querySelectorAll(".diff-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (running) return;

      document.querySelectorAll(".diff-btn").forEach((b) => {
        b.classList.remove("active");
      });

      btn.classList.add("active");

      difficulty = btn.dataset.diff || "easy";
      resetState();
    });
  });

  // ===== init =====
  resizeToPanel();
  resetState();
})();