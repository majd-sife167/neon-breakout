# Neon Breakout

A Breakout game (bounce the ball, clear the bricks) built for a university project.

**Two versions are in this repository:**

| Version | Folder | Tech | Code size |
|---|---|---|---|
| **JavaFX + Scene Builder** ⭐ | [`breakout-javafx/`](breakout-javafx/) | Java 21, JavaFX 21, FXML, CSS | **300 lines of Java** |
| Browser version | [`index.html`](index.html) + [`js/`](js/) | HTML, CSS, JavaScript | no build step |

The JavaFX version is the main one: the UI is designed in **Scene Builder**
(`game.fxml`), the gameplay is Java, and the whole game fits in **exactly 300 lines**.

**Start here → [`breakout-javafx/GUIDE.md`](breakout-javafx/GUIDE.md)** — plain-English
guide: how to play, what each file does, and how the code works.

---

## JavaFX + Scene Builder version

### Run it

Requires **JDK 21** and **Maven**.

```bash
cd breakout-javafx
./run.sh
```

On macOS you can also just double-click **`breakout-javafx/Play Game.command`**
(the first time, right-click → Open).

> Do not use `java -jar target/…jar` — JavaFX needs its modules on the module path,
> which `mvn javafx:run` (inside `run.sh`) handles for you.

### Design it

Open `breakout-javafx/src/main/resources/com/example/breakout/game.fxml` in
**Scene Builder**. Scene Builder edits the layout only — it cannot play the game.

### How it is built

```
breakout-javafx/
├── pom.xml                        Maven build (JavaFX 21)
├── run.sh / Play Game.command     launchers
└── src/main/
    ├── java/com/example/breakout/
    │   ├── App.java               25 lines — window + FXML loading
    │   └── GameController.java    275 lines — states, physics, collisions, drawing
    └── resources/com/example/breakout/
        ├── game.fxml              Scene Builder layout
        ├── styles.css             colours and fonts
        └── board-preview.png      board picture shown while designing
```

- **Loop:** `AnimationTimer`, delta time capped at 33 ms.
- **Physics:** sub-stepped movement (no tunnelling); circle-vs-rectangle collisions
  reflected on the smallest overlap axis.
- **States:** `MENU → READY → PLAYING → PAUSED / LEVEL_CLEAR → GAME_OVER`.
- **High score:** saved with `Preferences`.

Controls: `←` `→` or `A` `D` (or the mouse) to move · `Space`/`Enter` to start and
launch · `P`/`Esc` to pause · `R` to restart.

More details: [`breakout-javafx/README.md`](breakout-javafx/README.md) ·
[`breakout-javafx/SCENE-BUILDER.md`](breakout-javafx/SCENE-BUILDER.md)

---

## Browser version (JavaScript)

No installation, no build step — serve the folder and open it:

```bash
python3 -m http.server 8000
```

Then open **http://localhost:8000**.

> Don't open `index.html` directly: browsers restrict some features on `file://` URLs.

Extra features over the JavaFX version: combo scoring, two-hit bricks, and
synthesised sound effects.

| File | Purpose |
|---|---|
| `index.html`, `style.css` | page shell and styling |
| `js/config.js` | tunable constants (sizes, speeds, colours, scoring) |
| `js/entities.js`, `js/player.js` | ball, bricks, particles, paddle |
| `js/audio.js` | Web Audio sound synthesis (no audio files) |
| `js/main.js` | game loop, state machine, collisions, rendering |
| `js/player.js` | paddle |

Controls: `←` `→` / `A` `D` or mouse · `Space` to start · `P`/`Esc` pause ·
`M` mute · `R` restart.

---

## Documentation

| File | What is in it |
|---|---|
| [`breakout-javafx/GUIDE.md`](breakout-javafx/GUIDE.md) | simple guide: play, files, how the code works |
| [`breakout-javafx/README.md`](breakout-javafx/README.md) | JavaFX setup, controls, scoring, troubleshooting |
| [`breakout-javafx/SCENE-BUILDER.md`](breakout-javafx/SCENE-BUILDER.md) | editing the layout, `fx:id`s, the design-time mock-up |
| [`HOW-IT-WAS-BUILT.md`](HOW-IT-WAS-BUILT.md) | build log: decisions, installs, bugs found, line-budget trade-offs |
| [`PLAN.md`](PLAN.md) | original project plan and milestones |

## Line budget

```bash
wc -l breakout-javafx/src/main/java/com/example/breakout/*.java
#  25 App.java
# 275 GameController.java
# 300 total
```

FXML and CSS are layout/styling files and are not counted as code.
