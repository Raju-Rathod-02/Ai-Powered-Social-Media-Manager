// Configuration settings
const CONFIG = {
    // API Configuration
    API_BASE_URL: 'http://localhost:5000/api',
    SOCKET_URL: 'http://localhost:5000',
    
    // App Settings
    APP_NAME: 'SocialDash',
    VERSION: '1.0.0',
    
    // Real-time Updates
    REALTIME_ENABLED: true,
    AUTO_REFRESH_INTERVAL: 30000, // 30 seconds
    
    // Chart Settings
    CHART_COLORS: {
        primary: '#4361ee',
        secondary: '#3f37c9',
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#06b6d4'
    },
    
    // Supported Platforms
    PLATFORMS: {
        facebook: {
            name: 'Facebook',
            icon: 'fab fa-facebook',
            color: '#1877f2'
        },
        instagram: {
            name: 'Instagram',
            icon: 'fab fa-instagram',
            color: '#e4405f'
        },
        twitter: {
            name: 'Twitter',
            icon: 'fab fa-twitter',
            color: '#1da1f2'
        },
        linkedin: {
            name: 'LinkedIn',
            icon: 'fab fa-linkedin',
            color: '#0077b5'
        }
    },
    
    // Notification Settings
    NOTIFICATIONS: {
        DURATION: 5000, // 5 seconds
        MAX_NOTIFICATIONS: 5,
        POSITION: 'top-right'
    },
    
    // Validation Rules
    VALIDATION: {
        POST_MAX_LENGTH: 2000,
        TAG_MAX_LENGTH: 50,
        MAX_TAGS: 10,
        MIN_SCHEDULE_TIME: 5 // minutes in future
    },
    
    // Timeframe Options
    TIMEFRAMES: [
        { value: '24h', label: 'Last 24 Hours' },
        { value: '7d', label: 'Last 7 Days' },
        { value: '30d', label: 'Last 30 Days' },
        { value: '90d', label: 'Last 90 Days' }
    ],
    
    // Feature Flags
    FEATURES: {
        ANALYTICS: true,
        SCHEDULING: true,
        BULK_UPLOAD: true,
        WEBHOOKS: true,
        EXPORT: true
    },
    
    // Debug Settings
    DEBUG: true,
    LOG_LEVEL: 'info' // error, warn, info, debug
};

// Environment-specific overrides
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    CONFIG.DEBUG = true;
    CONFIG.LOG_LEVEL = 'debug';
} else {
    CONFIG.API_BASE_URL = 'https://your-production-api.com/api';
    CONFIG.SOCKET_URL = 'https://your-production-api.com';
    CONFIG.DEBUG = false;
    CONFIG.LOG_LEVEL = 'error';
}

// Make config globally available
window.CONFIG = CONFIG;
