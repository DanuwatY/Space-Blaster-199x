// Web Audio API Sound Synthesizer for Space Blaster 199X
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem('space_game_muted') === 'true';
    this.volume = parseFloat(localStorage.getItem('space_game_volume')) || 0.4;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (!this.noiseBuffer && this.ctx) {
      const duration = 0.5;
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('space_game_muted', this.muted);
    return this.muted;
  }

  // Helper for gain node with master volume applied
  createMasterGain() {
    if (!this.ctx || this.muted) return null;
    if (!this.masterGain) {
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.ctx.destination);
    } else {
      this.masterGain.gain.value = this.volume;
    }
    return this.masterGain;
  }

  playShieldHit() {
    this.playShield();
  }

  // Laser shot SFX
  playLaser(level = 1) {
    if (this.muted) return;
    this.init();
    const master = this.createMasterGain();
    if (!master) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const startFreq = 700 + level * 80;
    const endFreq = 120;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.08);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc.connect(gain);
    gain.connect(master);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  // Special weapon SFX
  playSpecial(type) {
    if (this.muted) return;
    this.init();
    const master = this.createMasterGain();
    if (!master) return;

    const now = this.ctx.currentTime;

    if (type === 1) { // Missile
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(800, now + 0.15);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

      osc.connect(gain);
      gain.connect(master);
      osc.start(now);
      osc.stop(now + 0.16);
    } else if (type === 2) { // Plasma Bomb
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);

      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

      osc.connect(gain);
      gain.connect(master);
      osc.start(now);
      osc.stop(now + 0.31);
    } else { // Scatter
      for (let i = 0; i < 3; i++) {
        setTimeout(() => this.playLaser(2), i * 30);
      }
    }
  }

  // Explosion SFX
  playExplosion(big = false) {
    if (this.muted) return;
    this.init();
    const master = this.createMasterGain();
    if (!master || !this.noiseBuffer) return;

    const now = this.ctx.currentTime;
    const duration = big ? 0.45 : 0.2;

    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(big ? 400 : 800, now);
    filter.frequency.exponentialRampToValueAtTime(30, now + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(big ? 0.6 : 0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(master);

    noise.start(now);
    noise.stop(now + duration + 0.01);
  }

  // Power-up SFX
  playPowerup() {
    if (this.muted) return;
    this.init();
    const master = this.createMasterGain();
    if (!master) return;

    const now = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;

      const noteTime = now + idx * 0.05;
      gain.gain.setValueAtTime(0.15, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.01, noteTime + 0.06);

      osc.connect(gain);
      gain.connect(master);
      osc.start(noteTime);
      osc.stop(noteTime + 0.07);
    });
  }

  // Shield hit SFX
  playShield() {
    if (this.muted) return;
    this.init();
    const master = this.createMasterGain();
    if (!master) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.15);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  // Boss Warning Siren SFX
  playBossWarning() {
    if (this.muted) return;
    this.init();
    const master = this.createMasterGain();
    if (!master) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.linearRampToValueAtTime(600, now + 0.2);
    osc.frequency.linearRampToValueAtTime(300, now + 0.4);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

    osc.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + 0.46);
  }

  // Game Over SFX
  playGameOver() {
    if (this.muted) return;
    this.init();
    const master = this.createMasterGain();
    if (!master) return;

    const now = this.ctx.currentTime;
    const notes = [300, 260, 220, 180];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;

      const noteTime = now + idx * 0.12;
      gain.gain.setValueAtTime(0.25, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.01, noteTime + 0.15);

      osc.connect(gain);
      gain.connect(master);
      osc.start(noteTime);
      osc.stop(noteTime + 0.16);
    });
  }
}

window.soundEngine = new SoundEngine();
