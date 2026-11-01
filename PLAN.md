# Project plan — Neon Breakout (JavaScript)

## 1. Goal
Build a small, complete arcade game in plain JavaScript that runs in any browser,
with no build step and no external libraries.

**Deliverable:** a playable Breakout clone with menu, score, lives, levels,
pause, game over and restart, plus a README and screenshots for the report.

## 2. Why this stack
| Choice | Reason |
|---|---|
| HTML + CSS + Canvas 2D | Nothing to install; runs everywhere |
| Plain JavaScript | Every line is explainable in the report/viva |
| Web Audio API | Sound effects with no asset files |
| `python3 -m http.server` | Local dev server, already installed on macOS |

## 3. Scope (what is in / out)
**In**
- One screen, keyboard + mouse control
- Ball physics, brick grid, collision detection
- Score, lives, level progression, high score (localStorage)
- Pause, game over, restart, mute

**Out** (mention as "future work" in the report)
- Multiplayer, 3D, mobile builds, online leaderboards, accounts

## 4. Architecture
```
index.html     page shell + script includes
style.css      layout, glow styling, responsive canvas
js/config.js   all tunable constants (sizes, speeds, colours)
js/audio.js    Web Audio beep synthesiser
js/entities.js Ball, Brick, Particle
js/player.js   Paddle (keyboard + pointer steering)
js/main.js     game loop, state machine, collisions, rendering
```

**State machine:** `menu → ready → playing → level_clear → ready … → gameover`

**Loop:** `requestAnimationFrame`, delta-time based, clamped to 1/30 s.
Ball movement is sub-stepped so it can never tunnel through a brick.

## 5. Milestones
| # | Milestone | Done when |
|---|---|---|
| 1 | Canvas + loop | Blank canvas animates at a stable frame rate |
| 2 | Paddle + ball | Ball bounces off walls and paddle |
| 3 | Bricks + collision | Bricks break, score increases |
| 4 | Lives + game over | Missing the ball costs a life, then ends the game |
| 5 | Levels | Clearing the board loads a harder one |
| 6 | Polish | Particles, sounds, screen shake, high score |
| 7 | Docs | README + screenshots + short demo video |

## 6. Report points to capture as you go
- Collision method (circle vs. expanded AABB) and why sub-stepping is needed
- State machine diagram
- Delta-time game loop with a frame clamp
- Difficulty tuning table (ball speed per level)
- Testing table: what you tried, expected vs. actual

## 7. How to run
```bash
cd "Default Project"
python3 -m http.server 8000
# open http://localhost:8000
```

## 8. Stretch ideas (only if time allows)
- Power-ups (wide paddle, multi-ball)
- Level editor using a text grid
- Particle trails, background music
- Touch controls for phones
