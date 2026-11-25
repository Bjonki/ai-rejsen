# Neon Blocks

A dependency-free, Tetris-style falling-block game. Open `index.html` in a browser or play the GitHub Pages site.

Use Left/Right to move, Up to rotate, Z to rotate back, Down to soft drop, Space to hard drop, C to hold, and P or Escape to pause. Enter starts, resumes, or restarts. Touch controls are available below the board.

Features: seven-bag randomization, standard wall kicks, ghost piece, hold, three-piece preview, 500 ms lock delay with up to 15 movement resets, line-clear scoring, increasing speed every ten lines, automatic pause when leaving the page, and browser-local high scores. Single/double/triple/four-line clears score 100/300/500/800 times the current level; soft/hard drops score 1/2 points per cell.

No packages, analytics, external assets, or downloads are required. High scores stay in your browser. This is an independently implemented falling-block puzzle, not an official Tetris product.

Run the gameplay regression tests with `node --test game.test.cjs`.
