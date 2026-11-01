/*
 * Tiny sound engine using the Web Audio API.
 * No audio files needed - every sound is generated from an oscillator.
 */
(function () {
  'use strict';

  Game.Audio = {
    ctx: null,
    muted: false,

    /** Must be called from a user gesture (click / key press) or the browser blocks audio. */
    init() {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        return;
      }
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      this.ctx = new AudioContextClass();
    },

    blip(freq, duration, type, volume) {
      if (this.muted || !this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type || 'square';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(volume || 0.05, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain).connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    },

    toggleMute() {
      this.muted = !this.muted;
      return this.muted;
    }
  };
})();
