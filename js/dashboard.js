// Main dashboard functionality
class Dashboard {
    constructor() {
        this.charts = {};
        this.currentTimeframe = '7d';
        this.refreshInterval = null;
        
        this.init();
    }

    async init() {
        try {
            // Initialize components
            this.setupEventListeners();
            this.setupCharts();
            this.setupRealTimeUpdates();
            
            // Load initial data
            await this.loadDashboardData();
            
            // Start auto-refresh if enabled
            if (CONFIG.AUTO_REFRESH_INTERVAL > 0) {
                this.startAutoRefresh();
            }
            
            console.log('Dashboard initialized successfully');
        } catch
