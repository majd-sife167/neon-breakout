package com.example.breakout;

import java.util.Random;
import java.util.prefs.Preferences;

import javafx.animation.AnimationTimer;
import javafx.fxml.FXML;
import javafx.scene.Scene;
import javafx.scene.canvas.Canvas;
import javafx.scene.canvas.GraphicsContext;
import javafx.scene.control.Label;
import javafx.scene.input.KeyCode;
import javafx.scene.layout.VBox;
import javafx.scene.paint.Color;
import javafx.scene.text.Font;

/** Gameplay: state machine, physics, collisions and drawing. */
public class GameController {

    private enum State { MENU, READY, PLAYING, PAUSED, LEVEL_CLEAR, GAME_OVER }

    private static final double W = 900, H = 600;
    private static final int COLS = 10, START_ROWS = 5, MAX_ROWS = 7;
    private static final double GAP = 6, LEFT = 40, TOP = 70;
    private static final double BW = (W - LEFT * 2 - (COLS - 1) * GAP) / COLS, BH = 24;
    private static final double PADDLE_W = 120, PADDLE_H = 14, PADDLE_Y = H - 40, BALL_R = 8;
    private static final Color BG = Color.web("#070b18"), GRID = Color.web("#101c33");
    private static final Color PADDLE = Color.web("#7ef0ff");
    private static final Color[] ROWS = {
        Color.web("#ff5c8a"), Color.web("#ff9f43"), Color.web("#ffe066"),
        Color.web("#4ade80"), Color.web("#4cc9f0"), Color.web("#a78bfa"), Color.web("#f472b6")
    };

    @FXML private Canvas canvas;
    @FXML private Label scoreLabel, levelLabel, livesLabel, bestLabel;
    @FXML private VBox overlay;
    @FXML private Label overlayTitle, overlaySubtitle, overlayPrompt;

    private final Preferences prefs = Preferences.userNodeForPackage(GameController.class);
    private final Random random = new Random();
    private final int[][] bricks = new int[MAX_ROWS][COLS];
    private final AnimationTimer loop = new AnimationTimer() {
        @Override public void handle(long now) { tick(now); }
    };

    private GraphicsContext g;
    private State state = State.MENU;
    private double paddleX = W / 2 - PADDLE_W / 2, ballX, ballY, vx, vy, speed, clearDelay;
    private int score, lives = 3, level = 1, rows, high;
    private boolean left, right;
    private long last;

    /** Called by App once the stage is visible. */
    public void init(Scene scene) {
        g = canvas.getGraphicsContext2D();
        high = prefs.getInt("high", 0);
        scene.setOnKeyPressed(e -> pressed(e.getCode()));
        scene.setOnKeyReleased(e -> released(e.getCode()));
        canvas.setOnMouseMoved(e -> paddleX = e.getX() - PADDLE_W / 2);
        newBoard(); resetBall();
        state = State.MENU; updateOverlay();
        scene.getRoot().lookupAll("#preview").forEach(n -> n.setVisible(false));
        loop.start();
    }

    private void pressed(KeyCode code) {
        if (code == KeyCode.LEFT || code == KeyCode.A) left = true;
        else if (code == KeyCode.RIGHT || code == KeyCode.D) right = true;
        else if (code == KeyCode.SPACE || code == KeyCode.ENTER) action();
        else if (code == KeyCode.P || code == KeyCode.ESCAPE) togglePause();
        else if (code == KeyCode.R && state == State.GAME_OVER) startGame();
    }

    private void released(KeyCode code) {
        if (code == KeyCode.LEFT || code == KeyCode.A) left = false;
        if (code == KeyCode.RIGHT || code == KeyCode.D) right = false;
    }

    private void action() {
        switch (state) {
            case MENU, GAME_OVER -> startGame();
            case READY -> { launch(); state = State.PLAYING; updateOverlay(); }
            case PAUSED -> togglePause();
            default -> { }
        }
    }

    private void togglePause() {
        if (state == State.PLAYING) state = State.PAUSED;
        else if (state == State.PAUSED) state = State.PLAYING;
        else return;
        updateOverlay();
    }

    private void startGame() {
        score = 0; lives = 3; level = 1; paddleX = W / 2 - PADDLE_W / 2;
        newBoard(); resetBall();
    }

    private void newBoard() {
        rows = Math.min(START_ROWS + level - 1, MAX_ROWS);
        for (int r = 0; r < MAX_ROWS; r++)
            for (int c = 0; c < COLS; c++)
                bricks[r][c] = r < rows ? 1 : 0;
    }

    private void resetBall() {
        ballX = paddleX + PADDLE_W / 2; ballY = PADDLE_Y - BALL_R;
        vx = 0; vy = 0;
        speed = Math.min(340 + 20 * (level - 1), 560);
        state = State.READY;
        updateOverlay();
    }

    private void launch() {
        double angle = (random.nextDouble() - 0.5) * 0.8;
        vx = Math.sin(angle) * speed;
        vy = -Math.cos(angle) * speed;
    }

    private void loseLife() {
        lives--;
        if (lives <= 0) {
            state = State.GAME_OVER;
            if (score > high) { high = score; prefs.putInt("high", high); }
        } else {
            resetBall();
        }
        updateOverlay();
    }

    private void tick(long now) {
        double dt = last == 0 ? 0 : Math.min((now - last) / 1e9, 0.033);
        last = now;
        if (state == State.PLAYING || state == State.READY) movePaddle(dt);
        if (state == State.PLAYING) update(dt);
        if (state == State.LEVEL_CLEAR && (clearDelay -= dt) <= 0) {
            level++;
            paddleX = W / 2 - PADDLE_W / 2;
            newBoard();
            resetBall();
        }
        draw();
        scoreLabel.setText(String.format("SCORE %05d", score));
        levelLabel.setText("LEVEL " + level);
        livesLabel.setText("LIVES " + lives);
        bestLabel.setText(String.format("BEST %05d", high));
    }

