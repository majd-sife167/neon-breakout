# Neon Breakout — Simple Guide

Everything about the game in one page: how to play it, what each file does, and how the
code works — explained in plain English.

---

## 1. What this project is

A small **Breakout** game (bounce a ball, break bricks) made for a university project.

- **Language:** Java + JavaFX
- **Design:** the layout is made in **Scene Builder** (drag and drop), saved as `game.fxml`
- **Size:** **300 lines of Java total** — that is the assignment limit
- **Everything else** (FXML, CSS) does not count as code

---

## 2. How to play (no commands)

1. Go to your **Desktop**
2. Double-click **`Play Game.command`**
3. A Terminal window opens by itself — leave it open
4. The game window appears — play

Close the game window when done, then close the Terminal window.

### Controls

| Key | What it does |
|---|---|
| `←` `→` or `A` `D` | Move the paddle |
| Mouse over the board | Also moves the paddle |
| `Space` / `Enter` | Start the game, launch the ball |
| `P` / `Esc` | Pause and resume |
| `R` | Play again after game over |

### Rules

- You have **3 lives**. Miss the ball and you lose one.
- Break every brick to finish the level. Each level adds a row and the ball gets faster.
- Points: **10 × level** per brick, **100 × level** bonus for clearing a level.
- Your best score is saved automatically and shown as `BEST`.

---

## 3. The files

```
breakout-javafx/
├── Play Game.command            double-click to play (keep inside this folder)
├── run.sh                       the real launcher (sets Java + runs Maven)
├── pom.xml                      build file: Java version + JavaFX libraries
└── src/main/
    ├── java/com/example/breakout/
    │   ├── App.java               25 lines  — opens the window
    │   └── GameController.java   275 lines  — the whole game
    └── resources/com/example/breakout/
        ├── game.fxml             the layout, made in Scene Builder
        ├── styles.css            colours, fonts, sizes
        └── board-preview.png     picture of the board, shown only in Scene Builder
```

**Total Java: 25 + 275 = 300 lines exactly.**

⚠️ Do not move files out of `breakout-javafx/`. The folder is the program: `run.sh`,
`src/` and `game.fxml` must stay together.

---

## 4. How the code works

### `App.java` — 25 lines, just opens the window

It does three things: load the FXML, show the window, start the game logic.

```java
FXMLLoader loader = new FXMLLoader(App.class.getResource("game.fxml"));
Scene scene = new Scene(loader.load());
stage.setScene(scene);
stage.show();
loader.<GameController>getController().init(scene);   // hand over to the game
```

### `GameController.java` — 275 lines, everything else

**The game has 6 states.** Only one is active at a time:

```
MENU → READY → PLAYING → LEVEL_CLEAR → (next level) → READY
                  ↕
               PAUSED
                  ↓
              GAME_OVER → PLAYING (restart)
```

`READY` means "ball sitting on the paddle, waiting for Space".

**`init(scene)` — start-up (runs once).** Finds the canvas, reads the saved best score,
connects the keyboard and mouse, hides the Scene Builder picture, starts the timer:

```java
g = canvas.getGraphicsContext2D();
scene.setOnKeyPressed(e -> pressed(e.getCode()));
canvas.setOnMouseMoved(e -> paddleX = e.getX() - PADDLE_W / 2);
loop.start();
```

**`tick(now)` — the game loop (runs ~60 times per second).** This is the heart:

```java
double dt = Math.min((now - last) / 1e9, 0.033);   // seconds since last frame
if (state == State.PLAYING) update(dt);            // move things, check hits
draw();                                            // paint the canvas
scoreLabel.setText(...);                           // update the HUD
```

`dt` (delta time) makes movement independent of frame rate. It is **capped at 33 ms**,
so if the window freezes, the ball cannot jump through a brick when it resumes.

**`update(dt)` — physics.** The ball is moved in several small steps per frame
(sub-stepping), so it can never pass through a brick. After each step:

1. `bounceWalls()` — hit left, right or top wall → reverse direction
2. `bouncePaddle()` — hit paddle → bounce, with angle based on where it hit
3. `hitBricks()` — hit a brick → remove it, add points, reverse the ball
4. ball below the bottom → `loseLife()`

