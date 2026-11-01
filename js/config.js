/*
 * Global settings for the game.
 * Everything that a marker might want to tweak lives here.
 */
window.Game = window.Game || {};

Game.CONFIG = {
  WIDTH: 960,
  HEIGHT: 640,
  HUD_HEIGHT: 76,

  PADDLE: { width: 120, height: 14, speed: 640, y: 590 },

  BALL: {
    radius: 8,
    speed: 360,       // starting speed in px / second
    maxSpeed: 700,    // hard cap so rallies stay playable
    launchSpread: 0.5 // max starting angle in radians
  },

  BRICK: {
    cols: 10,
    rows: 5,          // level 1; grows by one row per level, capped in main.js
    width: 84,
    height: 26,
    gapX: 6,
    gapY: 6,
    top: 112
  },

  START_LIVES: 3,
  POINTS_PER_BRICK: 10, // multiplied by the current level
  LEVEL_BONUS: 100,

  COLORS: {
    bg: '#070b18',
    grid: 'rgba(90, 160, 255, 0.06)',
    paddle: '#7ef0ff',
    ball: '#ffffff',
    text: '#dbe7ff',
    muted: '#7d8bb0',
    accent: '#7c5cff',
    rows: ['#ff5c8a', '#ff9f43', '#ffe066', '#4ade80', '#4cc9f0', '#a78bfa', '#f472b6']
  }
};

Game.util = {
  clamp(value, min, max) {
    return value < min ? min : value > max ? max : value;
  },

  rand(min, max) {
    return min + Math.random() * (max - min);
  },

  /** draw a rounded rectangle path (works on older Safari too) */
  roundRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }
};
