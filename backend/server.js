const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const cron = require('node-cron');
require('dotenv').config();

// Import routes and services
const apiRoutes = require('./routes/api');
const analyticsRoutes = require('./routes/analytics');
const postsRoutes = require('./routes/posts');
const RealtimeService = require('./services/realtimeService');
const SchedulerService = require('./services/schedulerService');
const FacebookService = require('./services/facebookService');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/social_media_dashboard', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Initialize services
const realtimeService = new RealtimeService(io);
const schedulerService = new SchedulerService();
const facebookService = new FacebookService(process.env.FACEBOOK_ACCESS_TOKEN);

// Routes
app.use('/api', apiRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/posts', postsRoutes);

// Real-time socket connection
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Join dashboard room for real-time updates
    socket.join('dashboard');
    
    // Send initial dashboard data
    realtimeService.sendDashboardUpdate(socket);
    
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Scheduled tasks for data fetching
cron.schedule('*/5 * * * *', async () => {
    console.log('Fetching latest analytics data...');
    await realtimeService.updateAnalytics();
});

cron.schedule('0 * * * *', async () => {
    console.log('Processing scheduled posts...');
    await schedulerService.processScheduledPosts();
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = { app, io };
