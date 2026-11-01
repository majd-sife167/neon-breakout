/*
 * Neon Breakout - main game loop, rules and rendering.
 *
 * States: menu -> ready -> playing -> (level_clear -> ready ...) -> gameover
 * The ball is "stuck" on the paddle while in the ready state.
 */
(function () {
  'use strict';

  const C = Game.CONFIG;
  const U = Game.util;
  const Audio = Game.Audio;

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  const STATE = {
    MENU: 'menu',
    READY: 'ready',
    PLAYING: 'playing',
    PAUSED: 'paused',
    LEVEL_CLEAR: 'level_clear',
    GAME_OVER: 'gameover'
  };

  const input = {
    left: false,
    right: false,
    pointerX: null,
    usePointer: false
  };

  /* ------------------------------------------------------------ Game state */

  const game = {
    state: STATE.MENU,
    score: 0,
    highScore: readHighScore(),
    lives: C.START_LIVES,
    level: 1,
    combo: 0,
    paddle: new Game.Paddle(),
    ball: new Game.Ball(),
    bricks: [],
    particles: [],
    shake: 0,
    clearTimer: 0,
    bonus: 0,
    time: 0
  };

  function readHighScore() {
    try {
      return Number(localStorage.getItem('neon-breakout-high')) || 0;
    } catch (err) {
      return 0; // private mode / file:// restrictions
    }
  }

  function saveHighScore() {
    try {
      localStorage.setItem('neon-breakout-high', String(game.highScore));
    } catch (err) {
      /* not fatal */
    }
  }

  /* ------------------------------------------------------------ Level setup */

  function buildLevel() {
    const B = C.BRICK;
    const rows = Math.min(B.rows + (game.level - 1), 7);
    const cols = B.cols;
    const rowWidth = cols * B.width + (cols - 1) * B.gapX;
    const left = (C.WIDTH - rowWidth) / 2;
    const bricks = [];

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        // From level 3 up, every other brick in the top row takes two hits.
        const tough = game.level >= 3 && row === 0 && col % 2 === 0;
        bricks.push(new Game.Brick(
          left + col * (B.width + B.gapX),
          B.top + row * (B.height + B.gapY),
          B.width,
          B.height,
          tough ? 2 : 1,
          C.COLORS.rows[row % C.COLORS.rows.length]
        ));
      }
    }

    game.bricks = bricks;
  }

  function levelSpeed() {
    return Math.min(C.BALL.speed * (1 + 0.06 * (game.level - 1)), C.BALL.maxSpeed);
  }

  function resetBall() {
    game.ball.reset(game.paddle.centerX(), C.PADDLE.y - game.ball.radius - 8);
    game.ball.speed = levelSpeed();
    game.state = STATE.READY;
  }

  function startGame() {
    Audio.init();
    game.score = 0;
    game.lives = C.START_LIVES;
    game.level = 1;
    game.combo = 0;
    game.particles = [];
    game.shake = 0;
    game.paddle.reset();
    buildLevel();
    resetBall();
    Audio.blip(660, 0.09, 'square', 0.05);
  }

  function nextLevel() {
    game.level += 1;
    game.combo = 0;
    game.particles = [];
    game.paddle.reset();
    buildLevel();
    resetBall();
  }

  function loseLife() {
    game.lives -= 1;
    game.combo = 0;
    game.shake = 0.45;
    Audio.blip(140, 0.3, 'sawtooth', 0.07);

    if (game.lives <= 0) {
      game.state = STATE.GAME_OVER;
      if (game.score > game.highScore) {
        game.highScore = game.score;
        saveHighScore();
      }
    } else {
      game.paddle.reset();
      resetBall();
    }
  }

  function onLevelClear() {
    game.state = STATE.LEVEL_CLEAR;
    game.clearTimer = 1.5;
    game.bonus = C.LEVEL_BONUS * game.level;
    game.score += game.bonus;
    Audio.blip(660, 0.08, 'triangle', 0.05);
    Audio.blip(990, 0.1, 'triangle', 0.05);
    Audio.blip(1320, 0.14, 'triangle', 0.05);
  }

  function launchBall() {
    if (game.state !== STATE.READY) return;
    game.ball.launch();
    game.state = STATE.PLAYING;
    Audio.blip(720, 0.06, 'square', 0.05);
  }

  /* --------------------------------------------------------------- Collision */

  function collideWalls(ball) {
    const r = ball.radius;

    if (ball.x - r < 0) {
      ball.x = r;
      ball.vx = Math.abs(ball.vx);
      Audio.blip(520, 0.03, 'sine', 0.02);
    } else if (ball.x + r > C.WIDTH) {
      ball.x = C.WIDTH - r;
      ball.vx = -Math.abs(ball.vx);
      Audio.blip(520, 0.03, 'sine', 0.02);
    }

    if (ball.y - r < C.HUD_HEIGHT) {
      ball.y = C.HUD_HEIGHT + r;
      ball.vy = Math.abs(ball.vy);
      Audio.blip(560, 0.03, 'sine', 0.02);
    }
  }

  function collidePaddle(ball) {
    const p = game.paddle;
    const r = ball.radius;

    if (ball.vy <= 0) return;
    if (ball.y + r < p.y || ball.y - r > p.y + p.h) return;
    if (ball.x < p.x - r || ball.x > p.x + p.w + r) return;

    // Push the ball onto the paddle surface, then bounce by hit position.
    ball.y = p.y - r - 0.5;

    const offset = U.clamp((ball.x - p.centerX()) / (p.w / 2), -1, 1);
    const angle = offset * (Math.PI / 3); // up to 60 degrees sideways
    ball.speed = Math.min(ball.speed + 4, C.BALL.maxSpeed);
    ball.vx = Math.sin(angle) * ball.speed;
    ball.vy = -Math.cos(angle) * ball.speed;

    game.combo = 0;
    p.glow = 1;
    game.particles.push.apply(game.particles, Game.spawnBurst(ball.x, p.y, C.COLORS.paddle, 4));
    Audio.blip(320, 0.05, 'square', 0.04);
  }

  function collideBricks(ball) {
    const r = ball.radius;

    for (let i = 0; i < game.bricks.length; i += 1) {
      const brick = game.bricks[i];
      if (!brick.alive) continue;

      // Treat the ball as a point against the brick expanded by its radius.
      const ex = brick.x - r;
      const ey = brick.y - r;
      const ew = brick.w + r * 2;
      const eh = brick.h + r * 2;

      if (ball.x <= ex || ball.x >= ex + ew || ball.y <= ey || ball.y >= ey + eh) continue;

      const overlapX = Math.min(ball.x - ex, ex + ew - ball.x);
      const overlapY = Math.min(ball.y - ey, ey + eh - ball.y);

      if (overlapX < overlapY) {
        const fromLeft = ball.x < brick.x + brick.w / 2;
        ball.vx = fromLeft ? -Math.abs(ball.vx) : Math.abs(ball.vx);
        ball.x += fromLeft ? -overlapX : overlapX;
      } else {
        const fromTop = ball.y < brick.y + brick.h / 2;
        ball.vy = fromTop ? -Math.abs(ball.vy) : Math.abs(ball.vy);
        ball.y += fromTop ? -overlapY : overlapY;
      }

      registerBrickHit(brick);
      break; // at most one brick per sub-step
    }
  }

  function registerBrickHit(brick) {
    const destroyed = brick.hit();
    const color = brick.color;

    game.combo += 1;
    game.score += C.POINTS_PER_BRICK * game.level;

    const cx = brick.x + brick.w / 2;
    const cy = brick.y + brick.h / 2;
    game.particles.push.apply(
      game.particles,
      Game.spawnBurst(cx, cy, color, destroyed ? 16 : 6)
    );

    // Rising arpeggio while a rally continues (capped so it never gets shrill).
    Audio.blip(300 + Math.min(game.combo, 12) * 45, 0.05, 'square', 0.045);
    if (destroyed) Audio.blip(900, 0.04, 'triangle', 0.025);

    if (!game.bricks.some(function (b) { return b.alive; })) {
      onLevelClear();
    }
  }

  /* ---------------------------------------------------------------- Update */

  function updatePlaying(dt) {
    game.paddle.update(dt, input);

    const ball = game.ball;
    const travel = ball.speed * dt;
    const steps = Math.max(1, Math.ceil(travel / (ball.radius * 0.8)));
    const stepDt = dt / steps;

    for (let i = 0; i < steps; i += 1) {
      ball.step(stepDt);
      collideWalls(ball);
      collidePaddle(ball);
      collideBricks(ball);

      if (game.state !== STATE.PLAYING) return; // level cleared mid-step
      if (ball.y - ball.radius > C.HEIGHT) {
        loseLife();
        return;
      }
    }
  }

  function updateReady(dt) {
    game.paddle.update(dt, input);
    game.ball.x = game.paddle.centerX();
    game.ball.y = C.PADDLE.y - game.ball.radius - 8;
  }

  function update(dt) {
    game.time += dt;
    if (game.shake > 0) game.shake = Math.max(0, game.shake - dt);

    for (let i = 0; i < game.particles.length; i += 1) game.particles[i].update(dt);
    game.particles = game.particles.filter(function (p) { return !p.dead; });

    for (let i = 0; i < game.bricks.length; i += 1) game.bricks[i].update(dt);

    if (game.state === STATE.PLAYING) {
      updatePlaying(dt);
    } else if (game.state === STATE.READY) {
      updateReady(dt);
    } else if (game.state === STATE.LEVEL_CLEAR) {
      game.clearTimer -= dt;
      if (game.clearTimer <= 0) nextLevel();
    }
  }

  /* ---------------------------------------------------------------- Render */

  function drawBackground() {
    ctx.fillStyle = C.COLORS.bg;
    ctx.fillRect(-20, -20, C.WIDTH + 40, C.HEIGHT + 40);

    const glow = ctx.createRadialGradient(C.WIDTH / 2, C.HUD_HEIGHT, 20, C.WIDTH / 2, C.HEIGHT * 0.6, C.HEIGHT);
    glow.addColorStop(0, 'rgba(76, 201, 240, 0.10)');
    glow.addColorStop(1, 'rgba(76, 201, 240, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, C.WIDTH, C.HEIGHT);

    ctx.strokeStyle = C.COLORS.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= C.WIDTH; x += 48) {
      ctx.moveTo(x + 0.5, C.HUD_HEIGHT);
      ctx.lineTo(x + 0.5, C.HEIGHT);
    }
    for (let y = C.HUD_HEIGHT; y <= C.HEIGHT; y += 48) {
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(C.WIDTH, y + 0.5);
    }
    ctx.stroke();
  }

  function drawBricks() {
    for (let i = 0; i < game.bricks.length; i += 1) {
      if (game.bricks[i].alive) game.bricks[i].draw(ctx);
    }
  }

  function drawParticles() {
    for (let i = 0; i < game.particles.length; i += 1) game.particles[i].draw(ctx);
  }

  function drawHud() {
    ctx.save();
    ctx.fillStyle = 'rgba(5, 9, 20, 0.7)';
    ctx.fillRect(0, 0, C.WIDTH, C.HUD_HEIGHT);
    ctx.strokeStyle = 'rgba(126, 240, 255, 0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, C.HUD_HEIGHT + 0.5);
    ctx.lineTo(C.WIDTH, C.HUD_HEIGHT + 0.5);
    ctx.stroke();

    ctx.textBaseline = 'middle';

    // Score
    ctx.textAlign = 'left';
    ctx.fillStyle = C.COLORS.muted;
    ctx.font = '12px Menlo, Monaco, monospace';
    ctx.fillText('SCORE', 32, 26);
    ctx.fillStyle = C.COLORS.text;
    ctx.font = 'bold 24px Menlo, Monaco, monospace';
    ctx.fillText(String(game.score).padStart(5, '0'), 32, 52);

    // Level
    ctx.textAlign = 'center';
    ctx.fillStyle = C.COLORS.muted;
    ctx.font = '12px Menlo, Monaco, monospace';
    ctx.fillText('LEVEL', C.WIDTH / 2, 26);
    ctx.fillStyle = C.COLORS.paddle;
    ctx.font = 'bold 24px Menlo, Monaco, monospace';
    ctx.fillText(String(game.level), C.WIDTH / 2, 52);

    // Lives
    ctx.textAlign = 'right';
    ctx.fillStyle = C.COLORS.muted;
    ctx.font = '12px Menlo, Monaco, monospace';
    ctx.fillText('LIVES', C.WIDTH - 32, 26);

    for (let i = 0; i < game.lives; i += 1) {
      ctx.beginPath();
      ctx.arc(C.WIDTH - 40 - i * 22, 52, 7, 0, Math.PI * 2);
      ctx.fillStyle = C.COLORS.paddle;
      ctx.fill();
    }

    // High score (small, under the level)
    ctx.textAlign = 'center';
    ctx.fillStyle = C.COLORS.muted;
    ctx.font = '11px Menlo, Monaco, monospace';
    ctx.fillText('BEST ' + String(game.highScore).padStart(5, '0'), C.WIDTH / 2, 68);

    ctx.restore();
  }

  function drawField() {
    ctx.save();
    if (game.shake > 0) {
      const amount = game.shake * 16;
      ctx.translate(U.rand(-amount, amount), U.rand(-amount, amount));
    }

    drawBackground();
    drawBricks();

    if (game.state !== STATE.GAME_OVER) {
      game.paddle.draw(ctx);
      game.ball.draw(ctx);
    }

    drawParticles();
    ctx.restore();
  }

  function drawCenteredPanel(width, height) {
    const x = (C.WIDTH - width) / 2;
    const y = (C.HEIGHT - height) / 2 - 10;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 40;
    U.roundRect(ctx, x, y, width, height, 20);
    ctx.fillStyle = 'rgba(6, 11, 26, 0.88)';
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = 'rgba(126, 240, 255, 0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    return { x: x, y: y, width: width, height: height };
  }

  function drawOverlay() {
    if (game.state === STATE.READY) {
      // Gentle prompt above the ball instead of a full panel.
      const pulse = 0.45 + 0.35 * Math.sin(game.time * 4);
      ctx.save();
      ctx.globalAlpha = pulse;
      ctx.fillStyle = C.COLORS.text;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '600 15px Menlo, Monaco, monospace';
      ctx.fillText('PRESS SPACE TO LAUNCH', C.WIDTH / 2, C.HEIGHT - 78);
      ctx.restore();
      return;
    }

    if (game.state === STATE.PLAYING) return;

    ctx.save();
    ctx.fillStyle = 'rgba(3, 6, 14, 0.55)';
    ctx.fillRect(0, 0, C.WIDTH, C.HEIGHT);
    ctx.restore();

    if (game.state === STATE.MENU) {
      drawCenteredPanel(560, 300);
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.fillStyle = C.COLORS.paddle;
      ctx.font = 'bold 46px "Avenir Next", "Helvetica Neue", sans-serif';
      ctx.shadowColor = C.COLORS.paddle;
      ctx.shadowBlur = 26;
      ctx.fillText('NEON BREAKOUT', C.WIDTH / 2, 250);
      ctx.shadowBlur = 0;

      ctx.fillStyle = C.COLORS.text;
      ctx.font = '15px Menlo, Monaco, monospace';
      ctx.fillText('Break every brick. Do not drop the ball.', C.WIDTH / 2, 300);

      ctx.fillStyle = C.COLORS.muted;
      ctx.font = '13px Menlo, Monaco, monospace';
      ctx.fillText('← →  or  A / D  to move', C.WIDTH / 2, 340);
      ctx.fillText('SPACE to launch  ·  P to pause  ·  M to mute', C.WIDTH / 2, 364);

      const pulse = 0.55 + 0.45 * Math.sin(game.time * 4);
      ctx.globalAlpha = pulse;
      ctx.fillStyle = C.COLORS.paddle;
      ctx.font = 'bold 16px Menlo, Monaco, monospace';
      ctx.fillText('PRESS SPACE OR CLICK TO START', C.WIDTH / 2, 415);
      ctx.restore();
      return;
    }

    if (game.state === STATE.PAUSED) {
      drawCenteredPanel(420, 200);
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = C.COLORS.paddle;
      ctx.font = 'bold 38px "Avenir Next", "Helvetica Neue", sans-serif';
      ctx.fillText('PAUSED', C.WIDTH / 2, 285);
      ctx.fillStyle = C.COLORS.muted;
      ctx.font = '14px Menlo, Monaco, monospace';
      ctx.fillText('Press P to resume', C.WIDTH / 2, 335);
      ctx.restore();
      return;
    }

    if (game.state === STATE.LEVEL_CLEAR) {
      drawCenteredPanel(480, 220);
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 36px "Avenir Next", "Helvetica Neue", sans-serif';
      ctx.fillText('LEVEL ' + game.level + ' CLEAR', C.WIDTH / 2, 285);
      ctx.fillStyle = C.COLORS.text;
      ctx.font = '16px Menlo, Monaco, monospace';
      ctx.fillText('+' + game.bonus + ' BONUS', C.WIDTH / 2, 330);
      ctx.restore();
      return;
    }

    if (game.state === STATE.GAME_OVER) {
      drawCenteredPanel(500, 300);
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.fillStyle = '#ff5c8a';
      ctx.font = 'bold 44px "Avenir Next", "Helvetica Neue", sans-serif';
      ctx.shadowColor = 'rgba(255, 92, 138, 0.6)';
      ctx.shadowBlur = 24;
      ctx.fillText('GAME OVER', C.WIDTH / 2, 245);
      ctx.shadowBlur = 0;

      ctx.fillStyle = C.COLORS.text;
      ctx.font = 'bold 22px Menlo, Monaco, monospace';
      ctx.fillText('SCORE  ' + game.score, C.WIDTH / 2, 305);

      ctx.fillStyle = C.COLORS.muted;
      ctx.font = '14px Menlo, Monaco, monospace';
      const record = game.score > 0 && game.score >= game.highScore;
      ctx.fillText(record ? 'NEW HIGH SCORE!' : 'BEST  ' + game.highScore, C.WIDTH / 2, 340);

      const pulse = 0.55 + 0.45 * Math.sin(game.time * 4);
      ctx.globalAlpha = pulse;
      ctx.fillStyle = C.COLORS.paddle;
      ctx.font = 'bold 15px Menlo, Monaco, monospace';
      ctx.fillText('PRESS R OR CLICK TO PLAY AGAIN', C.WIDTH / 2, 390);
      ctx.restore();
    }
  }

  function render() {
    ctx.clearRect(0, 0, C.WIDTH, C.HEIGHT);
    drawField();
    drawHud();
    drawOverlay();
  }

  /* ------------------------------------------------------------ Main loop */

  let lastTime = performance.now();

  function frame(now) {
    let dt = (now - lastTime) / 1000;
    lastTime = now;
    dt = Math.min(dt, 1 / 30); // avoid huge jumps after tab switches

    update(dt);
    render();
    requestAnimationFrame(frame);
  }

  /* ---------------------------------------------------------------- Input */

  function pointerX(event) {
    const rect = canvas.getBoundingClientRect();
    return (event.clientX - rect.left) * (C.WIDTH / rect.width);
  }

  function handleAction() {
    Audio.init();

    if (game.state === STATE.MENU) {
      startGame();
    } else if (game.state === STATE.READY) {
      launchBall();
    } else if (game.state === STATE.GAME_OVER) {
      startGame();
    } else if (game.state === STATE.PAUSED) {
      game.state = STATE.PLAYING;
    }
  }

  window.addEventListener('keydown', function (event) {
    const key = event.key.toLowerCase();

    if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' '].indexOf(key) !== -1) {
      event.preventDefault();
    }

    if (key === 'arrowleft' || key === 'a') {
      input.left = true;
      input.usePointer = false;
    } else if (key === 'arrowright' || key === 'd') {
      input.right = true;
      input.usePointer = false;
    } else if (key === ' ' || key === 'enter') {
      handleAction();
    } else if (key === 'p' || key === 'escape') {
      if (game.state === STATE.PLAYING) {
        game.state = STATE.PAUSED;
        Audio.blip(300, 0.06, 'sine', 0.04);
      } else if (game.state === STATE.PAUSED) {
        game.state = STATE.PLAYING;
        Audio.blip(500, 0.06, 'sine', 0.04);
      }
    } else if (key === 'm') {
      const muted = Audio.toggleMute();
      if (!muted) Audio.blip(600, 0.06, 'sine', 0.05);
    } else if (key === 'r') {
      if (game.state === STATE.GAME_OVER) startGame();
    }
  });

  window.addEventListener('keyup', function (event) {
    const key = event.key.toLowerCase();
    if (key === 'arrowleft' || key === 'a') input.left = false;
    if (key === 'arrowright' || key === 'd') input.right = false;
  });

  canvas.addEventListener('pointermove', function (event) {
    input.pointerX = pointerX(event);
    input.usePointer = true;
  });

  canvas.addEventListener('pointerdown', function (event) {
    event.preventDefault();
    input.pointerX = pointerX(event);
    input.usePointer = true;
    handleAction();
  });

  // Pause automatically when the window loses focus (nice for demos).
  window.addEventListener('blur', function () {
    if (game.state === STATE.PLAYING) game.state = STATE.PAUSED;
  });

  /* ---------------------------------------------------------------- Start */

  buildLevel();      // draw a board behind the menu
  resetBall();
  game.state = STATE.MENU;
  requestAnimationFrame(frame);
})();
