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
            console.log('Initializing dashboard...');
            
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
        } catch (error) {
            console.error('Dashboard initialization failed:', error);
        }
    }

    setupEventListeners() {
        // Create post button
        const createPostBtn = document.getElementById('create-post-btn');
        if (createPostBtn) {
            createPostBtn.addEventListener('click', () => this.showCreatePostModal());
        }

        // Create post form
        const createPostForm = document.getElementById('create-post-form');
        if (createPostForm) {
            createPostForm.addEventListener('submit', (e) => this.handleCreatePost(e));
        }

        // Modal close
        const closeModalBtn = document.querySelector('.close-modal');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => this.hideCreatePostModal());
        }

        // Character count
        const postContentTextarea = document.getElementById('post-content');
        if (postContentTextarea) {
            postContentTextarea.addEventListener('input', (e) => this.updateCharacterCount(e));
        }
    }

    setupCharts() {
        const ctx = document.getElementById('performance-chart');
        if (ctx && typeof Chart !== 'undefined') {
            this.charts.performance = new Chart(ctx.getContext('2d'), {
                type: 'line',
                data: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [
                        {
                            label: 'Impressions',
                            data: [6234, 7812, 9345, 8567, 10234, 9876, 11567],
                            borderColor: CONFIG.CHART_COLORS.primary,
                            backgroundColor: Utils.hexToRgba ? Utils.hexToRgba(CONFIG.CHART_COLORS.primary, 0.1) : CONFIG.CHART_COLORS.primary,
                            tension: 0.3,
                            fill: true
                        },
                        {
                            label: 'Engagements',
                            data: [534, 678, 892, 756, 945, 823, 1067],
                            borderColor: CONFIG.CHART_COLORS.error,
                            backgroundColor: Utils.hexToRgba ? Utils.hexToRgba(CONFIG.CHART_COLORS.error, 0.1) : CONFIG.CHART_COLORS.error,
                            tension: 0.3,
                            fill: true
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
    }

    setupRealTimeUpdates() {
        // Listen for real-time socket updates
        if (SocketManager) {
            SocketManager.on('dashboard_update', (data) => {
                console.log('Real-time dashboard update:', data);
                this.updateDashboardMetrics(data.analytics?.metrics || data);
            });

            SocketManager.on('engagement_notification', (data) => {
                if (Utils.showNotification) {
                    Utils.showNotification({
                        type: 'info',
                        title: 'New Engagement!',
                        message: `Your post received ${data.count} new ${data.type}s`
                    });
                }
                this.updateDashboardMetrics({ engagements: data.total });
            });
        }
    }

    async loadDashboardData() {
        try {
            console.log('Loading dashboard data...');
            
            const result = await API.getDashboardData(this.currentTimeframe);
            
            if (result.success) {
                console.log('Dashboard data loaded:', result.data);
                this.updateDashboardMetrics(result.data);
            } else {
                console.error('Failed to load dashboard data:', result.error);
            }
        } catch (error) {
            console.error('Dashboard data error:', error);
        }
    }

    updateDashboardMetrics(data) {
        console.log('Updating metrics with:', data);
        
        // Update followers
        const followersElement = document.getElementById('total-followers');
        if (followersElement && data.followers !== undefined) {
            followersElement.textContent = Utils.formatNumber(data.followers);
        }
        
        // Update impressions
        const impressionsElement = document.getElementById('total-impressions');
        if (impressionsElement && data.impressions !== undefined) {
            impressionsElement.textContent = Utils.formatNumber(data.impressions);
        }
        
        // Update engagements
        const engagementsElement = document.getElementById('total-engagements');
        if (engagementsElement && data.engagements !== undefined) {
            engagementsElement.textContent = Utils.formatNumber(data.engagements);
        }
        
        // Update scheduled posts
        const scheduledElement = document.getElementById('scheduled-posts');
        if (scheduledElement && data.scheduledPosts !== undefined) {
            scheduledElement.textContent = Utils.formatNumber(data.scheduledPosts);
        }
    }

    showCreatePostModal() {
        const modal = document.getElementById('create-post-modal');
        if (modal) {
            modal.classList.add('show');
        }
    }

    hideCreatePostModal() {
        const modal = document.getElementById('create-post-modal');
        if (modal) {
            modal.classList.remove('show');
            // Reset form
            const form = document.getElementById('create-post-form');
            if (form) form.reset();
            this.updateCharacterCount({ target: { value: '' } });
        }
    }

    updateCharacterCount(event) {
        const charCount = document.getElementById('char-count');
        if (charCount) {
            charCount.textContent = event.target.value.length;
        }
    }

    async handleCreatePost(event) {
        event.preventDefault();
        
        try {
            const postData = {
                content: document.getElementById('post-content').value,
                platforms: Array.from(document.querySelectorAll('input[name="platforms"]:checked')).map(cb => cb.value),
                scheduled_time: document.getElementById('schedule-time').value || null,
                tags: document.getElementById('post-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag)
            };

            console.log('Creating post:', postData);
            
            const result = await API.createPost(postData);
            
            if (result.success) {
                if (Utils.showNotification) {
                    Utils.showNotification({
                        type: 'success',
                        title: 'Post Created',
                        message: 'Your post has been created successfully'
                    });
                }
                
                this.hideCreatePostModal();
                this.loadDashboardData(); // Refresh dashboard
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Failed to create post:', error);
            if (Utils.showNotification) {
                Utils.showNotification({
                    type: 'error',
                    title: 'Post Creation Failed',
                    message: error.message || 'Failed to create post'
                });
            }
        }
    }

    startAutoRefresh() {
        this.refreshInterval = setInterval(() => {
            this.loadDashboardData();
        }, CONFIG.AUTO_REFRESH_INTERVAL);
    }
}

// Global functions for HTML onclick events
window.showCreatePostModal = () => dashboard.showCreatePostModal();
window.hideCreatePostModal = () => dashboard.hideCreatePostModal();
window.refreshAllData = () => dashboard.loadDashboardData();

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing dashboard...');
    window.dashboard = new Dashboard();
});
