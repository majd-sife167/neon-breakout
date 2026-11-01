/*
 * Game objects: the ball, bricks and particles.
 * Each class only knows how to update and draw itself - the rules live in main.js.
 */
(function () {
  'use strict';

  const C = Game.CONFIG;
  const U = Game.util;

  /* ---------------------------------------------------------------- Ball */

  Game.Ball = class Ball {
    constructor() {
      this.radius = C.BALL.radius;
      this.speed = C.BALL.speed;
      this.reset(C.WIDTH / 2, C.PADDLE.y - this.radius - 8);
    }

    reset(x, y) {
      this.x = x;
      this.y = y;
      this.vx = 0;
      this.vy = 0;
      this.stuck = true; // sitting on the paddle, waiting to launch
    }

    launch(angle) {
      const a = angle === undefined ? U.rand(-C.BALL.launchSpread, C.BALL.launchSpread) : angle;
      this.stuck = false;
      this.vx = Math.sin(a) * this.speed;
      this.vy = -Math.cos(a) * this.speed;
    }

    step(dt) {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
    }

    draw(ctx) {
      ctx.save();
      ctx.shadowColor = C.COLORS.ball;
      ctx.shadowBlur = 18;
      ctx.fillStyle = C.COLORS.ball;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  };

  /* --------------------------------------------------------------- Brick */

  Game.Brick = class Brick {
    constructor(x, y, w, h, hp, color) {
      this.x = x;
      this.y = y;
      this.w = w;
      this.h = h;
      this.hp = hp;
      this.maxHp = hp;
      this.color = color;
      this.alive = true;
      this.flash = 0;
    }

    /** Returns true when this hit destroyed the brick. */
    hit() {
      this.hp -= 1;
      this.flash = 0.14;
      if (this.hp <= 0) {
        this.alive = false;
        return true;
      }
      return false;
    }

    update(dt) {
      if (this.flash > 0) this.flash = Math.max(0, this.flash - dt);
    }

    draw(ctx) {
      const damaged = this.hp < this.maxHp;

      ctx.save();
      U.roundRect(ctx, this.x, this.y, this.w, this.h, 6);

      ctx.fillStyle = this.color;
      ctx.globalAlpha = damaged ? 0.35 : 0.9;
      ctx.fill();

      // top highlight
      ctx.globalAlpha = damaged ? 0.25 : 0.55;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(this.x + 6, this.y + 4, this.w - 12, 3);

      // outline
      ctx.globalAlpha = 1;
      ctx.strokeStyle = this.color;
      ctx.lineWidth = damaged ? 2 : 1;
      ctx.stroke();

      // white flash when hit
      if (this.flash > 0) {
        ctx.globalAlpha = this.flash / 0.14;
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }
      ctx.restore();
    }
  };

  /* ------------------------------------------------------------- Particle */

  Game.Particle = class Particle {
    constructor(x, y, color) {
      const angle = U.rand(0, Math.PI * 2);
      const speed = U.rand(60, 330);

      this.x = x;
      this.y = y;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.color = color;
      this.size = U.rand(1.5, 3.5);
      this.life = U.rand(0.3, 0.7);
      this.maxLife = this.life;
      this.gravity = 520;
    }

    get dead() {
      return this.life <= 0;
    }

    update(dt) {
      this.life -= dt;
      this.vy += this.gravity * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.vx *= 0.99;
    }

    draw(ctx) {
      ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  };

  /** Create a burst of particles for a brick break. */
  Game.spawnBurst = function (x, y, color, count) {
    const particles = [];
    for (let i = 0; i < count; i += 1) {
      particles.push(new Game.Particle(x, y, color));
    }
    return particles;
  };
})();
