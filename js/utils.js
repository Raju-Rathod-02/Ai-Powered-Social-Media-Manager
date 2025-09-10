// Utility functions for the dashboard
class Utils {
    // Format numbers for display
    static formatNumber(num) {
        if (!num && num !== 0) return '0';
        
        const absNum = Math.abs(num);
        
        if (absNum >= 1000000000) {
            return (num / 1000000000).toFixed(1) + 'B';
        } else if (absNum >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (absNum >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        
        return num.toLocaleString();
    }

    // Calculate percentage change
    static calculatePercentageChange(current, previous) {
        if (!previous || previous === 0) {
            return current > 0 ? '+100%' : '0%';
        }
        
        const change = ((current - previous) / previous) * 100;
        const sign = change >= 0 ? '+' : '';
        return `${sign}${change.toFixed(1)}%`;
    }

    // Color helpers
    static hexToRgba(hex, alpha = 1) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // Show notification
    static showNotification({ type = 'info', title, message, duration = 5000 }) {
        console.log(`${type.toUpperCase()}: ${title} - ${message}`);
        
        const container = document.getElementById('notification-container');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        `;

        container.appendChild(notification);

        // Auto remove after duration
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    // Local storage helpers
    static setStorage(key, value, expiry = null) {
        const item = {
            value: value,
            expiry: expiry ? Date.now() + expiry : null
        };
        localStorage.setItem(key, JSON.stringify(item));
    }

    static getStorage(key) {
        const itemStr = localStorage.getItem(key);
        if (!itemStr) return null;

        try {
            const item = JSON.parse(itemStr);
            
            if (item.expiry && Date.now() > item.expiry) {
                localStorage.removeItem(key);
                return null;
            }
            
            return item.value;
        } catch (e) {
            return null;
        }
    }
}

// Make Utils globally available
window.Utils = Utils;
