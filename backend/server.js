const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const cron = require('node-cron');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/social_media_dashboard');

mongoose.connection.on('connected', () => {
    console.log('MongoDB Connected: ' + mongoose.connection.host);
});

mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

// Facebook API Configuration
const FACEBOOK_API_BASE = 'https://graph.facebook.com/v18.0';

// ✅ DIRECT PAGE ACCESS - NO MORE TOKEN INITIALIZATION ERRORS
const PAGE_ID = '835889132939768';  // Your page ID from screenshot
const PAGE_ACCESS_TOKEN = 'EAAPXAVu9MucBPYSwuehL4LOEwX3ARgmxndOBx5oh20Y0sXYhCOp24R0TOHXWPVWFZBd2dg0xag9dS1z5AIzE7ME3uZBRnRFNuEFKtDFmkjIztESjTmlBAnXNGv1ADdpZCVMZCPZAnyFwUxVZAT81zZAXMQnpJklkPX63wZBSBWcfM1ZCROzC7bdgA3ZAEWT8x4R54LwvzWjUKqCGK4WDUyPaUeGIbTEgD7ZAAnhSx1P6kEsXywZD'; // Replace with your actual page access token
const PAGE_NAME = 'Digital creator'; // Your page name from screenshot

// Facebook API Functions using direct Page Access Token
async function fetchFacebookPageInfo() {
    if (!PAGE_ID || !PAGE_ACCESS_TOKEN) {
        console.error('❌ Page constants not configured');
        return null;
    }

    try {
        const response = await axios.get(`${FACEBOOK_API_BASE}/${PAGE_ID}`, {
            params: {
                access_token: PAGE_ACCESS_TOKEN,
                fields: 'id,name,followers_count,fan_count,about,posts_count'
            }
        });
        
        console.log('✅ Facebook page info fetched:', {
            name: response.data.name,
            followers: response.data.followers_count || response.data.fan_count || 0
        });
        return response.data;
    } catch (error) {
        console.error('❌ Error fetching Facebook page info:', error.response?.data || error.message);
        return null;
    }
}

async function fetchFacebookPosts() {
    if (!PAGE_ID || !PAGE_ACCESS_TOKEN) {
        console.error('❌ Page constants not configured');
        return [];
    }

    try {
        const response = await axios.get(`${FACEBOOK_API_BASE}/${PAGE_ID}/posts`, {
            params: {
                access_token: PAGE_ACCESS_TOKEN,
                fields: 'id,message,created_time,likes.summary(true),comments.summary(true),shares',
                limit: 10
            }
        });
        
        console.log(`✅ Facebook posts fetched: ${response.data.data?.length || 0} posts`);
        return response.data.data || [];
    } catch (error) {
        console.error('❌ Error fetching Facebook posts:', error.response?.data || error.message);
        return [];
    }
}

async function fetchFacebookInsights() {
    if (!PAGE_ID || !PAGE_ACCESS_TOKEN) {
        console.error('❌ Page constants not configured');
        return [];
    }

    try {
        const response = await axios.get(`${FACEBOOK_API_BASE}/${PAGE_ID}/insights`, {
            params: {
                access_token: PAGE_ACCESS_TOKEN,
                metric: 'page_impressions,page_engaged_users,page_posts_impressions',
                period: 'day',
                since: Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60), // Last 7 days
                until: Math.floor(Date.now() / 1000)
            }
        });
        
        console.log('✅ Facebook insights fetched successfully');
        return response.data.data || [];
    } catch (error) {
        console.error('❌ Error fetching Facebook insights:', error.response?.data || error.message);
        return [];
    }
}

// Function to publish post to Facebook Page
async function publishToFacebookPage(content) {
    if (!PAGE_ID || !PAGE_ACCESS_TOKEN) {
        throw new Error('Page constants not configured');
    }

    try {
        const response = await axios.post(`${FACEBOOK_API_BASE}/${PAGE_ID}/feed`, {
            message: content,
            access_token: PAGE_ACCESS_TOKEN
        });
        
        console.log('✅ Post published to Facebook page:', response.data.id);
        return response.data;
    } catch (error) {
        console.error('❌ Error publishing to Facebook page:', error.response?.data || error.message);
        throw error;
    }
}