**`hitBricks()` — the collision trick.** Each brick is treated as a slightly bigger
rectangle. The code measures how far the ball overlaps it in **x** and in **y**, and
reflects the ball on whichever overlap is **smaller**. That is why the ball bounces off
the correct side instead of getting stuck inside the brick.

**`draw()` — painting.** JavaFX `Canvas` is painted from scratch every frame:

```java
g.setFill(BG);                    g.fillRect(0, 0, W, H);        // background
for (...) g.fillRoundRect(...);                                  // grid + bricks
g.fillRoundRect(paddleX, PADDLE_Y, PADDLE_W, PADDLE_H, 7, 7);   // paddle
g.fillOval(ballX - BALL_R, ballY - BALL_R, BALL_R * 2, ...);    // ball
```

**`updateOverlay()` — the menus.** Shows the overlay box and changes its three labels
(title, subtitle, prompt) depending on the state. The overlay is hidden while playing.

**Keeping score.** `java.util.prefs.Preferences` saves the best score, so no file
handling is needed.

---

## 5. Scene Builder (the design tool)

Open `game.fxml` in Scene Builder to change the look.

**It cannot play the game.** Scene Builder only reads the layout file and applies the
CSS — it never runs `GameController`, the timer, or the drawing code. That is normal and
is the point of the assignment: design the UI visually, code the behaviour separately.

- The `Canvas` is where the game is drawn. In Scene Builder you instead see
  `board-preview.png` (a picture of the board). The game hides that picture at start-up
  with one line in `init()`.
- You may change text, colours, fonts, spacing and layout freely.
- These names (`fx:id`) must **not** be renamed, because the Java code looks them up:

| `fx:id` | What it is |
|---|---|
| `canvas` | where the game is drawn |
| `scoreLabel`, `levelLabel`, `livesLabel`, `bestLabel` | HUD numbers |
| `overlay`, `overlayTitle`, `overlaySubtitle`, `overlayPrompt` | menus |
| `preview` | the design-time picture |

⚠️ If you resize the Canvas, also change `W` and `H` at the top of
`GameController.java`, or the physics will not match the screen.

CSS lives in `styles.css`. Scene Builder applies it live, so colour changes are easy.

---

## 6. How the 300-line limit was met

| Decision | Why |
|---|---|
| HUD is FXML labels, not canvas text | less Java, and better for Scene Builder |
| No sound effects | needs audio files and extra code |
| No particles / combos / two-hit bricks | visual extras that cost the most lines |
| One controller class | one file instead of many small ones |
| Compact one-line helpers | e.g. `clamp()` |

Check the count yourself:

```bash
cd "/Users/majdsife/Documents/Default Project/breakout-javafx"
wc -l src/main/java/com/example/breakout/*.java
```

---

## 7. If something goes wrong

| Problem | What to do |
|---|---|
| Double-click does nothing | Right-click `Play Game.command` → **Open With → Terminal** |
| "could not find run.sh" | You moved the launcher out of `breakout-javafx/`. Move it back, or use the Desktop shortcut |
| `mvn: command not found` | Use `Play Game.command` — it sets up Java and Maven itself |
| Window opens but game is empty | You are probably in **Scene Builder**; the real game only runs via the launcher |
| Changes in Scene Builder do nothing | Save the FXML, then close and reopen the game |

---

## 8. For the report (short version)

- **Architecture:** FXML (view) + one controller (logic) + `App` (startup).
- **Game loop:** `AnimationTimer` with delta time capped at 33 ms.
- **Collision:** circle vs. expanded rectangle, reflect on the smallest overlap axis;
  sub-stepping prevents the ball passing through bricks.
- **State machine:** `MENU → READY → PLAYING → PAUSED / LEVEL_CLEAR → GAME_OVER`.
- **Persistence:** `Preferences` for the high score.
- **UI:** designed in Scene Builder, styled with CSS, dynamic parts drawn on a Canvas.
- **Constraint:** 300 lines of Java, met exactly (25 + 275).
