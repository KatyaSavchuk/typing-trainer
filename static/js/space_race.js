(() => {
  const playerShip = document.getElementById("playerShip");
  const botShip1 = document.getElementById("botShip1");
  const botShip2 = document.getElementById("botShip2");
  const botShip3 = document.getElementById("botShip3");

  const raceInput = document.getElementById("raceInput");
  const raceTextEl = document.getElementById("raceText");
  const startBtn = document.getElementById("startRaceBtn");
  const restartBtn = document.getElementById("restartRaceBtn");

  const progressValue = document.getElementById("progressValue");
  const raceStatus = document.getElementById("raceStatus");
  const finishLine = document.querySelector(".finish-line");
  const raceScene = document.querySelector(".race-scene");
  const fireworksLeft = document.getElementById("fireworksLeft");
  const fireworksRight = document.getElementById("fireworksRight");

  const difficultyButtons = document.querySelectorAll(".diff-btn");

  if (
    !playerShip ||
    !botShip1 ||
    !botShip2 ||
    !botShip3 ||
    !raceInput ||
    !raceTextEl ||
    !startBtn ||
    !restartBtn ||
    !progressValue ||
    !raceStatus ||
    !finishLine ||
    !raceScene
  ) {
    return;
  }

  const texts = [
    "Космічні ракети летять до фінішу через темний зоряний простір і поступово набирають швидкість",
    "Гравець уважно вводить кожен символ щоб його ракета рухалась вперед без зайвих помилок",
    "Швидкий і точний набір тексту допомагає обігнати суперників у космічній гонці",
    "Кожна правильно введена літера наближає корабель до фінішу і збільшує шанс на перемогу",
    "У цій грі важливо друкувати рівно уважно і не поспішати більше ніж потрібно",
    "Ракети суперників постійно рухаються вперед тому гравцю потрібно швидко набирати текст",
    "Космічна траса довга але уважний набір допомагає дістатися фінішу раніше за інших",
    "Перемога у гонці залежить від швидкості реакції точності друку та вміння не робити помилок"
  ];

  let currentText = "";
  let started = false;
  let finished = false;

  let currentIndex = 0;
  let finishX = 0;

  let animationFrameId = null;
  let lastFrameTs = null;

  let playerFinished = false;
  let playerPlace = null;
  let finishPlaceCounter = 0;

  const ships = {
    player: {
      el: playerShip,
      currentX: 0,
      targetX: 0,
      finished: false,
      place: null,
      smoothness: 4
    },
    bot1: {
      el: botShip1,
      currentX: 0,
      targetX: 0,
      finished: false,
      place: null,
      speedPx: 28,
      smoothness: 7
    },
    bot2: {
      el: botShip2,
      currentX: 0,
      targetX: 0,
      finished: false,
      place: null,
      speedPx: 31,
      smoothness: 7
    },
    bot3: {
      el: botShip3,
      currentX: 0,
      targetX: 0,
      finished: false,
      place: null,
      speedPx: 26,
      smoothness: 7
    }
  };

  const DIFFICULTY_SPEEDS = {
    easy: {
      bot1: 28,
      bot2: 31,
      bot3: 26
    },
    normal: {
      bot1: 38,
      bot2: 42,
      bot3: 35
    },
    hard: {
      bot1: 50,
      bot2: 56,
      bot3: 47
    }
  };

  let difficulty = "easy";

  function setShipVisual(ship) {
    ship.el.style.transform = `translate3d(${ship.currentX}px, -50%, 0)`;
  }

  function setShipTarget(ship, value) {
    ship.targetX = Math.max(0, Math.min(value, finishX));
  }

  function resetShip(ship) {
    ship.currentX = 0;
    ship.targetX = 0;
    ship.finished = false;
    ship.place = null;
    setShipVisual(ship);
  }

  function getRandomText() {
    const randomIndex = Math.floor(Math.random() * texts.length);
    return texts[randomIndex];
  }

  function calculateFinishX() {
    const finishRect = finishLine.getBoundingClientRect();
    const sceneRect = raceScene.getBoundingClientRect();
    const shipWidth = playerShip.offsetWidth || 110;

    finishX = finishRect.left - sceneRect.left - shipWidth + 8;

    if (finishX < 0) {
      finishX = 0;
    }
  }

  function escapeHtml(text) {
    return text
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function renderText() {
    const correct = currentText.slice(0, currentIndex);
    const current = currentText[currentIndex] || "";
    const rest = currentText.slice(currentIndex + 1);

    raceTextEl.innerHTML =
      `<span style="color:#41ff88;">${escapeHtml(correct)}</span>` +
      `<span style="color:#ffd24a; text-decoration: underline;">${escapeHtml(current)}</span>` +
      `<span>${escapeHtml(rest)}</span>`;
  }

  function getPlaceText(place) {
    if (place === 1) return "1 місці";
    if (place === 2) return "2 місці";
    if (place === 3) return "3 місці";
    if (place === 4) return "останньому місці";
    return `${place} місці`;
  }

  function setFinalPlayerStatus() {
    if (playerPlace === 4) {
      raceStatus.textContent = "Гравець прийшов на останньому місці";
      return;
    }

    if (playerPlace) {
      raceStatus.textContent = `Гравець прийшов на ${getPlaceText(playerPlace)}`;
    }
  }

  function launchFireworks() {
    if (!fireworksLeft || !fireworksRight) return;

    fireworksLeft.style.display = "block";
    fireworksRight.style.display = "block";

    const containers = [fireworksLeft, fireworksRight];

    const colors = [
      "#ff4dff",
      "#00e5ff",
      "#ffd54a",
      "#7cff6b",
      "#ff7a59",
      "#ffffff",
      "#8f7cff",
      "#ff5fd2"
    ];

    containers.forEach((container, index) => {
      for (let wave = 0; wave < 5; wave++) {
        setTimeout(() => {
          for (let i = 0; i < 42; i++) {
            const particle = document.createElement("div");
            particle.className = "firework-particle";

            const x = `${Math.random() * 220 - 110}px`;
            const y = `${Math.random() * 360 - 180}px`;

            particle.style.left = `${20 + Math.random() * 170}px`;
            particle.style.top = `${40 + Math.random() * 520}px`;
            particle.style.setProperty("--tx", x);
            particle.style.setProperty("--ty", y);

            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = 8 + Math.random() * 10;

            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.background = color;
            particle.style.boxShadow = `0 0 14px ${color}, 0 0 28px ${color}`;

            container.appendChild(particle);

            setTimeout(() => {
              particle.remove();
            }, 1200);
          }
        }, wave * 220 + index * 100);
      }
    });

    setTimeout(() => {
      fireworksLeft.style.display = "none";
      fireworksRight.style.display = "none";
      fireworksLeft.innerHTML = "";
      fireworksRight.innerHTML = "";
    }, 2600);
  }

  function markFinished(shipName) {
    const ship = ships[shipName];

    if (ship.finished) return;

    ship.finished = true;
    ship.targetX = finishX;
    ship.currentX = finishX;
    setShipVisual(ship);

    finishPlaceCounter += 1;
    ship.place = finishPlaceCounter;

    if (shipName === "player") {
      playerFinished = true;
      playerPlace = ship.place;

      setFinalPlayerStatus();
      raceInput.disabled = true;

      if (playerPlace === 1) {
        launchFireworks();
      }
    }

    const allBotsFinished =
      ships.bot1.finished &&
      ships.bot2.finished &&
      ships.bot3.finished;

    if (allBotsFinished) {
      finishRace();
    }
  }

  function finishRace() {
    finished = true;
    started = false;
    raceInput.disabled = true;

    difficultyButtons.forEach((btn) => {
      btn.disabled = false;
    });

    if (!playerFinished) {
      playerFinished = true;
      ships.player.finished = true;
      playerPlace = 4;
      ships.player.place = 4;
    }

    setFinalPlayerStatus();
  }

  function applyDifficulty() {
    const speeds = DIFFICULTY_SPEEDS[difficulty] || DIFFICULTY_SPEEDS.easy;

    ships.bot1.speedPx = speeds.bot1;
    ships.bot2.speedPx = speeds.bot2;
    ships.bot3.speedPx = speeds.bot3;
  }

  function animateShips(ts) {
    if (lastFrameTs === null) {
      lastFrameTs = ts;
    }

    const dt = Math.min(0.033, (ts - lastFrameTs) / 1000);
    lastFrameTs = ts;

    if (started && !finished) {
      ["bot1", "bot2", "bot3"].forEach((name) => {
        const ship = ships[name];

        if (ship.finished) return;

        const randomFactor = 0.94 + Math.random() * 0.12;
        const nextTarget = ship.targetX + ship.speedPx * dt * randomFactor;

        setShipTarget(ship, nextTarget);

        if (ship.targetX >= finishX) {
          markFinished(name);
        }
      });
    }

    Object.values(ships).forEach((ship) => {
      const diff = ship.targetX - ship.currentX;

      if (Math.abs(diff) < 0.1) {
        ship.currentX = ship.targetX;
      } else {
        ship.currentX += diff * Math.min(1, ship.smoothness * dt);
      }

      setShipVisual(ship);
    });

    animationFrameId = requestAnimationFrame(animateShips);
  }

  function resetRace() {
    started = false;
    finished = false;

    currentIndex = 0;
    lastFrameTs = null;

    playerFinished = false;
    playerPlace = null;
    finishPlaceCounter = 0;

    currentText = getRandomText();

    raceInput.value = "";
    raceInput.disabled = true;

    calculateFinishX();
    applyDifficulty();

    resetShip(ships.player);
    resetShip(ships.bot1);
    resetShip(ships.bot2);
    resetShip(ships.bot3);

    progressValue.textContent = "0%";

    difficultyButtons.forEach((btn) => {
      btn.disabled = false;
    });

    raceStatus.textContent = "Очікує старту";

    renderText();
  }

  function startRace() {
    if (started || finished) return;

    calculateFinishX();
    applyDifficulty();

    started = true;
    finished = false;

    difficultyButtons.forEach((btn) => {
      btn.disabled = true;
    });

    raceInput.disabled = false;
    raceInput.focus();

    raceStatus.textContent = "Гонка почалась";
  }

  raceInput.addEventListener("keydown", (e) => {
    if (!started || finished || playerFinished) return;

    if (
      e.key === "Backspace" ||
      e.key === "Delete" ||
      e.ctrlKey ||
      e.metaKey
    ) {
      e.preventDefault();
    }
  });

  raceInput.addEventListener("input", () => {
    if (!started || finished || playerFinished) return;

    let typed = raceInput.value;

    if (typed.length > currentIndex + 1) {
      typed = typed.slice(0, currentIndex + 1);
      raceInput.value = typed;
    }

    const lastChar = raceInput.value[currentIndex];

    if (!lastChar) return;

    if (lastChar === currentText[currentIndex]) {
      currentIndex += 1;

      raceInput.value = raceInput.value.slice(0, currentIndex);

      const progress = Math.min((currentIndex / currentText.length) * 100, 100);
      progressValue.textContent = `${Math.floor(progress)}%`;

      const target = (progress / 100) * finishX;
      setShipTarget(ships.player, target);

      renderText();

      if (currentIndex === currentText.length) {
        setShipTarget(ships.player, finishX);
        markFinished("player");
      } else {
        raceStatus.textContent = "Текст набирається правильно";
      }
    } else {
      raceInput.value = raceInput.value.slice(0, currentIndex);
      raceStatus.textContent = "Помилка: введи правильний символ";
    }
  });

  difficultyButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (started) return;

      difficultyButtons.forEach((b) => {
        b.classList.remove("active");
      });

      btn.classList.add("active");

      difficulty = btn.dataset.diff || "easy";
      applyDifficulty();
      resetRace();
    });
  });

  window.addEventListener("resize", () => {
    calculateFinishX();

    const progress = currentText.length
      ? Math.min((currentIndex / currentText.length) * 100, 100)
      : 0;

    setShipTarget(ships.player, (progress / 100) * finishX);

    ["bot1", "bot2", "bot3"].forEach((name) => {
      const ship = ships[name];

      if (ship.finished) {
        ship.currentX = finishX;
        ship.targetX = finishX;
        setShipVisual(ship);
      } else {
        setShipTarget(ship, Math.min(ship.targetX, finishX));
      }
    });
  });

  startBtn.addEventListener("click", startRace);

  restartBtn.addEventListener("click", () => {
    resetRace();
  });

  resetRace();

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }

  animationFrameId = requestAnimationFrame(animateShips);
})();