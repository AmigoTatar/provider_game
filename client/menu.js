// ============================================
// МЕНЮ ИГРЫ
// ============================================

class Menu {
    constructor() {
        this.menuElement = document.getElementById('menu');
        this.gameContainer = document.getElementById('gameContainer');
        this.startBtn = document.getElementById('startBtn');
        this.highScoreElement = document.getElementById('highScore');
        this.selectedLevel = 1;
        this.gameInstance = new Game();
        window.game = this.gameInstance;

        this.setupListeners();
        this.loadHighScore();
        this.syncVolumeSliders();
    }

    setupListeners() {
        this.startBtn.addEventListener('click', (e) => {
            if (window.audio) {
                window.audio.ensure();
                window.audio.play('click');
            }
            this.startGame(e);
        });

        document.querySelectorAll('.level-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                if (window.audio) window.audio.play('click');
                this.selectedLevel = Number(btn.dataset.level);
                document.querySelectorAll('.level-btn').forEach((el) => el.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        const master = document.getElementById('volMaster');
        const sfx = document.getElementById('volSfx');
        master.addEventListener('input', () => {
            if (!window.audio) return;
            window.audio.ensure();
            window.audio.masterVolume = Number(master.value) / 100;
            window.audio.save();
        });
        sfx.addEventListener('input', () => {
            if (!window.audio) return;
            window.audio.ensure();
            window.audio.sfxVolume = Number(sfx.value) / 100;
            window.audio.save();
        });
        master.addEventListener('change', () => {
            if (window.audio) window.audio.play('click');
        });
    }

    syncVolumeSliders() {
        if (!window.audio) return;
        document.getElementById('volMaster').value = Math.round(window.audio.masterVolume * 100);
        document.getElementById('volSfx').value = Math.round(window.audio.sfxVolume * 100);
    }

    goToMenu() {
        if (this.gameInstance) this.gameInstance.stop();
        this.showMenu();
    }

    showMenu() {
        this.menuElement.classList.add('visible');
        this.menuElement.style.display = 'flex';
        this.gameContainer.style.display = 'none';
        this.gameContainer.classList.remove('visible');
        this.loadHighScore();
    }

    hideMenu() {
        this.menuElement.style.display = 'none';
        this.menuElement.classList.remove('visible');
        this.gameContainer.style.display = 'flex';
        this.gameContainer.classList.add('visible');
    }

    startGame(pointerEvent) {
        this.hideMenu();
        this.gameInstance.start(1, pointerEvent);
    }

    async loadHighScore() {
        try {
            const response = await fetch('/api/score');
            const data = await response.json();
            this.highScoreElement.textContent = `Рекорд: ${data.highScore || 0}`;
        } catch (error) {
            this.highScoreElement.textContent = 'Рекорд: 0';
        }
    }
}

window.onload = () => {
    window.menu = new Menu();
};
