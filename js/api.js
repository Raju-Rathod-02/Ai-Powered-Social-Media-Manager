// API service for handling all backend communication
class APIService {
    constructor() {
        this.baseURL = CONFIG.API_BASE_URL;
        this.token = Utils.getStorage ? Utils.getStorage('auth_token') : null;
    }

    // Set authentication token
    setToken(token) {
        this.token = token;
        if (Utils.setStorage) {
            Utils.setStorage('auth_token', token, 24 * 60 * 60 * 1000); // 24 hours
        }
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
            console.log('API Request:', url);
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('API Response:', data);
            return { success: true, data: data.data || data };
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

    // Dashboard API methods
    async getDashboardData(timeframe = '7d') {
        return this.get('/dashboard', { timeframe });
    }

    async getPosts(params = {}) {
        return this.get('/posts', params);
    }

    async createPost(postData) {
        return this.post('/posts', postData);
    }

    // Health check
    async healthCheck() {
        return this.get('/health');
    }
}

// Create global API instance
window.API = new APIService();
