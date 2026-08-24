// ============================================
// ОСНОВНАЯ ЛОГИКА ИГРЫ
// ============================================

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.scoreElement = document.getElementById('score');
        this.destroyedElement = document.getElementById('destroyed');
        
        this.WIDTH = this.canvas.width;
        this.HEIGHT = this.canvas.height;
        
        // Инициализируем модули
        this.physics = new Physics(this.WIDTH, this.HEIGHT);
        this.renderer = new Renderer(this.canvas);
        
        this.score = 0;
        this.destroyedBlocks = 0;
        this.blocks = [];
        this.isRunning = true;
        this.animationId = null; // Добавляем ID анимации
        
        this.initBlocks();
        this.setupControls();
        this.gameLoop();
    }
    
    // Перезапуск игры
    restart() {
        console.log('🔄 Перезапуск игры...');
        
        // Сброс счета
        this.score = 0;
        this.destroyedBlocks = 0;
        this.scoreElement.textContent = '0';
        this.destroyedElement.textContent = '0';
        
        // Сбрасываем физику
        this.physics.initChain();
        this.physics.mouseX = 250;
        this.physics.mouseY = 100;
        
        // Создаем новые блоки
        this.initBlocks();
        
        // Запускаем цикл
        this.isRunning = true;
        this.gameLoop();
        
        console.log('✅ Игра перезапущена!');
    }
    
    // Возобновление игры (после паузы)
    resume() {
        console.log('▶️ Возобновление игры...');
        this.isRunning = true;
        this.gameLoop();
    }
    
    // Остановка игры
    pause() {
        console.log('⏸️ Пауза игры');
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    // Создаем блоки
    initBlocks() {
        this.blocks = [];
        const blockData = [
            { x: 50, y: 250, w: 70, h: 50 },
            { x: 150, y: 230, w: 80, h: 55 },
            { x: 280, y: 250, w: 60, h: 50 },
            { x: 380, y: 220, w: 75, h: 60 },
            { x: 80, y: 380, w: 90, h: 45 },
            { x: 250, y: 370, w: 70, h: 55 },
            { x: 380, y: 380, w: 80, h: 50 },
            { x: 160, y: 480, w: 65, h: 50 }
        ];
        
        for (let data of blockData) {
            this.blocks.push({
                x: data.x,
                y: data.y,
                w: data.w,
                h: data.h,
                hp: 3,
                maxHp: 3,
                color: '#ff6b6b'
            });
        }
        
        console.log(`📦 Создано ${this.blocks.length} блоков`);
    }
    
    // Проверка столкновений
    checkCollisions() {
        const head = this.physics.getHead();
        
        for (let block of this.blocks) {
            if (block.hp <= 0) continue;
            
            if (head.x > block.x && head.x < block.x + block.w &&
                head.y > block.y && head.y < block.y + block.h) {
                
                block.hp--;
                this.score += 10;
                this.scoreElement.textContent = this.score;
                
                // Отталкиваем груз
                const centerX = block.x + block.w / 2;
                const centerY = block.y + block.h / 2;
                head.x += (head.x - centerX) * 0.5;
                head.y += (head.y - centerY) * 0.5;
                
                // Меняем цвет
                if (block.hp === 2) block.color = '#ffd93d';
                else if (block.hp === 1) block.color = '#6bcbff';
                else if (block.hp === 0) {
                    block.color = '#4a4a4a';
                    this.destroyedBlocks++;
                    this.destroyedElement.textContent = this.destroyedBlocks;
                    this.score += 20;
                    this.scoreElement.textContent = this.score;
                    
                    // Проверяем рекорд
                    this.checkHighScore();
                }
            }
        }
    }
    
    // Проверка рекорда
    async checkHighScore() {
        try {
            const response = await fetch('/api/score');
            const data = await response.json();
            if (this.score > data.highScore) {
                // Сохраняем рекорд
                await fetch('/api/score', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ score: this.score })
                });
                console.log(`🏆 Новый рекорд: ${this.score}!`);
                // Обновляем в меню
                if (window.menu) {
                    window.menu.loadHighScore();
                }
            }
        } catch (error) {
            console.log('Ошибка при проверке рекорда');
        }
    }
    
    // Проверка респауна
    checkRespawn() {
        let allDestroyed = true;
        for (let block of this.blocks) {
            if (block.hp > 0) {
                allDestroyed = false;
                break;
            }
        }
        
        if (allDestroyed && this.blocks.length > 0) {
            console.log('🔄 Все блоки разрушены! Создаем новые...');
            setTimeout(() => {
                this.initBlocks();
                console.log(`📦 Создано ${this.blocks.length} новых блоков!`);
            }, 1000);
        }
    }
    
    // Настройка управления
    setupControls() {
        // Мышь
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            this.physics.setMouse(
                (e.clientX - rect.left) * scaleX,
                (e.clientY - rect.top) * scaleY
            );
        });
        
        // Тач (Android)
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            this.physics.setMouse(
                (touch.clientX - rect.left) * scaleX,
                (touch.clientY - rect.top) * scaleY
            );
        }, { passive: false });
    }
    
    // Главный игровой цикл
    gameLoop() {
        if (!this.isRunning) {
            console.log('⏸️ Цикл остановлен');
            return;
        }
        
        this.physics.update();
        this.checkCollisions();
        this.checkRespawn();
        
        this.renderer.clear();
        this.renderer.drawBlocks(this.blocks);
        this.renderer.drawChain(this.physics.getPoints());
        
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }
}

// ============================================
// ЭКСПОРТ КЛАССА
// ============================================
console.log('🎮 Класс Game загружен!');