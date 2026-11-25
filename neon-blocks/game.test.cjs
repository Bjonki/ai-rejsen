const { test } = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const path = require("node:path");

function game() {
  const elements = new Map();
  const drawing = new Proxy({}, { get: () => () => {} });
  const sandbox = {
    console, performance: { now: () => 0 }, requestAnimationFrame() {},
    setTimeout() {}, clearTimeout() {},
    localStorage: { getItem: () => null, setItem() {} },
    window: { addEventListener() {} },
    document: {
      getElementById(id) {
        if (!elements.has(id)) elements.set(id, {
          textContent: "", hidden: false, width: 128, height: 250,
          getContext: () => drawing, addEventListener() {}, setAttribute() {}
        });
        return elements.get(id);
      },
      addEventListener() {}, querySelectorAll: () => []
    }
  };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(__dirname, "game.js"), "utf8"), sandbox);
  return (code) => vm.runInContext(code, sandbox);
}

test("each seven-bag contains every piece exactly once", () => {
  const run = game();
  assert.equal(run("Array.from({length: 20}, () => new Set(Array.from({length: 7}, randomType)).size).every(n => n === 7)"), true);
});

test("start, hard drop, hold limit, pause, and restart", () => {
  const run = game();
  run("start()");
  assert.equal(run('state === "playing" && queue.length === 4 && !$("overlay").hidden === false'), true);
  run("const original = current.type; hold(); const swapped = current.type; hold()");
  assert.equal(run("held === original && current.type === swapped && holdUsed"), true);
  run("hardDrop()");
  assert.equal(run("board.flat().filter(Boolean).length"), 4);
  assert.equal(run("score > 0 && !holdUsed"), true);
  run("togglePause(); const pausedX = current.x; action('left')");
  assert.equal(run("state === 'paused' && current.x === pausedX && !$('overlay').hidden"), true);
  run("start()");
  assert.equal(run("state"), "playing");
  run("finish(); start()");
  assert.equal(run("score === 0 && lines === 0 && held === null && board.flat().every(c => c === null)"), true);
});

test("four-line clear uses previous level and advances at ten lines", () => {
  const run = game();
  run(`start(); lines = 6;
    for (let y = 16; y < 20; y++) board[y] = Array.from({length: 10}, (_, x) => x === 4 ? null : "T");
    current = makePiece("I"); rotate(); current.x = 2; current.y = 16; lock();`);
  assert.equal(run("lines"), 10);
  assert.equal(run("level"), 2);
  assert.equal(run("score"), 800);
  assert.equal(run("board.flat().filter(Boolean).length"), 0);
  assert.equal(run("$('message').textContent"), "TETRIS! +800");
});

test("rotation wall and floor kicks stay legal", () => {
  const run = game();
  run('start(); spawn("I"); rotate(); current.x = -2; rotate()');
  assert.equal(run("current.rotation === 2 && !collides(current)"), true);
  run('spawn("T"); current.y = 18; rotate()');
  assert.equal(run("current.rotation === 1 && !collides(current)"), true);
  run("for (let i = 0; i < 30; i++) { move(i % 2 ? 1 : -1); }");
  assert.equal(run("lockResets <= 15 && !collides(current)"), true);
});

test("blocked spawn and locking above the playfield end the game", () => {
  const run = game();
  run('start(); board[0].fill("Z"); spawn("O")');
  assert.equal(run("state"), "over");
  run('start(); current = makePiece("O"); lock()');
  assert.equal(run("state"), "over");
});

test("soft drop scores only actual movement; lock delay allows placement", () => {
  const run = game();
  run('start(); spawn("O"); current.y = 17; down(true); down(true)');
  assert.equal(run("score"), 1);
  assert.equal(run("current.y"), 18);
  run("frame(100); frame(200); frame(300); frame(400)");
  assert.equal(run("board.flat().filter(Boolean).length"), 0);
  run("frame(500)");
  assert.equal(run("board.flat().filter(Boolean).length"), 4);
});