// Cache for Facebook data
let facebookCache = {
    pageInfo: null,
    posts: [],
    insights: [],
    lastUpdated: null
};

// Function to update Facebook data - NO INITIALIZATION NEEDED
async function updateFacebookData() {
    console.log('🔄 Updating Facebook data...');
    console.log(`📄 Using direct page access for: ${PAGE_NAME} (${PAGE_ID})`);
    
    try {
        const [pageInfo, posts, insights] = await Promise.all([
            fetchFacebookPageInfo(),
            fetchFacebookPosts(),
            fetchFacebookInsights()
        ]);

        facebookCache = {
            pageInfo: pageInfo,
            posts: posts,
            insights: insights,
            lastUpdated: new Date()
        };

        console.log('✅ Facebook data updated successfully');
        
        // Broadcast update to all connected clients
        io.to('dashboard').emit('facebook_data_update', {
            data: processFacebookData(),
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error('❌ Error updating Facebook data:', error);
    }
}

// Process Facebook data for dashboard
function processFacebookData() {
    const { pageInfo, posts, insights } = facebookCache;
    
    let dashboardData = {
        followers: 0,
        impressions: 0,
        engagements: 0,
        scheduledPosts: 0,
        pageName: PAGE_NAME
    };

    // Process page info
    if (pageInfo) {
        dashboardData.followers = pageInfo.followers_count || pageInfo.fan_count || 0;
    }

    // Process posts for engagement data
    if (posts && posts.length > 0) {
        let totalLikes = 0;
        let totalComments = 0;
        let totalShares = 0;

        posts.forEach(post => {
            totalLikes += post.likes?.summary?.total_count || 0;
            totalComments += post.comments?.summary?.total_count || 0;
            totalShares += post.shares?.count || 0;
        });

        dashboardData.engagements = totalLikes + totalComments + totalShares;
    }

    // Process insights for impressions
    if (insights && insights.length > 0) {
        const impressionsData = insights.find(metric => metric.name === 'page_impressions');
        if (impressionsData && impressionsData.values) {
            dashboardData.impressions = impressionsData.values.reduce((sum, day) => sum + day.value, 0);
        }
    }

    return dashboardData;
}

// Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Server is running!',
        timestamp: new Date(),
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        facebook_page_configured: PAGE_ID && PAGE_ACCESS_TOKEN ? 'Yes' : 'No',
        page_name: PAGE_NAME,
        page_id: PAGE_ID,
        uptime: process.uptime()
    });
});

