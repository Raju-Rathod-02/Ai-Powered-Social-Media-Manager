// Real-time socket connection and event handling
class SocketService {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        
        this.eventHandlers = new Map();
        
        if (CONFIG.REALTIME_ENABLED) {
            this.connect();
        }
    }

    // Connect to socket server
    connect() {
        try {
            this.socket = io(CONFIG.SOCKET_URL, {
                transports: ['websocket', 'polling'],
                timeout: 20000,
                forceNew: true
            });

            this.setupEventListeners();
        } catch (error) {
            console.error('Socket connection failed:', error);
            this.updateConnectionStatus(false);
        }
    }

    // Setup socket event listeners
    setupEventListeners() {
        this.socket.on('connect', () => {
            console.log('Socket connected:', this.socket.id);
            this.connected = true;
            this.reconnectAttempts = 0;
            this.updateConnectionStatus(true);
            
            // Join dashboard room
            this.socket.emit('join', 'dashboard');
        });

        this.socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
            this.connected = false;
            this.updateConnectionStatus(false);
            
            // Auto-reconnect if not intentional
            if (reason === 'io server disconnect') {
                this.socket.connect();
            }
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            this.connected = false;
            this.updateConnectionStatus(false);
            
            // Implement exponential backoff for reconnection
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                setTimeout(() => {
                    this.reconnectAttempts++;
                    this.socket.connect();
                }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts));
            }
        });

        // Dashboard data updates
        this.socket.on('dashboard_update', (data) => {
            console.log('Dashboard update received:', data);
            this.emit('dashboard_update', data);
        });

        // Analytics updates
        this.socket.on('analytics_update', (data) => {
            console.log('Analytics update received:', data);
            this.emit('analytics_update', data);
        });

        // Engagement notifications
        this.socket.on('engagement_notification', (data) => {
            console.log('Engagement notification:', data);
            this.emit('engagement_notification', data);
            
            // Show notification to user
            Utils.showNotification({
                type: 'info',
                title: 'New Engagement!',
                message: `Your post received a new ${data.type}`
            });
        });

        // New follower notifications
        this.socket.on('new_follower', (data) => {
            console.log('New follower:', data);
            this.emit('new_follower', data);
            
            Utils.showNotification({
                type: 'success',
                title: 'New Follower!',
                message: 'Someone just followed your account'
            });
        });

        // Post published notifications
        this.socket.on('post_published', (data) => {
            console.log('Post published:', data);
            this.emit('post_published', data);
            
            Utils.showNotification({
                type: 'success',
                title: 'Post Published',
                message: 'Your scheduled post has been published successfully'
            });
        });

        // Error notifications
        this.socket.on('error_notification', (data) => {
            console.error('Server error:', data);
            
            Utils.showNotification({
                type: 'error',
                title: 'Error',
                message: data.message || 'An error occurred'
            });
        });
    }

    // Update connection status in UI
    updateConnectionStatus(connected) {
        const statusElement = document.getElementById('connection-status');
        if (statusElement) {
            const icon = statusElement.querySelector('i');
            const text = statusElement.querySelector('span');
            
            if (connected) {
                icon.className = 'fas fa-circle online';
                text.textContent = 'Connected';
            } else {
                icon.className = 'fas fa-circle offline';
                text.textContent = 'Disconnected';
            }
        }
    }

    // Event emitter methods
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event).push(handler);
    }

    off(event, handler) {
        if (this.eventHandlers.has(event)) {
            const handlers = this.eventHandlers.get(event);
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }

    emit(event, data) {
        if (this.eventHandlers.has(event)) {
            this.eventHandlers.get(event).forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`Error in event handler for ${event}:`, error);
                }
            });
        }
    }

    // Send data to server
    send(event, data) {
        if (this.socket && this.connected) {
            this.socket.emit(event, data);
        } else {
            console.warn('Socket not connected, cannot send:', event, data);
        }
    }

    // Disconnect socket
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.connected = false;
            this.updateConnectionStatus(false);
        }
    }

    // Get connection status
    isConnected() {
        return this.connected;
    }
}

// Create global socket instance
window.SocketManager = new SocketService();
