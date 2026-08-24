// ============================================
// ФИЗИКА ЦЕПИ (Verlet Integration)
// ============================================

class Physics {
    constructor(canvasWidth, canvasHeight) {
        this.WIDTH = canvasWidth;
        this.HEIGHT = canvasHeight;
        this.points = [];
        this.NUM_POINTS = 12;
        this.TARGET_DIST = 8;
        this.gravity = 0.6;
        this.stiffness = 0.95;
        this.mouseX = 250;
        this.mouseY = 100;
        
        this.initChain();
    }
    
    // Создаем цепь
    initChain() {
        this.points = [];
        for (let i = 0; i < this.NUM_POINTS; i++) {
            this.points.push({
                x: 250,
                y: 50 + i * 12,
                oldX: 250,
                oldY: 50 + i * 12
            });
        }
    }
    
    // Обновление физики
    update() {
        // 1. Обновляем все точки
        for (let p of this.points) {
            const vx = (p.x - p.oldX) * this.stiffness;
            const vy = (p.y - p.oldY) * this.stiffness;
            p.oldX = p.x;
            p.oldY = p.y;
            p.x += vx;
            p.y += vy + this.gravity;
        }
        
        // 2. Ограничиваем движение (не вылетаем за экран)
        for (let p of this.points) {
            if (p.x < 0) { p.x = 0; p.oldX = 0; }
            if (p.x > this.WIDTH) { p.x = this.WIDTH; p.oldX = this.WIDTH; }
            if (p.y > this.HEIGHT) { p.y = this.HEIGHT; p.oldY = this.HEIGHT; }
        }
        
        // 3. Связи между точками (сохраняем длину)
        for (let i = 0; i < this.points.length - 1; i++) {
            const p1 = this.points[i];
            const p2 = this.points[i + 1];
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 0) {
                const diff = (dist - this.TARGET_DIST) / dist;
                p1.x += dx * diff * 0.5;
                p1.y += dy * diff * 0.5;
                p2.x -= dx * diff * 0.5;
                p2.y -= dy * diff * 0.5;
            }
        }
        
        // 4. Первая точка следует за мышкой
        this.points[0].x = this.mouseX;
        this.points[0].y = this.mouseY;
    }
    
    // Получить позицию груза (последняя точка)
    getHead() {
        return this.points[this.points.length - 1];
    }
    
    // Получить все точки
    getPoints() {
        return this.points;
    }
    
    // Обновить позицию мыши
    setMouse(x, y) {
        this.mouseX = x;
        this.mouseY = y;
    }
}