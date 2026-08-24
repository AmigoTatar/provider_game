// ============================================
// UI: уведомления и достижения
// ============================================

function showNotification(message, type = 'info') {
    const colors = {
        info: '#6bcbff',
        success: '#ffd93d',
        error: '#ff6b6b'
    };

    const notification = document.createElement('div');
    notification.className = 'toast-note';
    notification.textContent = message;
    notification.style.background = colors[type] || colors.info;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('hide');
        setTimeout(() => notification.remove(), 400);
    }, 2000);
}

function showAchievement(title, desc) {
    const toast = document.getElementById('achievementToast');
    if (!toast) {
        showNotification(`🏆 ${title}`, 'success');
        return;
    }

    toast.innerHTML = `<strong>🏆 ${title}</strong><span>${desc || ''}</span>`;
    toast.classList.add('show');
    clearTimeout(showAchievement._timer);
    showAchievement._timer = setTimeout(() => {
        toast.classList.remove('show');
    }, 3200);
}

function setOverlay(el, visible) {
    if (!el) return;
    if (visible) {
        el.classList.remove('show');
        void el.offsetWidth;
        el.classList.add('show');
        el.setAttribute('aria-hidden', 'false');
    } else {
        el.classList.remove('show');
        el.setAttribute('aria-hidden', 'true');
    }
}

console.log('✨ UI модуль загружен');
