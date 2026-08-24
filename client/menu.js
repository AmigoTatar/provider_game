// ============================================
// МЕНЮ ИГРЫ
// ============================================

class Menu {
    constructor() {
        console.log('📋 Инициализация меню...');
        
        this.menuElement = document.getElementById('menu');
        this.gameContainer = document.getElementById('gameContainer');
        this.startBtn = document.getElementById('startBtn');
        this.highScoreElement = document.getElementById('highScore');
        this.gameInstance = null;
        
        // Проверяем что все элементы найдены
        if (!this.menuElement) console.error('❌ #menu не найден!');
        if (!this.gameContainer) console.error('❌ #gameContainer не найден!');
        if (!this.startBtn) console.error('❌ #startBtn не найден!');
        
        this.setupListeners();
        this.loadHighScore();
        
        console.log('✅ Меню инициализировано');
    }
    
    setupListeners() {
        this.startBtn.addEventListener('click', () => {
            console.log('🖱️ Клик по кнопке "Начать игру"');
            this.startGame();
        });
        
        const backBtn = document.getElementById('backToMenu');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                console.log('🖱️ Клик "Назад в меню"');
                this.goToMenu();
            });
        }
    }
    
    goToMenu() {
        // Останавливаем игру
        if (this.gameInstance) {
            this.gameInstance.pause();
        }
        // Показываем меню
        this.showMenu();
    }
    
    showMenu() {
        this.menuElement.style.display = 'flex';
        this.gameContainer.style.display = 'none';
        console.log('📋 Показано меню');
        // Обновляем рекорд
        this.loadHighScore();
    }
    
    hideMenu() {
        this.menuElement.style.display = 'none';
        this.gameContainer.style.display = 'block';
        console.log('🎮 Показана игра');
    }
    
    startGame() {
        console.log('🚀 Запуск игры...');
        
        if (this.gameInstance) {
            console.log('🔄 Возобновление существующей игры');
            this.hideMenu();
            this.gameInstance.resume();
            return;
        }
        
        try {
            console.log('🆕 Создание новой игры...');
            this.gameInstance = new Game();
            window.game = this.gameInstance;
            this.hideMenu();
            console.log('✅ Игра создана успешно!');
        } catch (error) {
            console.error('❌ Ошибка при создании игры:', error);
        }
    }
    
    async loadHighScore() {
        try {
            const response = await fetch('/api/score');
            const data = await response.json();
            this.highScoreElement.textContent = `🏆 Рекорд: ${data.highScore || 0}`;
        } catch (error) {
            console.log('⚠️ Не удалось загрузить рекорд');
            this.highScoreElement.textContent = '🏆 Рекорд: 0';
        }
    }
}

// ============================================
// ЗАПУСК МЕНЮ
// ============================================
window.onload = () => {
    console.log('🎮 Загрузка игры...');
    window.menu = new Menu();
    console.log('✅ Меню загружено!');
};