    private void movePaddle(double dt) {
        paddleX = clamp(paddleX + ((left ? -1 : 0) + (right ? 1 : 0)) * 620 * dt, 0, W - PADDLE_W);
        if (state == State.READY) {
            ballX = paddleX + PADDLE_W / 2;
            ballY = PADDLE_Y - BALL_R;
        }
    }

    private void update(double dt) {
        int steps = Math.max(1, (int) Math.ceil(speed * dt / (BALL_R * 0.8)));
        for (int i = 0; i < steps; i++) {
            ballX += vx * dt / steps;
            ballY += vy * dt / steps;
            bounceWalls();
            bouncePaddle();
            hitBricks();
            if (state != State.PLAYING) return;
            if (ballY - BALL_R > H) { loseLife(); return; }
        }
    }

    private void bounceWalls() {
        if (ballX - BALL_R < 0) { ballX = BALL_R; vx = Math.abs(vx); }
        if (ballX + BALL_R > W) { ballX = W - BALL_R; vx = -Math.abs(vx); }
        if (ballY - BALL_R < 0) { ballY = BALL_R; vy = Math.abs(vy); }
    }

    private void bouncePaddle() {
        if (vy <= 0 || ballY + BALL_R < PADDLE_Y || ballY - BALL_R > PADDLE_Y + PADDLE_H) return;
        if (ballX < paddleX - BALL_R || ballX > paddleX + PADDLE_W + BALL_R) return;
        ballY = PADDLE_Y - BALL_R;
        double offset = clamp((ballX - paddleX - PADDLE_W / 2) / (PADDLE_W / 2), -1, 1);
        double angle = offset * Math.PI / 3;
        speed = Math.min(speed + 4, 620);
        vx = Math.sin(angle) * speed;
        vy = -Math.cos(angle) * speed;
    }

    private void hitBricks() {
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < COLS; c++) {
                if (bricks[r][c] == 0) continue;
                double x = LEFT + c * (BW + GAP), y = TOP + r * (BH + GAP);
                if (ballX < x - BALL_R || ballX > x + BW + BALL_R
                        || ballY < y - BALL_R || ballY > y + BH + BALL_R) continue;

                double ox = Math.min(ballX - (x - BALL_R), (x + BW + BALL_R) - ballX);
                double oy = Math.min(ballY - (y - BALL_R), (y + BH + BALL_R) - ballY);
                if (ox < oy) {
                    boolean west = ballX < x + BW / 2;
                    vx = west ? -Math.abs(vx) : Math.abs(vx);
                    ballX += west ? -ox : ox;
                } else {
                    boolean north = ballY < y + BH / 2;
                    vy = north ? -Math.abs(vy) : Math.abs(vy);
                    ballY += north ? -oy : oy;
                }

                bricks[r][c] = 0;
                score += 10 * level;
                if (isCleared()) {
                    score += 100 * level;
                    state = State.LEVEL_CLEAR;
                    clearDelay = 1.2;
                    updateOverlay();
                }
                return;
            }
        }
    }

    private boolean isCleared() {
        for (int r = 0; r < rows; r++)
            for (int c = 0; c < COLS; c++)
                if (bricks[r][c] > 0) return false;
        return true;
    }

    private void draw() {
        g.setFill(BG);
        g.fillRect(0, 0, W, H);
        g.setStroke(GRID);
        g.setLineWidth(1);
        for (double x = 0; x <= W; x += 45) g.strokeLine(x, 0, x, H);
        for (double y = 0; y <= H; y += 45) g.strokeLine(0, y, W, y);
        for (int r = 0; r < rows; r++)
            for (int c = 0; c < COLS; c++)
                if (bricks[r][c] > 0) {
                    g.setFill(ROWS[r % ROWS.length]);
                    g.fillRoundRect(LEFT + c * (BW + GAP), TOP + r * (BH + GAP), BW, BH, 6, 6);
                }
        g.setFill(PADDLE);
        g.fillRoundRect(paddleX, PADDLE_Y, PADDLE_W, PADDLE_H, 7, 7);
        g.setFill(Color.WHITE);
        g.fillOval(ballX - BALL_R, ballY - BALL_R, BALL_R * 2, BALL_R * 2);

        if (state == State.READY) {
            g.setFill(Color.web("#dbe7ff"));
            g.setFont(Font.font("Menlo", 14));
            g.fillText("PRESS SPACE TO LAUNCH", W / 2 - 82, H - 60);
        }
    }

    private void updateOverlay() {
        overlay.setVisible(state != State.PLAYING && state != State.READY);
        switch (state) {
            case MENU -> setOverlayText("NEON BREAKOUT",
                    "Break every brick. Do not drop the ball.", "PRESS SPACE OR ENTER TO START");
            case PAUSED -> setOverlayText("PAUSED", "Take your time.", "PRESS P TO RESUME");
            case LEVEL_CLEAR -> setOverlayText("LEVEL " + level + " CLEAR",
                    "+" + (100 * level) + " BONUS", "GET READY...");
            case GAME_OVER -> setOverlayText("GAME OVER",
                    "Score " + score + "   Best " + high, "PRESS R TO PLAY AGAIN");
        }
    }

    private void setOverlayText(String title, String subtitle, String prompt) {
        overlayTitle.setText(title);
        overlaySubtitle.setText(subtitle);
        overlayPrompt.setText(prompt);
    }

    private static double clamp(double v, double min, double max) {
        return v < min ? min : v > max ? max : v;
    }
}
