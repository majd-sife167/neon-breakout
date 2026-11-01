# Neon Breakout — JavaFX + Scene Builder

A Breakout game for a university assignment: the UI is designed in **Scene Builder**
(`game.fxml`), the logic is Java. **All Java code is 300 lines total** (25 + 275).

> **New here? Read [`GUIDE.md`](GUIDE.md) first** — it explains how to play, what each
> file does, and how the code works, in plain English.

```
breakout-javafx/
├── pom.xml                        Maven build (JavaFX 21)
├── run.sh                         terminal launcher
├── Play Game.command              double-click in Finder to play
└── src/main/
    ├── java/com/example/breakout/
    │   ├── App.java               25 lines — starts the app, loads the FXML
    │   └── GameController.java    275 lines — all gameplay
    └── resources/com/example/breakout/
        ├── game.fxml              Scene Builder layout
        ├── styles.css             colours and fonts
        └── board-preview.png      static board mock-up shown in Scene Builder
```

## What is installed on this Mac

| Piece | Version | Location |
|---|---|---|
| JDK (Temurin) | 21.0.13 LTS | `~/Library/Java/JavaVirtualMachines/temurin-21.jdk` |
| Maven | 3.9.16 | `~/tools/apache-maven-3.9.16` |
| Scene Builder | 26.0.0 | `/Applications/SceneBuilder.app` |
| JavaFX | 21.0.6 | downloaded by Maven into `~/.m2` |

`JAVA_HOME` and the Maven path are exported from `~/.zshrc`. **Open a new terminal**
(or run `source ~/.zshrc`) before using `java`/`mvn`.

## Run it

Fastest: **double-click `Play Game.command`** in Finder.

Or from a terminal:

```bash
cd "/Users/majdsife/Documents/Default Project/breakout-javafx"
./run.sh
```

or

```bash
mvn javafx:run
```

> Don't try `java -jar target/breakout-javafx-1.0.jar` — JavaFX needs its modules on
> the module path, which `mvn javafx:run` handles for you.

## Scene Builder vs. the game

Scene Builder **edits** the layout; it cannot **play** the game. It never runs
`GameController`, the `AnimationTimer` or `draw()`, so the board is static there.

To make the designer less misleading, `game.fxml` contains an `ImageView` named
`preview` that shows a picture of the board (`board-preview.png`). The game hides it at
startup, so you only ever see it while designing.

- Design: open `game.fxml` in Scene Builder, press `⌘P` for a static preview.
- Play: `./run.sh` or double-click `Play Game.command`.

## Controls

| Key | Action |
|---|---|
| `←` `→` or `A` `D` | Move the paddle |
| Mouse over the board | Steer the paddle |
| `Space` / `Enter` | Start · launch ball |
| `P` / `Esc` | Pause / resume |
| `R` | Restart on the game-over screen |

## Rules and scoring

- 3 lives. Clear all bricks to finish the level; each level adds a row (max 7) and
  a faster ball.
- `10 × level` points per brick, `100 × level` bonus for clearing a level.
- High score is saved with `java.util.prefs.Preferences` (no files, no database).
- Bricks are 10 × 7 max, drawn on a `Canvas`; the HUD and menus are real JavaFX
  controls from the FXML.
- Ball movement is **sub-stepped** so it cannot pass through a brick.

## Where the code lives

| Concern | File / method |
|---|---|
| Window, FXML loading | `App.start()` |
| Game states | `enum State` + `action()`, `updateOverlay()` |
| Game loop | `AnimationTimer` → `tick(now)` |
| Physics + collisions | `update()`, `bounceWalls()`, `bouncePaddle()`, `hitBricks()` |
| Rendering | `draw()` (Canvas `GraphicsContext`) |
| HUD text | labels updated in `tick()` |
| High score | `Preferences` in `init()` / `loseLife()` |

## Report notes

- **Why Canvas + JavaFX controls together?** The FXML/Scene Builder part shows UI
  design skills (layout, CSS, labels, overlays); the Canvas part keeps 70 bricks
  and a ball readable in a few hundred lines.
- **State machine:** `MENU → READY → PLAYING → PAUSED / LEVEL_CLEAR → … → GAME_OVER`.
- **Collision:** circle-vs-expanded-rectangle, reflect on the axis with the
  smallest overlap; paddle bounce angle depends on hit position.
- **Delta time** is clamped to 33 ms so a stalled window cannot teleport the ball.
- **Line budget:** run `wc -l src/main/java/com/example/breakout/*.java`.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `mvn: command not found` | Open a new terminal, or `source ~/.zshrc` |
| `Unable to locate a Java Runtime` | `export JAVA_HOME="$HOME/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home"` |
| `Error: JavaFX runtime components are missing` | Run with `mvn javafx:run`, not `java -jar` |
| Scene Builder won't open | `open /Applications/SceneBuilder.app` |
