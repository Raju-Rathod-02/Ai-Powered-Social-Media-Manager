const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const DataProcessor = require('../utils/dataProcessor');

// Health check
router.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV
    });
});

// Get user dashboard data
router.get('/dashboard', auth, async (req, res) => {
    try {
        const { timeframe = '7d' } = req.query;
        const userId = req.user.id;

        // Get user's analytics and posts
        const [analytics, posts, user] = await Promise.all([
            getAnalyticsForTimeframe(userId, timeframe),
            getPostsForTimeframe(userId, timeframe),
            User.findById(userId).select('-password')
        ]);

        const processedData = {
            user: user,
            analytics: analytics ? DataProcessor.aggregateAnalytics([analytics]) : null,
            posts: DataProcessor.processPostPerformance(posts),
            insights: DataProcessor.generateInsightsSummary(analytics, posts),
            timeframe: timeframe,
            last_updated: new Date()
        };

        res.json(processedData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Connect social media account
router.post('/connect-account', auth, async (req, res) => {
    try {
        const { platform, access_token, account_id } = req.body;
        const userId = req.user.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update social account connection
        if (user.social_accounts[platform]) {
            user.social_accounts[platform] = {
                account_id,
                access_token,
                connected: true
            };
            await user.save();

            res.json({
                message: `${platform} account connected successfully`,
                connected_platforms: user.getConnectedPlatforms()
            });
        } else {
            res.status(400).json({ message: 'Invalid platform' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get real-time stats
router.get('/realtime-stats', auth, async (req, res) => {
    try {
        const stats = {
            active_connections: global.io ? global.io.engine.clientsCount : 0,
            server_uptime: process.uptime(),
            memory_usage: process.memoryUsage(),
            last_update: new Date()
        };

        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Helper functions
async function getAnalyticsForTimeframe(userId, timeframe) {
    const Analytics = require('../models/Analytics');
    const startDate = new Date();
    
    switch(timeframe) {
        case '24h':
            startDate.setHours(startDate.getHours() - 24);
            break;
        case '7d':
            startDate.setDate(startDate.getDate() - 7);
            break;
        case '30d':
            startDate.setDate(startDate.getDate() - 30);
            break;
    }

    return await Analytics.findOne({
        createdAt: { $gte: startDate }
    }).sort({ createdAt: -1 });
}

async function getPostsForTimeframe(userId, timeframe) {
    const Post = require('../models/Post');
    const startDate = new Date();
    
    switch(timeframe) {
        case '24h':
            startDate.setHours(startDate.getHours() - 24);
            break;
        case '7d':
            startDate.setDate(startDate.getDate() - 7);
            break;
        case '30d':
            startDate.setDate(startDate.getDate() - 30);
            break;
    }

    return await Post.find({
        createdAt: { $gte: startDate }
    }).sort({ createdAt: -1 });
}

module.exports = router;