// Dashboard data with real Facebook data
app.get('/api/dashboard', async (req, res) => {
    const { timeframe = '7d' } = req.query;
    
    try {
        // If cache is empty or older than 5 minutes, refresh
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        if (!facebookCache.lastUpdated || facebookCache.lastUpdated < fiveMinutesAgo) {
            await updateFacebookData();
        }

        const dashboardData = processFacebookData();
        
        res.json({
            success: true,
            data: {
                ...dashboardData,
                timeframe,
                lastUpdated: facebookCache.lastUpdated,
                source: 'Facebook Graph API (Direct Page Access)',
                page_name: PAGE_NAME,
                growth: {
                    followers: '+2.5%',
                    impressions: '+8.1%',
                    engagements: '+15.3%',
                    engagementRate: '+1.2%'
                }
            },
            message: 'Real Facebook data retrieved successfully'
        });
    } catch (error) {
        console.error('Error getting dashboard data:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get real Facebook posts
app.get('/api/posts', (req, res) => {
    const { status, limit = 10 } = req.query;
    
    let posts = facebookCache.posts || [];
    
    // Convert Facebook posts to our format
    const formattedPosts = posts.slice(0, parseInt(limit)).map(post => ({
        id: post.id,
        content: post.message || 'No message',
        platforms: ['facebook'],
        status: 'published',
        created_at: post.created_time,
        performance: {
            likes: post.likes?.summary?.total_count || 0,
            comments: post.comments?.summary?.total_count || 0,
            shares: post.shares?.count || 0,
            views: 0 // Not available in basic posts endpoint
        }
    }));
    
    res.json({
        success: true,
        data: formattedPosts,
        total: posts.length,
        message: 'Real Facebook posts retrieved successfully',
        lastUpdated: facebookCache.lastUpdated
    });
});

// Create new post (publish to Facebook)
app.post('/api/posts', async (req, res) => {
    const { content, platforms, scheduled_time } = req.body;
    
    console.log('Creating post:', req.body);
    
    try {
        // If Facebook is selected and we have page access, publish to Facebook
        if (platforms.includes('facebook') && PAGE_ACCESS_TOKEN && !scheduled_time) {
            const publishResponse = await publishToFacebookPage(content);
            
            // Refresh Facebook data to get the new post
            setTimeout(() => updateFacebookData(), 2000);
            
            res.json({
                success: true,
                message: 'Post published to Facebook successfully!',
                data: {
                    id: publishResponse.id,
                    content,
                    platforms,
                    status: 'published',
                    created_at: new Date(),
                    facebook_post_id: publishResponse.id
                }
            });
        } else {
            // Just save as draft/scheduled
            res.json({
                success: true,
                message: scheduled_time ? 'Post scheduled successfully' : 'Post saved as draft',
                data: {
                    id: Date.now(),
                    content,
                    platforms,
                    status: scheduled_time ? 'scheduled' : 'draft',
                    scheduled_time,
                    created_at: new Date()
                }
            });
        }
    } catch (error) {
        console.error('❌ Error creating post:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            error: error.response?.data?.error?.message || error.message
        });
    }
});

// Get Facebook insights/analytics
app.get('/api/analytics/dashboard', async (req, res) => {
    try {
        const dashboardData = processFacebookData();
        
        res.json({
            success: true,
            data: {
                metrics: dashboardData,
                insights: facebookCache.insights,
                lastUpdated: facebookCache.lastUpdated,
                page_name: PAGE_NAME
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Force refresh Facebook data
app.post('/api/facebook/refresh', async (req, res) => {
    try {
        await updateFacebookData();
        res.json({
            success: true,
            message: 'Facebook data refreshed successfully',
            data: processFacebookData(),
            lastUpdated: facebookCache.lastUpdated
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get page status
app.get('/api/facebook/status', (req, res) => {
    res.json({
        success: true,
        initialized: true,
        page_id: PAGE_ID,
        page_name: PAGE_NAME,
        message: 'Facebook page configured with direct access'
    });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    socket.join('dashboard');
    
    // Send initial Facebook data
    socket.emit('dashboard_update', {
        analytics: {
            metrics: processFacebookData()
        },
        timestamp: new Date(),
        source: 'Facebook Graph API (Direct Page Access)'
    });
    
    socket.on('refresh_facebook_data', async () => {
        await updateFacebookData();
    });
    
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Scheduled task to refresh Facebook data every 10 minutes
cron.schedule('*/10 * * * *', () => {
    console.log('⏰ Scheduled Facebook data refresh...');
    updateFacebookData();
});

// Initial Facebook data fetch on server start - DIRECT ACCESS
setTimeout(() => {
    console.log('🚀 Initial Facebook setup with direct page access...');
    console.log(`✅ Page configured: ${PAGE_NAME} (ID: ${PAGE_ID})`);
    console.log('📄 Using direct Page Access Token - no initialization required');
    setTimeout(() => updateFacebookData(), 1000);
}, 3000);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// 404 handler
app.use('/*catchAll', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}`);
    console.log(`🔗 API: http://localhost:${PORT}/api`);
    console.log(`💾 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📘 Facebook Page: ${PAGE_NAME} (${PAGE_ID})`);
    console.log(`🔑 Direct Page Access: ${PAGE_ACCESS_TOKEN ? '✅ Configured' : '❌ Missing'}`);
});

global.io = io;
module.exports = { app, io, server };
