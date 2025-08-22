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
        
        return num.toString();
    }

    // Format dates for display
    static formatDate(date, format = 'relative') {
        if (!date) return '';
        
        const d = new Date(date);
        const now = new Date();
        
        if (format === 'relative') {
            const diffMs = now - d;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);
            
            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return `${diffMins}m ago`;
            if (diffHours < 24) return `${diffHours}h ago`;
            if (diffDays < 7) return `${diffDays}d ago`;
            
            return d.toLocaleDateString();
        }
        
        if (format === 'short') {
            return d.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
            });
        }
        
        if (format === 'full') {
            return d.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        
        return d.toLocaleDateString();
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

    // Get engagement rate
    static calculateEngagementRate(engagements, impressions) {
        if (!impressions || impressions === 0) return 0;
        return ((engagements / impressions) * 100).toFixed(1);
    }

    // Debounce function calls
    static debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func.apply(this, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(this, args);
        };
    }

    // Throttle function calls
    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Generate unique ID
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Deep clone object
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        
        const clonedObj = {};
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = this.deepClone(obj[key]);
            }
        }
        return clonedObj;
    }

    // Validate email
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Validate URL
    static isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    // Get query parameter
    static getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    // Set query parameter
    static setQueryParam(param, value) {
        const url = new URL(window.location);
        url.searchParams.set(param, value);
        window.history.replaceState({}, '', url);
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

    static removeStorage(key) {
        localStorage.removeItem(key);
    }

    // Cookie helpers
    static setCookie(name, value, days = 7) {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
    }

    static getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    // Array helpers
    static groupBy(array, key) {
        return array.reduce((result, item) => {
            const group = item[key];
            if (!result[group]) {
                result[group] = [];
            }
            result[group].push(item);
            return result;
        }, {});
    }

    static sortBy(array, key, direction = 'asc') {
        return array.sort((a, b) => {
            const aVal = a[key];
            const bVal = b[key];
            
            if (direction === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });
    }

    // Color helpers
    static hexToRgba(hex, alpha = 1) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // Platform helpers
    static getPlatformConfig(platform) {
        return CONFIG.PLATFORMS[platform] || {
            name: platform,
            icon: 'fas fa-globe',
            color: '#64748b'
        };
    }

    // Error handling
    static handleError(error, context = '') {
        console.error(`Error in ${context}:`, error);
        
        if (CONFIG.DEBUG) {
            this.showNotification({
                type: 'error',
                title: 'Development Error',
                message: `${context}: ${error.message}`
            });
        } else {
            this.showNotification({
                type: 'error',
                title: 'Something went wrong',
                message: 'Please try again later or contact support.'
            });
        }
    }

    // Show notification
    static showNotification({ type = 'info', title, message, duration = CONFIG.NOTIFICATIONS.DURATION }) {
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

        // Limit max notifications
        const notifications = container.children;
        if (notifications.length > CONFIG.NOTIFICATIONS.MAX_NOTIFICATIONS) {
            notifications[0].remove();
        }
    }

    // Loading state helpers
    static showLoading(element) {
        if (!element) return;
        element.classList.add('loading');
        element.setAttribute('data-original-text', element.textContent);
    }

    static hideLoading(element) {
        if (!element) return;
        element.classList.remove('loading');
        const originalText = element.getAttribute('data-original-text');
        if (originalText) {
            element.textContent = originalText;
            element.removeAttribute('data-original-text');
        }
    }

    // Animation helpers
    static fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.display = 'block';
        
        const start = performance.now();
        
        function animate(currentTime) {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            element.style.opacity = progress;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        }
        
        requestAnimationFrame(animate);
    }

    static fadeOut(element, duration = 300) {
        const start = performance.now();
        const startOpacity = parseFloat(getComputedStyle(element).opacity);
        
        function animate(currentTime) {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            element.style.opacity = startOpacity * (1 - progress);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.style.display = 'none';
            }
        }
        
        requestAnimationFrame(animate);
    }
}

// Make Utils globally available
window.Utils = Utils;
