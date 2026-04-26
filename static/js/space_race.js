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

  if (
    !playerShip || !raceInput || !startBtn || !restartBtn ||
    !finishLine || !raceScene
  ) return;

  const texts = [
    "Космічні ракети летять до фінішу крізь зоряний простір",
    "Швидкий друк допомагає перемогти у космічній гонці",
    "Ракета гравця рухається вперед за кожен правильний символ",
    "Уважний набір тексту веде до перемоги над суперниками",
    "Кожна правильна літера наближає тебе до фінішу"
  ];

  let currentText = "";
  let started = false;
  let finished = false;

  let currentIndex = 0;
  let playerProgress = 0;

  let bot1 = 0;
  let bot2 = 0;
  let bot3 = 0;

  let botInterval = null;
  let finishX = 0;

  function setShipX(ship, value) {
    ship.style.left = `${16 + value}px`;
  }

  function getRandomText() {
    const randomIndex = Math.floor(Math.random() * texts.length);
    return texts[randomIndex];
  }

  function calculateFinishX() {
    const finishRect = finishLine.getBoundingClientRect();
    const sceneRect = raceScene.getBoundingClientRect();
    const shipWidth = playerShip.offsetWidth || 110;

    finishX = (finishRect.left - sceneRect.left) - shipWidth + 8;
    if (finishX < 0) finishX = 0;
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

            setTimeout(() => particle.remove(), 1200);
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

  function resetRace() {
    started = false;
    finished = false;
    currentIndex = 0;
    playerProgress = 0;
    bot1 = 0;
    bot2 = 0;
    bot3 = 0;

    if (botInterval) {
      clearInterval(botInterval);
      botInterval = null;
    }

    currentText = getRandomText();
    raceInput.value = "";
    raceInput.disabled = true;

    calculateFinishX();

    setShipX(playerShip, playerProgress);
    setShipX(botShip1, bot1);
    setShipX(botShip2, bot2);
    setShipX(botShip3, bot3);

    progressValue.textContent = "0%";
    raceStatus.textContent = "Очікує старту";

    renderText();
  }

  function finishRace(message) {
    finished = true;
    started = false;

    if (botInterval) {
      clearInterval(botInterval);
      botInterval = null;
    }

    raceInput.disabled = true;
    raceStatus.textContent = message;

    if (message.includes("Ти перемогла")) {
      launchFireworks();
    }
  }

  function startRace() {
    if (started || finished) return;

    started = true;
    raceInput.disabled = false;
    raceInput.focus();
    raceStatus.textContent = "Гонка почалась";

    const botSpeeds = {
      bot1: 2.4,
      bot2: 2.9,
      bot3: 2.2
    };

    botInterval = setInterval(() => {
      if (finished) return;

      bot1 += botSpeeds.bot1 + Math.random() * 1.2;
      bot2 += botSpeeds.bot2 + Math.random() * 1.0;
      bot3 += botSpeeds.bot3 + Math.random() * 1.4;

      setShipX(botShip1, bot1);
      setShipX(botShip2, bot2);
      setShipX(botShip3, bot3);

      if (bot1 >= finishX) return finishRace("Бот 1 переміг");
      if (bot2 >= finishX) return finishRace("Бот 2 переміг");
      if (bot3 >= finishX) return finishRace("Бот 3 переміг");
    }, 140);
  }

  raceInput.addEventListener("keydown", (e) => {
    if (!started || finished) return;

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
    if (!started || finished) return;

    const typed = raceInput.value;

    if (typed.length > currentIndex + 1) {
      raceInput.value = typed.slice(0, currentIndex + 1);
    }

    const lastChar = raceInput.value[currentIndex];

    if (!lastChar) return;

    if (lastChar === currentText[currentIndex]) {
      currentIndex += 1;

      raceInput.value = raceInput.value.slice(0, currentIndex);

      const progress = Math.min((currentIndex / currentText.length) * 100, 100);
      progressValue.textContent = `${Math.floor(progress)}%`;

      playerProgress = (progress / 100) * finishX;
      setShipX(playerShip, playerProgress);

      raceStatus.textContent = "Правильно";
      renderText();

      if (currentIndex === currentText.length) {
        setShipX(playerShip, finishX);
        finishRace("Ти переміг 🚀");
      }
    } else {
      raceInput.value = raceInput.value.slice(0, currentIndex);
      raceStatus.textContent = "Помилка: введи правильний символ";
    }
  });

  window.addEventListener("resize", () => {
    calculateFinishX();

    if (!finished) {
      setShipX(playerShip, playerProgress);
      setShipX(botShip1, bot1);
      setShipX(botShip2, bot2);
      setShipX(botShip3, bot3);
    }
  });

  startBtn.addEventListener("click", startRace);
  restartBtn.addEventListener("click", resetRace);

  resetRace();
})();