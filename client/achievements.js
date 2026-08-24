// ============================================
// СИСТЕМА ДОСТИЖЕНИЙ
// ============================================

const ACHIEVEMENT_DEFS = [
    { id: 'score100', title: 'Первые 100 очков', desc: 'Наберите 100 очков за одну игру' },
    { id: 'blocks50', title: 'Разрушить 50 блоков', desc: 'Уничтожьте 50 блоков за всё время' },
    { id: 'levels3', title: 'Пройти 3 волны', desc: 'Пройдите 3 волны в одном забеге' },
    { id: 'wave10', title: '10 волн', desc: 'Пройдите 10 волн за один забег' },
    { id: 'wave25', title: 'Глубокая медитация', desc: 'Пройдите 25 волн за один забег' }
];

class AchievementManager {
    constructor() {
        this.unlocked = new Set();
        this.totalDestroyed = 0;
        this.load();
    }

    load() {
        try {
            const raw = localStorage.getItem('provodnik-achievements');
            if (!raw) return;
            const data = JSON.parse(raw);
            this.unlocked = new Set(data.unlocked || []);
            this.totalDestroyed = data.totalDestroyed || 0;
        } catch (e) {}
    }

    save() {
        localStorage.setItem('provodnik-achievements', JSON.stringify({
            unlocked: [...this.unlocked],
            totalDestroyed: this.totalDestroyed
        }));
    }

    unlock(id) {
        if (this.unlocked.has(id)) return false;
        const def = ACHIEVEMENT_DEFS.find((item) => item.id === id);
        if (!def) return false;
        this.unlocked.add(id);
        this.save();
        if (typeof showAchievement === 'function') {
            showAchievement(def.title, def.desc);
        }
        if (window.audio) window.audio.play('win');
        return true;
    }

    addDestroyed(count) {
        this.totalDestroyed += count;
        this.save();
        this.check({ totalDestroyed: this.totalDestroyed });
    }

    check(stats) {
        if (stats.score >= 100) this.unlock('score100');
        if ((stats.totalDestroyed ?? this.totalDestroyed) >= 50) this.unlock('blocks50');
        if (stats.clearedAllFromStart || (stats.wavesCleared || 0) >= 3) this.unlock('levels3');
        if ((stats.wavesCleared || 0) >= 10) this.unlock('wave10');
        if ((stats.wavesCleared || 0) >= 25) this.unlock('wave25');
    }
}

window.achievements = new AchievementManager();
