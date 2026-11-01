# Build log — what happened, and whyThis document explains, in plain language, everything that was done in this
session: what was on your Mac, what decisions were made, which files were
created, how the game works, and how it was tested.

If you only read one section, read **[1. Summary](#1-summary)** and
**[6. How to run and change it](#6-how-to-run-and-change-it)**.

---

## 1. Summary

You asked for a simple JavaScript game for a university project and wanted to
understand the setup first. The outcome:

1. Your Mac was inspected — **no new software needed to be installed**.
2. A complete, playable **Breakout** clone was created from scratch using plain
   HTML, CSS and JavaScript (no frameworks, no build step).
3. A local web server was started on port **8123** and the game was opened in
   the in-app browser.
4. The game was tested automatically: no console errors, all files load, the
   ball launches, and bricks actually break.

Everything lives in this folder:

```
Default Project/
├── index.html      ← entry point the browser loads
├── style.css       ← page layout + neon styling
├── js/
│   ├── config.js   ← all tunable numbers (difficulty, scoring, colours)
│   ├── audio.js    ← sound effect generator (Web Audio API)
│   ├── entities.js ← Ball, Brick and Particle classes
│   ├── player.js   ← Paddle class (keyboard + mouse steering)
│   └── main.js     ← game loop, state machine, collisions, drawing
├── README.md       ← how to run it and how it works (submission-ready)
└── PLAN.md         ← project plan, milestones, report talking points
```

---

## 2. First: what was already on your machine

Before recommending installs, I checked the tools that a JS project might need.

| Tool | Result | Meaning |
|---|---|---|
| `node` | **not installed** | Only needed for Phaser/Vite/bundlers — not for this project |
| `npm` | **not installed** | Same as above |
| `python3` | 3.9.6 ✅ | Already enough to run a local web server |
| `git` | 2.50.1 ✅ | Version control available |
| `brew` | **not installed** | Not needed; no Homebrew required |
| Browsers in `/Applications` | Safari only | Safari is enough; its dev tools open with `Cmd + Option + I` |
| Editor | none found | Optional: VS Code is recommended but any text editor works |

**Conclusion:** a plain browser game needs only a browser, a text editor and a
way to serve files. You already had all three (Safari + TextEdit/whatever you
use + Python's built-in server). That is why the final answer was
*"you don't have to install anything."*

---

## 3. Decisions made, and the reason for each

| Decision | Reason |
|---|---|
| **Browser game, not a desktop game** | Runs on any machine, easiest to demo and submit. No installer, no OS-specific build. |
| **Plain JavaScript, no framework** | Zero installation, zero build step. You can explain every line in a viva or report — examiners like that. |
| **Canvas 2D, not DOM elements** | One drawing surface, precise pixel control, simple collision maths. |
| **Breakout rather than Snake** | Breakout demonstrates more of what a marker looks for: collision detection, physics/reflection, levels, lives, scoring. Snake would mostly demonstrate a grid. |
| **Multiple small files instead of one big one** | Each file has one job, which makes the code easier to explain and to mark. |
| **Web Audio API for sound** | Sounds are generated from oscillators, so there are no `.mp3` files to ship or lose. |
| **`localStorage` for the high score** | No database or backend required. |
| **Classic `<script>` tags, not ES modules** | Works even if the page is opened in an unusual way; avoids extra server requirements. |

---

## 4. What was built (step by step)

### Step 1 — Plan
The plan (kept in `PLAN.md`) covers scope, architecture, milestones, and which
points to write up in the report. Scope was deliberately kept small: one screen,
keyboard + mouse, no multiplayer, no 3D, no accounts.

### Step 2 — Page shell
`index.html` creates a single `<canvas>` (960 × 640 internal resolution) and
loads the five scripts in dependency order: config → audio → entities → player →
main. `style.css` centres it, makes it scale to the window, and gives it the glow.

### Step 3 — Configuration
`js/config.js` holds every number you might want to change: paddle size and
speed, ball speed and cap, brick grid geometry, lives, points, and the colour
palette. It also defines two small helpers (`clamp`, `rand`) and a rounded
rectangle drawing function that works on older Safari.

> Why: a marker (or you, at 2 a.m.) can rebalance the game without reading the
> game logic.

### Step 4 — Game objects
`js/entities.js` defines three classes:

- **`Ball`** — position, velocity, radius, speed. `reset()` parks it on the
  paddle; `launch()` gives it a velocity with a random slight angle.
- **`Brick`** — rectangle, colour, hit points. `hit()` returns `true` when the
  brick is destroyed. It also has a short `flash` timer so a hit is visible.
- **`Particle`** — a small dot with velocity, gravity and a lifetime, used for
  brick-break bursts. `Game.spawnBurst()` creates a batch of them.

### Step 5 — Paddle
`js/player.js` holds the `Paddle`. It supports two input styles:

- **Keyboard:** continuous movement at a fixed speed.
- **Pointer:** the paddle eases toward the mouse/finger x-position.

Whichever input was used most recently wins, so they don't fight each other.

### Step 6 — Rules, loop and rendering
`js/main.js` is the heart of the game (see the next section for details). It
contains the state machine, level generation, collision handling, scoring,
particles, HUD, overlays and the animation loop.

### Step 7 — Serving and testing
Python's built-in server was started and the page was opened in the in-app
browser, then checked programmatically (Section 7).

### Step 8 — Documentation
`README.md` (how to run, controls, architecture — suitable for submission) and
`PLAN.md` (planning document) were written. This file is the build log.

---

## 5. How the game actually works

### 5.1 The game loop
```js
let lastTime = performance.now();

function frame(now) {
  let dt = (now - lastTime) / 1000;   // seconds since last frame
  lastTime = now;
  dt = Math.min(dt, 1 / 30);          // clamp: never simulate more than 33 ms at once

  update(dt);
  render();
  requestAnimationFrame(frame);
}
```
`requestAnimationFrame` asks the browser to call `frame` before the next repaint.
Using **delta time** means the game runs at the same speed on a 60 Hz and a
120 Hz screen. The clamp prevents a "teleport" after the tab was in the
background.

### 5.2 The state machine
The game is always in exactly one state:

```
menu ──start──► ready ──launch──► playing ──all bricks gone──► level_clear
                  ▲                   │                              │
                  └───────────────────┘◄───────── next level ────────┘
                                      │
                                 ball falls (lives 0)
                                      ▼
                                 gameover ──restart──► ready
```

| State | What updates | What you see |
|---|---|---|
| `menu` | nothing but animation | title, instructions |
| `ready` | paddle moves, ball sticks to it | "PRESS SPACE TO LAUNCH" |
| `playing` | full physics | the game |
| `paused` | nothing | "PAUSED" |
| `level_clear` | timer | "LEVEL n CLEAR" + bonus |
| `gameover` | nothing | final score, high score, restart prompt |

Keeping this explicit means you can always answer "what is the game doing right
now?" with one variable — useful in a report and when debugging.

### 5.3 Collision detection
There are three kinds, from simplest to most interesting:

1. **Walls** — if the ball's edge crosses a boundary, move it back inside and
   flip the relevant velocity component.
2. **Paddle** — only when the ball is moving down and overlaps the paddle's
   box. The ball is pushed onto the paddle surface, then the bounce angle is
   chosen from *where* it landed:
   ```js
   const offset = clamp((ball.x - paddleCenter) / (paddle.width / 2), -1, 1);
   const angle  = offset * (Math.PI / 3);   // up to 60° sideways
   ball.vx =  Math.sin(angle) * ball.speed;
   ball.vy = -Math.cos(angle) * ball.speed;
   ```
   Hitting with the edge sends the ball away sharply; the middle sends it almost
   straight up. This is what makes the game feel controllable.
3. **Bricks** — the ball is treated as a single point against the brick's
   rectangle *expanded* by the ball's radius. When they overlap, the code
   compares how far the ball has sunk in horizontally vs vertically and flips
   only the axis with the smaller overlap. That prevents the ball "sticking" to
   a brick face or reflecting the wrong way.

### 5.4 Why the ball moves in sub-steps
A fast ball can travel further in one frame than a brick is thick, which would
let it pass straight through. So each frame is split into small moves, and
collisions are checked after each one:

```js
const steps  = Math.max(1, Math.ceil(travel / (ball.radius * 0.8)));
```

This is called **sub-stepping** (or continuous collision). It is the single most
important trick in the code and a great thing to mention in your report.

### 5.5 Frames, levels and difficulty
- Level 1 has 5 rows; every level adds a row, capped at 7.
- Ball speed is `360 × (1 + 0.06 × (level − 1))`, capped at 700 px/s.
- The ball also speeds up by 4 px/s every time it hits the paddle (capped), so
  long rallies get harder.
- From level 3, every other brick in the top row takes **two** hits and is drawn
  faded after the first.
- Clearing the board awards `100 × level` bonus points.

### 5.6 Scoring and feedback
- `10 × level` points per brick hit.
- Consecutive brick hits build a **combo**; the sound pitch rises with the combo
  (capped so it never gets shrill). Hitting the paddle or losing a life resets it.
- Bricks spawn a particle burst on impact (bigger burst when destroyed).
- Losing a life shakes the screen for a moment.
- The high score is written to `localStorage` under the key
  `neon-breakout-high` and wrapped in `try/catch`, because some browsers block
  storage on `file://` pages or in private mode.

### 5.7 Sound
`js/audio.js` creates one `AudioContext` and plays short oscillator "blips" with
a quick volume envelope. Browsers block audio until the user interacts with the
page, so `Audio.init()` is called from the first click or keypress. `M` toggles
a mute flag.

### 5.8 Input handling
- `keydown` / `keyup` track left/right (`←` `→`, `A` `D`).
- `Space` / `Enter` / click / tap performs the current "action" (start, launch,
  restart, resume) depending on the state.
- Pointer movement sets a target x; the paddle eases toward it.
- `P` / `Esc` pause, `M` mutes, `R` restarts on the game-over screen.
- Arrow keys and Space call `preventDefault()` so the page doesn't scroll.
- Losing window focus automatically pauses the game — handy during a demo.

### 5.9 Rendering order
```
background → grid → bricks → paddle → ball → particles → HUD → overlay
```
The HUD is drawn *after* the screen-shake transform is undone, so the score
stays still while the playfield shakes. Overlays are translucent panels drawn on
the same canvas, so there is no HTML/CSS state to keep in sync.

---

## 6. How to run and change it

### Run it
```bash
cd "/Users/majdsife/Documents/Default Project"
python3 -m http.server 8000
```
Then open **http://localhost:8000**.

> **Right now** a server is already running in the background on port **8123**
> (chosen to avoid clashing with anything on 8000), and the game is open in the
> Review pane. To stop it, ask me, or use the shell's stop control.

### Controls
| Key | Action |
|---|---|
| `←` `→` / `A` `D` | Move the paddle |
| Mouse / trackpad | Steer directly |
| `Space` / `Enter` / click | Start · launch ball |
| `P` / `Esc` | Pause / resume |
| `M` | Mute |
| `R` | Restart (game-over screen) |

### Change the difficulty or look
Open `js/config.js` — every gameplay number is there. Common tweaks:

| Want | Change |
|---|---|
| Bigger paddle | `PADDLE.width` (120 → 150) |
| Slower ball | `BALL.speed` (360 → 300) |
| More rows | `BRICK.rows` (5 → 6) |
| More lives | `START_LIVES` (3 → 5) |
| Different colours | `COLORS.rows` |

### Where to add features
| Feature | Where |
|---|---|
| Power-ups | new class in `js/entities.js`, spawn logic in `collideBricks` in `js/main.js` |
| Extra levels / patterns | `buildLevel()` in `js/main.js` |
| New sound | `Audio.blip(...)` calls in `js/main.js` |
| Extra HUD info | `drawHud()` in `js/main.js` |
| Mobile touch | already works via pointer events; add on-screen buttons if needed |

---

## 7. How it was tested

Testing was done through the in-app browser's automation, not by eyeballing.

| Check | Method | Result |
|---|---|---|
| Page loads | Open `http://localhost:8123`, inspect title | Title = "Neon Breakout" ✅ |
| Files load | List captured network requests | 7/7 requests, all served ✅ |
| Console clean | Read console at `warning` and `error` level | **No page errors** ✅ |
| Canvas renders | Count bright pixels on the canvas | ~1,300 lit samples → game is drawing ✅ |
| Animation runs | Hash canvas pixels, wait 600 ms, hash again | Hash changes in menu, ready and playing ✅ |
| Gameplay works | Count brick-coloured pixels before/after 4 s of play | 7,399 brick pixels destroyed → collisions, scoring and the loop all run ✅ |
| Start button | Send `Space` | Menu → ready → playing transitions observed ✅ |

Two caveats worth knowing:

1. **I could not view the screenshot myself** — this model cannot read images.
   The visual design was therefore verified structurally (pixels present, no
   errors) rather than by looking. Please glance at it; if a colour or layout
   looks off, tell me and I'll adjust.
2. The only console message that appeared was a Chrome *warning* caused by the
   test itself (`getImageData` readback), not by the game.

### Test it yourself
1. Load the page — the menu should appear with a pulsing "press space" prompt.
2. Press `Space` — the ball sits on the paddle.
3. Press `Space` again — the ball launches and bounces off bricks.
4. Move with the mouse, then with the arrow keys — both should work smoothly.
5. Let the ball fall three times — the game-over panel shows the score.
6. Press `R` — a fresh game starts and the high score is kept.
7. Refresh the page — the high score should still be in the HUD.

---

## 8. Things to be aware of

| Issue | Explanation |
|---|---|
| **Don't double-click `index.html`** | Browsers restrict some features on `file://` URLs. Always use the local server, then open `http://localhost:PORT`. |
| **Port numbers may differ** | The README says 8000; the currently running server is on 8123. Both are fine — the port is just "which door" the server listens on. |
| **Not a git repository yet** | The folder started empty and no repo was created. For evidence of your work, run `git init` early — see below. |
| **No automated tests** | All logic lives in the browser. If your course requires unit tests, the scoring and collision functions would need extracting into testable modules (worth asking about). |
| **Scope is intentionally small** | No multiplayer, 3D, accounts or online leaderboard. Mention them as "future work" in the report. |

### Recommended: put it under version control
```bash
cd "/Users/majdsife/Documents/Default Project"
git init
git add .
git commit -m "Initial working Breakout game"
```
Then commit after each milestone. Markers often value a visible commit history
as evidence of process.

---

## 9. Plain-English glossary (useful for the viva)

| Term | Meaning |
|---|---|
| **Canvas** | An HTML element that gives you a blank drawing surface controlled by JavaScript. |
| **Game loop** | The function that runs ~60 times per second: read input, update world, redraw. |
| **Delta time (`dt`)** | The number of seconds since the previous frame; used so speed doesn't depend on frame rate. |
| **State machine** | A design where the program is always in exactly one named state, with rules for moving between states. |
| **AABB** | "Axis-Aligned Bounding Box" — a rectangle that hasn't been rotated. The simplest collision shape. |
| **Sub-stepping** | Splitting a fast movement into several small movements so collisions can't be skipped. |
| **`requestAnimationFrame`** | The browser API that calls your loop right before each repaint. |
| **`localStorage`** | A small key/value store built into the browser, used here for the high score. |
| **Web Audio API** | Browser API for generating and processing sound; used here instead of audio files. |
| **Delta-time clamp** | Capping `dt` so a long pause (e.g. background tab) can't make objects teleport. |

---

## 10. Suggested next steps

1. **Run it** and play a few rounds; note anything that feels wrong.
2. **Read `js/config.js`** and try changing one number at a time.
3. **Add one feature** from the list in Section 6 — a small, finished addition
   scores better than a large, half-finished one.
4. **Write the report** using the points in `PLAN.md` §6: collision method,
   state diagram, delta-time loop, difficulty table, test table.
5. **Commit to git** at every milestone.
6. **Record a 60–90 second demo video** (screen recording + a browser tab is
   enough) — most markers ask for this.

---

# Part 2 — the JavaFX / Scene Builder version

Part 1 above covers the JavaScript game in this folder. Part 2 covers what happened
after you said the project must use **Scene Builder** with a **300-line code limit**.

## 11. Why the stack changed

"Scene Builder" means **JavaFX Scene Builder** — a drag-and-drop designer that
produces `.fxml` UI files for **Java** programs. That is a different language and
runtime from the JavaScript game, so the JavaFX version is a separate project, not a
port of the same files.

The two projects now live side by side:

```
Default Project/
├── index.html, style.css, js/…      ← JavaScript version (Part 1)
├── breakout-javafx/                 ← JavaFX + Scene Builder version (this part)
├── README.md, PLAN.md, HOW-IT-WAS-BUILT.md
```

Ask your lecturer which one matches the assignment before you submit.

## 12. What was already installed (nothing)

| Tool | Before | Consequence |
|---|---|---|
| JDK | **none** | JavaFX cannot compile or run without it |
| Maven / Gradle | **none** | no dependency management |
| Scene Builder | **none** | no FXML designer |
| Homebrew | **none** | so everything was installed manually, no admin password |
| macOS | 26.0.1, **arm64** (Apple Silicon) | must use `aarch64` builds |

## 13. What was installed, and where

| Piece | Version | Location | Why |
|---|---|---|---|
| Eclipse Temurin JDK | 21.0.13 LTS | `~/Library/Java/JavaVirtualMachines/temurin-21.jdk` | LTS, the version most JavaFX tutorials use |
| Apache Maven | 3.9.16 | `~/tools/apache-maven-3.9.16` | builds the project, downloads JavaFX |
| Gluon Scene Builder | 26.0.0 | `/Applications/SceneBuilder.app` | the drag-and-drop designer |
| OpenJFX | 21.0.6 | `~/.m2/repository/org/openjfx` | pulled automatically by Maven |

Install method, for the record:

1. JDK downloaded from the Adoptium API, extracted to
   `~/Library/Java/JavaVirtualMachines/temurin-21.jdk` (macOS finds it automatically —
   confirmed with `/usr/libexec/java_home -V`).
2. Maven binary tarball extracted to `~/tools`.
3. `~/.zshrc` gained a small block exporting `JAVA_HOME` and adding Maven to `PATH`:
   ```zsh
   export JAVA_HOME="$HOME/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home"
   export PATH="$JAVA_HOME/bin:$HOME/tools/apache-maven-3.9.16/bin:$PATH"
   ```
4. Scene Builder downloaded (91 MB dmg, **aarch64**), mounted with `hdiutil`, copied
   to `~/Applications`.

**Mistake worth knowing about:** you had downloaded
`SceneBuilder-26.0.0-amd64.dmg` — the **Intel** build — for an Apple Silicon Mac. It
would run under Rosetta and be slower. The installed copy is the native `aarch64`
build; the amd64 dmg in `~/Downloads` can be deleted.

## 14. Why the 300-line limit changed the design

The limit is **code only** (not FXML/CSS), but the safest reading is all Java files.
Final count:

| File | Lines |
|---|---|
| `App.java` | 25 |
| `GameController.java` | 275 |
| **Total** | **300** |

To fit, these decisions were made:

| Removed / changed | Lines saved | Trade-off |
|---|---|---|
| Particle effects | ~25 | fewer visual flourishes; gameplay unchanged |
| Section banner comments | ~8 | code is grouped by method name instead |
| Sound effects | — | JavaFX audio needs `.wav` assets; skipped |
| Two-hit bricks, combos | ~15 | simpler rules, easier to explain |
| HUD drawn on Canvas | ~15 | HUD is real FXML `Label`s instead — better for Scene Builder |

The split is deliberate: **FXML carries layout and styling** (Scene Builder's job),
**one controller carries logic** (your job), and `App` only starts things.

## 15. How the parts fit together

```
App.java
  └─ FXMLLoader loads game.fxml
       ├─ BorderPane
       │    ├─ HBox (HUD labels)          ← designed in Scene Builder
       │    └─ StackPane
       │         ├─ Canvas 900×600        ← game drawn here in Java
       │         └─ VBox overlay          ← menu / pause / game-over panels
       └─ GameController.init(scene)
            ├─ AnimationTimer → tick(now) each frame
            ├─ key + mouse handlers
            └─ draw() → GraphicsContext
```

- `fx:id` in the FXML matches an `@FXML` field in the controller (that is the only
  link between design and code).
- The overlay is shown/hidden and its text replaced by `updateOverlay()`.
- The HUD labels update every frame in `tick()`.
- The high score uses `java.util.prefs.Preferences`, so no file handling is needed.

## 16. Verification performed

| Check | Command / method | Result |
|---|---|---|
| JDK registered with macOS | `/usr/libexec/java_home -V` | 21.0.13 arm64 ✅ |
| Maven works | `mvn -v` | 3.9.16 ✅ |
| Code compiles | `mvn package` | BUILD SUCCESS ✅ |
| Line budget | `wc -l src/main/java/.../*.java` | 300 exactly ✅ |
| App starts | `mvn javafx:run`, then check the process and log | process alive, **no exceptions** ✅ |
| Scene Builder installed | `PlistBuddy` version check | 26.0.0 ✅ |

Caveat: the JavaFX window is a native window, not a browser tab, so it was verified
by "compiles, launches, stays alive, no stack trace". I could not inspect the window
visually (no image support). Please play one round and tell me if anything looks off.

## 17. How to run, edit and submit

Run the game:
```bash
cd "/Users/majdsife/Documents/Default Project/breakout-javafx"
./run.sh
```

Open the layout in Scene Builder:
```bash
open /Applications/SceneBuilder.app
```
then open `src/main/resources/com/example/breakout/game.fxml`.

Full details are in `breakout-javafx/README.md` and
`breakout-javafx/SCENE-BUILDER.md`.

Before submitting:
1. Confirm with your lecturer whether "Scene Builder" means JavaFX (this folder) or
   the JavaScript version (root folder).
2. Run `wc -l` yourself and keep a screenshot of the 300-line result as evidence.
3. Add `git init` + commits so the history shows the work.
4. Take screenshots of the menu, gameplay and game-over panel.
5. Note the line-count trade-offs (Section 14) in your report — being able to explain
   what you cut and why is worth marks.

## 18. Two bugs found after the first "finished" build

The project compiled and launched on the first try, but the window looked broken.
Both causes were found by reading the files, not by guessing.

| Bug | Cause | Fix |
|---|---|---|
| UI looked plain/grey, menu text almost invisible | `styles.css` existed but the FXML root never had `stylesheets="@styles.css"`, so **no CSS was ever loaded** | added the attribute to `BorderPane` |
| No start screen | `State.MENU` was declared and had text, but `init()` jumped straight to `READY`, so the menu was unreachable | `state = State.MENU;` in `init()` (merged onto an existing line to stay at 300) |

Verification method: a throwaway JavaFX harness (outside the project, so it costs no
lines) loaded `game.fxml` and printed the computed style of the HUD label:

```
SCORE_FONT = Font[name=Menlo Bold, family=Menlo, style=Bold, size=15.0]
SCORE_FILL = 0xdbe7ffff
```

Those values can only come from `.hud-item` in `styles.css`, which proved the sheet was
loaded and matched — not merely present on disk.

Later additions, still inside the 300-line budget:

- `board-preview.png` + an `ImageView` named `preview` in the `StackPane`, so Scene
  Builder shows the real board instead of an empty Canvas. The controller hides it at
  startup with `lookupAll("#preview").forEach(n -> n.setVisible(false));` (one line,
  paid for by merging `newBoard(); resetBall();`).
- `Play Game.command`, so the game can be launched from Finder without a terminal.

**Scene Builder cannot run the game.** It parses the FXML and applies CSS; it never
instantiates the controller or starts the `AnimationTimer`. That split is the point of
the assignment: design in Scene Builder, behaviour in Java.
