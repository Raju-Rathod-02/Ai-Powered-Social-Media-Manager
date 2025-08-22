// API service for handling all backend communication
class APIService {
    constructor() {
        this.baseURL = CONFIG.API_BASE_URL;
        this.token = Utils.getStorage('auth_token');
    }

    // Set authentication token
    setToken(token) {
        this.token = token;
        Utils.setStorage('auth_token', token, 24 * 60 * 60 * 1000); // 24 hours
    }

    // Get authentication headers
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    // Generic API request method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.getHeaders(),
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return { success: true, data };
        } catch (error) {
            console.error(`API request failed: ${endpoint}`, error);
            return { success: false, error: error.message };
        }
    }

    // GET request
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        
        return this.request(url, {
            method: 'GET'
        });
    }

    // POST request
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // PUT request
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // DELETE request
    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }

    // Dashboard API methods
    async getDashboardData(timeframe = '7d') {
        return this.get('/dashboard', { timeframe });
    }

    async getAnalytics(timeframe = '7d') {
        return this.get('/analytics/dashboard', { timeframe });
    }

    async getEngagementMetrics() {
        return this.get('/analytics/engagement');
    }

    // Posts API methods
    async getPosts(params = {}) {
        return this.get('/posts', params);
    }

    async createPost(postData) {
        return this.post('/posts', postData);
    }

    async updatePost(postId, postData) {
        return this.put(`/posts/${postId}`, postData);
    }

    async deletePost(postId) {
        return this.delete(`/posts/${postId}`);
    }

    async updatePostPerformance(postId, performance) {
        return this.put(`/posts/${postId}/performance`, { performance });
    }

    // User API methods
    async connectAccount(platform, accountData) {
        return this.post('/connect-account', {
            platform,
            ...accountData
        });
    }

    async getRealtimeStats() {
        return this.get('/realtime-stats');
    }

    // Health check
    async healthCheck() {
        return this.get('/health');
    }
}

// Create global API instance
window.API = new APIService();
