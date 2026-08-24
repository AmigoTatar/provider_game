// ============================================
// ОСНОВНАЯ ЛОГИКА ИГРЫ
// ============================================

const BLOCK_TYPES = {
    normal: { type: 'normal', color: '#ff6b6b', hp: 3, hitScore: 10 },
    strong: { type: 'strong', color: '#a29bfe', hp: 5, hitScore: 15 },
    gold: { type: 'gold', color: '#ffd700', hp: 1, hitScore: 50, lifetime: 5000 },
    ice: { type: 'ice', color: '#00d2ff', hp: 2, hitScore: 10, iceMs: 900 }
};

const WAVE_NAMES = ['Покой', 'Дыхание', 'Поток', 'Туман', 'Прилив', 'Глубина', 'Тишина', 'Эхо', 'Зыбь', 'Бездна'];

function getWaveConfig(level) {
    const n = Math.max(1, level);
    const ice = Math.min(0.34, 0.12 + n * 0.012);
    const gold = Math.min(0.2, 0.12 + n * 0.005);
    const strong = Math.min(0.48, 0.14 + n * 0.018);
    const normal = Math.max(0.12, 1 - ice - gold - strong);
    return {
        name: WAVE_NAMES[(n - 1) % WAVE_NAMES.length],
        count: Math.min(16, 6 + Math.floor((n - 1) * 0.7)),
        delay: Math.max(480, 1600 - n * 45),
        mix: { normal, strong, gold, ice }
    };
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.destroyedElement = document.getElementById('destroyed');
        this.levelElement = document.getElementById('level');
        this.timerElement = document.getElementById('timer');
        this.comboElement = document.getElementById('combo');
        this.waveNameElement = document.getElementById('waveName');
        this.tensionFill = document.getElementById('tensionFill');
        this.tensionLabel = document.getElementById('tensionLabel');

        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.pauseScreen = document.getElementById('pauseScreen');
        this.levelCompleteScreen = document.getElementById('levelCompleteScreen');
        this.finalScore = document.getElementById('finalScore');
        this.finalDestroyed = document.getElementById('finalDestroyed');
        this.finalLevel = document.getElementById('finalLevel');
        this.finalTime = document.getElementById('finalTime');
        this.finalCombo = document.getElementById('finalCombo');
        this.gameOverTitle = document.getElementById('gameOverTitle');
        this.levelCompleteTitle = document.getElementById('levelCompleteTitle');
        this.levelCompleteText = document.getElementById('levelCompleteText');
        this.nextLevelBtn = document.getElementById('nextLevelBtn');

        this.WIDTH = this.canvas.width;
        this.HEIGHT = this.canvas.height;
        this.HIT_RADIUS = 16;

        this.physics = new Physics(this.WIDTH, this.HEIGHT);
        this.renderer = new Renderer(this.canvas);

        this.blocks = [];
        this.particles = [];
        this.scoreFloats = [];
        this.animationId = null;
        this.timerInterval = null;
        this.comboTimeout = null;
        this.levelAdvanceTimer = null;
        this.boundKey = (e) => this.onKey(e);

        this.resetState(1);
        this.setupControls();
        this.setupOverlayButtons();
        window.addEventListener('keydown', this.boundKey);
    }

    resetState(startLevel) {
        this.startLevel = startLevel;
        this.level = startLevel;
        this.score = 0;
        this.destroyedBlocks = 0;
        this.timer = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.lastHitTime = 0;
        this.clearedThisRun = 0;
        this.isRunning = false;
        this.isPaused = false;
        this.isFalling = false;
        this.isGameOverShown = false;
        this.isLevelTransitioning = false;
        this.isVictory = false;
        this.isAdvancing = false;
        this.fallingHead = null;
        this.fallingVelocityX = 0;
        this.fallingVelocityY = 0;
        this.fallStartTime = 0;
        this.blocks = [];
        this.particles = [];
        this.scoreFloats = [];
        this.tension = 0;
        this.wear = 0;
        this.breakReason = '';
        this.warnedTension = false;
        this.pointerReady = false;
        this.safeUntil = 0;
        this.lastClientX = null;
        this.lastClientY = null;
        this.updateHud();
    }

    start(startLevel = 1, pointerEvent = null) {
        this.stopLoop();
        this.stopTimers();
        this.hideAllOverlays();
        this.resetState(startLevel);
        this.physics.initChain(250, 80);
        this.physics.setMouse(250, 80, true);
        this.initBlocks();
        this.isRunning = true;
        this.safeUntil = Date.now() + 1600;
        this.startTimer();
        this.gameLoop();
        requestAnimationFrame(() => {
            requestAnimationFrame(() => this.capturePointer(pointerEvent));
        });
    }

    toLocal(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) {
            return { x: 250, y: 80 };
        }
        const x = (clientX - rect.left) * (this.canvas.width / rect.width);
        const y = (clientY - rect.top) * (this.canvas.height / rect.height);
        return {
            x: Math.max(8, Math.min(this.WIDTH - 8, x)),
            y: Math.max(24, Math.min(this.HEIGHT - 80, y))
        };
    }

    capturePointer(pointerEvent) {
        if (!pointerEvent || typeof pointerEvent.clientX !== 'number') {
            this.pointerReady = false;
            return;
        }
        const rect = this.canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) {
            requestAnimationFrame(() => this.capturePointer(pointerEvent));
            return;
        }
        this.placeChainAtPointer(pointerEvent.clientX, pointerEvent.clientY);
    }

    placeChainAtPointer(clientX, clientY) {
        const p = this.toLocal(clientX, clientY);
        this.physics.initChain(p.x, p.y);
        this.physics.setMouse(p.x, p.y, true);
        this.pointerReady = true;
        this.tension = 0;
        this.warnedTension = false;
        this.updateTensionHud();
    }

    resumeChainControl(pointerEvent) {
        this.safeUntil = Date.now() + 1400;
        this.tension = 0;
        this.warnedTension = false;
        const event = pointerEvent || (
            this.lastClientX != null
                ? { clientX: this.lastClientX, clientY: this.lastClientY }
                : null
        );
        if (event) {
            this.placeChainAtPointer(event.clientX, event.clientY);
        } else {
            this.physics.initChain(this.physics.mouseX, this.physics.mouseY);
            this.physics.setMouse(this.physics.mouseX, this.physics.mouseY, true);
            this.pointerReady = true;
        }
        this.updateTensionHud();
    }

    restart() {
        this.start(this.startLevel);
    }

    pause() {
        if (!this.isRunning || this.isPaused || this.isGameOverShown || this.isLevelTransitioning) return;
        this.isPaused = true;
        this.isRunning = false;
        this.stopLoop();
        if (window.audio) window.audio.play('click');
        setOverlay(this.pauseScreen, true);
    }

    resume() {
        if (!this.isPaused || this.isGameOverShown) return;
        this.isPaused = false;
        this.isRunning = true;
        setOverlay(this.pauseScreen, false);
        this.resumeChainControl();
        this.gameLoop();
    }

    stop() {
        this.isRunning = false;
        this.isPaused = false;
        this.stopLoop();
        this.stopTimers();
        this.hideAllOverlays();
    }

    destroy() {
        this.stop();
        window.removeEventListener('keydown', this.boundKey);
    }

    stopLoop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    stopTimers() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        if (this.comboTimeout) {
            clearTimeout(this.comboTimeout);
            this.comboTimeout = null;
        }
        if (this.levelAdvanceTimer) {
            clearTimeout(this.levelAdvanceTimer);
            this.levelAdvanceTimer = null;
        }
    }

    hideAllOverlays() {
        setOverlay(this.gameOverScreen, false);
        setOverlay(this.pauseScreen, false);
        setOverlay(this.levelCompleteScreen, false);
    }

    startTimer() {
        this.timerElement.textContent = String(this.timer);
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            if (this.isRunning && !this.isPaused) {
                this.timer++;
                this.timerElement.textContent = String(this.timer);
            }
        }, 1000);
    }

    pickType(mix) {
        const roll = Math.random();
        let acc = 0;
        for (const [type, weight] of Object.entries(mix)) {
            acc += weight;
            if (roll <= acc) return type;
        }
        return 'normal';
    }

    initBlocks() {
        this.blocks = [];
        this.isLevelTransitioning = false;
        const config = getWaveConfig(this.level);
        const padding = 18;
        const maxAttempts = 80;

        for (let i = 0; i < config.count; i++) {
            const def = BLOCK_TYPES[this.pickType(config.mix)];
            const w = 42 + Math.random() * 34;
            const h = 42 + Math.random() * 34;
            let x = padding;
            let y = 110;
            let found = false;
            let attempts = 0;

            while (!found && attempts < maxAttempts) {
                x = padding + Math.random() * (this.WIDTH - w - padding * 2);
                y = 90 + Math.random() * (this.HEIGHT - h - 140);
                found = true;
                for (const block of this.blocks) {
                    if (
                        x < block.x + block.w + 12 &&
                        x + w + 12 > block.x &&
                        y < block.y + block.h + 12 &&
                        y + h + 12 > block.y
                    ) {
                        found = false;
                        break;
                    }
                }
                attempts++;
            }

            const now = Date.now();
            this.blocks.push({
                x,
                y,
                w,
                h,
                type: def.type,
                color: def.color,
                hp: def.hp,
                maxHp: def.hp,
                hitScore: def.hitScore,
                lifetime: def.lifetime || 0,
                spawnedAt: now,
                expiresAt: def.lifetime ? now + def.lifetime : 0,
                iceMs: def.iceMs || 0,
                shake: 0,
                wasHit: false
            });
        }

        this.levelElement.textContent = String(this.level);
    }

    updateHud() {
        this.scoreElement.textContent = String(this.score);
        this.destroyedElement.textContent = String(this.destroyedBlocks);
        this.levelElement.textContent = String(this.level);
        this.timerElement.textContent = String(this.timer);
        this.comboElement.textContent = String(this.combo);
        if (this.waveNameElement) {
            this.waveNameElement.textContent = getWaveConfig(this.level).name;
        }
        this.updateTensionHud();
    }

    updateTensionHud() {
        if (this.tensionFill) {
            this.tensionFill.style.width = `${Math.max(0, Math.min(100, this.tension))}%`;
            this.tensionFill.classList.toggle('danger', this.tension >= 72);
            this.tensionFill.classList.toggle('ice', this.physics.isSlippery());
        }
        if (this.tensionLabel) {
            if (this.tension < 28) this.tensionLabel.textContent = 'спокойна';
            else if (this.tension < 55) this.tensionLabel.textContent = 'натянута';
            else if (this.tension < 80) this.tensionLabel.textContent = 'гудит';
            else this.tensionLabel.textContent = 'сейчас лопнет';
        }
    }

    addScore(amount, x, y, extra = {}) {
        this.score += amount;
        this.scoreElement.textContent = String(this.score);
        this.scoreElement.classList.remove('score-pop');
        void this.scoreElement.offsetWidth;
        this.scoreElement.classList.add('score-pop');

        if (x != null && y != null) {
            this.scoreFloats.push({
                x,
                y,
                text: `+${amount}`,
                life: 1,
                color: extra.color || '#ffd93d',
                big: extra.big || false
            });
        }

        if (window.achievements) {
            window.achievements.check({ score: this.score });
        }
    }

    spawnParticles(x, y, color, count = 14) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1.2 + Math.random() * 4.5;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1.2,
                life: 1,
                color,
                size: 2 + Math.random() * 3.5
            });
        }
    }

    updateCombo(cx, cy) {
        const now = Date.now();
        if (now - this.lastHitTime > 2000) this.combo = 0;

        this.combo++;
        this.lastHitTime = now;
        if (this.combo > this.maxCombo) this.maxCombo = this.combo;

        this.comboElement.textContent = String(this.combo);
        this.comboElement.className = this.combo >= 3 ? 'combo-active' : '';

        if (this.combo >= 3 && this.combo % 3 === 0) {
            this.addScore(5 * (this.combo / 3), cx, cy - 24, { color: '#fd79a8', big: true });
        }

        if (this.comboTimeout) clearTimeout(this.comboTimeout);
        this.comboTimeout = setTimeout(() => {
            this.combo = 0;
            this.comboElement.textContent = '0';
            this.comboElement.className = '';
        }, 2000);
    }

    circleHitsBlock(head, block) {
        const nearestX = Math.max(block.x, Math.min(head.x, block.x + block.w));
        const nearestY = Math.max(block.y, Math.min(head.y, block.y + block.h));
        const dx = head.x - nearestX;
        const dy = head.y - nearestY;
        return dx * dx + dy * dy <= this.HIT_RADIUS * this.HIT_RADIUS;
    }

    hitBlock(block, head) {
        const cx = block.x + block.w / 2;
        const cy = block.y + block.h / 2;
        block.shake = 10;

        if (block.type === 'gold') {
            block.hp = 0;
            this.addScore(block.hitScore, cx, cy, { color: '#ffd700', big: true });
            this.onBlockDestroyed(block);
            if (window.audio) window.audio.play('gold');
        } else {
            block.hp--;
            this.addScore(block.hitScore, cx, cy, { color: block.color });
            if (window.audio) window.audio.play('hit');

            if (block.type === 'ice') {
                this.physics.makeSlippery(block.iceMs);
                if (window.audio) window.audio.play('ice');
            }

            if (block.hp <= 0) {
                this.onBlockDestroyed(block);
            }
        }

        const speed = this.physics.getHeadSpeed();
        this.wear = Math.min(42, this.wear + (block.type === 'strong' ? 4 : 1.2));
        if (block.type === 'strong' && speed > 6) {
            this.tension += 14 + speed * 1.5;
        }
        if (block.type === 'ice') {
            this.tension += 10.8;
        }
        this.updateTensionHud();
        if (this.tension >= 100) {
            this.snapChain(block.type === 'ice' ? 'лёд' : 'удар');
        }

        this.updateCombo(cx, cy);

        const nx = head.x - cx;
        const ny = head.y - cy;
        const len = Math.sqrt(nx * nx + ny * ny) || 1;
        head.x += (nx / len) * 10;
        head.y += (ny / len) * 10;
    }

    onBlockDestroyed(block) {
        block.hp = 0;
        this.destroyedBlocks++;
        this.destroyedElement.textContent = String(this.destroyedBlocks);
        const cx = block.x + block.w / 2;
        const cy = block.y + block.h / 2;
        this.spawnParticles(cx, cy, block.color, 18);
        if (block.type !== 'gold') {
            const bonus = 20 + Math.floor(this.combo / 2) * 5;
            this.addScore(bonus, cx, cy - 18, { color: '#fff', big: true });
            if (window.audio) window.audio.play('destroy');
        }
        if (window.achievements) {
            window.achievements.addDestroyed(1);
            window.achievements.check({ score: this.score });
        }
        this.checkHighScore();
    }

    checkCollisions() {
        if (this.isFalling || this.isLevelTransitioning) return;
        const head = this.physics.getHead();
        if (!head) return;

        for (const block of this.blocks) {
            if (block.hp <= 0) {
                block.wasHit = false;
                continue;
            }
            const colliding = this.circleHitsBlock(head, block);
            if (colliding && !block.wasHit) {
                this.hitBlock(block, head);
                block.wasHit = true;
            } else if (!colliding) {
                block.wasHit = false;
            }
        }
    }

    updateGoldTimers() {
        const now = Date.now();
        for (const block of this.blocks) {
            if (block.type !== 'gold' || block.hp <= 0 || !block.expiresAt) continue;
            if (now >= block.expiresAt) {
                block.hp = 0;
                block.expired = true;
                this.spawnParticles(block.x + block.w / 2, block.y + block.h / 2, '#ffd700', 8);
            }
        }
    }

    snapChain(reason) {
        if (this.isFalling || this.isGameOverShown) return;
        const head = this.physics.getHead();
        if (!head) return;
        this.breakReason = reason;
        this.fallingHead = { x: head.x, y: head.y };
        this.fallingVelocityX = (head.x - head.oldX) * 0.3;
        this.fallingVelocityY = (head.y - head.oldY) * 0.3 + 2;
        this.isFalling = true;
        this.fallStartTime = Date.now();
        this.physics.detachHead();
    }

    updateTension() {
        if (this.isFalling || this.isLevelTransitioning || this.isGameOverShown) return false;
        if (!this.pointerReady || Date.now() < this.safeUntil) {
            this.physics.mouseSpeed = 0;
            this.tension = 0;
            if (this.pointerReady && this.physics.getStretchRatio() > 1.1) {
                this.physics.initChain(this.physics.mouseX, this.physics.mouseY);
            }
            this.updateTensionHud();
            return false;
        }
        const icy = this.physics.isSlippery();
        const stretch = this.physics.getStretchRatio();
        const jerk = Math.max(0, this.physics.mouseSpeed - 12);
        let add = jerk * (icy ? 0.495 : 0.32);
        if (stretch > 1.28) add += (stretch - 1.28) * (icy ? 12.6 : 8);
        if (icy) add += 0.108;
        this.tension += add;
        this.tension += this.wear * 0.015;
        this.tension = Math.max(0, this.tension - (icy ? 0.242 : 0.62));
        this.tension = Math.min(110, this.tension);
        this.updateTensionHud();

        if (this.tension >= 78 && !this.warnedTension) {
            this.warnedTension = true;
            showNotification('Цепь натянута — веди спокойнее', 'error');
            if (window.audio) window.audio.play('ice');
        }
        if (this.tension < 50) this.warnedTension = false;

        if (this.tension >= 100) {
            this.snapChain('натяжение');
            return true;
        }
        if (stretch > 2.55) {
            this.snapChain('разрыв');
            return true;
        }
        return false;
    }

    checkLevelComplete() {
        if (this.isFalling || this.isLevelTransitioning || this.isGameOverShown) return;

        const remaining = this.blocks.some((block) => block.hp > 0);
        if (remaining || this.blocks.length === 0) return;

        this.isLevelTransitioning = true;
        this.isRunning = false;
        this.stopLoop();
        this.clearedThisRun++;
        if (window.audio) window.audio.play('level');
        if (window.achievements) {
            window.achievements.check({
                score: this.score,
                wavesCleared: this.clearedThisRun,
                clearedAllFromStart: this.startLevel === 1 && this.clearedThisRun >= 3
            });
        }

        const current = getWaveConfig(this.level);
        const next = getWaveConfig(this.level + 1);
        this.levelCompleteTitle.textContent = `Волна ${this.level} · ${current.name}`;
        this.levelCompleteText.textContent = `Дальше — ${next.name}. Веди цепь спокойнее.`;
        this.nextLevelBtn.textContent = 'Дальше';
        setOverlay(this.levelCompleteScreen, true);

        this.levelAdvanceTimer = setTimeout(() => this.advanceLevel(), current.delay + 700);
    }

    advanceLevel(pointerEvent) {
        if (this.levelAdvanceTimer) {
            clearTimeout(this.levelAdvanceTimer);
            this.levelAdvanceTimer = null;
        }
        if (!this.isLevelTransitioning || this.isAdvancing || this.isGameOverShown) return;

        this.isAdvancing = true;
        this.level++;
        this.wear *= 0.55;
        this.warnedTension = false;
        setOverlay(this.levelCompleteScreen, false);
        this.initBlocks();
        this.updateHud();
        this.resumeChainControl(pointerEvent);
        this.isAdvancing = false;
        this.isPaused = false;
        this.isRunning = true;
        this.gameLoop();
    }

    showVictory() {
        this.isVictory = true;
        this.isRunning = false;
        this.stopLoop();
        this.stopTimers();
        if (window.audio) window.audio.play('win');
        if (window.achievements) {
            window.achievements.check({
                score: this.score,
                clearedAllFromStart: this.startLevel === 1 && this.clearedThisRun >= 3
            });
        }
        this.checkHighScore();
        this.gameOverTitle.textContent = 'Победа!';
        this.fillGameOverStats();
        setOverlay(this.levelCompleteScreen, false);
        setOverlay(this.pauseScreen, false);
        setOverlay(this.gameOverScreen, true);
    }

    fillGameOverStats() {
        this.finalScore.textContent = String(this.score);
        this.finalDestroyed.textContent = String(this.destroyedBlocks);
        this.finalLevel.textContent = String(this.level);
        this.finalTime.textContent = String(this.timer);
        this.finalCombo.textContent = String(this.maxCombo);
    }

    showGameOver(reason = 'Игра окончена!') {
        if (this.isGameOverShown || this.isVictory) return;
        this.isGameOverShown = true;
        this.isRunning = false;
        this.stopLoop();
        this.stopTimers();

        if (window.audio) window.audio.play('gameover');

        if (reason.includes('натяжен') || reason.includes('не выдержала')) {
            this.gameOverTitle.textContent = 'Цепь не выдержала';
        } else if (reason.includes('удар')) {
            this.gameOverTitle.textContent = 'Цепь лопнула от удара';
        } else if (reason.includes('лёд') || reason.includes('лед')) {
            this.gameOverTitle.textContent = 'Цепь застыла и треснула';
        } else if (reason.includes('порвал') || reason.includes('разрыв')) {
            this.gameOverTitle.textContent = 'Цепь порвалась';
        } else if (reason.includes('упал')) {
            this.gameOverTitle.textContent = 'Груз упал';
        } else {
            this.gameOverTitle.textContent = 'Игра окончена';
        }

        this.fillGameOverStats();
        setOverlay(this.pauseScreen, false);
        setOverlay(this.levelCompleteScreen, false);
        setTimeout(() => setOverlay(this.gameOverScreen, true), 280);
        this.checkHighScore();
    }

    setupOverlayButtons() {
        document.getElementById('restartBtn').addEventListener('click', () => {
            if (window.audio) window.audio.play('click');
            this.hideAllOverlays();
            this.restart();
        });

        document.getElementById('menuBtnGameOver').addEventListener('click', () => {
            if (window.audio) window.audio.play('click');
            this.goToMenu();
        });

        document.getElementById('resumeBtn').addEventListener('click', () => {
            if (window.audio) window.audio.play('click');
            this.resume();
        });

        document.getElementById('pauseRestartBtn').addEventListener('click', () => {
            if (window.audio) window.audio.play('click');
            this.hideAllOverlays();
            this.restart();
        });

        document.getElementById('pauseMenuBtn').addEventListener('click', () => {
            if (window.audio) window.audio.play('click');
            this.goToMenu();
        });

        this.nextLevelBtn.addEventListener('click', (e) => {
            if (window.audio) window.audio.play('click');
            this.advanceLevel(e);
        });

        document.getElementById('pauseBtn').addEventListener('click', () => {
            if (this.isPaused) this.resume();
            else this.pause();
        });
    }

    goToMenu() {
        this.stop();
        if (window.menu) window.menu.showMenu();
    }

    onKey(e) {
        const playing = this.gameContainerVisible();
        if (!playing) return;
        if (e.key === 'Escape') {
            e.preventDefault();
            if (this.isGameOverShown || this.isVictory || this.isLevelTransitioning) return;
            if (this.isPaused) this.resume();
            else this.pause();
        }
    }

    gameContainerVisible() {
        const el = document.getElementById('gameContainer');
        return el && el.style.display !== 'none';
    }

    async checkHighScore() {
        try {
            const response = await fetch('/api/score');
            const data = await response.json();
            if (this.score > (data.highScore || 0)) {
                await fetch('/api/score', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ score: this.score })
                });
                if (window.menu) window.menu.loadHighScore();
            }
        } catch (error) {}
    }

    setupControls() {
        const onPointer = (clientX, clientY) => {
            if (this.isPaused || this.isGameOverShown) return;
            if (!this.pointerReady || Date.now() < this.safeUntil) {
                this.placeChainAtPointer(clientX, clientY);
                return;
            }
            const p = this.toLocal(clientX, clientY);
            this.physics.setMouse(p.x, p.y);
        };

        this.canvas.addEventListener('mousemove', (e) => {
            this.lastClientX = e.clientX;
            this.lastClientY = e.clientY;
            onPointer(e.clientX, e.clientY);
        });

        this.canvas.addEventListener('mouseenter', (e) => {
            if (!this.pointerReady) onPointer(e.clientX, e.clientY);
        });

        window.addEventListener('mousemove', (e) => {
            this.lastClientX = e.clientX;
            this.lastClientY = e.clientY;
            if (!this.isRunning || this.isPaused) return;
            if (!this.pointerReady || Date.now() < this.safeUntil) {
                onPointer(e.clientX, e.clientY);
            }
        });

        this.canvas.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            if (touch) onPointer(touch.clientX, touch.clientY);
        }, { passive: true });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            if (touch) onPointer(touch.clientX, touch.clientY);
        }, { passive: false });
    }

    updateEffects() {
        for (const block of this.blocks) {
            if (block.shake > 0) block.shake *= 0.82;
            if (block.shake < 0.4) block.shake = 0;
        }

        for (const p of this.particles) {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.12;
            p.life -= 0.02;
        }
        this.particles = this.particles.filter((p) => p.life > 0);

        for (const item of this.scoreFloats) {
            item.y -= 0.8;
            item.life -= 0.018;
        }
        this.scoreFloats = this.scoreFloats.filter((item) => item.life > 0);
    }

    gameLoop() {
        if (!this.isRunning || this.isPaused) return;

        if (this.isFalling) {
            this.fallingVelocityY += 0.8;
            this.fallingHead.x += this.fallingVelocityX;
            this.fallingHead.y += this.fallingVelocityY;
            const elapsed = (Date.now() - this.fallStartTime) / 1000;

            if (this.fallingHead.y > this.HEIGHT + 100) {
                this.showGameOver(this.breakReason || 'Груз упал!');
            } else if (elapsed > 2.0 && !this.isGameOverShown) {
                this.showGameOver(this.breakReason || 'Цепь порвалась!');
            }

            this.updateEffects();
            this.render();
            if (this.isRunning && !this.isPaused) {
                this.animationId = requestAnimationFrame(() => this.gameLoop());
            }
            return;
        }

        this.physics.update();
        const head = this.physics.getHead();
        const anchor = this.physics.getPoints()[0];

        if (head && anchor && !this.isLevelTransitioning) {
            if (this.updateTension()) {
                this.render();
                this.animationId = requestAnimationFrame(() => this.gameLoop());
                return;
            }

            if (head.y > this.HEIGHT + 40 && this.isRunning) {
                this.showGameOver('Груз упал!');
                return;
            }
        }

        this.updateGoldTimers();
        this.checkCollisions();
        this.checkLevelComplete();
        this.updateEffects();
        this.render();
        if (this.isRunning && !this.isPaused) {
            this.animationId = requestAnimationFrame(() => this.gameLoop());
        }
    }

    render() {
        const now = Date.now();
        this.renderer.clear();
        this.renderer.drawBackground(now);
        this.renderer.drawBlocks(this.blocks, now);
        this.renderer.drawParticles(this.particles);
        this.renderer.drawScoreFloats(this.scoreFloats);

        const points = this.physics.getPoints();
        this.renderer.drawChain(points, this.physics.isSlippery(), this.tension);
        this.renderer.drawTensionBar(this.tension, this.physics.isSlippery());

        if (!this.isFalling && points.length > 1) {
            this.renderer.drawHead(points[points.length - 1]);
        }
        if (this.isFalling && this.fallingHead) {
            this.renderer.drawFallingHead(this.fallingHead, points);
        }
    }
}
