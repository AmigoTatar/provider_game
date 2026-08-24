// ============================================
// ФИЗИКА ЦЕПИ (Verlet Integration)
// ============================================

class Physics {
    constructor(canvasWidth, canvasHeight) {
        this.WIDTH = canvasWidth;
        this.HEIGHT = canvasHeight;
        this.points = [];
        this.NUM_POINTS = 14;
        this.TARGET_DIST = 12;
        this.CONSTRAINT_ITERS = 5;
        this.gravity = 0.6;
        this.stiffness = 0.95;
        this.mouseX = 250;
        this.mouseY = 80;
        this.lastMouseX = 250;
        this.lastMouseY = 80;
        this.mouseSpeed = 0;
        this.slipperyUntil = 0;

        this.initChain();
    }

    get restLength() {
        return (this.NUM_POINTS - 1) * this.TARGET_DIST;
    }

    get breakDistance() {
        return this.restLength * 2.7;
    }

    initChain(anchorX = 250, anchorY = 80) {
        this.points = [];
        this.slipperyUntil = 0;
        this.mouseSpeed = 0;
        this.mouseX = anchorX;
        this.mouseY = anchorY;
        this.lastMouseX = anchorX;
        this.lastMouseY = anchorY;
        for (let i = 0; i < this.NUM_POINTS; i++) {
            const x = anchorX;
            const y = anchorY + i * this.TARGET_DIST;
            this.points.push({
                x,
                y,
                oldX: x,
                oldY: y
            });
        }
    }

    isSlippery() {
        return Date.now() < this.slipperyUntil;
    }

    makeSlippery(durationMs) {
        this.slipperyUntil = Date.now() + durationMs;
    }

    update() {
        const slippery = this.isSlippery();
        const damp = slippery ? 0.9905 : this.stiffness;
        const pull = slippery ? 0.302 : 0.5;
        const gravity = slippery ? this.gravity * 0.865 : this.gravity;

        for (let i = 1; i < this.points.length; i++) {
            const p = this.points[i];
            const vx = (p.x - p.oldX) * damp;
            const vy = (p.y - p.oldY) * damp;
            p.oldX = p.x;
            p.oldY = p.y;
            p.x += vx;
            p.y += vy + gravity;
        }
        this.mouseSpeed *= 0.82;

        for (let p of this.points) {
            if (p.x < 0) {
                p.x = 0;
                p.oldX = 0;
            }
            if (p.x > this.WIDTH) {
                p.x = this.WIDTH;
                p.oldX = this.WIDTH;
            }
        }

        for (let k = 0; k < this.CONSTRAINT_ITERS; k++) {
            for (let i = 0; i < this.points.length - 1; i++) {
                const p1 = this.points[i];
                const p2 = this.points[i + 1];
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist === 0) continue;

                const diff = (dist - this.TARGET_DIST) / dist;
                if (i === 0) {
                    p2.x -= dx * diff;
                    p2.y -= dy * diff;
                } else {
                    p1.x += dx * diff * pull;
                    p1.y += dy * diff * pull;
                    p2.x -= dx * diff * pull;
                    p2.y -= dy * diff * pull;
                }
            }

            this.points[0].x = this.mouseX;
            this.points[0].y = this.mouseY;
            this.points[0].oldX = this.mouseX;
            this.points[0].oldY = this.mouseY;
        }
    }

    getHead() {
        return this.points[this.points.length - 1];
    }

    getPoints() {
        return this.points;
    }

    setMouse(x, y, snap = false) {
        if (snap) {
            this.mouseSpeed = 0;
            this.mouseX = x;
            this.mouseY = y;
            this.lastMouseX = x;
            this.lastMouseY = y;
            return;
        }
        this.mouseSpeed = Math.hypot(x - this.mouseX, y - this.mouseY);
        this.lastMouseX = this.mouseX;
        this.lastMouseY = this.mouseY;
        this.mouseX = x;
        this.mouseY = y;
    }

    getHeadSpeed() {
        const head = this.getHead();
        if (!head) return 0;
        return Math.hypot(head.x - head.oldX, head.y - head.oldY);
    }

    getStretchRatio() {
        if (this.points.length < 2) return 0;
        let length = 0;
        for (let i = 0; i < this.points.length - 1; i++) {
            const a = this.points[i];
            const b = this.points[i + 1];
            length += Math.hypot(b.x - a.x, b.y - a.y);
        }
        return length / this.restLength;
    }

    detachHead() {
        if (this.points.length > 1) {
            this.points.pop();
        }
    }
}
