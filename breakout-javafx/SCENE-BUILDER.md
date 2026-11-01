# Using Scene Builder with this project

Scene Builder is installed at **`/Applications/SceneBuilder.app`** (version 26.0.0).
Open it with:

```bash
open /Applications/SceneBuilder.app
```

To open the layout straight away from Terminal:

```bash
/Applications/SceneBuilder.app/Contents/MacOS/SceneBuilder \
  "/Users/majdsife/Documents/Default Project/breakout-javafx/src/main/resources/com/example/breakout/game.fxml"
```

## Open the layout

**File → Open…** and choose:

```
/Users/majdsife/Documents/Default Project/breakout-javafx/src/main/resources/com/example/breakout/game.fxml
```

## What you will see

```
BorderPane (root-pane)
├── top: HBox (hud)
│   ├── Label scoreLabel    "SCORE 00000"
│   ├── Label levelLabel    "LEVEL 1"
│   ├── Label livesLabel    "LIVES 3"
│   ├── Region  (pushes BEST to the right)
│   └── Label bestLabel     "BEST 00000"
└── center: StackPane (board)
    ├── Canvas canvas       (900 × 600 — the real game surface, blank in the designer)
    ├── ImageView preview   (static mock-up of the board, so it does not look empty)
    └── VBox overlay        (menus: title / subtitle / prompt)
```

**The Canvas itself is blank in Scene Builder — that is expected.** Everything inside it
(the bricks, paddle, ball) is painted by Java at runtime.

To avoid an empty rectangle in the designer, `board-preview.png` sits on top of the
Canvas as an `ImageView` named `preview`. It is a *picture*, not the game: it shows what
the board looks like, but you cannot interact with it. At runtime the controller hides
it with one line in `init()`:

```java
scene.getRoot().lookupAll("#preview").forEach(n -> n.setVisible(false));
```

So Scene Builder shows the mock-up, and the real game shows the live Canvas.

> **You cannot play the game inside Scene Builder.** It is a layout editor: it parses
> the FXML, applies the CSS and lets you drag nodes around. It never starts the
> `AnimationTimer`, never calls the controller, and never runs `draw()`. Play the game
> with `./run.sh` (or double-click `Play Game.command`).

## Editing safely

The Java controller finds each node by `fx:id`, so these names must not change:

| `fx:id` | Type | Used for |
|---|---|---|
| `canvas` | Canvas | game drawing surface |
| `preview` | ImageView | design-time mock-up; must keep this `fx:id` **and** `id` (the controller hides it by id) |
| `scoreLabel`, `levelLabel`, `livesLabel`, `bestLabel` | Label | HUD |
| `overlay` | VBox | shown on menu / pause / level clear / game over |
| `overlayTitle`, `overlaySubtitle`, `overlayPrompt` | Label | menu text |

You can freely change:
- text, fonts, colours, spacing, alignment, padding
- the HUD order (but keep the ids)
- the overlay layout, as long as the three labels keep their ids

⚠️ If you resize the Canvas, also change `W` and `H` at the top of
`GameController.java` — the physics uses those constants. Then re-render
`board-preview.png` at the same aspect ratio, or just delete the `preview` ImageView
(and the `lookupAll("#preview")` line in `init()`) to go back to a blank designer.

## About the `fx:controller` warning

Scene Builder may show a yellow warning that it cannot resolve
`com.example.breakout.GameController`. **That is harmless** — the node tree, `fx:id`s,
CSS and preview all still work, because Scene Builder only needs the class to show your
`@FXML` fields in the Inspector.

The reliable way to get rid of it is to open the FXML from an IDE (IntelliJ IDEA or the
VS Code JavaFX extension) with Scene Builder integration enabled; the IDE then passes
the project classpath automatically. Standalone Scene Builder has no classpath setting
for your project.

## Preview (⌘P)

Preview renders the FXML with the real JavaFX controls and CSS, so you can check
spacing and colours — you will see the HUD, the mock-up board and the overlay. It is a
still image of the design: no game loop, no keyboard, no physics. To play:

```bash
cd "/Users/majdsife/Documents/Default Project/breakout-javafx"
./run.sh
```

## Styling

Styles are in `src/main/resources/com/example/breakout/styles.css` and are linked from
the FXML root (`stylesheets="@styles.css"`). Scene Builder applies them immediately in
the preview, so you can tweak colours visually. Useful classes:

| Style class | Used by |
|---|---|
| `.root-pane` | window background and font |
| `.hud`, `.hud-item`, `.hud-dim` | top bar |
| `.overlay`, `.overlay-title`, `.overlay-subtitle`, `.overlay-prompt` | menu panels |

## Note about the install

Scene Builder lives at `/Applications/SceneBuilder.app` (single copy — the duplicate in
`~/Applications` and the `amd64` dmg in `~/Downloads` were deleted). macOS was refusing
to launch it from a quarantined download location, so it ran from a random read-only
`AppTranslocation/...` folder; copying it into `/Applications` and clearing the
quarantine flag fixed that, and it now starts from its real path.
