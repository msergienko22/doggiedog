const playfield = document.getElementById("playfield");
const dog = document.getElementById("dog");
const counter = document.getElementById("counter");
const modal = document.getElementById("modal");
const resetButton = document.getElementById("reset");

const corners = [
  { top: "6%", left: "6%" },
  { top: "6%", right: "6%" },
  { bottom: "6%", left: "6%" },
  { bottom: "6%", right: "6%" },
];

const hearts = new Set();
let clearedHearts = 0;
let gameWon = false;

const supportsHover = window.matchMedia("(hover: hover)").matches;
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const heartSvg = `
  <svg viewBox="0 0 60 56" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ff8fb0" />
        <stop offset="55%" stop-color="#ff8a5b" />
        <stop offset="100%" stop-color="#7f8bff" />
      </linearGradient>
    </defs>
    <path
      d="M30 54 C10 40 2 30 2 18 C2 9 9 2 18 2 C24 2 29 5 30 11 C31 5 36 2 42 2 C51 2 58 9 58 18 C58 30 50 40 30 54 Z"
      fill="url(#heartGradient)"
    />
  </svg>
`;

const randomBetween = (min, max) => Math.random() * (max - min) + min;

const createHeart = (position, variant, index) => {
  const heart = document.createElement("div");
  heart.className = variant ? `heart ${variant}` : "heart";

  const size = randomBetween(45, 110);
  const rotation = randomBetween(-18, 18);
  const zIndex = Math.floor(randomBetween(3, 8));

  heart.style.width = `${size}px`;
  heart.style.height = `${size}px`;
  heart.style.left = `${position.x}px`;
  heart.style.top = `${position.y}px`;
  heart.style.zIndex = zIndex;
  heart.style.setProperty("--rotation", `${rotation}deg`);
  heart.style.transform = `rotate(${rotation}deg)`;

  if (index % 2 === 0) {
    heart.innerHTML = heartSvg;
  }

  const triggerClear = () => {
    if (heart.classList.contains("is-removed")) {
      return;
    }
    if (!prefersReducedMotion) {
      heart.classList.add("is-shaking");
    }
    heart.classList.add("is-cleared");

    window.setTimeout(() => {
      heart.classList.remove("is-shaking");
      heart.classList.add("is-removed");
      hearts.delete(heart);
      heart.remove();
      if (!gameWon && isDogRevealed()) {
        showModal();
      }
    }, prefersReducedMotion ? 100 : 380);

    clearedHearts += 1;
    counter.textContent = `Hearts cleared: ${clearedHearts}`;
  };

  if (supportsHover) {
    heart.addEventListener("mouseenter", triggerClear, { once: true });
  } else {
    let tappedOnce = false;
    heart.addEventListener("pointerdown", () => {
      if (!tappedOnce) {
        tappedOnce = true;
        if (!prefersReducedMotion) {
          heart.classList.add("is-shaking");
          window.setTimeout(() => heart.classList.remove("is-shaking"), 280);
        }
        return;
      }
      triggerClear();
    });
  }

  return heart;
};

const buildGridPositions = (spacing, offsetX = 0, offsetY = 0) => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const columns = Math.ceil(width / spacing) + 1;
  const rows = Math.ceil(height / spacing) + 1;
  const jitter = spacing * 0.25;
  const positions = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < columns; col += 1) {
      const x = col * spacing + offsetX + randomBetween(-jitter, jitter);
      const y = row * spacing + offsetY + randomBetween(-jitter, jitter);
      positions.push({ x: x - spacing * 0.5, y: y - spacing * 0.5 });
    }
  }

  return positions;
};

const buildRectPositions = (rect, spacing) => {
  const positions = [];
  const width = rect.width + spacing;
  const height = rect.height + spacing;
  const columns = Math.ceil(width / spacing);
  const rows = Math.ceil(height / spacing);
  const jitter = spacing * 0.2;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < columns; col += 1) {
      const x = rect.left + col * spacing + randomBetween(-jitter, jitter);
      const y = rect.top + row * spacing + randomBetween(-jitter, jitter);
      positions.push({ x, y });
    }
  }

  return positions;
};

const isDogRevealed = () => {
  const rect = dog.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) {
    return false;
  }

  const samplePoints = [
    { x: rect.left + rect.width * 0.5, y: rect.top + rect.height * 0.5 },
    { x: rect.left + rect.width * 0.25, y: rect.top + rect.height * 0.25 },
    { x: rect.left + rect.width * 0.75, y: rect.top + rect.height * 0.25 },
    { x: rect.left + rect.width * 0.25, y: rect.top + rect.height * 0.75 },
    { x: rect.left + rect.width * 0.75, y: rect.top + rect.height * 0.75 },
  ];

  return samplePoints.every((point) => {
    const x = Math.min(Math.max(point.x, 1), window.innerWidth - 1);
    const y = Math.min(Math.max(point.y, 1), window.innerHeight - 1);
    const topElement = document.elementFromPoint(x, y);
    return topElement === dog || dog.contains(topElement);
  });
};

const positionDog = () => {
  const corner = corners[Math.floor(Math.random() * corners.length)];
  dog.style.top = corner.top ?? "auto";
  dog.style.bottom = corner.bottom ?? "auto";
  dog.style.left = corner.left ?? "auto";
  dog.style.right = corner.right ?? "auto";
};

const clearHearts = () => {
  hearts.forEach((heart) => heart.remove());
  hearts.clear();
  clearedHearts = 0;
  counter.textContent = "Hearts cleared: 0";
};

const buildHearts = () => {
  clearHearts();
  dog.classList.add("is-hidden");
  const spacing = 60;
  const basePositions = buildGridPositions(spacing);
  const offsetPositions = buildGridPositions(spacing, spacing / 2, spacing / 2);

  basePositions.forEach((position, index) => {
    const heart = createHeart(position, null, index);
    hearts.add(heart);
    playfield.appendChild(heart);
  });
  basePositions.forEach((position, index) => {
    const heart = createHeart(position, "heart--light", index);
    hearts.add(heart);
    playfield.appendChild(heart);
  });
  offsetPositions.forEach((position, index) => {
    const heart = createHeart(position, "heart--beige", index);
    hearts.add(heart);
    playfield.appendChild(heart);
  });

  const dogRect = dog.getBoundingClientRect();
  const paddedRect = {
    left: Math.max(0, dogRect.left - spacing * 0.6),
    top: Math.max(0, dogRect.top - spacing * 0.6),
    width: dogRect.width + spacing * 1.2,
    height: dogRect.height + spacing * 1.2,
  };
  const coverPositions = buildRectPositions(paddedRect, spacing * 0.9);
  coverPositions.forEach((position, index) => {
    const heart = createHeart(position, "heart--beige", index);
    hearts.add(heart);
    playfield.appendChild(heart);
  });

  window.requestAnimationFrame(() => {
    dog.classList.remove("is-hidden");
  });
};

const showModal = () => {
  modal.classList.add("is-visible");
  modal.setAttribute("aria-hidden", "false");
  gameWon = true;
};

const resetGame = () => {
  gameWon = false;
  modal.classList.remove("is-visible");
  modal.setAttribute("aria-hidden", "true");
  positionDog();
  window.requestAnimationFrame(buildHearts);
};

dog.addEventListener("click", () => {
  if (!gameWon) {
    showModal();
  }
});

resetButton.addEventListener("click", resetGame);

resetGame();
