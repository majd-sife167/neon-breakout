# Neon Breakout

A small Breakout-style arcade game built with plain **HTML, CSS and JavaScript** —
no frameworks, no build step, no installed dependencies.

> **Two versions exist in this folder.** This README covers the **JavaScript** game
> (root folder). If your assignment requires **JavaFX + Scene Builder**, use
> [`breakout-javafx/`](breakout-javafx/README.md) instead — same game, Java, 300 lines
> of code, UI designed in Scene Builder.

## Run it

```bash
cd "Default Project"
python3 -m http.server 8000
```

Then open **http://localhost:8000** in your browser.

> Do not double-click `index.html`. Browsers block some features on `file://`
> URLs, so always use the local server above.

## Controls

| Key | Action |
|---|---|
| `←` `→` or `A` `D` | Move the paddle |
| Mouse / trackpad | Steer the paddle directly |
| `Space` / `Enter` / click | Start game · launch ball |
| `P` or `Esc` | Pause / resume |
| `M` | Mute sound |
| `R` | Restart (on the game-over screen) |

## Rules

- Clear every brick to finish the level. Each level adds a row and a faster ball.
- You have 3 lives. Dropping the ball costs one.
- Hitting bricks in a row builds a combo and raises the pitch of the sound.
- From level 3, some top-row bricks take two hits (they look faded after the first).
- High score is stored in the browser (`localStorage`).

## Project layout

```
index.html      page shell
style.css       layout and visuals
js/config.js    all tunable constants (sizes, speeds, colours, scoring)
js/audio.js     tiny Web Audio sound synthesiser
js/entities.js  Ball, Brick, Particle
js/player.js    Paddle
js/main.js      game loop, state machine, collisions, rendering
PLAN.md         project plan and milestones
```

## How it works (short version)

- **Game loop:** `requestAnimationFrame` with a delta time in seconds, clamped to
  `1/30 s` so a stalled tab cannot teleport the ball.
- **States:** `menu → ready → playing → level_clear → ready … → gameover`.
  The ball sits on the paddle in `ready` until it is launched.
- **Collision:** walls and paddle use simple reflection; the paddle bounce angle
  depends on where the ball lands. Bricks use circle-vs-expanded-rectangle tests
  and reflect on the axis with the smallest overlap.
- **No tunnelling:** the ball moves in sub-steps of at most `0.8 × radius` per
  collision check.
- **Sound:** oscillators only, so there are no audio files to ship.

## Tweaking the game

Everything gameplay-related is in `js/config.js`:

- `BALL.speed` / `BALL.maxSpeed` — base speed and cap
- `PADDLE.width` / `PADDLE.speed` — difficulty
- `BRICK.rows` / `BRICK.cols` — board size
- `START_LIVES`, `POINTS_PER_BRICK`, `LEVEL_BONUS` — scoring
