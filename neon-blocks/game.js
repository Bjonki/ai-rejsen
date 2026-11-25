"use strict";

const COLS = 10;
const ROWS = 20;
const CELL = 30;
const SHAPES = {
  I: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
  J: [[1,0,0],[1,1,1],[0,0,0]],
  L: [[0,0,1],[1,1,1],[0,0,0]],
  O: [[1,1],[1,1]],
  S: [[0,1,1],[1,1,0],[0,0,0]],
  T: [[0,1,0],[1,1,1],[0,0,0]],
  Z: [[1,1,0],[0,1,1],[0,0,0]]
};
const COLORS = { I: "#64dded", J: "#7295ff", L: "#ffb665", O: "#f0d76a", S: "#7de2a2", T: "#b194ff", Z: "#f67e9c" };
// Standard rotation kicks, with the vertical axis converted to canvas coordinates.
const JLSTZ_KICKS = {
  "0>1": [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
  "1>0": [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
  "1>2": [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
  "2>1": [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
  "2>3": [[0,0],[1,0],[1,-1],[0,2],[1,2]],
  "3>2": [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
  "3>0": [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
  "0>3": [[0,0],[1,0],[1,-1],[0,2],[1,2]]
};
const I_KICKS = {
  "0>1": [[0,0],[-2,0],[1,0],[-2,1],[1,-2]],
  "1>0": [[0,0],[2,0],[-1,0],[2,-1],[-1,2]],
  "1>2": [[0,0],[-1,0],[2,0],[-1,-2],[2,1]],
  "2>1": [[0,0],[1,0],[-2,0],[1,2],[-2,-1]],
  "2>3": [[0,0],[2,0],[-1,0],[2,-1],[-1,2]],
  "3>2": [[0,0],[-2,0],[1,0],[-2,1],[1,-2]],
  "3>0": [[0,0],[1,0],[-2,0],[1,2],[-2,-1]],
  "0>3": [[0,0],[-1,0],[2,0],[-1,-2],[2,1]]
};
const $ = (id) => document.getElementById(id);
const ctx = $("board").getContext("2d");
let board, current, queue = [], bag = [], held = null, holdUsed = false;
let score = 0, lines = 0, level = 1, best = 0;
let state = "ready", fallTime = 0, lockTime = 0, lockResets = 0, lastTime = 0;
let messageTimer, storageAvailable = true;
const pressed = new Map();
let touch = null;

try {
  const saved = Number(localStorage.getItem("neon-blocks-best"));
  if (Number.isSafeInteger(saved) && saved >= 0) best = saved;
} catch (error) {
  storageAvailable = false;
  console.warn("High score storage unavailable:", error);
  $("storage-note").textContent = "High scores cannot be saved in this browser.";
}
$("best").textContent = best.toLocaleString();

function emptyBoard() { return Array.from({ length: ROWS }, () => Array(COLS).fill(null)); }
board = emptyBoard();
function randomType() {
  if (!bag.length) {
    bag = Object.keys(SHAPES);
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
  }
  return bag.pop();
}
function makePiece(type) {
  return { type, matrix: SHAPES[type].map((row) => [...row]), x: Math.floor((COLS - SHAPES[type].length) / 2), y: -1, rotation: 0 };
}
function collides(piece, dx = 0, dy = 0, matrix = piece.matrix) {
  return matrix.some((row, y) => row.some((filled, x) => {
    if (!filled) return false;
    const bx = piece.x + x + dx, by = piece.y + y + dy;
    return bx < 0 || bx >= COLS || by >= ROWS || (by >= 0 && board[by][bx] !== null);
  }));
}
function spawn(type) {
  current = makePiece(type);
  fallTime = lockTime = lockResets = 0;
  if (collides(current)) finish();
}
function nextPiece() {
  while (queue.length < 4) queue.push(randomType());
  spawn(queue.shift());
  queue.push(randomType());
  holdUsed = false;
}
function updateStats() {
  $("score").textContent = score.toLocaleString();
  $("lines").textContent = lines;
  $("level").textContent = level;
  if (score > best) {
    best = score;
    $("best").textContent = best.toLocaleString();
    if (storageAvailable) {
      try { localStorage.setItem("neon-blocks-best", String(best)); }
      catch (error) {
        storageAvailable = false;
        console.warn("Could not save high score:", error);
        $("storage-note").textContent = "High scores cannot be saved in this browser.";
      }
    }
  }
}
function announce(text) {
  clearTimeout(messageTimer);
  $("message").textContent = text;
  messageTimer = setTimeout(() => { $("message").textContent = ""; }, 2200);
}
function showOverlay(title, text, button, hint) {
  $("overlay-title").textContent = title;
  $("overlay-text").textContent = text;
  $("start").textContent = button;
  $("overlay-hint").textContent = hint;
  $("overlay").hidden = false;
}
function start() {
  if (state === "paused") { togglePause(); return; }
  board = emptyBoard();
  queue = []; bag = []; held = null;
  score = lines = 0; level = 1;
  state = "playing"; pressed.clear(); touch = null;
  clearTimeout(messageTimer); $("message").textContent = "";
  nextPiece(); updateStats();
  $("overlay").hidden = true;
  $("pause").disabled = false;
  $("pause").innerHTML = 'Pause <kbd>P</kbd>';
  $("pause").setAttribute("aria-label", "Pause game");
  lastTime = performance.now();
}
function finish() {
  state = "over"; pressed.clear(); touch = null;
  $("pause").disabled = true;
  showOverlay("Nice run.", `${score.toLocaleString()} points. ${lines} lines. Ready for another?`, "Play again", "Press Enter to restart");
}
function togglePause() {
  if (state !== "playing" && state !== "paused") return;
  state = state === "playing" ? "paused" : "playing";
  pressed.clear(); touch = null; lastTime = performance.now();
  const paused = state === "paused";
  $("pause").innerHTML = `${paused ? "Resume" : "Pause"} <kbd>P</kbd>`;
  $("pause").setAttribute("aria-label", paused ? "Resume game" : "Pause game");
  if (paused) showOverlay("Take a breather.", "Your blocks will be right here.", "Resume game", "Press P or Enter to resume");
  else $("overlay").hidden = true;
}
function resetLock(wasGrounded) {
  if (wasGrounded && lockResets < 15) { lockTime = 0; lockResets++; }
}
function move(dx) {
  const grounded = collides(current, 0, 1);
  if (!collides(current, dx)) { current.x += dx; resetLock(grounded); }
}
function rotate(direction = 1) {
  if (current.type === "O") return;
  const n = current.matrix.length;
  const matrix = Array.from({ length: n }, (_, y) => Array.from({ length: n }, (_, x) =>
    direction === 1 ? current.matrix[n - 1 - x][y] : current.matrix[x][n - 1 - y]));
  const rotation = (current.rotation + direction + 4) % 4;
  const kicks = (current.type === "I" ? I_KICKS : JLSTZ_KICKS)[`${current.rotation}>${rotation}`];
  const grounded = collides(current, 0, 1);
  for (const [dx, dy] of kicks) {
    if (!collides(current, dx, dy, matrix)) {
      current.x += dx; current.y += dy;
      current.matrix = matrix; current.rotation = rotation;
      resetLock(grounded); return;
    }
  }
}
function down(manual = false) {
  if (!collides(current, 0, 1)) {
    current.y++; lockTime = 0;
    if (manual) { score++; updateStats(); }
  }
  fallTime = 0;
}
function lock() {
  let aboveTop = false;
  current.matrix.forEach((row, y) => row.forEach((filled, x) => {
    if (!filled) return;
    if (current.y + y < 0) aboveTop = true;
    else board[current.y + y][current.x + x] = current.type;
  }));
  if (aboveTop) { finish(); return; }
  const remaining = board.filter((row) => row.some((cell) => cell === null));
  const cleared = ROWS - remaining.length;
  if (cleared) {
    board = [...Array.from({ length: cleared }, () => Array(COLS).fill(null)), ...remaining];
    const points = [0, 100, 300, 500, 800][cleared] * level;
    score += points;
    lines += cleared;
    level = 1 + Math.floor(lines / 10);
    announce(`${["", "SINGLE", "DOUBLE", "TRIPLE", "TETRIS!"][cleared]} +${points}`);
  }
  updateStats(); nextPiece();
}
function hardDrop() {
  let distance = 0;
  while (!collides(current, 0, 1)) { current.y++; distance++; }
  score += distance * 2; lock();
}
function hold() {
  if (holdUsed) return;
  const type = current.type;
  if (held === null) nextPiece(); else spawn(held);
  held = type; holdUsed = true;
}
function action(name) {
  if (state !== "playing") return;
  if (name === "left") move(-1);
  else if (name === "right") move(1);
  else if (name === "rotate") rotate();
  else if (name === "back") rotate(-1);
  else if (name === "down") down(true);
  else if (name === "drop") hardDrop();
  else if (name === "hold") hold();
}
const keyActions = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "rotate", ArrowDown: "down", " ": "drop", z: "back", Z: "back", c: "hold", C: "hold" };
document.addEventListener("keydown", (event) => {
  const name = keyActions[event.key];
  if (name || ["p", "P", "Escape", "Enter"].includes(event.key)) event.preventDefault();
  if (event.repeat) return;
  if (event.key === "Enter") { if (state !== "playing") start(); return; }
  if (["p", "P", "Escape"].includes(event.key)) { togglePause(); return; }
  if (name && state === "playing") {
    action(name);
    if (["left", "right", "down"].includes(name)) pressed.set(event.key, { name, elapsed: 0, next: 170 });
  }
});
document.addEventListener("keyup", (event) => pressed.delete(event.key));
$("start").addEventListener("click", start);
$("pause").addEventListener("click", togglePause);
document.querySelectorAll("[data-action]").forEach((button) => {
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    if (state !== "playing") return;
    button.setPointerCapture(event.pointerId);
    const name = button.dataset.action;
    action(name);
    if (["left", "right", "down"].includes(name)) touch = { name, elapsed: 0, next: 170, id: event.pointerId };
  });
  for (const eventName of ["pointerup", "pointercancel", "lostpointercapture"]) {
    button.addEventListener(eventName, (event) => { if (touch?.id === event.pointerId) touch = null; });
  }
  button.addEventListener("click", (event) => { if (event.detail === 0) action(button.dataset.action); });
});
function leavePage() { if (state === "playing") togglePause(); }
window.addEventListener("blur", leavePage);
document.addEventListener("visibilitychange", () => { if (document.hidden) leavePage(); });

function drawBlock(context, x, y, size, type, ghost = false) {
  const color = COLORS[type];
  if (ghost) {
    context.strokeStyle = color; context.globalAlpha = .35;
    context.lineWidth = 1.5; context.strokeRect(x + 3, y + 3, size - 6, size - 6);
    context.globalAlpha = 1; return;
  }
  context.fillStyle = color; context.fillRect(x + 1, y + 1, size - 2, size - 2);
  context.fillStyle = "#ffffff35"; context.fillRect(x + 2, y + 2, size - 4, 3);
  context.fillStyle = "#00000025"; context.fillRect(x + 2, y + size - 5, size - 4, 3);
}
function drawPiece(piece, ghost = false) {
  piece.matrix.forEach((row, y) => row.forEach((filled, x) => {
    if (filled && piece.y + y >= 0) drawBlock(ctx, (piece.x + x) * CELL, (piece.y + y) * CELL, CELL, piece.type, ghost);
  }));
}
function preview(canvas, types) {
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  types.forEach((type, index) => {
    if (!type) return;
    const cells = [];
    SHAPES[type].forEach((row, y) => row.forEach((filled, x) => { if (filled) cells.push([x, y]); }));
    const minX = Math.min(...cells.map(([x]) => x)), maxX = Math.max(...cells.map(([x]) => x));
    const minY = Math.min(...cells.map(([, y]) => y)), maxY = Math.max(...cells.map(([, y]) => y));
    const size = 23;
    const ox = (canvas.width - (maxX - minX + 1) * size) / 2;
    const oy = index * 82 + (82 - (maxY - minY + 1) * size) / 2;
    cells.forEach(([x, y]) => drawBlock(context, ox + (x - minX) * size, oy + (y - minY) * size, size, type));
  });
}
function draw() {
  ctx.fillStyle = "#0c0e18"; ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL);
  ctx.strokeStyle = "#ffffff06"; ctx.lineWidth = 1;
  for (let x = 0; x <= COLS; x++) { ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, ROWS * CELL); ctx.stroke(); }
  for (let y = 0; y <= ROWS; y++) { ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(COLS * CELL, y * CELL); ctx.stroke(); }
  board.forEach((row, y) => row.forEach((type, x) => { if (type) drawBlock(ctx, x * CELL, y * CELL, CELL, type); }));
  if (current && state !== "over") {
    const ghost = { ...current };
    while (!collides(ghost, 0, 1)) ghost.y++;
    drawPiece(ghost, true); drawPiece(current);
  }
  preview($("hold"), [held]); preview($("hold-mobile"), [held]); preview($("next"), queue.slice(0, 3));
}
function frame(now) {
  const delta = Math.min(now - lastTime, 100);
  lastTime = now;
  if (state === "playing") {
    for (const input of [...pressed.values(), ...(touch ? [touch] : [])]) {
      input.elapsed += delta;
      while (input.elapsed >= input.next && state === "playing") {
        action(input.name); input.next += input.name === "down" ? 35 : 55;
      }
    }
    if (state === "playing") {
      const interval = Math.max(70, 850 * Math.pow(.8, level - 1));
      fallTime += delta;
      if (fallTime >= interval) down();
      if (collides(current, 0, 1)) {
        lockTime += delta;
        if (lockTime >= 500) lock();
      } else lockTime = 0;
    }
  }
  draw(); requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
