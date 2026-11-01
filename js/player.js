/*
 * The player's paddle.
 * Supports keyboard (left/right, A/D) and mouse/touch steering.
 */
(function () {
  'use strict';

  const C = Game.CONFIG;
  const U = Game.util;

  Game.Paddle = class Paddle {
    constructor() {
      this.w = C.PADDLE.width;
      this.h = C.PADDLE.height;
      this.y = C.PADDLE.y;
      this.speed = C.PADDLE.speed;
      this.x = C.WIDTH / 2 - this.w / 2;
      this.vx = 0;
      this.glow = 0;
    }

    reset() {
      this.x = C.WIDTH / 2 - this.w / 2;
      this.vx = 0;
      this.glow = 0;
    }

    centerX() {
      return this.x + this.w / 2;
    }

    update(dt, input) {
      let direction = 0;
      if (input.left) direction -= 1;
      if (input.right) direction += 1;

      if (input.usePointer && input.pointerX !== null) {
        const target = input.pointerX - this.w / 2;
        this.x += (target - this.x) * Math.min(1, dt * 24);
        this.vx = 0;
      } else {
        this.vx = direction * this.speed;
        this.x += this.vx * dt;
      }

      this.x = U.clamp(this.x, 0, C.WIDTH - this.w);
      if (this.glow > 0) this.glow = Math.max(0, this.glow - dt * 3);
    }

    draw(ctx) {
      ctx.save();
      ctx.shadowColor = C.COLORS.paddle;
      ctx.shadowBlur = 16 + this.glow * 20;

      const gradient = ctx.createLinearGradient(this.x, 0, this.x + this.w, 0);
      gradient.addColorStop(0, '#3ba9ff');
      gradient.addColorStop(0.5, '#7ef0ff');
      gradient.addColorStop(1, '#3ba9ff');

      U.roundRect(ctx, this.x, this.y, this.w, this.h, this.h / 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.restore();
    }
  };
})();
