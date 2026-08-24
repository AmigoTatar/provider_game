// ============================================
// ДОПОЛНИТЕЛЬНЫЕ UI ФУНКЦИИ
// ============================================

// Показываем уведомления (можно использовать для будущих обновлений)
function showNotification(message, type = 'info') {
    const colors = {
        info: '#6bcbff',
        success: '#ffd93d',
        error: '#ff6b6b'
    };
    
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${colors[type] || colors.info};
        color: #1a1a2e;
        padding: 10px 20px;
        border-radius: 25px;
        font-weight: bold;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        z-index: 1000;
        animation: slideDown 0.5s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.5s';
        setTimeout(() => notification.remove(), 500);
    }, 2000);
}

// Добавляем стили для анимации (можно добавить в style.css)
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from { transform: translateX(-50%) translateY(-100px); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
    }
`;
document.head.appendChild(style);

console.log('✨ UI модуль загружен');