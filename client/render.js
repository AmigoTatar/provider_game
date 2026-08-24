// ============================================
// ОТРИСОВКА
// ============================================

class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.WIDTH = canvas.width;
        this.HEIGHT = canvas.height;
    }
    
    // Отрисовка блоков
    drawBlocks(blocks) {
        for (let block of blocks) {
            if (block.hp > 0) {
                // Заливка блока
                this.ctx.fillStyle = block.color;
                this.ctx.fillRect(block.x, block.y, block.w, block.h);
                
                // Обводка
                this.ctx.strokeStyle = 'white';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(block.x, block.y, block.w, block.h);
                
                // Текст HP
                this.ctx.fillStyle = 'white';
                this.ctx.font = 'bold 24px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(block.hp, block.x + block.w/2, block.y + block.h/2);
            } else {
                // Разрушенный блок
                this.ctx.fillStyle = '#2a2a2a';
                this.ctx.fillRect(block.x, block.y, block.w, block.h);
                this.ctx.fillStyle = '#888';
                this.ctx.font = '30px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText('💥', block.x + block.w/2, block.y + block.h/2);
            }
        }
    }
    
    // Отрисовка цепи
    drawChain(points) {
        // Цепь
        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            this.ctx.lineTo(points[i].x, points[i].y);
        }
        this.ctx.strokeStyle = '#ff6b6b';
        this.ctx.lineWidth = 4;
        this.ctx.stroke();
        
        // Груз (последняя точка)
        const head = points[points.length - 1];
        
        // Свечение груза
        const gradient = this.ctx.createRadialGradient(head.x, head.y, 2, head.x, head.y, 25);
        gradient.addColorStop(0, 'rgba(255, 217, 61, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 217, 61, 0)');
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(head.x, head.y, 25, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Сам груз
        this.ctx.beginPath();
        this.ctx.arc(head.x, head.y, 14, 0, Math.PI * 2);
        this.ctx.fillStyle = '#ffd93d';
        this.ctx.fill();
        this.ctx.strokeStyle = '#f0932b';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        
        // Точка крепления (первая точка)
        this.ctx.beginPath();
        this.ctx.arc(points[0].x, points[0].y, 8, 0, Math.PI * 2);
        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.fill();
        this.ctx.strokeStyle = '#ff4757';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Свечение точки крепления
        const glow = this.ctx.createRadialGradient(points[0].x, points[0].y, 2, points[0].x, points[0].y, 20);
        glow.addColorStop(0, 'rgba(255, 107, 107, 0.4)');
        glow.addColorStop(1, 'rgba(255, 107, 107, 0)');
        this.ctx.fillStyle = glow;
        this.ctx.beginPath();
        this.ctx.arc(points[0].x, points[0].y, 20, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    // Очистка экрана
    clear() {
        this.ctx.clearRect(0, 0, this.WIDTH, this.HEIGHT);
    }
}