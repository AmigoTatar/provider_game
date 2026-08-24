// ============================================
// ЗВУКИ (Web Audio API)
// ============================================

class AudioManager {
    constructor() {
        this.ctx = null;
        this.masterVolume = 0.7;
        this.sfxVolume = 0.85;
        this.enabled = true;
        this.load();
    }

    load() {
        try {
            const raw = localStorage.getItem('provodnik-audio');
            if (!raw) return;
            const data = JSON.parse(raw);
            if (typeof data.masterVolume === 'number') this.masterVolume = data.masterVolume;
            if (typeof data.sfxVolume === 'number') this.sfxVolume = data.sfxVolume;
        } catch (e) {}
    }

    save() {
        localStorage.setItem('provodnik-audio', JSON.stringify({
            masterVolume: this.masterVolume,
            sfxVolume: this.sfxVolume
        }));
    }

    ensure() {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return null;
        if (!this.ctx) this.ctx = new Ctx();
        if (this.ctx.state === 'suspended') this.ctx.resume();
        return this.ctx;
    }

    volume() {
        return this.enabled ? this.masterVolume * this.sfxVolume : 0;
    }

    tone({ freq = 440, freqEnd = null, duration = 0.12, type = 'square', gain = 0.12, attack = 0.005, curve = 'exponential' }) {
        const ctx = this.ensure();
        if (!ctx || this.volume() <= 0) return;

        const osc = ctx.createOscillator();
        const amp = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        if (freqEnd != null) {
            osc.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd), ctx.currentTime + duration);
        }

        const peak = Math.max(0.0001, gain * this.volume());
        amp.gain.setValueAtTime(0.0001, ctx.currentTime);
        amp.gain.linearRampToValueAtTime(peak, ctx.currentTime + attack);
        if (curve === 'linear') {
            amp.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + duration);
        } else {
            amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
        }

        osc.connect(amp);
        amp.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration + 0.02);
    }

    noise(duration, gain, filterFreq) {
        const ctx = this.ensure();
        if (!ctx || this.volume() <= 0) return;

        const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
        }

        const src = ctx.createBufferSource();
        src.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = filterFreq;
        const amp = ctx.createGain();
        amp.gain.setValueAtTime(gain * this.volume(), ctx.currentTime);
        amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
        src.connect(filter);
        filter.connect(amp);
        amp.connect(ctx.destination);
        src.start();
    }

    play(name) {
        switch (name) {
            case 'click':
                this.tone({ freq: 880, duration: 0.06, type: 'square', gain: 0.06 });
                break;
            case 'hit':
                this.tone({ freq: 220, freqEnd: 140, duration: 0.07, type: 'square', gain: 0.1 });
                this.noise(0.05, 0.08, 1800);
                break;
            case 'destroy':
                this.tone({ freq: 120, freqEnd: 50, duration: 0.28, type: 'sawtooth', gain: 0.16 });
                this.noise(0.22, 0.2, 700);
                break;
            case 'gold':
                this.tone({ freq: 880, freqEnd: 1320, duration: 0.18, type: 'sine', gain: 0.1 });
                break;
            case 'ice':
                this.tone({ freq: 1400, freqEnd: 900, duration: 0.16, type: 'triangle', gain: 0.08 });
                break;
            case 'gameover':
                this.tone({ freq: 320, freqEnd: 80, duration: 0.55, type: 'sawtooth', gain: 0.14 });
                break;
            case 'win':
                this.tone({ freq: 523, duration: 0.12, type: 'sine', gain: 0.1 });
                setTimeout(() => this.tone({ freq: 659, duration: 0.12, type: 'sine', gain: 0.1 }), 110);
                setTimeout(() => this.tone({ freq: 784, duration: 0.22, type: 'sine', gain: 0.12 }), 220);
                break;
            case 'level':
                this.tone({ freq: 440, freqEnd: 660, duration: 0.2, type: 'triangle', gain: 0.1 });
                break;
            default:
                break;
        }
    }
}

window.audio = new AudioManager();
