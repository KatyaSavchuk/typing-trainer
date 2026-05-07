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

  // ===== IMAGE =====
  const asteroidImg = new Image();
  let asteroidLoaded = false;

  const asteroidSrc = canvas.dataset.asteroidSrc || "/static/img/asteroid.png";

  asteroidImg.onload = () => {
    asteroidLoaded = true;
    console.log("ASTEROID IMAGE LOADED:", asteroidImg.src);
  };

  asteroidImg.onerror = () => {
    asteroidLoaded = false;
    console.error("ASTEROID IMAGE NOT FOUND:", asteroidImg.src);
  };

  asteroidImg.src = asteroidSrc + "?v=41";

  // ===== WORDS from Django json_script =====
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
    easy: {
      spawnMs: 1500,
      speed: 95,
      lives: 5,
      totalAsteroids: 12,
    },
    normal: {
      spawnMs: 1150,
      speed: 115,
      lives: 3,
      totalAsteroids: 17,
    },
    hard: {
      spawnMs: 850,
      speed: 135,
      lives: 2,
      totalAsteroids: 20,
    },
  };

  const DIFF_LABELS = {
    easy: "легко",
    normal: "нормально",
    hard: "важко",
  };

  const MAX_ASTEROIDS_ON_SCREEN = 2;

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
  let baseSpeed = 75;
  let totalAsteroidsToSpawn = 12;
  let spawnedAsteroids = 0;

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
    bg.style.zIndex = "0";

    canvas.style.position = "absolute";
    canvas.style.left = "0";
    canvas.style.top = "0";
    canvas.style.display = "block";
    canvas.style.zIndex = "1";
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

    drawBlackBackground();
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

  function drawBlackBackground() {
    bgCtx.clearRect(0, 0, W, H);
  }

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
    totalAsteroidsToSpawn = p.totalAsteroids;

    updateHud();
  }

  // ===== asteroids =====
  function randWord() {
    return WORDS[Math.floor(Math.random() * WORDS.length)];
  }

  function canSpawnMoreAsteroids() {
    return spawnedAsteroids < totalAsteroidsToSpawn;
  }

  function spawnAsteroid() {
    if (!canSpawnMoreAsteroids()) {
      stopSpawner();
      return;
    }

    if (asteroids.length >= MAX_ASTEROIDS_ON_SCREEN) {
      return;
    }

    const text = randWord();

    const r = 46 + Math.random() * 26;

    const minX = r + 10;
    const maxX = Math.max(r + 10, W - r - 10);
    const x = minX + Math.random() * Math.max(1, maxX - minX);

    const y = -r - 30;

    asteroids.push({
      text,
      x,
      y,
      r,
      vy: baseSpeed + Math.random() * 22,
      rot: Math.random() * Math.PI * 2,
      vr: (-0.7 + Math.random() * 1.4) * 0.45,
    });

    spawnedAsteroids += 1;

    if (!canSpawnMoreAsteroids()) {
      stopSpawner();
    }
  }

  // ===== explosion particles =====
  function boom(x, y, radius) {
    const parts = [];
    const n = 34 + Math.floor(Math.random() * 16);

    for (let i = 0; i < n; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = 80 + Math.random() * 210;

      parts.push({
        x,
        y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp,
        life: 0.35 + Math.random() * 0.35,
        age: 0,
        r: 2 + Math.random() * 3.5,
      });
    }

    explosions.push({
      x,
      y,
      radius,
      age: 0,
      life: 0.28,
      parts,
    });
  }

  // ===== drawing =====
  function drawAsteroid(a) {
    ctx.save();

    ctx.translate(a.x, a.y);
    ctx.rotate(a.rot);

    const size = a.r * 2.75;

    if (asteroidLoaded && asteroidImg.naturalWidth > 0) {
      ctx.drawImage(
        asteroidImg,
        -size / 2,
        -size / 2,
        size,
        size
      );
    } else {
      ctx.fillStyle = "rgba(120,120,120,0.95)";
      ctx.beginPath();
      ctx.arc(0, 0, a.r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = "800 12px system-ui, -apple-system, Segoe UI, Roboto, Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("IMG?", 0, 0);
    }

    ctx.rotate(-a.rot);

    ctx.fillStyle = "rgba(255,255,255,0.98)";
    ctx.strokeStyle = "rgba(0,0,0,0.75)";
    ctx.lineWidth = 5;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    let fontSize = 20;
    ctx.font = `900 ${fontSize}px system-ui, -apple-system, Segoe UI, Roboto, Arial`;

    const maxW = a.r * 1.75;

    while (ctx.measureText(a.text).width > maxW && fontSize > 11) {
      fontSize -= 1;
      ctx.font = `900 ${fontSize}px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
    }

    ctx.strokeText(a.text, 0, 1);
    ctx.fillText(a.text, 0, 1);

    ctx.restore();
  }

  function drawExplosions(dt) {
    for (let i = explosions.length - 1; i >= 0; i--) {
      const ex = explosions[i];

      ex.age += dt;

      const ringProgress = Math.min(1, ex.age / ex.life);
      const ringAlpha = Math.max(0, 1 - ringProgress);

      if (ringAlpha > 0) {
        ctx.save();
        ctx.strokeStyle = `rgba(255,255,255,${0.65 * ringAlpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(ex.x, ex.y, ex.radius * ringProgress, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      for (let j = ex.parts.length - 1; j >= 0; j--) {
        const p = ex.parts[j];

        p.age += dt;

        if (p.age >= p.life) {
          ex.parts.splice(j, 1);
          continue;
        }

        p.x += p.vx * dt;
        p.y += p.vy * dt;

        p.vy += 80 * dt;

        const k = 1 - p.age / p.life;
        const alpha = Math.max(0, k);

        ctx.fillStyle = `rgba(255,255,255,${0.9 * alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (ex.parts.length === 0 && ex.age >= ex.life) {
        explosions.splice(i, 1);
      }
    }
  }

  // ===== game loop =====
  function clearGame() {
    ctx.clearRect(0, 0, W, H);
  }

  function stopSpawner() {
    if (spawnTimer) {
      clearInterval(spawnTimer);
      spawnTimer = null;
    }
  }

  function finishGame(message) {
    running = false;
    allowResize = true;

    unlockGamePanelSize();
    stopSpawner();

    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }

    input.blur();

    setTimeout(() => {
      alert(message);
    }, 60);
  }

  function checkGameCompleted() {
    const allAsteroidsSpawned = spawnedAsteroids >= totalAsteroidsToSpawn;
    const noActiveAsteroids = asteroids.length === 0;
    const noExplosions = explosions.length === 0;

    if (running && allAsteroidsSpawned && noActiveAsteroids && noExplosions) {
      finishGame(`Гру завершено! Рахунок: ${score} із ${totalAsteroidsToSpawn}`);
    }
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
        finishGame(`Гру завершено! Рахунок: ${score} із ${totalAsteroidsToSpawn}`);
        return;
      }
    }

    checkGameCompleted();

    if (!running) return;

    animationFrameId = requestAnimationFrame(tick);
  }

  function startSpawner() {
    stopSpawner();

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

    input.focus({
      preventScroll: true,
    });

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
    spawnedAsteroids = 0;
    asteroids = [];
    explosions = [];
    lastFrame = null;

    stopSpawner();

    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }

    input.value = "";

    applyDifficulty();
    clearGame();
    drawBlackBackground();
  }

  function onConfirmWord() {
    const typed = input.value.trim();

    if (!typed) return;

    const idx = asteroids.findIndex((a) => a.text === typed);

    if (idx !== -1) {
      const a = asteroids[idx];

      const boomX = a.x;
      const boomY = a.y;

      boom(boomX, boomY, a.r * 1.5);

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