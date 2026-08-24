// ============================================
// ОСНОВНАЯ ЛОГИКА ИГРЫ
// ============================================

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.destroyedElement = document.getElementById('destroyed');
        
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.finalScore = document.getElementById('finalScore');
        this.finalDestroyed = document.getElementById('finalDestroyed');
        this.restartBtn = document.getElementById('restartBtn');
        this.menuBtnGameOver = document.getElementById('menuBtnGameOver');
        
        this.WIDTH = this.canvas.width;
        this.HEIGHT = this.canvas.height;
        
        this.physics = new Physics(this.WIDTH, this.HEIGHT);
        
        this.score = 0;
        this.destroyedBlocks = 0;
        this.blocks = [];
        this.isRunning = true;
        this.animationId = null;
        
        // ДЛЯ ПАДАЮЩЕГО ГРУЗА
        this.fallingHead = null;      // {x, y}
        this.fallingVelocityY = 0;
        this.fallingVelocityX = 0;
        this.isFalling = false;
        this.isGameOverShown = false;
        this.fallStartTime = 0;
        
        this.initBlocks();
        this.setupControls();
        this.setupGameOverButtons();
        this.gameLoop();
    }
    
    showGameOver(reason = 'Игра окончена!') {
        if (this.isGameOverShown) return;
        this.isGameOverShown = true;
        
        console.log(`💥 ${reason}`);
        this.isRunning = false;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        this.finalScore.textContent = this.score;
        this.finalDestroyed.textContent = this.destroyedBlocks;
        
        const title = this.gameOverScreen.querySelector('h2');
        if (reason.includes('порвалась')) {
            title.textContent = '💥 ЦЕПЬ ПОРВАЛАСЬ!';
        } else {
            title.textContent = '💥 ИГРА ОКОНЧЕНА';
        }
        
        setTimeout(() => {
            this.gameOverScreen.style.display = 'block';
        }, 500);
        
        this.checkHighScore();
    }
    
    setupGameOverButtons() {
        this.restartBtn.addEventListener('click', () => {
            this.gameOverScreen.style.display = 'none';
            this.isFalling = false;
            this.fallingHead = null;
            this.isGameOverShown = false;
            this.restart();
            document.getElementById('menu').style.display = 'none';
            document.getElementById('gameContainer').style.display = 'block';
        });
        
        this.menuBtnGameOver.addEventListener('click', () => {
            this.gameOverScreen.style.display = 'none';
            this.isFalling = false;
            this.fallingHead = null;
            this.isGameOverShown = false;
            this.isRunning = false;
            if (window.menu) {
                window.menu.showMenu();
            }
        });
    }
    
    restart() {
        console.log('🔄 Перезапуск...');
        this.score = 0;
        this.destroyedBlocks = 0;
        this.scoreElement.textContent = '0';
        this.destroyedElement.textContent = '0';
        
        this.isFalling = false;
        this.fallingHead = null;
        this.fallingVelocityY = 0;
        this.fallingVelocityX = 0;
        this.isGameOverShown = false;
        
        this.physics.initChain();
        this.physics.mouseX = 250;
        this.physics.mouseY = 100;
        
        this.initBlocks();
        this.isRunning = true;
        this.gameLoop();
    }
    
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
    }
    
    checkCollisions() {
        if (this.isFalling) return;
        
        const head = this.physics.getHead();
        if (!head) return;
        
        for (let block of this.blocks) {
            if (block.hp <= 0) continue;
            
            if (head.x > block.x && head.x < block.x + block.w &&
                head.y > block.y && head.y < block.y + block.h) {
                
                block.hp--;
                this.score += 10;
                this.scoreElement.textContent = this.score;
                
                const centerX = block.x + block.w / 2;
                const centerY = block.y + block.h / 2;
                head.x += (head.x - centerX) * 0.5;
                head.y += (head.y - centerY) * 0.5;
                
                if (block.hp === 2) block.color = '#ffd93d';
                else if (block.hp === 1) block.color = '#6bcbff';
                else if (block.hp === 0) {
                    block.color = '#4a4a4a';
                    this.destroyedBlocks++;
                    this.destroyedElement.textContent = this.destroyedBlocks;
                    this.score += 20;
                    this.scoreElement.textContent = this.score;
                    this.checkHighScore();
                }
            }
        }
    }
    
    async checkHighScore() {
        try {
            const response = await fetch('/api/score');
            const data = await response.json();
            if (this.score > data.highScore) {
                await fetch('/api/score', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ score: this.score })
                });
                if (window.menu) {
                    window.menu.loadHighScore();
                }
            }
        } catch (error) {}
    }
    
    checkRespawn() {
        if (this.isFalling) return;
        
        let allDestroyed = true;
        for (let block of this.blocks) {
            if (block.hp > 0) {
                allDestroyed = false;
                break;
            }
        }
        
        if (allDestroyed && this.blocks.length > 0) {
            setTimeout(() => {
                this.initBlocks();
            }, 1000);
        }
    }
    
    setupControls() {
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            this.physics.setMouse(
                (e.clientX - rect.left) * scaleX,
                (e.clientY - rect.top) * scaleY
            );
        });
        
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
    
    gameLoop() {
        if (!this.isRunning) return;
        
        // === Если груз падает ===
        if (this.isFalling) {
            // Обновляем физику падения
            this.fallingVelocityY += 0.8;
            this.fallingHead.x += this.fallingVelocityX;
            this.fallingHead.y += this.fallingVelocityY;
            
            // Проверяем время падения
            const elapsed = (Date.now() - this.fallStartTime) / 1000;
            
            // Если упал за экран или прошло 2 секунды
            if (this.fallingHead.y > this.HEIGHT + 100) {
                this.showGameOver('Груз упал!');
            } else if (elapsed > 2.0 && !this.isGameOverShown) {
                this.showGameOver('Цепь порвалась!');
            }
            
            // Рисуем всё
            this.render();
            this.animationId = requestAnimationFrame(() => this.gameLoop());
            return;
        }
        
        // === Нормальный игровой цикл ===
        this.physics.update();
        
        const head = this.physics.getHead();
        const anchor = this.physics.getPoints()[0];
        
        if (head && anchor) {
            const dx = head.x - anchor.x;
            const dy = head.y - anchor.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // === РАЗРЫВ ЦЕПИ ===
            if (distance > 400 && this.isRunning && !this.isFalling) {
                console.log('💥 РАЗРЫВ! distance:', distance);
                
                // Сохраняем позицию груза
                this.fallingHead = {
                    x: head.x,
                    y: head.y
                };
                
                this.fallingVelocityX = (head.x - head.oldX) * 0.3;
                this.fallingVelocityY = (head.y - head.oldY) * 0.3 + 2;
                this.isFalling = true;
                this.fallStartTime = Date.now();
                
                // Удаляем груз из цепи
                this.physics.points.pop();
                
                this.render();
                this.animationId = requestAnimationFrame(() => this.gameLoop());
                return;
            }
            
            // Груз упал ниже экрана
            if (head.y > this.HEIGHT + 50 && this.isRunning) {
                this.showGameOver('Груз упал!');
                return;
            }
        }
        
        this.checkCollisions();
        this.checkRespawn();
        this.render();
        
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }
    
    // ===== ОТРИСОВКА =====
    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.WIDTH, this.HEIGHT);
        
        // === БЛОКИ ===
        for (let block of this.blocks) {
            if (block.hp > 0) {
                ctx.fillStyle = block.color;
                ctx.fillRect(block.x, block.y, block.w, block.h);
                ctx.strokeStyle = 'rgba(255,255,255,0.3)';
                ctx.lineWidth = 2;
                ctx.strokeRect(block.x, block.y, block.w, block.h);
                
                ctx.fillStyle = 'white';
                ctx.font = 'bold 24px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(block.hp, block.x + block.w/2, block.y + block.h/2);
            } else {
                ctx.fillStyle = '#2a2a2a';
                ctx.fillRect(block.x, block.y, block.w, block.h);
                ctx.fillStyle = '#666';
                ctx.font = '30px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('💥', block.x + block.w/2, block.y + block.h/2);
            }
        }
        
        const points = this.physics.getPoints();
        
        // === ЦЕПЬ ===
        if (points.length > 1) {
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.strokeStyle = '#ff6b6b';
            ctx.lineWidth = 4;
            ctx.shadowColor = 'rgba(255,107,107,0.3)';
            ctx.shadowBlur = 8;
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
        
        // === ТОЧКА КРЕПЛЕНИЯ ===
        if (points.length > 0) {
            ctx.beginPath();
            ctx.arc(points[0].x, points[0].y, 8, 0, Math.PI * 2);
            ctx.fillStyle = '#ff6b6b';
            ctx.fill();
            ctx.strokeStyle = '#ff4757';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        // === ГРУЗ (если он есть в цепи) ===
        if (!this.isFalling && points.length > 1) {
            const head = points[points.length - 1];
            
            // Свечение
            const gradient = ctx.createRadialGradient(head.x, head.y, 2, head.x, head.y, 25);
            gradient.addColorStop(0, 'rgba(255,217,61,0.8)');
            gradient.addColorStop(1, 'rgba(255,217,61,0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(head.x, head.y, 25, 0, Math.PI * 2);
            ctx.fill();
            
            // Шар
            ctx.beginPath();
            ctx.arc(head.x, head.y, 14, 0, Math.PI * 2);
            ctx.fillStyle = '#ffd93d';
            ctx.fill();
            ctx.strokeStyle = '#f0932b';
            ctx.lineWidth = 3;
            ctx.stroke();
        }
        
        // === ПАДАЮЩИЙ ГРУЗ ===
        if (this.isFalling && this.fallingHead) {
            const fh = this.fallingHead;
            
            // Большое красное свечение
            const glow = ctx.createRadialGradient(fh.x, fh.y, 5, fh.x, fh.y, 60);
            glow.addColorStop(0, 'rgba(255, 50, 0, 0.9)');
            glow.addColorStop(0.3, 'rgba(255, 0, 0, 0.6)');
            glow.addColorStop(1, 'rgba(255, 0, 0, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(fh.x, fh.y, 60, 0, Math.PI * 2);
            ctx.fill();
            
            // Красный шар
            const ballGrad = ctx.createRadialGradient(fh.x - 5, fh.y - 5, 3, fh.x, fh.y, 18);
            ballGrad.addColorStop(0, '#ff6b35');
            ballGrad.addColorStop(0.5, '#ff2200');
            ballGrad.addColorStop(1, '#990000');
            
            ctx.beginPath();
            ctx.arc(fh.x, fh.y, 18, 0, Math.PI * 2);
            ctx.fillStyle = ballGrad;
            ctx.fill();
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 3;
            ctx.shadowColor = 'rgba(255,0,0,0.8)';
            ctx.shadowBlur = 20;
            ctx.stroke();
            ctx.shadowBlur = 0;
            
            // Огненные искры вокруг
            const time = Date.now() / 200;
            for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2 + time;
                const radius = 22 + Math.sin(time + i) * 6;
                const sx = fh.x + Math.cos(angle) * radius;
                const sy = fh.y + Math.sin(angle) * radius;
                
                ctx.beginPath();
                ctx.arc(sx, sy, 3 + Math.sin(time * 1.5 + i) * 2, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, ${150 + Math.sin(time + i) * 80}, 0, 0.8)`;
                ctx.fill();
            }
            
            // Текст 💥
            ctx.fillStyle = 'white';
            ctx.font = 'bold 28px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = 'rgba(255,0,0,0.5)';
            ctx.shadowBlur = 15;
            ctx.fillText('💥', fh.x, fh.y - 2);
            ctx.shadowBlur = 0;
            
            // Оборванная цепь (пунктир)
            if (points.length > 0) {
                const last = points[points.length - 1];
                ctx.beginPath();
                ctx.moveTo(last.x, last.y);
                ctx.lineTo(last.x + (fh.x - last.x) * 0.3, last.y + (fh.y - last.y) * 0.3);
                ctx.strokeStyle = 'rgba(255, 50, 0, 0.4)';
                ctx.lineWidth = 2;
                ctx.setLineDash([6, 6]);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }
    }
}

console.log('🎮 Game loaded!');