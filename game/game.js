// Space Blaster 199X - Main Game Engine (1P & 2P Co-Op Enabled)
(function () {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  // HUD Elements - Player 1
  const scoreDisplay = document.getElementById('scoreDisplay');
  const livesDisplay = document.getElementById('livesDisplay');
  const shieldDisplay = document.getElementById('shieldDisplay');
  const weaponDisplay = document.getElementById('weaponDisplay');
  const specialDisplay = document.getElementById('specialDisplay');

  // HUD Elements - Center & General
  const waveDisplay = document.getElementById('waveDisplay');
  const highScoreDisplay = document.getElementById('highScoreDisplay');
  const pauseBtn = document.getElementById('pauseBtn');
  const soundBtn = document.getElementById('soundBtn');
  const controlsHint = document.getElementById('controlsHint');

  // HUD Elements - Player 2
  const p1HudGroup = document.getElementById('p1HudGroup');
  const p2HudGroup = document.getElementById('p2HudGroup');
  const p2ScoreDisplay = document.getElementById('p2ScoreDisplay');
  const p2LivesDisplay = document.getElementById('p2LivesDisplay');
  const p2ShieldDisplay = document.getElementById('p2ShieldDisplay');
  const p2WeaponDisplay = document.getElementById('p2WeaponDisplay');
  const p2SpecialDisplay = document.getElementById('p2SpecialDisplay');

  // Modals & Buttons
  const modeSelectScreen = document.getElementById('modeSelectScreen');
  const gameoverScreen = document.getElementById('gameoverScreen');
  const finalScoreSpan = document.getElementById('finalScore');
  const p2FinalScoreBox = document.getElementById('p2FinalScoreBox');
  const p2FinalScoreSpan = document.getElementById('p2FinalScore');
  const highscoreNotice = document.getElementById('highscoreNotice');
  const btnPlayer1 = document.getElementById('btnPlayer1');
  const btnPlayer2 = document.getElementById('btnPlayer2');
  const pauseScreen = document.getElementById('pauseScreen');
  const resumeBtn = document.getElementById('resumeBtn');
  const restartGameBtn = document.getElementById('restartGameBtn');
  const mainMenuBtn = document.getElementById('mainMenuBtn');
  const shipSelectScreen = document.getElementById('shipSelectScreen');
  const playerTabGroup = document.getElementById('playerTabGroup');
  const tabP1 = document.getElementById('tabP1');
  const tabP2 = document.getElementById('tabP2');
  const pSelectNotice = document.getElementById('pSelectNotice');
  const shipBackBtn = document.getElementById('shipBackBtn');
  const startGameBtn = document.getElementById('startGameBtn');
  let currentTargetPlayer = 1; // 1 or 2

  // Canvas Constants
  const W = 960, H = 720;
  canvas.width = W;
  canvas.height = H;

  // Game States
  let playerCount = 1; // 1 or 2
  let p1ShipType = 0; // 0: Cyber Interceptor, 1: Plasma Striker, 2: Void Phantom
  let p2ShipType = 1; // 0: Cyber Interceptor, 1: Plasma Striker, 2: Void Phantom
  let score = 0;
  let wave = 1;
  let lives = 3;
  let running = false;
  let paused = false;
  let mode = 'medium';

  // Player 2 Game States
  let p2Score = 0;
  let p2Lives = 3;

  let highScores = {
    easy: parseInt(localStorage.getItem('space_game_hs_easy')) || 0,
    medium: parseInt(localStorage.getItem('space_game_hs_medium')) || 0,
    hard: parseInt(localStorage.getItem('space_game_hs_hard')) || 0,
    goodnight: parseInt(localStorage.getItem('space_game_hs_goodnight')) || 0
  };

  // Weapon State - Player 1
  let weaponLevel = 1;
  let specialWeapon = 0; // 0: None, 1: Missile, 2: Bomb, 3: Scatter
  let specialAmmo = 0;
  let specialTimer = 0;

  // Weapon State - Player 2
  let p2WeaponLevel = 1;
  let p2SpecialWeapon = 0;
  let p2SpecialAmmo = 0;
  let p2SpecialTimer = 0;

  const SPECIAL_NAMES = ['', 'MISSILE', 'BOMB', 'SCATTER'];
  const SPECIAL_COLORS = ['', '#ff6600', '#ffaa00', '#ff0055'];

  // Difficulty Configurations (Wave Cooldown set to 180 frames = 3 seconds)
  const DIFFICULTY = {
    easy:      { lives: 5, enemySpeedMul: 0.7, hpMul: 1.00, countMul: 1.00, enemyHpAdd: 0, shootRateMul: 0.5, cooldown: 180, bossHpMul: 0.7, desc: 'EASY: มอนและเลือดปกติ (เริ่มต้น 5 ชีวิต)' },
    medium:    { lives: 3, enemySpeedMul: 1.0, hpMul: 1.08, countMul: 1.08, enemyHpAdd: 0, shootRateMul: 1.0, cooldown: 180, bossHpMul: 1.0, desc: 'MEDIUM: เลือดมอนและจำนวนมอน +8%' },
    hard:      { lives: 2, enemySpeedMul: 1.3, hpMul: 1.16, countMul: 1.16, enemyHpAdd: 1, shootRateMul: 1.5, cooldown: 180, bossHpMul: 1.3, desc: 'HARD: เลือดมอนและจำนวนมอน +16% (เริ่มต้น 2 ชีวิต)' },
    goodnight: { lives: 3, enemySpeedMul: 1.0, hpMul: 1.50, countMul: 1.50, enemyHpAdd: 0, shootRateMul: 0.8, cooldown: 180, bossHpMul: 1.2, desc: 'GOODNIGHT: เลือดมอนและจำนวนมอน +50% (บอสเกิดทีละหลายตัว)' }
  };

  // Inputs
  const keys = {};
  const touchState = { dx: 0, dy: 0, fire: false, special: false };

  // FX & Shake
  let screenShakeTimer = 0;
  let screenShakeIntensity = 0;

  function triggerShake(intensity = 10, duration = 15) {
    screenShakeIntensity = intensity;
    screenShakeTimer = duration;
  }

  // Multi-layer Starfield
  let stars = [];
  for (let i = 0; i < 180; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      speed: 0.4 + Math.random() * 1.6,
      size: 0.5 + Math.random() * 1.8,
      brightness: 0.2 + Math.random() * 0.8,
      layer: Math.random() < 0.3 ? 2 : 1
    });
  }

  // Player 1 Ship Object
  const player = {
    x: W / 2 - 40,
    y: H - 70,
    w: 30,
    h: 38,
    speed: 5.5,
    shootTimer: 0,
    shootDelay: 10,
    invincible: 0,
    shield: 0,
    thrusterTimer: 0,
    active: true
  };

  // Player 2 Ship Object
  const player2 = {
    x: W / 2 + 40,
    y: H - 70,
    w: 30,
    h: 38,
    speed: 5.5,
    shootTimer: 0,
    shootDelay: 10,
    invincible: 0,
    shield: 0,
    thrusterTimer: 0,
    active: false
  };

  // Game Entities Arrays
  let bullets = [];
  let enemies = [];
  let enemyBullets = [];
  let particles = [];
  let powerups = [];
  let floatingTexts = [];

  // Boss & Wave State
  let bosses = [];
  let bossActive = false;
  let bossWarning = 0;
  let bossProjectiles = [];
  let bossDefeatedCount = 0;
  let bossAnimTimer = 0;

  let waveEnemyCount = 0;
  let waveSpawned = 0;
  let waveCooldown = 0;
  let waveState = 'cooldown';
  let waveSpawnTimer = 0;

  // Enemy Configurations (5 Distinct Monster Types)
  const ENEMY_CONFIGS = {
    basic:   { w:26, h:26, hp:1,   speed:1.0, color:'#ff6633', points:10, pattern:'sine',    shootRate:0.002 }, // Basic Scout
    fast:    { w:20, h:20, hp:1,   speed:2.2, color:'#ff00ff', points:20, pattern:'zigzag',  shootRate:0.003 }, // Speeder
    tank:    { w:38, h:38, hp:5,   speed:0.6, color:'#ffcc00', points:40, pattern:'straight',shootRate:0.010 }, // Heavy Tank
    shooter: { w:28, h:28, hp:2.5, speed:0.8, color:'#00ffcc', points:35, pattern:'hover',   shootRate:0.015 }, // Bio-Drone Shooter
    sniper:  { w:24, h:32, hp:3.0, speed:1.2, color:'#9900ff', points:45, pattern:'hover',   shootRate:0.018 }  // Laser Sniper
  };

  function getEnemyTypesForWave() {
    if (wave === 1) return ['basic'];
    if (wave === 2) return ['fast'];
    if (wave === 3) return ['tank'];
    if (wave === 4) return ['shooter'];
    if (wave === 5) return ['sniper'];
    return ['basic', 'fast', 'tank', 'shooter', 'sniper'];
  }

  // 7 Unique Boss Definitions
  const BOSS_DEFS = [
    {
      name: 'INVADER-ALPHA',
      primaryColor: '#b026ff', innerColor: '#d67bff', coreColor: '#ff00ff',
      bulletColor: '#ff0055',
      hpBase: 35, hpScale: 12,
      speed: 1.5, targetY: 65, shootDelay: 32,
      desc: 'ยานแม่เอเลี่ยนบุกสเปซ!'
    },
    {
      name: 'GUARDIAN-AEGIS',
      primaryColor: '#0088ff', innerColor: '#55bbff', coreColor: '#00ffff',
      bulletColor: '#00f0ff',
      hpBase: 50, hpScale: 15,
      speed: 1.2, targetY: 75, shootDelay: 38,
      desc: 'ป้อมปราการโล่ผู้พิทักษ์!'
    },
    {
      name: 'PHANTOM-STRIKER',
      primaryColor: '#ff0055', innerColor: '#ff6699', coreColor: '#ffb3cc',
      bulletColor: '#ff6600',
      hpBase: 65, hpScale: 18,
      speed: 2.5, targetY: 60, shootDelay: 24,
      desc: 'เงามรณะวาร์ประยะสั้น!'
    },
    {
      name: 'OVERLORD-PRIME',
      primaryColor: '#ffb700', innerColor: '#ffe066', coreColor: '#ffffff',
      bulletColor: '#ffffff',
      hpBase: 85, hpScale: 25,
      speed: 1.6, targetY: 55, shootDelay: 28,
      desc: 'จอมทัพมงกุฎจักรวาล!'
    },
    {
      name: 'NEBULA-LEVIATHAN',
      primaryColor: '#00ff99', innerColor: '#66ffcc', coreColor: '#ffffff',
      bulletColor: '#00ff99',
      hpBase: 100, hpScale: 28,
      speed: 1.8, targetY: 65, shootDelay: 26,
      desc: 'มังกรสเปซมังกรพลาสม่า!'
    },
    {
      name: 'SOLAR-HYPERION',
      primaryColor: '#ff4400', innerColor: '#ff9900', coreColor: '#ffffaa',
      bulletColor: '#ff5500',
      hpBase: 120, hpScale: 32,
      speed: 1.1, targetY: 70, shootDelay: 30,
      desc: 'หัวใจดาวฤกษ์ความร้อนสูง!'
    },
    {
      name: 'VOID-CHRONOS',
      primaryColor: '#7700ff', innerColor: '#bb66ff', coreColor: '#ffffff',
      bulletColor: '#aa00ff',
      hpBase: 140, hpScale: 36,
      speed: 2.0, targetY: 58, shootDelay: 22,
      desc: 'จักรกลหลุมดำห้วงมิติ!'
    }
  ];

  function spawnBoss() {
    bosses = [];
    const count = mode === 'goodnight' ? 2 : 1; // 2 Bosses at a time in Goodnight mode (+50% HP) for optimal performance
    const coopHpMul = playerCount === 2 ? 1.65 : 1.0; // +65% Boss HP in 2P Co-Op mode for balance

    for (let i = 0; i < count; i++) {
      const bossX = count > 1 ? (W / (count + 1)) * (i + 1) : W / 2;
      const offset = bossDefeatedCount + i;
      const def = BOSS_DEFS[offset % BOSS_DEFS.length];
      const d = DIFFICULTY[mode];
      const hp = Math.max(1, Math.round((def.hpBase + def.hpScale * offset) * d.bossHpMul * d.hpMul * coopHpMul));
      bosses.push({
        x: bossX, y: -90 - i * 50,
        w: 90, h: 70,
        hp, maxHp: hp,
        speed: (def.speed + offset * 0.1) * (count > 1 ? 0.75 : 1.0),
        dir: i % 2 === 0 ? 1 : -1,
        targetY: def.targetY + (count > 1 ? (i % 2) * 25 : 0),
        shootTimer: Math.floor(Math.random() * def.shootDelay),
        shootDelay: Math.max(10, def.shootDelay - offset * 2),
        entered: false,
        points: 250 * (1 + offset),
        def,
        type: offset % BOSS_DEFS.length,
        patternTimer: Math.floor(Math.random() * 100),
        teleportTimer: Math.floor(Math.random() * 100),
        moveDirY: 1,
        minY: def.targetY,
        maxY: Math.min(H * 0.4, H / 2 - 30),
        verticalSpeed: (def.speed + offset * 0.08) * 0.4
      });
    }
    bossActive = true;
    bossWarning = 0;
  }

  function getActiveTargetPlayer() {
    if (playerCount === 2) {
      if (player.active && player2.active) {
        return Math.random() < 0.5 ? player : player2;
      }
      return player.active ? player : player2;
    }
    return player;
  }

  function spawnEnemy() {
    const types = getEnemyTypesForWave();
    const typeName = types[Math.floor(Math.random() * types.length)];
    const cfg = ENEMY_CONFIGS[typeName];
    const d = DIFFICULTY[mode];

    const speedMul = (1 + (wave - 1) * 0.05) * d.enemySpeedMul;
    const coopEnemyHpMul = playerCount === 2 ? 1.5 : 1.0; // +50% Monster HP in 2P Co-Op mode
    const baseHp = cfg.hp + Math.floor(wave / 3) + d.enemyHpAdd;
    const finalHp = Math.max(1, Math.round(baseHp * d.hpMul * coopEnemyHpMul));
    const shield = (playerCount === 2 && Math.random() < 0.30) ? 1 : 0; // 30% chance for Cyber Energy Shield in 2P Co-Op

    // Base shoot rate
    let enemyShootRate = cfg.shootRate > 0 ? (cfg.shootRate + wave * 0.002) * d.shootRateMul : 0;

    // AFTER 1ST BOSS (bossDefeatedCount >= 1): Randomly ~35% of passive monsters (basic & fast) gain attack ability!
    if (bossDefeatedCount >= 1 && (typeName === 'basic' || typeName === 'fast')) {
      if (Math.random() < 0.35) {
        enemyShootRate = (0.008 + wave * 0.001) * d.shootRateMul;
      }
    }

    const e = {
      x: 30 + Math.random() * (W - 60),
      y: -35,
      w: cfg.w, h: cfg.h,
      hp: finalHp,
      maxHp: finalHp,
      shield: shield,
      speed: cfg.speed * speedMul,
      color: cfg.color,
      points: cfg.points,
      pattern: cfg.pattern,
      typeName: typeName,
      shootRate: enemyShootRate,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.03 + Math.random() * 0.04,
      wobbleAmp: 0.5 + Math.random() * 0.5,
      zigTimer: 0,
      zigDir: Math.random() < 0.5 ? 1 : -1,
      hoverTargetY: 80 + Math.random() * 140,
      hoverReached: false,
      spawnX: 30 + Math.random() * (W - 60),
      shootTimer: 0
    };
    enemies.push(e);
  }

  // Shooting Logic - Player 1
  function shootP1() {
    if (!player.active) return;
    window.soundEngine.playLaser(weaponLevel);
    switch (weaponLevel) {
      case 5:
        bullets.push({ owner: 1, x: player.x, y: player.y - player.h/2, w: 6, h: 16, speed: 10, vx: 0, color: '#ffea00' });
        bullets.push({ owner: 1, x: player.x - 12, y: player.y - player.h/2, w: 4, h: 14, speed: 9.5, vx: -1.5, color: '#ffea00' });
        bullets.push({ owner: 1, x: player.x + 12, y: player.y - player.h/2, w: 4, h: 14, speed: 9.5, vx: 1.5, color: '#ffea00' });
        bullets.push({ owner: 1, x: player.x - 22, y: player.y - player.h/2, w: 4, h: 12, speed: 9, vx: -2.8, color: '#ff9900' });
        bullets.push({ owner: 1, x: player.x + 22, y: player.y - player.h/2, w: 4, h: 12, speed: 9, vx: 2.8, color: '#ff9900' });
        break;
      case 4:
        bullets.push({ owner: 1, x: player.x, y: player.y - player.h/2, w: 5, h: 14, speed: 9, vx: 0, color: '#00ff66' });
        bullets.push({ owner: 1, x: player.x - 10, y: player.y - player.h/2, w: 4, h: 13, speed: 8.8, vx: -1.4, color: '#00ff66' });
        bullets.push({ owner: 1, x: player.x + 10, y: player.y - player.h/2, w: 4, h: 13, speed: 8.8, vx: 1.4, color: '#00ff66' });
        bullets.push({ owner: 1, x: player.x - 18, y: player.y - player.h/2, w: 4, h: 12, speed: 8.5, vx: -2.4, color: '#00ffaa' });
        bullets.push({ owner: 1, x: player.x + 18, y: player.y - player.h/2, w: 4, h: 12, speed: 8.5, vx: 2.4, color: '#00ffaa' });
        break;
      case 3:
        bullets.push({ owner: 1, x: player.x, y: player.y - player.h/2, w: 5, h: 14, speed: 9, vx: 0, color: '#00f0ff' });
        bullets.push({ owner: 1, x: player.x - 9, y: player.y - player.h/2, w: 4, h: 13, speed: 8.5, vx: -1.2, color: '#00f0ff' });
        bullets.push({ owner: 1, x: player.x + 9, y: player.y - player.h/2, w: 4, h: 13, speed: 8.5, vx: 1.2, color: '#00f0ff' });
        break;
      case 2:
        bullets.push({ owner: 1, x: player.x - 7, y: player.y - player.h/2, w: 4, h: 13, speed: 8.5, vx: -0.8, color: '#00ff66' });
        bullets.push({ owner: 1, x: player.x + 7, y: player.y - player.h/2, w: 4, h: 13, speed: 8.5, vx: 0.8, color: '#00ff66' });
        break;
      default:
        bullets.push({ owner: 1, x: player.x, y: player.y - player.h/2, w: 4, h: 13, speed: 8.5, vx: 0, color: '#00ff66' });
    }
  }

  // Shooting Logic - Player 2
  function shootP2() {
    if (!player2.active) return;
    window.soundEngine.playLaser(p2WeaponLevel);
    switch (p2WeaponLevel) {
      case 5:
        bullets.push({ owner: 2, x: player2.x, y: player2.y - player2.h/2, w: 6, h: 16, speed: 10, vx: 0, color: '#ffffff' });
        bullets.push({ owner: 2, x: player2.x - 12, y: player2.y - player2.h/2, w: 4, h: 14, speed: 9.5, vx: -1.5, color: '#ffaa00' });
        bullets.push({ owner: 2, x: player2.x + 12, y: player2.y - player2.h/2, w: 4, h: 14, speed: 9.5, vx: 1.5, color: '#ffaa00' });
        bullets.push({ owner: 2, x: player2.x - 22, y: player2.y - player2.h/2, w: 4, h: 12, speed: 9, vx: -2.8, color: '#ff0055' });
        bullets.push({ owner: 2, x: player2.x + 22, y: player2.y - player2.h/2, w: 4, h: 12, speed: 9, vx: 2.8, color: '#ff0055' });
        break;
      case 4:
        bullets.push({ owner: 2, x: player2.x, y: player2.y - player2.h/2, w: 5, h: 14, speed: 9, vx: 0, color: '#ff0055' });
        bullets.push({ owner: 2, x: player2.x - 10, y: player2.y - player2.h/2, w: 4, h: 13, speed: 8.8, vx: -1.4, color: '#ff0055' });
        bullets.push({ owner: 2, x: player2.x + 10, y: player2.y - player2.h/2, w: 4, h: 13, speed: 8.8, vx: 1.4, color: '#ff0055' });
        bullets.push({ owner: 2, x: player2.x - 18, y: player2.y - player2.h/2, w: 4, h: 12, speed: 8.5, vx: -2.4, color: '#ffaa00' });
        bullets.push({ owner: 2, x: player2.x + 18, y: player2.y - player2.h/2, w: 4, h: 12, speed: 8.5, vx: 2.4, color: '#ffaa00' });
        break;
      case 3:
        bullets.push({ owner: 2, x: player2.x, y: player2.y - player2.h/2, w: 5, h: 14, speed: 9, vx: 0, color: '#ffaa00' });
        bullets.push({ owner: 2, x: player2.x - 9, y: player2.y - player2.h/2, w: 4, h: 13, speed: 8.5, vx: -1.2, color: '#ffaa00' });
        bullets.push({ owner: 2, x: player2.x + 9, y: player2.y - player2.h/2, w: 4, h: 13, speed: 8.5, vx: 1.2, color: '#ffaa00' });
        break;
      case 2:
        bullets.push({ owner: 2, x: player2.x - 7, y: player2.y - player2.h/2, w: 4, h: 13, speed: 8.5, vx: -0.8, color: '#ff0055' });
        bullets.push({ owner: 2, x: player2.x + 7, y: player2.y - player2.h/2, w: 4, h: 13, speed: 8.5, vx: 0.8, color: '#ff0055' });
        break;
      default:
        bullets.push({ owner: 2, x: player2.x, y: player2.y - player2.h/2, w: 4, h: 13, speed: 8.5, vx: 0, color: '#ff0055' });
    }
  }

  // Special Weapons
  function fireSpecialP1() {
    if (!player.active || specialWeapon <= 0 || specialAmmo <= 0) return;
    window.soundEngine.playSpecial(specialWeapon);
    specialAmmo--;

    switch (specialWeapon) {
      case 1: // Missile
        let target = null, minDist = Infinity;
        for (const e of enemies) {
          const d = Math.hypot(e.x - player.x, e.y - player.y);
          if (d < minDist) { minDist = d; target = e; }
        }
        if (bossActive && bosses.length > 0) {
          for (const b of bosses) {
            const d = Math.hypot(b.x - player.x, b.y - player.y);
            if (d < minDist) { minDist = d; target = b; }
          }
        }
        const angle = target ? Math.atan2(target.y - player.y, target.x - player.x) : -Math.PI/2;
        bullets.push({ owner: 1, x: player.x, y: player.y - player.h/2, w: 8, h: 8, speed: 6, vx: Math.cos(angle)*6, vy: Math.sin(angle)*6, color: '#ff6600', homing: true, homingTimer: 110 });
        break;
      case 2: // Bomb
        bullets.push({ owner: 1, x: player.x, y: player.y - player.h/2, w: 14, h: 14, speed: 5, vx: 0, color: '#ffaa00', bomb: true, pierce: true });
        break;
      case 3: // Scatter
        for (let i = -3; i <= 3; i++) {
          bullets.push({ owner: 1, x: player.x, y: player.y - player.h/2, w: 4, h: 10, speed: 8 - Math.abs(i), vx: i * 1.8, color: '#ff0055' });
        }
        break;
    }

    if (specialAmmo <= 0) {
      specialWeapon = 0;
      specialAmmo = 0;
    }
    updateUI();
  }

  function fireSpecialP2() {
    if (!player2.active || p2SpecialWeapon <= 0 || p2SpecialAmmo <= 0) return;
    window.soundEngine.playSpecial(p2SpecialWeapon);
    p2SpecialAmmo--;

    switch (p2SpecialWeapon) {
      case 1: // Missile
        let target = null, minDist = Infinity;
        for (const e of enemies) {
          const d = Math.hypot(e.x - player2.x, e.y - player2.y);
          if (d < minDist) { minDist = d; target = e; }
        }
        if (bossActive && bosses.length > 0) {
          for (const b of bosses) {
            const d = Math.hypot(b.x - player2.x, b.y - player2.y);
            if (d < minDist) { minDist = d; target = b; }
          }
        }
        const angle = target ? Math.atan2(target.y - player2.y, target.x - player2.x) : -Math.PI/2;
        bullets.push({ owner: 2, x: player2.x, y: player2.y - player2.h/2, w: 8, h: 8, speed: 6, vx: Math.cos(angle)*6, vy: Math.sin(angle)*6, color: '#ffaa00', homing: true, homingTimer: 110 });
        break;
      case 2: // Bomb
        bullets.push({ owner: 2, x: player2.x, y: player2.y - player2.h/2, w: 14, h: 14, speed: 5, vx: 0, color: '#ff0055', bomb: true, pierce: true });
        break;
      case 3: // Scatter
        for (let i = -3; i <= 3; i++) {
          bullets.push({ owner: 2, x: player2.x, y: player2.y - player2.h/2, w: 4, h: 10, speed: 8 - Math.abs(i), vx: i * 1.8, color: '#ffaa00' });
        }
        break;
    }

    if (p2SpecialAmmo <= 0) {
      p2SpecialWeapon = 0;
      p2SpecialAmmo = 0;
    }
    updateUI();
  }

  // Particle Effects
  function addExplosion(x, y, color, count = 15, big = false) {
    window.soundEngine.playExplosion(big);
    if (big) triggerShake(12, 18);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = (0.8 + Math.random() * (big ? 4.5 : 3.0));
      particles.push({
        x, y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: 20 + Math.random() * (big ? 35 : 20),
        maxLife: 55,
        size: 1.5 + Math.random() * (big ? 6 : 3.5),
        color
      });
    }
  }

  function addFloatingText(x, y, text, color = '#00f0ff') {
    floatingTexts.push({
      x, y, text, color,
      life: 45, maxLife: 45, vy: -1
    });
  }

  function spawnPowerup(x, y) {
    const types = ['shield', 'life', 'weapon', 'special'];
    const rand = Math.random();
    let type = 'shield';
    if (rand < 0.3) type = 'shield';
    else if (rand < 0.55) type = 'special';
    else if (rand < 0.8) type = 'weapon';
    else type = 'life';

    powerups.push({
      x, y,
      w: 20, h: 20,
      speed: 1.4,
      type,
      bobTimer: Math.random() * Math.PI * 2
    });
  }

  function togglePause() {
    if (!running) return;
    paused = !paused;
    if (paused) {
      if (pauseScreen) pauseScreen.classList.remove('hidden');
    } else {
      if (pauseScreen) pauseScreen.classList.add('hidden');
    }
  }

  function resumeGame() {
    if (running && paused) {
      paused = false;
      if (pauseScreen) pauseScreen.classList.add('hidden');
    }
  }

  function restartCurrentGame() {
    if (pauseScreen) pauseScreen.classList.add('hidden');
    if (gameoverScreen) gameoverScreen.classList.add('hidden');
    resetGame();
    running = true;
    paused = false;
  }

  function returnToMainMenu() {
    if (pauseScreen) pauseScreen.classList.add('hidden');
    if (gameoverScreen) gameoverScreen.classList.add('hidden');
    if (modeSelectScreen) modeSelectScreen.classList.remove('hidden');
    running = false;
    paused = false;
  }

  function toggleSound() {
    const muted = window.soundEngine.toggleMute();
    soundBtn.textContent = muted ? '[ 🔇 MUTE ]' : '[ 🔊 SOUND ]';
  }

  function updateUI() {
    // Player 1 HUD
    scoreDisplay.textContent = score;
    livesDisplay.textContent = lives;
    weaponDisplay.textContent = 'LV.' + weaponLevel;

    if (player.shield > 0) {
      shieldDisplay.textContent = 'ACTIVE';
      shieldDisplay.className = 'badge shield-on';
    } else {
      shieldDisplay.textContent = 'OFF';
      shieldDisplay.className = 'badge shield-off';
    }

    if (specialWeapon > 0 && specialAmmo > 0) {
      specialDisplay.textContent = `${SPECIAL_NAMES[specialWeapon]} x${specialAmmo}`;
      specialDisplay.style.display = 'inline-block';
      specialDisplay.className = 'badge';
      specialDisplay.style.borderColor = SPECIAL_COLORS[specialWeapon];
      specialDisplay.style.color = SPECIAL_COLORS[specialWeapon];
    } else {
      specialDisplay.style.display = 'none';
    }

    // Player 2 HUD
    if (playerCount === 2) {
      p2HudGroup.style.display = 'flex';
      p2ScoreDisplay.textContent = p2Score;
      p2LivesDisplay.textContent = p2Lives;
      p2WeaponDisplay.textContent = 'LV.' + p2WeaponLevel;

      if (player2.shield > 0) {
        p2ShieldDisplay.textContent = 'ACTIVE';
        p2ShieldDisplay.className = 'badge shield-on';
      } else {
        p2ShieldDisplay.textContent = 'OFF';
        p2ShieldDisplay.className = 'badge shield-off';
      }

      if (p2SpecialWeapon > 0 && p2SpecialAmmo > 0) {
        p2SpecialDisplay.textContent = `${SPECIAL_NAMES[p2SpecialWeapon]} x${p2SpecialAmmo}`;
        p2SpecialDisplay.style.display = 'inline-block';
        p2SpecialDisplay.className = 'badge';
        p2SpecialDisplay.style.borderColor = SPECIAL_COLORS[p2SpecialWeapon];
        p2SpecialDisplay.style.color = SPECIAL_COLORS[p2SpecialWeapon];
      } else {
        p2SpecialDisplay.style.display = 'none';
      }
    } else {
      p2HudGroup.style.display = 'none';
    }

    // General HUD
    waveDisplay.textContent = wave;
    highScoreDisplay.textContent = highScores[mode];

    // Controls Hint
    if (controlsHint) {
      if (playerCount === 2) {
        controlsHint.textContent = 'P1: [ WASD ] + [ Q/E ]  |  P2: [ ⬆⬇⬅➡ ] + [ SPACE/ENTER ]  |  [ P ] หยุด  |  [ M ] เสียง';
      } else {
        controlsHint.textContent = '[ WASD / ⬆⬇⬅➡ ] เคลื่อนที่  |  [ AUTO-FIRE ]  |  [ SPACE ] อาวุธพิเศษ  |  [ P ] หยุดเกม  |  [ M ] ปิด/เปิดเสียง';
      }
    }
  }

  function resetGame() {
    const d = DIFFICULTY[mode];
    score = 0; wave = 1; lives = d.lives;
    player.x = playerCount === 2 ? W / 2 - 50 : W / 2;
    player.y = H - 70;
    player.invincible = 0; player.shootTimer = 0; player.shield = 0;
    player.active = true;
    weaponLevel = 1; specialWeapon = 0; specialAmmo = 0; specialTimer = 0;

    if (playerCount === 2) {
      p2Score = 0; p2Lives = d.lives;
      player2.x = W / 2 + 50;
      player2.y = H - 70;
      player2.invincible = 0; player2.shootTimer = 0; player2.shield = 0;
      player2.active = true;
      p2WeaponLevel = 1; p2SpecialWeapon = 0; p2SpecialAmmo = 0; p2SpecialTimer = 0;
      p2FinalScoreBox.style.display = 'flex';
    } else {
      player2.active = false;
      p2FinalScoreBox.style.display = 'none';
    }

    bullets = []; enemies = []; particles = [];
    enemyBullets = []; bossProjectiles = [];
    powerups = []; floatingTexts = [];

    waveEnemyCount = 0; waveSpawned = 0; waveCooldown = d.cooldown;
    waveState = 'cooldown'; waveSpawnTimer = 0;

    bosses = []; bossActive = false; bossWarning = 0;
    bossDefeatedCount = 0; bossAnimTimer = 0;

    paused = false;

    gameoverScreen.classList.add('hidden');
    modeSelectScreen.classList.add('hidden');
    updateUI();
  }

  function gameOver() {
    running = false;
    paused = false;
    window.soundEngine.playGameOver();

    const maxTeamScore = Math.max(score, p2Score);
    if (maxTeamScore > highScores[mode]) {
      highScores[mode] = maxTeamScore;
      localStorage.setItem('space_game_hs_' + mode, maxTeamScore);
      highscoreNotice.textContent = '🎉 NEW HIGH SCORE RECORD!';
      highscoreNotice.style.display = 'block';
    } else {
      highscoreNotice.style.display = 'none';
    }

    finalScoreSpan.textContent = score;
    p2FinalScoreSpan.textContent = p2Score;
    gameoverScreen.classList.remove('hidden');
  }

  // =====================================================================
  //  UPDATE LOOP
  // =====================================================================
  function update() {
    if (!running || paused) return;

    // Safety Array Bounds to prevent Memory Bloat & Freezing
    if (particles.length > 200) particles.splice(0, particles.length - 200);
    if (bullets.length > 120) bullets.splice(0, bullets.length - 120);
    if (enemyBullets.length > 120) enemyBullets.splice(0, enemyBullets.length - 120);
    if (bossProjectiles.length > 120) bossProjectiles.splice(0, bossProjectiles.length - 120);
    if (floatingTexts.length > 40) floatingTexts.splice(0, floatingTexts.length - 40);

    if (screenShakeTimer > 0) screenShakeTimer--;

    // Stars movement
    for (const s of stars) {
      s.y += s.speed * (bossActive ? 1.5 : 1.0);
      if (s.y > H) { s.y = -2; s.x = Math.random() * W; }
    }

    // ===== Player 1 Controls & Movement =====
    if (player.active) {
      let moveX1 = 0, moveY1 = 0;
      if (keys['a'] || keys['A'] || keys['KeyA']) moveX1 -= 1;
      if (keys['d'] || keys['D'] || keys['KeyD']) moveX1 += 1;
      if (keys['w'] || keys['W'] || keys['KeyW']) moveY1 -= 1;
      if (keys['s'] || keys['S'] || keys['KeyS']) moveY1 += 1;

      if (playerCount === 1) {
        if (keys['ArrowLeft']) moveX1 -= 1;
        if (keys['ArrowRight']) moveX1 += 1;
        if (keys['ArrowUp']) moveY1 -= 1;
        if (keys['ArrowDown']) moveY1 += 1;
        if (touchState.dx !== 0 || touchState.dy !== 0) {
          moveX1 = touchState.dx;
          moveY1 = touchState.dy;
        }
      }

      player.x += moveX1 * player.speed;
      player.y += moveY1 * player.speed;
      player.x = Math.max(player.w/2, Math.min(W - player.w/2, player.x));
      player.y = Math.max(player.h/2, Math.min(H - player.h/2, player.y));

      if (player.invincible > 0) player.invincible--;

      player.thrusterTimer++;
      if (player.thrusterTimer % 2 === 0) {
        particles.push({
          x: player.x + (Math.random() - 0.5) * 8,
          y: player.y + player.h/2 + 2,
          vx: (Math.random() - 0.5) * 0.8,
          vy: 2 + Math.random() * 2,
          life: 12, maxLife: 12,
          size: 2 + Math.random() * 2,
          color: Math.random() < 0.5 ? '#00f0ff' : '#ff0055'
        });
      }

      if (player.shootTimer > 0) player.shootTimer--;
      if (player.shootTimer === 0) {
        shootP1();
        player.shootTimer = player.shootDelay;
      }

      if ((keys['q'] || keys['Q'] || keys['e'] || keys['E'] || (playerCount === 1 && (keys[' '] || touchState.special))) && specialWeapon > 0 && specialTimer <= 0) {
        fireSpecialP1();
        specialTimer = 22;
      }
      if (specialTimer > 0) specialTimer--;
    }

    // ===== Player 2 Controls & Movement =====
    if (playerCount === 2 && player2.active) {
      let moveX2 = 0, moveY2 = 0;
      if (keys['ArrowLeft']) moveX2 -= 1;
      if (keys['ArrowRight']) moveX2 += 1;
      if (keys['ArrowUp']) moveY2 -= 1;
      if (keys['ArrowDown']) moveY2 += 1;

      player2.x += moveX2 * player2.speed;
      player2.y += moveY2 * player2.speed;
      player2.x = Math.max(player2.w/2, Math.min(W - player2.w/2, player2.x));
      player2.y = Math.max(player2.h/2, Math.min(H - player2.h/2, player2.y));

      if (player2.invincible > 0) player2.invincible--;

      player2.thrusterTimer++;
      if (player2.thrusterTimer % 2 === 0) {
        particles.push({
          x: player2.x + (Math.random() - 0.5) * 8,
          y: player2.y + player2.h/2 + 2,
          vx: (Math.random() - 0.5) * 0.8,
          vy: 2 + Math.random() * 2,
          life: 12, maxLife: 12,
          size: 2 + Math.random() * 2,
          color: Math.random() < 0.5 ? '#ffaa00' : '#ff0055'
        });
      }

      if (player2.shootTimer > 0) player2.shootTimer--;
      if (player2.shootTimer === 0) {
        shootP2();
        player2.shootTimer = player2.shootDelay;
      }

      if ((keys[' '] || keys['Enter']) && p2SpecialWeapon > 0 && p2SpecialTimer <= 0) {
        fireSpecialP2();
        p2SpecialTimer = 22;
      }
      if (p2SpecialTimer > 0) p2SpecialTimer--;
    }

    // Siren
    if (bossWarning > 0) {
      bossWarning--;
      if (bossWarning % 30 === 0) window.soundEngine.playBossWarning();
      if (bossWarning === 0) spawnBoss();
    }

    // Boss AI
    if (bossActive && bosses.length > 0) {
      bossAnimTimer++;
      for (let i = bosses.length - 1; i >= 0; i--) {
        const boss = bosses[i];
        const def = boss.def;
        const targetPlayer = getActiveTargetPlayer();

        if (!boss.entered) {
          boss.y += 1.8;
          if (boss.y >= boss.targetY) { boss.y = boss.targetY; boss.entered = true; }
        } else {
          boss.patternTimer++;

          switch (boss.type) {
            case 0: // INVADER
              boss.x += boss.speed * boss.dir;
              if (boss.x > W - boss.w/2 - 30) boss.dir = -1;
              if (boss.x < boss.w/2 + 30) boss.dir = 1;
              boss.shootTimer++;
              if (boss.shootTimer >= boss.shootDelay) {
                boss.shootTimer = 0;
                const angle = Math.atan2(targetPlayer.y - boss.y, targetPlayer.x - boss.x);
                bossProjectiles.push({ x: boss.x, y: boss.y + boss.h/2, vx: Math.cos(angle)*3, vy: Math.sin(angle)*3, size: 7, life: 220, color: def.bulletColor });
              }
              break;
            case 1: // GUARDIAN
              boss.x += boss.speed * 0.6 * boss.dir;
              if (boss.x > W - boss.w/2 - 40) boss.dir = -1;
              if (boss.x < boss.w/2 + 40) boss.dir = 1;
              boss.shootTimer++;
              if (boss.shootTimer >= boss.shootDelay + 12) {
                boss.shootTimer = 0;
                const count = 8;
                for (let k = 0; k < count; k++) {
                  const a = (Math.PI * 2 / count) * k + boss.patternTimer * 0.03;
                  bossProjectiles.push({ x: boss.x, y: boss.y, vx: Math.cos(a)*2.2, vy: Math.sin(a)*2.2, size: 6, life: 160, color: def.bulletColor });
                }
              }
              break;
            case 2: // PHANTOM
              boss.shootTimer++;
              if (boss.shootTimer >= boss.shootDelay) {
                boss.shootTimer = 0;
                for (let k = -2; k <= 2; k++) {
                  const a = Math.atan2(targetPlayer.y - boss.y, targetPlayer.x - boss.x) + k * 0.35;
                  bossProjectiles.push({ x: boss.x, y: boss.y + boss.h/2, vx: Math.cos(a)*2.8, vy: Math.sin(a)*2.8, size: 6, life: 180, color: def.bulletColor });
                }
              }
              boss.teleportTimer++;
              if (boss.teleportTimer > 140) {
                boss.teleportTimer = 0;
                addExplosion(boss.x, boss.y, '#ff0055', 18);
                boss.x = 80 + Math.random() * (W - 160);
                boss.y = boss.targetY + (Math.random() - 0.5) * 30;
                addExplosion(boss.x, boss.y, '#00f0ff', 18);
              }
              break;
            case 3: // OVERLORD
              boss.x += boss.speed * 0.9 * boss.dir;
              if (boss.x > W - boss.w/2 - 20) boss.dir = -1;
              if (boss.x < boss.w/2 + 20) boss.dir = 1;
              boss.shootTimer++;
              if (boss.shootTimer >= boss.shootDelay) {
                boss.shootTimer = 0;
                const count = 10;
                for (let k = 0; k < count; k++) {
                  const a = (Math.PI * 2 / count) * k + boss.patternTimer * 0.02;
                  bossProjectiles.push({ x: boss.x, y: boss.y, vx: Math.cos(a)*2.0, vy: Math.sin(a)*2.0, size: 6, life: 150, color: def.bulletColor });
                }
                const angle = Math.atan2(targetPlayer.y - boss.y, targetPlayer.x - boss.x);
                bossProjectiles.push({ x: boss.x, y: boss.y + boss.h/2, vx: Math.cos(angle)*3.5, vy: Math.sin(angle)*3.5, size: 8, life: 200, color: '#ffffff' });
              }
              break;
            case 4: // NEBULA-LEVIATHAN
              boss.x += Math.sin(boss.patternTimer * 0.04) * 2.8 * boss.dir;
              if (boss.x > W - boss.w/2 - 20) boss.dir = -1;
              if (boss.x < boss.w/2 + 20) boss.dir = 1;
              boss.shootTimer++;
              if (boss.shootTimer >= boss.shootDelay + 4) {
                boss.shootTimer = 0;
                const angle = Math.atan2(targetPlayer.y - boss.y, targetPlayer.x - boss.x);
                bossProjectiles.push({ x: boss.x, y: boss.y + boss.h/2, vx: Math.cos(angle)*2.2, vy: Math.sin(angle)*2.2, size: 9, life: 240, color: def.bulletColor, homing: true });
                bossProjectiles.push({ x: boss.x - 20, y: boss.y + boss.h/2, vx: Math.cos(angle - 0.35)*2.5, vy: Math.sin(angle - 0.35)*2.5, size: 6, life: 180, color: '#00ff99' });
                bossProjectiles.push({ x: boss.x + 20, y: boss.y + boss.h/2, vx: Math.cos(angle + 0.35)*2.5, vy: Math.sin(angle + 0.35)*2.5, size: 6, life: 180, color: '#00ff99' });
              }
              break;
            case 5: // SOLAR-HYPERION
              boss.x += boss.speed * 0.5 * boss.dir;
              if (boss.x > W - boss.w/2 - 50) boss.dir = -1;
              if (boss.x < boss.w/2 + 50) boss.dir = 1;
              boss.shootTimer++;
              if (boss.shootTimer >= boss.shootDelay + 8) {
                boss.shootTimer = 0;
                const count = 12;
                for (let k = 0; k < count; k++) {
                  const a = (Math.PI * 2 / count) * k + boss.patternTimer * 0.04;
                  bossProjectiles.push({ x: boss.x, y: boss.y, vx: Math.cos(a)*2.4, vy: Math.sin(a)*2.4, size: 7, life: 170, color: def.bulletColor });
                }
                const angle = Math.atan2(targetPlayer.y - boss.y, targetPlayer.x - boss.x);
                bossProjectiles.push({ x: boss.x, y: boss.y + boss.h/2, vx: Math.cos(angle)*4.2, vy: Math.sin(angle)*4.2, size: 8, life: 200, color: '#ffffff' });
              }
              break;
            case 6: // VOID-CHRONOS
              boss.x += boss.speed * 1.1 * boss.dir;
              if (boss.x > W - boss.w/2 - 20) boss.dir = -1;
              if (boss.x < boss.w/2 + 20) boss.dir = 1;
              boss.shootTimer++;
              if (boss.shootTimer >= boss.shootDelay - 3) {
                boss.shootTimer = 0;
                const a = boss.patternTimer * 0.15;
                bossProjectiles.push({ x: boss.x, y: boss.y, vx: Math.cos(a)*3.0, vy: Math.sin(a)*3.0, size: 6, life: 190, color: def.bulletColor });
                bossProjectiles.push({ x: boss.x, y: boss.y, vx: Math.cos(a + Math.PI)*3.0, vy: Math.sin(a + Math.PI)*3.0, size: 6, life: 190, color: def.bulletColor });
                if (boss.patternTimer % 50 === 0) {
                  const angle = Math.atan2(targetPlayer.y - boss.y, targetPlayer.x - boss.x);
                  for (let k = -1; k <= 1; k++) {
                    bossProjectiles.push({ x: boss.x, y: boss.y + boss.h/2, vx: Math.cos(angle + k * 0.2)*3.5, vy: Math.sin(angle + k * 0.2)*3.5, size: 7, life: 210, color: '#aa00ff' });
                  }
                }
              }
              break;
          }
        }

        boss.y += boss.verticalSpeed * boss.moveDirY;
        if (boss.y > boss.maxY) boss.moveDirY = -1;
        if (boss.y < boss.minY) boss.moveDirY = 1;
      }
    }

    // Boss Projectiles Update vs P1 & P2
    for (let i = bossProjectiles.length - 1; i >= 0; i--) {
      const bp = bossProjectiles[i];
      if (bp.homing) {
        const targetPlayer = getActiveTargetPlayer();
        if (targetPlayer && targetPlayer.active) {
          const a = Math.atan2(targetPlayer.y - bp.y, targetPlayer.x - bp.x);
          bp.vx += (Math.cos(a) * 2.5 - bp.vx) * 0.05;
          bp.vy += (Math.sin(a) * 2.5 - bp.vy) * 0.05;
        }
      }
      bp.x += bp.vx; bp.y += bp.vy;
      bp.life--;
      if (bp.life <= 0 || bp.x < -30 || bp.x > W + 30 || bp.y > H + 30 || bp.y < -30) {
        bossProjectiles.splice(i, 1);
        continue;
      }

      // Check vs P1
      if (player.active && player.invincible === 0 && Math.hypot(player.x - bp.x, player.y - bp.y) < player.w/2 + bp.size/2) {
        if (player.shield > 0) {
          player.shield = 0; player.invincible = 60;
          window.soundEngine.playShield();
          addExplosion(player.x, player.y, '#00f0ff', 25, true);
        } else {
          lives--; player.invincible = 90;
          addExplosion(bp.x, bp.y, '#ff0055', 20, true);
          if (lives <= 0) { player.active = false; }
          if (!player.active && (!player2.active || p2Lives <= 0)) { gameOver(); return; }
        }
        bossProjectiles.splice(i, 1);
        updateUI();
        continue;
      }

      // Check vs P2
      if (playerCount === 2 && player2.active && player2.invincible === 0 && Math.hypot(player2.x - bp.x, player2.y - bp.y) < player2.w/2 + bp.size/2) {
        if (player2.shield > 0) {
          player2.shield = 0; player2.invincible = 60;
          window.soundEngine.playShield();
          addExplosion(player2.x, player2.y, '#ffaa00', 25, true);
        } else {
          p2Lives--; player2.invincible = 90;
          addExplosion(bp.x, bp.y, '#ff0055', 20, true);
          if (p2Lives <= 0) { player2.active = false; }
          if (!player2.active && (!player.active || lives <= 0)) { gameOver(); return; }
        }
        bossProjectiles.splice(i, 1);
        updateUI();
      }
    }

    // Player Bullets Update
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      if (!b.homing) {
        b.y -= b.speed;
      }
      b.x += b.vx || 0;

      if (b.homing) {
        b.homingTimer--;
        if (b.homingTimer <= 0) { bullets.splice(i, 1); continue; }
        let target = null, minDist = Infinity;
        for (const e of enemies) {
          const d = Math.hypot(e.x - b.x, e.y - b.y);
          if (d < minDist) { minDist = d; target = e; }
        }
        if (bossActive && bosses.length > 0) {
          for (const bo of bosses) {
            const d = Math.hypot(bo.x - b.x, bo.y - b.y);
            if (d < minDist) { minDist = d; target = bo; }
          }
        }
        if (target) {
          const a = Math.atan2(target.y - b.y, target.x - b.x);
          b.vx += (Math.cos(a) * 6 - b.vx) * 0.15;
          b.vy = (b.vy || 0) + (Math.sin(a) * 6 - (b.vy || 0)) * 0.15;
        } else {
          b.vy = b.vy || -6;
        }
        b.y += b.vy;
      }

      if (b.y + b.h < 0 || b.y > H + 30 || b.x < -30 || b.x > W + 30) {
        bullets.splice(i, 1);
        continue;
      }

      let hit = false;

      // Bullet vs Boss
      if (bossActive && bosses.length > 0) {
        for (let j = bosses.length - 1; j >= 0; j--) {
          const bo = bosses[j];
          if (Math.abs(b.x - bo.x) < bo.w/2 + b.w/2 && Math.abs(b.y - bo.y) < bo.h/2 + b.h/2) {
            bo.hp--;
            addExplosion(b.x, b.y, '#ffea00', 5);
            hit = true;
            if (bo.hp <= 0) {
              if (b.owner === 2) {
                p2Score += bo.points;
                addFloatingText(bo.x, bo.y, `+${bo.points}`, '#ffaa00');
              } else {
                score += bo.points;
                addFloatingText(bo.x, bo.y, `+${bo.points}`, '#00f0ff');
              }

              addExplosion(bo.x, bo.y, '#ff0055', 60, true);
              addExplosion(bo.x, bo.y, '#ffea00', 40, true);
              bossDefeatedCount++;

              if (b.owner === 2) {
                p2WeaponLevel = Math.min(p2WeaponLevel + 1, 5);
                p2SpecialWeapon = 1 + Math.floor(Math.random() * 3);
                p2SpecialAmmo = 6;
              } else {
                weaponLevel = Math.min(weaponLevel + 1, 5);
                specialWeapon = 1 + Math.floor(Math.random() * 3);
                specialAmmo = 6;
              }

              bosses.splice(j, 1);

              if (bosses.length === 0) {
                wave++;
                waveState = 'cooldown';
                waveCooldown = DIFFICULTY[mode].cooldown;
                bossActive = false;
                enemies = [];
                bossProjectiles = [];
              }
              updateUI();
            }
            break;
          }
        }
        if (hit) {
          if (!b.pierce) bullets.splice(i, 1);
          continue;
        }
      }

      // Bullet vs Enemy
      for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j];
        if (Math.abs(b.x - e.x) < e.w/2 + b.w/2 && Math.abs(b.y - e.y) < e.h/2 + b.h/2) {
          if (e.shield > 0) {
            e.shield--;
            addExplosion(b.x, b.y, '#00ffff', 10);
            window.soundEngine.playShieldHit();
          } else {
            e.hp--;
          }
          hit = true;
          if (b.bomb) {
            addExplosion(b.x, b.y, '#ffaa00', 35, true);
            for (let k = enemies.length - 1; k >= 0; k--) {
              const o = enemies[k];
              if (k === j || Math.hypot(o.x - e.x, o.y - e.y) < 80) {
                if (k !== j) o.hp--;
                if (o.hp <= 0) {
                  if (b.owner === 2) {
                    p2Score += o.points;
                    addFloatingText(o.x, o.y, `+${o.points}`, '#ffaa00');
                  } else {
                    score += o.points;
                    addFloatingText(o.x, o.y, `+${o.points}`, '#00f0ff');
                  }
                  addExplosion(o.x, o.y, o.color, 16);
                  if (Math.random() < 0.12) spawnPowerup(o.x, o.y);
                  enemies.splice(k, 1);
                  if (k < j) j--;
                }
              }
            }
            bullets.splice(i, 1);
            updateUI();
            break;
          }
          addExplosion(b.x, b.y, b.color || '#00ff66', 4);
          if (e.hp <= 0) {
            if (b.owner === 2) {
              p2Score += e.points;
              addFloatingText(e.x, e.y, `+${e.points}`, '#ffaa00');
            } else {
              score += e.points;
              addFloatingText(e.x, e.y, `+${e.points}`, '#00f0ff');
            }
            addExplosion(e.x, e.y, e.color, 18);
            if (Math.random() < 0.12) spawnPowerup(e.x, e.y);
            enemies.splice(j, 1);
            updateUI();
          }
          if (!b.pierce) { bullets.splice(i, 1); break; }
        }
      }
    }

    // Wave Spawning System
    if (!bossActive && bossWarning === 0) {
      const d = DIFFICULTY[mode];
      if (waveState === 'cooldown') {
        waveCooldown--;
        if (waveCooldown <= 0) {
          if (mode === 'goodnight' || (wave % 3 === 0 && bossDefeatedCount < Math.floor(wave / 3))) {
            waveState = 'boss';
            bossWarning = 120;
          } else {
            waveState = 'spawning';
            const coopCountMul = playerCount === 2 ? 1.35 : 1.0;
            const baseCount = 16 + Math.floor(Math.random() * 8);
            waveEnemyCount = Math.max(1, Math.round(baseCount * d.countMul * coopCountMul));
            waveSpawned = 0; waveSpawnTimer = 0;
          }
        }
      } else if (waveState === 'spawning') {
        if (waveSpawned < waveEnemyCount) {
          waveSpawnTimer++;
          if (waveSpawnTimer >= 35) {
            waveSpawnTimer = 0;
            spawnEnemy();
            waveSpawned++;
          }
        } else {
          waveState = 'waiting';
        }
      } else if (waveState === 'waiting') {
        if (enemies.length === 0) {
          wave++;
          waveState = 'cooldown';
          waveCooldown = d.cooldown;
          updateUI();
        }
      }
    }

    // Enemy movement & firing
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      switch (e.pattern) {
        case 'sine':
          e.wobble += e.wobbleSpeed;
          e.x = e.spawnX + Math.sin(e.wobble) * 40 * e.wobbleAmp;
          e.y += e.speed;
          break;
        case 'zigzag':
          e.x += e.speed * 1.6 * e.zigDir;
          e.zigTimer++;
          if (e.zigTimer > 28) { e.zigTimer = 0; e.zigDir *= -1; }
          e.y += e.speed * 0.8;
          break;
        case 'hover':
          if (!e.hoverReached) {
            e.y += e.speed;
            if (e.y >= e.hoverTargetY) e.hoverReached = true;
          } else {
            e.x += Math.sin(e.wobble) * 0.6;
            e.wobble += 0.04;
            e.y += e.speed * 0.2;
          }
          break;
        default:
          e.y += e.speed;
      }
      e.x = Math.max(e.w/2, Math.min(W - e.w/2, e.x));

      if (e.y - e.h/2 > H + 40) { enemies.splice(i, 1); continue; }

      // Enemy Shoot
      if (e.shootTimer <= 0 && Math.random() < e.shootRate) {
        const targetPlayer = getActiveTargetPlayer();
        const a = Math.atan2(targetPlayer.y - e.y, targetPlayer.x - e.x);
        enemyBullets.push({ x: e.x, y: e.y + e.h/2, vx: Math.cos(a)*2.0, vy: Math.sin(a)*2.0, size: 5, life: 140, color: '#ff6600' });
        e.shootTimer = 45;
      }
      if (e.shootTimer > 0) e.shootTimer--;

      // Enemy vs P1 collision
      if (player.active && player.invincible === 0 && Math.hypot(player.x - e.x, player.y - e.y) < player.w/2 + e.w/2) {
        if (player.shield > 0) {
          player.shield = 0; player.invincible = 60;
          window.soundEngine.playShield();
          addExplosion(player.x, player.y, '#00f0ff', 25, true);
        } else {
          lives--; player.invincible = 90;
          addExplosion(e.x, e.y, '#ff0055', 20, true);
          if (lives <= 0) { player.active = false; }
          if (!player.active && (!player2.active || p2Lives <= 0)) { gameOver(); return; }
        }
        enemies.splice(i, 1);
        updateUI();
        continue;
      }

      // Enemy vs P2 collision
      if (playerCount === 2 && player2.active && player2.invincible === 0 && Math.hypot(player2.x - e.x, player2.y - e.y) < player2.w/2 + e.w/2) {
        if (player2.shield > 0) {
          player2.shield = 0; player2.invincible = 60;
          window.soundEngine.playShield();
          addExplosion(player2.x, player2.y, '#ffaa00', 25, true);
        } else {
          p2Lives--; player2.invincible = 90;
          addExplosion(e.x, e.y, '#ff0055', 20, true);
          if (p2Lives <= 0) { player2.active = false; }
          if (!player2.active && (!player.active || lives <= 0)) { gameOver(); return; }
        }
        enemies.splice(i, 1);
        updateUI();
      }
    }

    // Enemy Bullets Update vs P1 & P2
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
      const eb = enemyBullets[i];
      eb.x += eb.vx; eb.y += eb.vy;
      eb.life--;
      if (eb.life <= 0 || eb.x < -20 || eb.x > W + 20 || eb.y > H + 20 || eb.y < -20) {
        enemyBullets.splice(i, 1); continue;
      }

      if (player.active && player.invincible === 0 && Math.hypot(player.x - eb.x, player.y - eb.y) < player.w/2 + eb.size/2) {
        if (player.shield > 0) {
          player.shield = 0; player.invincible = 60;
          window.soundEngine.playShield();
          addExplosion(player.x, player.y, '#00f0ff', 25, true);
        } else {
          lives--; player.invincible = 90;
          addExplosion(eb.x, eb.y, '#ff6600', 12, true);
          if (lives <= 0) { player.active = false; }
          if (!player.active && (!player2.active || p2Lives <= 0)) { gameOver(); return; }
        }
        enemyBullets.splice(i, 1);
        updateUI();
        continue;
      }

      if (playerCount === 2 && player2.active && player2.invincible === 0 && Math.hypot(player2.x - eb.x, player2.y - eb.y) < player2.w/2 + eb.size/2) {
        if (player2.shield > 0) {
          player2.shield = 0; player2.invincible = 60;
          window.soundEngine.playShield();
          addExplosion(player2.x, player2.y, '#ffaa00', 25, true);
        } else {
          p2Lives--; player2.invincible = 90;
          addExplosion(eb.x, eb.y, '#ff6600', 12, true);
          if (p2Lives <= 0) { player2.active = false; }
          if (!player2.active && (!player.active || lives <= 0)) { gameOver(); return; }
        }
        enemyBullets.splice(i, 1);
        updateUI();
      }
    }

    // Powerups Update
    for (let i = powerups.length - 1; i >= 0; i--) {
      const p = powerups[i];
      p.y += p.speed;
      p.bobTimer += 0.05;
      if (p.y > H + 30) { powerups.splice(i, 1); continue; }

      // Check vs P1
      if (player.active && Math.hypot(player.x - p.x, player.y - p.y) < player.w/2 + p.w/2) {
        window.soundEngine.playPowerup();
        if (p.type === 'life') {
          if (playerCount === 2 && !player2.active) {
            player2.active = true; p2Lives = 1; player2.invincible = 90;
            player2.x = W/2 + 40; player2.y = H - 70;
            addFloatingText(p.x, p.y, 'REVIVED P2!', '#ffaa00');
          } else {
            lives = Math.min(lives + 1, 5);
            addFloatingText(p.x, p.y, '+1 LIFE', '#ff0055');
          }
        } else if (p.type === 'shield') {
          player.shield = 1;
          addFloatingText(p.x, p.y, 'SHIELD ON', '#00f0ff');
        } else if (p.type === 'weapon') {
          weaponLevel = Math.min(weaponLevel + 1, 5);
          addFloatingText(p.x, p.y, 'WEAPON UP!', '#00ff66');
        } else if (p.type === 'special') {
          specialWeapon = 1 + Math.floor(Math.random() * 3);
          specialAmmo = 6;
          addFloatingText(p.x, p.y, `${SPECIAL_NAMES[specialWeapon]} x6`, '#ffea00');
        }
        addExplosion(p.x, p.y, '#ffffff', 14);
        powerups.splice(i, 1);
        updateUI();
        continue;
      }

      // Check vs P2
      if (playerCount === 2 && player2.active && Math.hypot(player2.x - p.x, player2.y - p.y) < player2.w/2 + p.w/2) {
        window.soundEngine.playPowerup();
        if (p.type === 'life') {
          if (!player.active) {
            player.active = true; lives = 1; player.invincible = 90;
            player.x = W/2 - 40; player.y = H - 70;
            addFloatingText(p.x, p.y, 'REVIVED P1!', '#00f0ff');
          } else {
            p2Lives = Math.min(p2Lives + 1, 5);
            addFloatingText(p.x, p.y, '+1 LIFE', '#ff0055');
          }
        } else if (p.type === 'shield') {
          player2.shield = 1;
          addFloatingText(p.x, p.y, 'SHIELD ON', '#ffaa00');
        } else if (p.type === 'weapon') {
          p2WeaponLevel = Math.min(p2WeaponLevel + 1, 5);
          addFloatingText(p.x, p.y, 'WEAPON UP!', '#ffaa00');
        } else if (p.type === 'special') {
          p2SpecialWeapon = 1 + Math.floor(Math.random() * 3);
          p2SpecialAmmo = 6;
          addFloatingText(p.x, p.y, `${SPECIAL_NAMES[p2SpecialWeapon]} x6`, '#ffaa00');
        }
        addExplosion(p.x, p.y, '#ffffff', 14);
        powerups.splice(i, 1);
        updateUI();
      }
    }

    // Particles & Floating Text
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy;
      p.vx *= 0.95; p.vy *= 0.95;
      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }

    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ft.y += ft.vy;
      ft.life--;
      if (ft.life <= 0) floatingTexts.splice(i, 1);
    }
  }

  // =====================================================================
  //  ADVANCED GRAPHICS RENDERERS (SHIPS & MONSTERS)
  // =====================================================================

  // Unified Player Ship Renderer supporting 3 Ship Models
  function drawShipModel(ctx, p, shipType) {
    const x = p.x, y = p.y, w = p.w, h = p.h;
    const hw = w / 2, hh = h / 2;

    ctx.save();
    const flick = Math.random() * 6;

    if (shipType === 0) {
      // ===== MODEL 0: CYBER INTERCEPTOR (Cyan / Jet Wings) =====
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 16;
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.moveTo(x - 6, y + hh - 4);
      ctx.lineTo(x - 3, y + hh + 8 + flick);
      ctx.lineTo(x, y + hh - 4);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(x, y + hh - 4);
      ctx.lineTo(x + 3, y + hh + 8 + flick);
      ctx.lineTo(x + 6, y + hh - 4);
      ctx.fill();

      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#ff0055';
      ctx.fillRect(x - hw - 3, y - 4, 3, 14);
      ctx.fillRect(x + hw, y - 4, 3, 14);

      const wingGrad = ctx.createLinearGradient(x - hw, y, x + hw, y);
      wingGrad.addColorStop(0, '#00d4ff');
      wingGrad.addColorStop(0.25, '#082538');
      wingGrad.addColorStop(0.5, '#0e3a54');
      wingGrad.addColorStop(0.75, '#082538');
      wingGrad.addColorStop(1, '#00d4ff');

      ctx.fillStyle = wingGrad;
      ctx.beginPath();
      ctx.moveTo(x, y - hh);
      ctx.lineTo(x + hw + 2, y + hh - 6);
      ctx.lineTo(x + hw * 0.7, y + hh);
      ctx.lineTo(x, y + hh - 6);
      ctx.lineTo(x - hw * 0.7, y + hh);
      ctx.lineTo(x - hw - 2, y + hh - 6);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y - hh + 4);
      ctx.lineTo(x + hw - 2, y + hh - 8);
      ctx.moveTo(x, y - hh + 4);
      ctx.lineTo(x - hw + 2, y + hh - 8);
      ctx.stroke();

      const hullGrad = ctx.createLinearGradient(x, y - hh, x, y + hh);
      hullGrad.addColorStop(0, '#ffffff');
      hullGrad.addColorStop(0.35, '#00c3ff');
      hullGrad.addColorStop(1, '#004466');

      ctx.fillStyle = hullGrad;
      ctx.beginPath();
      ctx.moveTo(x, y - hh - 2);
      ctx.lineTo(x + 7, y - 4);
      ctx.lineTo(x + 5, y + hh - 4);
      ctx.lineTo(x - 5, y + hh - 4);
      ctx.lineTo(x - 7, y - 4);
      ctx.closePath();
      ctx.fill();

      const glassGrad = ctx.createLinearGradient(x, y - 10, x, y + 4);
      glassGrad.addColorStop(0, '#ffffff');
      glassGrad.addColorStop(0.5, '#00f0ff');
      glassGrad.addColorStop(1, '#003344');

      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 10;
      ctx.fillStyle = glassGrad;
      ctx.beginPath();
      ctx.ellipse(x, y - 4, 3.5, 9, 0, 0, Math.PI * 2);
      ctx.fill();

      if (p.shield > 0) {
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 24;
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, hw * 1.35, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(0, 240, 255, 0.12)';
        ctx.fill();
      }

    } else if (shipType === 1) {
      // ===== MODEL 1: PLASMA STRIKER (Crimson / Gold Delta) =====
      ctx.shadowColor = '#ffaa00';
      ctx.shadowBlur = 16;
      ctx.fillStyle = '#ffaa00';
      ctx.beginPath();
      ctx.moveTo(x - 5, y + hh - 4);
      ctx.lineTo(x, y + hh + 9 + flick);
      ctx.lineTo(x + 5, y + hh - 4);
      ctx.fill();

      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#ff0055';
      ctx.fillRect(x - hw - 3, y - 2, 3, 14);
      ctx.fillRect(x + hw, y - 2, 3, 14);

      const wingGrad = ctx.createLinearGradient(x - hw, y, x + hw, y);
      wingGrad.addColorStop(0, '#ff0055');
      wingGrad.addColorStop(0.3, '#4a0011');
      wingGrad.addColorStop(0.5, '#77001a');
      wingGrad.addColorStop(0.7, '#4a0011');
      wingGrad.addColorStop(1, '#ff0055');

      ctx.fillStyle = wingGrad;
      ctx.beginPath();
      ctx.moveTo(x, y + hh + 2);
      ctx.lineTo(x + hw + 3, y - hh + 6);
      ctx.lineTo(x + hw * 0.5, y - hh * 0.4);
      ctx.lineTo(x, y - hh - 2);
      ctx.lineTo(x - hw * 0.5, y - hh * 0.4);
      ctx.lineTo(x - hw - 3, y - hh + 6);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#ffaa00';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y - hh + 2);
      ctx.lineTo(x + hw + 1, y - hh + 6);
      ctx.moveTo(x, y - hh + 2);
      ctx.lineTo(x - hw - 1, y - hh + 6);
      ctx.stroke();

      const hullGrad = ctx.createLinearGradient(x, y - hh, x, y + hh);
      hullGrad.addColorStop(0, '#ffffff');
      hullGrad.addColorStop(0.4, '#ffaa00');
      hullGrad.addColorStop(1, '#664400');

      ctx.fillStyle = hullGrad;
      ctx.beginPath();
      ctx.moveTo(x, y - hh - 3);
      ctx.lineTo(x + 6, y - 2);
      ctx.lineTo(x + 4, y + hh - 2);
      ctx.lineTo(x - 4, y + hh - 2);
      ctx.lineTo(x - 6, y - 2);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffaa00';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.ellipse(x, y - 3, 3, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      if (p.shield > 0) {
        ctx.shadowColor = '#ffaa00';
        ctx.shadowBlur = 24;
        ctx.strokeStyle = '#ffaa00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, hw * 1.35, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255, 170, 0, 0.15)';
        ctx.fill();
      }

    } else {
      // ===== MODEL 2: VOID PHANTOM (Emerald / Deep Violet Diamond) =====
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = 16;
      ctx.fillStyle = '#00ff88';
      ctx.beginPath();
      ctx.moveTo(x - 4, y + hh - 3);
      ctx.lineTo(x, y + hh + 8 + flick);
      ctx.lineTo(x + 4, y + hh - 3);
      ctx.fill();

      ctx.shadowColor = '#9900ff';
      ctx.shadowBlur = 14;
      ctx.fillStyle = '#9900ff';
      ctx.beginPath();
      ctx.arc(x - hw - 1, y, 4, 0, Math.PI * 2);
      ctx.arc(x + hw + 1, y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#00ff88';
      ctx.beginPath();
      ctx.arc(x - hw - 1, y, 2, 0, Math.PI * 2);
      ctx.arc(x + hw + 1, y, 2, 0, Math.PI * 2);
      ctx.fill();

      const wingGrad = ctx.createLinearGradient(x - hw, y, x + hw, y);
      wingGrad.addColorStop(0, '#00ff88');
      wingGrad.addColorStop(0.3, '#1a0033');
      wingGrad.addColorStop(0.5, '#330066');
      wingGrad.addColorStop(0.7, '#1a0033');
      wingGrad.addColorStop(1, '#00ff88');

      ctx.fillStyle = wingGrad;
      ctx.beginPath();
      ctx.moveTo(x, y - hh - 4);
      ctx.lineTo(x + hw + 2, y);
      ctx.lineTo(x + hw * 0.4, y + hh);
      ctx.lineTo(x, y + hh - 4);
      ctx.lineTo(x - hw * 0.4, y + hh);
      ctx.lineTo(x - hw - 2, y);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.ellipse(x, y - 2, 3.5, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      if (p.shield > 0) {
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 24;
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, hw * 1.35, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(0, 255, 136, 0.15)';
        ctx.fill();
      }
    }

    ctx.restore();
  }

  function drawPlayerShip(ctx, p) {
    drawShipModel(ctx, p, p1ShipType);
  }

  function drawPlayer2Ship(ctx, p) {
    drawShipModel(ctx, p, p2ShipType);
  }

  function drawEnemyShip(ctx, e) {
    const x = e.x, y = e.y, w = e.w, h = e.h;
    const hw = w / 2, hh = h / 2;

    ctx.save();
    ctx.shadowBlur = 0;

    if (e.typeName === 'basic' || e.pattern === 'sine' || e.color === '#ff6633') {
      // ===== 1. ALIEN SCOUT FIGHTER (Basic) =====
      ctx.fillStyle = '#2b0c05';
      ctx.strokeStyle = e.color;
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.moveTo(x, y + hh);
      ctx.lineTo(x + hw + 2, y - hh + 4);
      ctx.lineTo(x + hw * 0.5, y - hh * 0.6);
      ctx.lineTo(x, y - hh);
      ctx.lineTo(x - hw * 0.5, y - hh * 0.6);
      ctx.lineTo(x - hw - 2, y - hh + 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.moveTo(x + hw + 2, y - hh + 4);
      ctx.lineTo(x + hw - 2, y + 2);
      ctx.lineTo(x + hw - 5, y - 4);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(x - hw - 2, y - hh + 4);
      ctx.lineTo(x - hw + 2, y + 2);
      ctx.lineTo(x - hw + 5, y - 4);
      ctx.fill();

      ctx.fillStyle = '#ffea00';
      ctx.shadowColor = '#ffea00';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.ellipse(x, y, 4, 6, 0, 0, Math.PI * 2);
      ctx.fill();

    } else if (e.typeName === 'fast' || e.pattern === 'zigzag' || e.color === '#ff00ff') {
      // ===== 2. FAST INTERCEPTOR BLADE (Fast) =====
      ctx.fillStyle = '#26002b';
      ctx.strokeStyle = '#ff00ff';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.moveTo(x, y + hh + 4);
      ctx.lineTo(x + hw, y - hh + 2);
      ctx.lineTo(x + 2, y - hh);
      ctx.lineTo(x - 2, y - hh);
      ctx.lineTo(x - hw, y - hh + 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ff007f';
      ctx.beginPath();
      ctx.moveTo(x, y + hh + 4);
      ctx.lineTo(x + 4, y);
      ctx.lineTo(x + hw * 0.8, y - hh + 4);
      ctx.lineTo(x - hw * 0.8, y - hh + 4);
      ctx.lineTo(x - 4, y);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(x, y - 2, 3, 0, Math.PI * 2);
      ctx.fill();

    } else if (e.typeName === 'tank' || e.pattern === 'straight' || e.color === '#ffcc00') {
      // ===== 3. HEAVY DREADNOUGHT WARSHIP (Tank) =====
      const hullGrad = ctx.createLinearGradient(x - hw, y, x + hw, y);
      hullGrad.addColorStop(0, '#4a3800');
      hullGrad.addColorStop(0.5, '#221900');
      hullGrad.addColorStop(1, '#4a3800');

      ctx.fillStyle = hullGrad;
      ctx.strokeStyle = '#ffcc00';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(x - hw * 0.5, y + hh);
      ctx.lineTo(x + hw * 0.5, y + hh);
      ctx.lineTo(x + hw, y + hh * 0.2);
      ctx.lineTo(x + hw * 0.8, y - hh);
      ctx.lineTo(x - hw * 0.8, y - hh);
      ctx.lineTo(x - hw, y + hh * 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffcc00';
      ctx.fillRect(x - hw * 0.45, y + hh - 2, 5, 8);
      ctx.fillRect(x + hw * 0.45 - 5, y + hh - 2, 5, 8);

      ctx.fillStyle = '#ffea00';
      ctx.shadowColor = '#ffea00';
      ctx.shadowBlur = 12;
      ctx.fillRect(x - 6, y - 6, 12, 8);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - 3, y - 4, 6, 4);

    } else if (e.typeName === 'shooter' || e.color === '#00ffcc') {
      // ===== 4. CYBER BIO-DRONE (Shooter 1) =====
      ctx.fillStyle = '#052b2b';
      ctx.strokeStyle = '#00ffcc';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.ellipse(x, y, hw * 0.75, hh * 0.85, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#00ffcc';
      ctx.beginPath();
      ctx.arc(x - hw, y, 4.5, 0, Math.PI * 2);
      ctx.arc(x + hw, y, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(0, 255, 204, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x - hw, y);
      ctx.lineTo(x + hw, y);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#00ffcc';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(x, y + 2, 4, 0, Math.PI * 2);
      ctx.fill();

    } else {
      // ===== 5. LASER SNIPER DRONE (Shooter 2 - Sniper) =====
      ctx.fillStyle = '#1a0033';
      ctx.strokeStyle = '#9900ff';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.moveTo(x, y + hh + 2); // Precision Lens Nose
      ctx.lineTo(x + hw * 0.7, y + hh * 0.3);
      ctx.lineTo(x + hw, y - hh * 0.4);
      ctx.lineTo(x + hw * 0.4, y - hh);
      ctx.lineTo(x - hw * 0.4, y - hh);
      ctx.lineTo(x - hw, y - hh * 0.4);
      ctx.lineTo(x - hw * 0.7, y + hh * 0.3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Emerald Stabilizer Fins
      ctx.fillStyle = '#00ff88';
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = 10;
      ctx.fillRect(x - hw - 3, y - 2, 3, 10);
      ctx.fillRect(x + hw, y - 2, 3, 10);

      // Precision Laser Focal Sight
      ctx.fillStyle = '#00ff88';
      ctx.beginPath();
      ctx.arc(x, y + hh - 2, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    if (e.shield > 0) {
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 18;
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, hw * 1.35, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
      ctx.fill();
    }

    ctx.restore();
  }

  function drawBossShip(ctx, bo, animTimer) {
    const x = bo.x, y = bo.y, w = bo.w, h = bo.h;
    const hw = w / 2, hh = h / 2;
    const def = bo.def;

    ctx.save();
    ctx.shadowColor = def.primaryColor;
    ctx.shadowBlur = 30;

    if (bo.type === 0) {
      // ===== BOSS 1: INVADER-ALPHA =====
      const pulse = Math.sin(animTimer * 0.08) * 4;

      ctx.fillStyle = '#1e0533';
      ctx.strokeStyle = def.primaryColor;
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(x, y + hh);
      ctx.lineTo(x + hw * 0.7, y + hh * 0.4);
      ctx.lineTo(x + hw, y - hh * 0.2);
      ctx.lineTo(x + hw * 0.8, y - hh);
      ctx.lineTo(x - hw * 0.8, y - hh);
      ctx.lineTo(x - hw, y - hh * 0.2);
      ctx.lineTo(x - hw * 0.7, y + hh * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = def.primaryColor;
      ctx.fillRect(x - hw - 2, y - 6, 6, 18);
      ctx.fillRect(x + hw - 4, y - 6, 6, 18);

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(animTimer * 0.03);
      ctx.strokeStyle = def.innerColor;
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.arc(0, 0, hw * 0.45 + pulse * 0.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = def.innerColor;
      ctx.beginPath();
      ctx.arc(x, y, 16, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = def.coreColor;
      ctx.shadowColor = def.coreColor;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(x, y, 8 + pulse * 0.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y - 1, 3, 0, Math.PI * 2);
      ctx.fill();

    } else if (bo.type === 1) {
      // ===== BOSS 2: GUARDIAN-AEGIS =====
      ctx.fillStyle = '#031b33';
      ctx.strokeStyle = def.primaryColor;
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI * 2 / 8) * i - Math.PI / 8;
        const r = i % 2 === 0 ? hw : hw * 0.85;
        const px = x + Math.cos(a) * r;
        const py = y + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-animTimer * 0.02);
      ctx.fillStyle = def.innerColor;
      for (let i = 0; i < 4; i++) {
        const a = (Math.PI / 2) * i;
        ctx.fillRect(Math.cos(a) * (hw * 0.7) - 6, Math.sin(a) * (hw * 0.7) - 6, 12, 12);
      }
      ctx.restore();

      ctx.fillStyle = def.coreColor;
      ctx.shadowColor = def.coreColor;
      ctx.shadowBlur = 25;
      ctx.beginPath();
      ctx.moveTo(x, y - 14);
      ctx.lineTo(x + 12, y);
      ctx.lineTo(x, y + 14);
      ctx.lineTo(x - 12, y);
      ctx.closePath();
      ctx.fill();

    } else if (bo.type === 2) {
      // ===== BOSS 3: PHANTOM-STRIKER =====
      ctx.fillStyle = '#330011';
      ctx.strokeStyle = def.primaryColor;
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(x, y + hh + 6);
      ctx.lineTo(x + hw, y - hh * 0.4);
      ctx.lineTo(x + hw * 0.6, y - hh);
      ctx.lineTo(x, y - hh * 0.5);
      ctx.lineTo(x - hw * 0.6, y - hh);
      ctx.lineTo(x - hw, y - hh * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = def.innerColor;
      ctx.shadowColor = def.innerColor;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.moveTo(x, y + hh + 6);
      ctx.lineTo(x + hw + 4, y - hh * 0.3);
      ctx.lineTo(x + hw * 0.7, y);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(x, y + hh + 6);
      ctx.lineTo(x - hw - 4, y - hh * 0.3);
      ctx.lineTo(x - hw * 0.7, y);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();

    } else if (bo.type === 3) {
      // ===== BOSS 4: OVERLORD-PRIME =====
      ctx.fillStyle = '#3a2700';
      ctx.strokeStyle = def.primaryColor;
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.moveTo(x, y + hh + 8);
      ctx.lineTo(x + hw * 0.4, y + hh * 0.4);
      ctx.lineTo(x + hw, y + hh * 0.6);
      ctx.lineTo(x + hw * 0.8, y - hh);
      ctx.lineTo(x + hw * 0.3, y - hh * 0.4);
      ctx.lineTo(x, y - hh);
      ctx.lineTo(x - hw * 0.3, y - hh * 0.4);
      ctx.lineTo(x - hw * 0.8, y - hh);
      ctx.lineTo(x - hw, y + hh * 0.6);
      ctx.lineTo(x - hw * 0.4, y + hh * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = def.innerColor;
      ctx.fillRect(x - hw * 0.7, y - 4, 8, 16);
      ctx.fillRect(x + hw * 0.7 - 8, y - 4, 8, 16);

      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 30;
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = def.primaryColor;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();

    } else if (bo.type === 4) {
      // ===== BOSS 5: NEBULA-LEVIATHAN (Dragon/Serpent Mech) =====
      ctx.fillStyle = '#002b1a';
      ctx.strokeStyle = def.primaryColor;
      ctx.lineWidth = 2.5;

      // Serpent Dragon Head & Horns
      ctx.beginPath();
      ctx.moveTo(x, y + hh + 10);
      ctx.lineTo(x + 14, y + hh * 0.2);
      ctx.lineTo(x + hw + 4, y - hh * 0.4); // Horn Tip Right
      ctx.lineTo(x + hw * 0.5, y - hh);
      ctx.lineTo(x, y - hh * 0.6);
      ctx.lineTo(x - hw * 0.5, y - hh);
      ctx.lineTo(x - hw - 4, y - hh * 0.4); // Horn Tip Left
      ctx.lineTo(x - 14, y + hh * 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Emerald Vertebrae Scales
      ctx.fillStyle = def.innerColor;
      ctx.beginPath();
      ctx.arc(x - 18, y, 6, 0, Math.PI * 2);
      ctx.arc(x + 18, y, 6, 0, Math.PI * 2);
      ctx.fill();

      // Glowing Dragon Core Eyes
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#00ff99';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.ellipse(x - 8, y + 4, 3, 6, -0.2, 0, Math.PI * 2);
      ctx.ellipse(x + 8, y + 4, 3, 6, 0.2, 0, Math.PI * 2);
      ctx.fill();

    } else if (bo.type === 5) {
      // ===== BOSS 6: SOLAR-HYPERION (Fiery Star Core Engine) =====
      ctx.fillStyle = '#330e00';
      ctx.strokeStyle = def.primaryColor;
      ctx.lineWidth = 2.5;

      // Solar Disc Core
      ctx.beginPath();
      ctx.arc(x, y, hw * 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Rotating Solar Flare Wings
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(animTimer * 0.05);
      ctx.fillStyle = def.innerColor;
      for (let i = 0; i < 3; i++) {
        const a = (Math.PI * 2 / 3) * i;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * hw * 0.7, Math.sin(a) * hw * 0.7);
        ctx.lineTo(Math.cos(a + 0.3) * (hw + 10), Math.sin(a + 0.3) * (hw + 10));
        ctx.lineTo(Math.cos(a + 0.6) * hw * 0.7, Math.sin(a + 0.6) * hw * 0.7);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // White-Hot Sun Core
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ff4400';
      ctx.shadowBlur = 30;
      ctx.beginPath();
      ctx.arc(x, y, 14, 0, Math.PI * 2);
      ctx.fill();

    } else {
      // ===== BOSS 7: VOID-CHRONOS (Black-Hole Mech) =====
      ctx.fillStyle = '#110026';
      ctx.strokeStyle = def.primaryColor;
      ctx.lineWidth = 2.5;

      // Void Wings & Event Horizon
      ctx.beginPath();
      ctx.moveTo(x, y + hh + 6);
      ctx.lineTo(x + hw + 6, y + hh * 0.2);
      ctx.lineTo(x + hw * 0.6, y - hh);
      ctx.lineTo(x, y - hh * 0.3);
      ctx.lineTo(x - hw * 0.6, y - hh);
      ctx.lineTo(x - hw - 6, y + hh * 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Purple Gravity Conduits
      ctx.fillStyle = def.innerColor;
      ctx.beginPath();
      ctx.arc(x - 22, y - 4, 7, 0, Math.PI * 2);
      ctx.arc(x + 22, y - 4, 7, 0, Math.PI * 2);
      ctx.fill();

      // Deep Black Event-Horizon Center with Pulsing Void Aura
      ctx.fillStyle = '#000000';
      ctx.shadowColor = '#aa00ff';
      ctx.shadowBlur = 25;
      ctx.beginPath();
      ctx.arc(x, y, 13 + Math.sin(animTimer * 0.1) * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
    ctx.font = 'bold 12px "Share Tech Mono"';
    ctx.fillStyle = def.primaryColor;
    ctx.textAlign = 'center';
    ctx.fillText(def.name, x, y + hh + 20);

    const barW = 85;
    ctx.fillStyle = '#111';
    ctx.fillRect(x - barW / 2, y - hh - 16, barW, 7);
    ctx.fillStyle = def.primaryColor;
    ctx.fillRect(x - barW / 2, y - hh - 16, barW * (bo.hp / bo.maxHp), 7);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - barW / 2, y - hh - 16, barW, 7);

    ctx.restore();
  }

  // =====================================================================
  //  RENDER LOOP
  // =====================================================================
  function draw() {
    ctx.save();

    if (screenShakeTimer > 0) {
      const offsetX = (Math.random() - 0.5) * screenShakeIntensity;
      const offsetY = (Math.random() - 0.5) * screenShakeIntensity;
      ctx.translate(offsetX, offsetY);
    }

    ctx.clearRect(0, 0, W, H);

    // Stars
    for (const s of stars) {
      ctx.globalAlpha = s.brightness;
      ctx.fillStyle = s.layer === 2 ? '#00f0ff' : '#ffffff';
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }
    ctx.globalAlpha = 1;

    // Boss Projectiles
    ctx.shadowBlur = 0;
    for (const bp of bossProjectiles) {
      ctx.fillStyle = bp.color;
      ctx.beginPath();
      ctx.arc(bp.x, bp.y, bp.size/2, 0, Math.PI*2);
      ctx.fill();
    }

    // Enemy Bullets
    for (const eb of enemyBullets) {
      ctx.fillStyle = eb.color;
      ctx.beginPath();
      ctx.arc(eb.x, eb.y, eb.size/2, 0, Math.PI*2);
      ctx.fill();
    }

    // Particles
    for (const p of particles) {
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
    }
    ctx.globalAlpha = 1;

    // Enemies
    for (const e of enemies) {
      drawEnemyShip(ctx, e);

      if (e.maxHp > 1) {
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#222';
        ctx.fillRect(e.x - 14, e.y - e.h / 2 - 8, 28, 4);
        ctx.fillStyle = '#00ff66';
        ctx.fillRect(e.x - 14, e.y - e.h / 2 - 8, 28 * (e.hp / e.maxHp), 4);
      }
    }

    // Bosses
    if (bossActive && bosses.length > 0) {
      for (const bo of bosses) {
        drawBossShip(ctx, bo, bossAnimTimer);
      }
    }

    // Player Bullets
    for (const b of bullets) {
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x - b.w/2, b.y - b.h/2, b.w, b.h);
    }
    ctx.shadowBlur = 0;

    // Powerups
    for (const p of powerups) {
      const bobY = p.y + Math.sin(p.bobTimer) * 4;
      ctx.shadowColor = p.type === 'shield' ? '#00f0ff' : p.type === 'life' ? '#ff0055' : '#ffea00';
      ctx.shadowBlur = 15;
      ctx.fillStyle = ctx.shadowColor;
      ctx.beginPath();
      ctx.arc(p.x, bobY, p.w/2, 0, Math.PI*2);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#000';
      ctx.font = 'bold 11px "Orbitron"';
      ctx.textAlign = 'center';
      const label = p.type === 'shield' ? 'S' : p.type === 'life' ? '+' : p.type === 'weapon' ? 'W' : '★';
      ctx.fillText(label, p.x, bobY + 4);
    }

    // Draw Player 1 Ship
    if (player.active && !(player.invincible > 0 && Math.floor(player.invincible / 4) % 2 === 0)) {
      drawPlayerShip(ctx, player);
    }

    // Draw Player 2 Ship (in Co-Op mode)
    if (playerCount === 2 && player2.active && !(player2.invincible > 0 && Math.floor(player2.invincible / 4) % 2 === 0)) {
      drawPlayer2Ship(ctx, player2);
    }
    ctx.shadowBlur = 0;

    // Floating Text Popups
    for (const ft of floatingTexts) {
      ctx.globalAlpha = ft.life / ft.maxLife;
      ctx.font = 'bold 14px "Share Tech Mono"';
      ctx.fillStyle = ft.color;
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.globalAlpha = 1;

    // Boss Warning Banner Overlay
    if (bossWarning > 0) {
      const alpha = Math.abs(Math.sin(bossWarning * 0.08));
      ctx.globalAlpha = alpha;
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = 30;
      ctx.fillStyle = '#ff0055';
      ctx.font = '900 42px "Orbitron"';
      ctx.textAlign = 'center';
      ctx.fillText('⚠ WARNING ⚠', W/2, H/2 - 15);
      ctx.font = '18px "Share Tech Mono"';
      ctx.fillText('BOSS INCOMING', W/2, H/2 + 25);
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }

  let lastTime = performance.now();
  let accumulator = 0;
  const frameInterval = 1000 / 60; // Strict 60 FPS tick rate (16.666ms)

  function loop(now) {
    requestAnimationFrame(loop);

    if (!now) now = performance.now();
    let elapsed = now - lastTime;
    lastTime = now;

    // Safety guard for tab switching, GPU stalls, or lag spikes
    if (elapsed > 250) {
      elapsed = frameInterval;
      accumulator = 0;
    }

    accumulator += elapsed;
    let ticks = 0;
    while (accumulator >= frameInterval && ticks < 5) {
      update();
      accumulator -= frameInterval;
      ticks++;
    }
    if (ticks >= 5) accumulator = 0;

    draw();
  }

  // =====================================================================
  //  LISTENERS & INPUT BINDINGS
  // =====================================================================
  document.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (e.key) keys[e.key.toLowerCase()] = true;
    if (e.code) keys[e.code] = true;

    if (e.key === ' ' || e.code === 'Space' || e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.code === 'KeyW' || e.code === 'KeyS') {
      if (running && !paused) e.preventDefault();
    }
    if (e.key === 'Escape' || e.code === 'Escape' || e.key === 'p' || e.key === 'P' || e.code === 'KeyP') {
      if (running) {
        togglePause();
      }
    }
    if (e.key === 'm' || e.key === 'M' || e.code === 'KeyM') toggleSound();
  });

  document.addEventListener('keyup', e => {
    keys[e.key] = false;
    if (e.key) keys[e.key.toLowerCase()] = false;
    if (e.code) keys[e.code] = false;
  });

  pauseBtn.addEventListener('click', togglePause);
  soundBtn.addEventListener('click', toggleSound);
  if (resumeBtn) resumeBtn.addEventListener('click', resumeGame);
  if (restartGameBtn) restartGameBtn.addEventListener('click', restartCurrentGame);
  if (mainMenuBtn) mainMenuBtn.addEventListener('click', returnToMainMenu);

  function drawShipPreviews() {
    for (let i = 0; i < 3; i++) {
      const cvs = document.getElementById('shipPreview' + i);
      if (!cvs) continue;
      const pctx = cvs.getContext('2d');
      pctx.clearRect(0, 0, cvs.width, cvs.height);

      const p = {
        x: cvs.width / 2,
        y: cvs.height / 2 + 2,
        w: 26,
        h: 34,
        shield: i === 2 ? 1 : 0
      };
      drawShipModel(pctx, p, i);
    }
  }

  function updateShipCardHighlights() {
    document.querySelectorAll('.ship-card').forEach(card => {
      const shipIndex = parseInt(card.dataset.ship);
      card.classList.remove('active', 'p2-active', 'p1-p2-both');

      if (playerCount === 1) {
        if (p1ShipType === shipIndex) card.classList.add('active');
      } else {
        const isP1 = (p1ShipType === shipIndex);
        const isP2 = (p2ShipType === shipIndex);
        if (isP1 && isP2) card.classList.add('p1-p2-both');
        else if (isP1) card.classList.add('active');
        else if (isP2) card.classList.add('p2-active');
      }
    });

    if (pSelectNotice) {
      if (playerCount === 1) {
        pSelectNotice.textContent = 'SELECTED FOR PLAYER 1';
        pSelectNotice.style.color = '#00f0ff';
      } else {
        pSelectNotice.textContent = currentTargetPlayer === 1 ? 'SELECTING FOR PLAYER 1 (CYBER BLUE)' : 'SELECTING FOR PLAYER 2 (PLASMA GOLD)';
        pSelectNotice.style.color = currentTargetPlayer === 1 ? '#00f0ff' : '#ffaa00';
      }
    }
  }

  // Player Count Toggle Listeners
  if (btnPlayer1 && btnPlayer2) {
    btnPlayer1.addEventListener('click', () => {
      playerCount = 1;
      btnPlayer1.classList.add('active');
      btnPlayer2.classList.remove('active');
      updateUI();
    });
    btnPlayer2.addEventListener('click', () => {
      playerCount = 2;
      btnPlayer2.classList.add('active');
      btnPlayer1.classList.remove('active');
      updateUI();
    });
  }

  // Difficulty Mode Selection Listeners (Step 1 -> Advances to Step 2 Hangar)
  document.querySelectorAll('.btn-option').forEach(btn => {
    btn.addEventListener('click', () => {
      const selectedMode = btn.dataset.mode;
      if (selectedMode) {
        mode = selectedMode;
        if (modeSelectScreen) modeSelectScreen.classList.add('hidden');
        if (shipSelectScreen) shipSelectScreen.classList.remove('hidden');
        currentTargetPlayer = 1;

        if (playerTabGroup) {
          if (playerCount === 2) {
            playerTabGroup.style.display = 'flex';
            if (tabP1) tabP1.classList.add('active');
            if (tabP2) tabP2.classList.remove('active');
          } else {
            playerTabGroup.style.display = 'none';
          }
        }
        updateShipCardHighlights();
        drawShipPreviews();
      }
    });
  });

  // Hangar Ship Card Selection Listeners
  document.querySelectorAll('.ship-card').forEach(card => {
    card.addEventListener('click', () => {
      const shipIndex = parseInt(card.dataset.ship);
      if (currentTargetPlayer === 1) {
        p1ShipType = shipIndex;
        if (playerCount === 2) currentTargetPlayer = 2; // Auto advance tab in 2P mode
      } else {
        p2ShipType = shipIndex;
      }

      if (tabP1 && tabP2) {
        if (currentTargetPlayer === 1) {
          tabP1.classList.add('active'); tabP2.classList.remove('active');
        } else {
          tabP2.classList.add('active'); tabP1.classList.remove('active');
        }
      }
      updateShipCardHighlights();
    });
  });

  if (tabP1) {
    tabP1.addEventListener('click', () => {
      currentTargetPlayer = 1;
      tabP1.classList.add('active'); if (tabP2) tabP2.classList.remove('active');
      updateShipCardHighlights();
    });
  }
  if (tabP2) {
    tabP2.addEventListener('click', () => {
      currentTargetPlayer = 2;
      tabP2.classList.add('active'); if (tabP1) tabP1.classList.remove('active');
      updateShipCardHighlights();
    });
  }

  if (shipBackBtn) {
    shipBackBtn.addEventListener('click', () => {
      if (shipSelectScreen) shipSelectScreen.classList.add('hidden');
      if (modeSelectScreen) modeSelectScreen.classList.remove('hidden');
    });
  }

  if (startGameBtn) {
    startGameBtn.addEventListener('click', () => {
      if (shipSelectScreen) shipSelectScreen.classList.add('hidden');
      window.soundEngine.init();
      resetGame();
      running = true;
      paused = false;
    });
  }

  const restartBtn = document.getElementById('restartBtn');
  if (restartBtn) {
    restartBtn.addEventListener('click', returnToMainMenu);
  }

  // Touch Control Joystick Setup
  const touchDpad = document.getElementById('touchDpad');
  const touchSpecial = document.getElementById('touchSpecial');

  if (touchDpad) {
    let dpadRect = null;
    const handleTouch = (e) => {
      e.preventDefault();
      if (!dpadRect) dpadRect = touchDpad.getBoundingClientRect();
      const touch = e.touches[0];
      if (touch) {
        const centerX = dpadRect.left + dpadRect.width / 2;
        const centerY = dpadRect.top + dpadRect.height / 2;
        const dx = touch.clientX - centerX;
        const dy = touch.clientY - centerY;
        const dist = Math.hypot(dx, dy);
        const maxDist = dpadRect.width / 2;
        touchState.dx = dist > 5 ? dx / maxDist : 0;
        touchState.dy = dist > 5 ? dy / maxDist : 0;
      }
    };
    const resetTouch = () => { touchState.dx = 0; touchState.dy = 0; dpadRect = null; };

    touchDpad.addEventListener('touchstart', handleTouch, { passive: false });
    touchDpad.addEventListener('touchmove', handleTouch, { passive: false });
    touchDpad.addEventListener('touchend', resetTouch);
    touchDpad.addEventListener('touchcancel', resetTouch);
  }

  if (touchSpecial) {
    touchSpecial.addEventListener('touchstart', (e) => { e.preventDefault(); touchState.special = true; }, { passive: false });
    touchSpecial.addEventListener('touchend', () => { touchState.special = false; });
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && running && !paused) {
      togglePause();
    }
  });

  // Initial Setup
  highScoreDisplay.textContent = highScores[mode];
  updateUI();
  loop();
})();
