(() => {
  const canvas = document.getElementById("milkyway");
  if (!canvas) return;

  const ctx = canvas.getContext("2d", { alpha: false });

  // ===== настройки "млечного пути" =====
  const SETTINGS = {
  emitRate: 3.5,          // больше частиц → шире след
  maxParticles: 2000,

  sizeMin: 1.0,
  sizeMax: 3.2,           // звезды чуть крупнее
  glowMin: 14,
  glowMax: 32,            // сильнее свечение

  lifeMin: 1.6,
  lifeMax: 3.8,           // туман дольше живёт

  drift: 0.4,            // больше "разброса" → ширина
  fadeAlpha: 0.10,        // след держится дольше

  nebulaStrength: 0.55    
};


  let w = 0, h = 0, dpr = 1;

  function resize() {
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    w = Math.floor(window.innerWidth);
    h = Math.floor(window.innerHeight);

    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);

    canvas.style.width = w + "px";
    canvas.style.height = h + "px";

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // фон сразу
    ctx.fillStyle = "#05050a";
    ctx.fillRect(0, 0, w, h);
  }

  window.addEventListener("resize", resize, { passive: true });
  resize();

  // ===== частицы =====
  const particles = [];
  let mouse = { x: w * 0.5, y: h * 0.5, vx: 0, vy: 0, active: false };
  let last = { x: mouse.x, y: mouse.y };

  function rand(min, max) { return min + Math.random() * (max - min); }

  function colorFor(t) {
    // палитра "космос": синий -> фиолетовый -> розовый
    // t 0..1
    const a = { r: 120, g: 210, b: 255 }; // cyan-blue
    const b = { r: 170, g: 120, b: 255 }; // violet
    const c = { r: 255, g: 120, b: 220 }; // pink

    let r, g, bl;
    if (t < 0.5) {
      const k = t / 0.5;
      r = a.r + (b.r - a.r) * k;
      g = a.g + (b.g - a.g) * k;
      bl = a.b + (b.b - a.b) * k;
    } else {
      const k = (t - 0.5) / 0.5;
      r = b.r + (c.r - b.r) * k;
      g = b.g + (c.g - b.g) * k;
      bl = b.b + (c.b - b.b) * k;
    }
    return `rgb(${r|0},${g|0},${bl|0})`;
  }

  function addParticle(x, y, speedX, speedY) {
    if (particles.length > SETTINGS.maxParticles) particles.shift();

    const t = Math.random();
    const size = rand(SETTINGS.sizeMin, SETTINGS.sizeMax);
    const glow = rand(SETTINGS.glowMin, SETTINGS.glowMax);
    const life = rand(SETTINGS.lifeMin, SETTINGS.lifeMax);

    particles.push({
      x, y,
      vx: speedX + rand(-SETTINGS.drift, SETTINGS.drift),
      vy: speedY + rand(-SETTINGS.drift, SETTINGS.drift),
      size,
      glow,
      life,
      age: 0,
      col: colorFor(t),
      tw: rand(0.4, 1.0) // мерцание
    });
  }

  function emitAlongLine(x0, y0, x1, y1) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const dist = Math.hypot(dx, dy);

    // чем быстрее мышь, тем больше частиц
    const count = Math.max(1, Math.floor(dist * SETTINGS.emitRate / 10));

    for (let i = 0; i < count; i++) {
      const p = i / count;
      const x = x0 + dx * p + rand(-3, 3);
      const y = y0 + dy * p + rand(-3, 3);

      // частицы "тянутся" по направлению движения
      const sx = dx * 0.02;
      const sy = dy * 0.02;

      addParticle(x, y, sx, sy);
    }
  }

  // ===== управление мышью/тач =====
  function onMove(x, y) {
    mouse.active = true;
    mouse.vx = x - mouse.x;
    mouse.vy = y - mouse.y;
    mouse.x = x;
    mouse.y = y;

    emitAlongLine(last.x, last.y, mouse.x, mouse.y);

    last.x = mouse.x;
    last.y = mouse.y;
  }

  window.addEventListener("mousemove", (e) => onMove(e.clientX, e.clientY), { passive: true });

  window.addEventListener("touchmove", (e) => {
    const t = e.touches && e.touches[0];
    if (!t) return;
    onMove(t.clientX, t.clientY);
  }, { passive: true });

  window.addEventListener("mouseleave", () => { mouse.active = false; }, { passive: true });

  // ===== рендер =====
  let lastTime = performance.now();

  function drawNebula(x, y, strength) {
    // мягкая туманность вокруг мыши
    const r = 140;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(160, 90, 255, ${0.18 * strength})`);
    g.addColorStop(0.45, `rgba(90, 190, 255, ${0.12 * strength})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  function loop(now) {
    const dt = Math.min(0.033, (now - lastTime) / 1000);
    lastTime = now;

    // плавное "затухание" кадра (оставляем хвост)
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = `rgba(5,5,10,${SETTINGS.fadeAlpha})`;
    ctx.fillRect(0, 0, w, h);

    // туманность
    if (mouse.active) {
      drawNebula(mouse.x, mouse.y, SETTINGS.nebulaStrength);
    }

    // рисуем частицы в режиме "свечения"
    ctx.globalCompositeOperation = "lighter";

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.age += dt;

      if (p.age >= p.life) {
        particles.splice(i, 1);
        continue;
      }

      // движение
      p.x += p.vx * (60 * dt);
      p.y += p.vy * (60 * dt);

      // плавное исчезновение
      const k = 1 - (p.age / p.life);
      const alpha = Math.max(0, k);

      // мерцание
      const tw = 0.7 + Math.sin((now * 0.004) + i) * 0.25;
      const glow = p.glow * tw;

      // свечение (градиент)
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glow);
      grad.addColorStop(0, `rgba(255,255,255,${0.10 * alpha})`);
      grad.addColorStop(0.25, `rgba(255,255,255,${0.06 * alpha})`);
      grad.addColorStop(0.45, `${p.col.replace("rgb", "rgba").replace(")", `,${0.07 * alpha})`)}`);
      grad.addColorStop(1, "rgba(0,0,0,0)");

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, glow, 0, Math.PI * 2);
      ctx.fill();

      // яркая точка звезды
      ctx.fillStyle = `rgba(255,255,255,${0.18 * alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
