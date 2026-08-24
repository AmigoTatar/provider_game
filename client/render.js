// ============================================
// ОТРИСОВКА
// ============================================

class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.WIDTH = canvas.width;
        this.HEIGHT = canvas.height;
        this.stars = this.createStars(70);
        this.time = 0;
    }

    createStars(count) {
        const stars = [];
        for (let i = 0; i < count; i++) {
            stars.push({
                x: Math.random() * this.WIDTH,
                y: Math.random() * this.HEIGHT,
                r: Math.random() * 1.6 + 0.3,
                base: 0.2 + Math.random() * 0.5,
                speed: 0.5 + Math.random() * 2
            });
        }
        return stars;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.WIDTH, this.HEIGHT);
    }

    drawBackground(time) {
        this.time = time;
        const ctx = this.ctx;
        const g = ctx.createLinearGradient(0, 0, 0, this.HEIGHT);
        g.addColorStop(0, '#0d1024');
        g.addColorStop(1, '#16213e');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);

        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 1;
        const step = 40;
        for (let x = 0; x <= this.WIDTH; x += step) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.HEIGHT);
            ctx.stroke();
        }
        for (let y = 0; y <= this.HEIGHT; y += step) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.WIDTH, y);
            ctx.stroke();
        }

        for (const star of this.stars) {
            const twinkle = star.base + Math.sin(time * 0.003 * star.speed + star.x) * 0.25;
            ctx.beginPath();
            ctx.fillStyle = `rgba(255,255,255,${Math.max(0.05, twinkle)})`;
            ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawBlocks(blocks, time) {
        const ctx = this.ctx;
        for (const block of blocks) {
            if (block.hp <= 0) {
                ctx.fillStyle = 'rgba(42,42,42,0.55)';
                ctx.fillRect(block.x, block.y, block.w, block.h);
                ctx.fillStyle = '#666';
                ctx.font = '28px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('💥', block.x + block.w / 2, block.y + block.h / 2);
                continue;
            }

            const shakeX = block.shake > 0 ? (Math.random() - 0.5) * block.shake : 0;
            const shakeY = block.shake > 0 ? (Math.random() - 0.5) * block.shake : 0;
            const x = block.x + shakeX;
            const y = block.y + shakeY;

            if (block.type === 'gold') {
                const pulse = 0.45 + Math.sin(time / 180) * 0.25;
                ctx.save();
                ctx.shadowColor = '#ffd700';
                ctx.shadowBlur = 18 + pulse * 16;
                ctx.fillStyle = `rgba(255, 215, 0, ${0.18 + pulse * 0.15})`;
                ctx.fillRect(x - 6, y - 6, block.w + 12, block.h + 12);
                ctx.restore();
            }

            const fill = ctx.createLinearGradient(x, y, x, y + block.h);
            if (block.type === 'ice') {
                fill.addColorStop(0, '#7fefff');
                fill.addColorStop(1, '#00b4d8');
            } else if (block.type === 'strong') {
                fill.addColorStop(0, '#c2b8ff');
                fill.addColorStop(1, '#6c5ce7');
            } else if (block.type === 'gold') {
                fill.addColorStop(0, '#ffeaa7');
                fill.addColorStop(1, '#f1c40f');
            } else {
                fill.addColorStop(0, '#ff8a8a');
                fill.addColorStop(1, '#e74c3c');
            }

            ctx.fillStyle = fill;
            ctx.fillRect(x, y, block.w, block.h);
            ctx.strokeStyle = 'rgba(255,255,255,0.4)';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, block.w, block.h);

            if (block.type === 'gold' && block.expiresAt) {
                const left = Math.max(0, (block.expiresAt - time) / block.lifetime);
                ctx.fillStyle = 'rgba(0,0,0,0.35)';
                ctx.fillRect(x + 6, y + block.h - 12, block.w - 12, 5);
                ctx.fillStyle = '#fff8dc';
                ctx.fillRect(x + 6, y + block.h - 12, (block.w - 12) * left, 5);
            }

            ctx.fillStyle = 'white';
            ctx.font = 'bold 22px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(block.hp), x + block.w / 2, y + block.h / 2 - (block.type === 'gold' ? 4 : 0));
        }
    }

    drawParticles(particles) {
        const ctx = this.ctx;
        for (const p of particles) {
            ctx.beginPath();
            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    drawScoreFloats(items) {
        const ctx = this.ctx;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (const item of items) {
            ctx.globalAlpha = Math.max(0, item.life);
            ctx.fillStyle = item.color || '#ffd93d';
            ctx.font = `bold ${18 + (item.big ? 6 : 0)}px Arial`;
            ctx.fillText(item.text, item.x, item.y);
            ctx.globalAlpha = 1;
        }
    }

    drawChain(points, slippery, tension = 0) {
        if (points.length < 2) return;
        const ctx = this.ctx;
        const heat = Math.max(0, Math.min(1, tension / 100));
        let stroke = slippery ? '#7fefff' : '#ff6b6b';
        let glow = slippery ? 'rgba(0,210,255,0.45)' : 'rgba(255,107,107,0.35)';
        if (!slippery && heat > 0.35) {
            const r = Math.round(255);
            const g = Math.round(107 - heat * 90);
            const b = Math.round(107 - heat * 80);
            stroke = `rgb(${r},${g},${b})`;
            glow = `rgba(255, ${Math.round(80 - heat * 60)}, 0, ${0.3 + heat * 0.45})`;
        }
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 4 + (heat > 0.7 ? Math.sin(Date.now() / 70) * 0.8 : 0);
        ctx.shadowColor = glow;
        ctx.shadowBlur = 8 + heat * 10;
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.beginPath();
        ctx.arc(points[0].x, points[0].y, 8, 0, Math.PI * 2);
        ctx.fillStyle = slippery ? '#00d2ff' : stroke;
        ctx.fill();
        ctx.strokeStyle = slippery ? '#74b9ff' : '#ff4757';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    drawTensionBar(tension, icy) {
        const ctx = this.ctx;
        const x = 16;
        const y = this.HEIGHT - 22;
        const w = this.WIDTH - 32;
        const h = 8;
        const fill = Math.max(0, Math.min(1, tension / 100));

        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = 'rgba(255,255,255,0.18)';
        ctx.strokeRect(x, y, w, h);

        const g = ctx.createLinearGradient(x, y, x + w, y);
        g.addColorStop(0, icy ? '#7fefff' : '#6bcb77');
        g.addColorStop(0.55, '#ffd93d');
        g.addColorStop(1, '#ff4757');
        ctx.fillStyle = g;
        ctx.fillRect(x, y, w * fill, h);

        ctx.fillStyle = fill > 0.72 ? '#ff6b6b' : 'rgba(255,255,255,0.7)';
        ctx.font = '11px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(icy ? 'натяжение · лёд' : 'натяжение', x, y - 3);
    }

    drawHead(head) {
        if (!head) return;
        const ctx = this.ctx;
        const gradient = ctx.createRadialGradient(head.x, head.y, 2, head.x, head.y, 25);
        gradient.addColorStop(0, 'rgba(255,217,61,0.8)');
        gradient.addColorStop(1, 'rgba(255,217,61,0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(head.x, head.y, 25, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(head.x, head.y, 14, 0, Math.PI * 2);
        ctx.fillStyle = '#ffd93d';
        ctx.fill();
        ctx.strokeStyle = '#f0932b';
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    drawFallingHead(fh, points) {
        const ctx = this.ctx;
        const glow = ctx.createRadialGradient(fh.x, fh.y, 5, fh.x, fh.y, 60);
        glow.addColorStop(0, 'rgba(255, 50, 0, 0.9)');
        glow.addColorStop(0.3, 'rgba(255, 0, 0, 0.6)');
        glow.addColorStop(1, 'rgba(255, 0, 0, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(fh.x, fh.y, 60, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(fh.x, fh.y, 18, 0, Math.PI * 2);
        ctx.fillStyle = '#ff2200';
        ctx.fill();
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 3;
        ctx.shadowColor = 'rgba(255,0,0,0.8)';
        ctx.shadowBlur = 20;
        ctx.stroke();
        ctx.shadowBlur = 0;

        const t = Date.now() / 200;
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2 + t;
            const radius = 22 + Math.sin(t + i) * 6;
            ctx.beginPath();
            ctx.arc(
                fh.x + Math.cos(angle) * radius,
                fh.y + Math.sin(angle) * radius,
                3 + Math.sin(t * 1.5 + i) * 2,
                0,
                Math.PI * 2
            );
            ctx.fillStyle = `rgba(255, ${150 + Math.sin(t + i) * 80}, 0, 0.8)`;
            ctx.fill();
        }

        ctx.fillStyle = 'white';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💥', fh.x, fh.y - 2);

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
