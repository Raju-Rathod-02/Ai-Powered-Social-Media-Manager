const Analytics = require('../models/Analytics');
const Post = require('../models/Post');
const FacebookService = require('./facebookService');

class RealtimeService {
    constructor(io) {
        this.io = io;
        this.facebookService = new FacebookService();
    }

    async sendDashboardUpdate(socket = null) {
        try {
            const dashboardData = await this.getDashboardData();
            
            if (socket) {
                socket.emit('dashboard_update', dashboardData);
            } else {
                this.io.to('dashboard').emit('dashboard_update', dashboardData);
            }
        } catch (error) {
            console.error('Error sending dashboard update:', error);
        }
    }

    async getDashboardData() {
        const [analytics, recentPosts, scheduledPosts] = await Promise.all([
            this.getLatestAnalytics(),
            this.getRecentPosts(),
            this.getScheduledPosts()
        ]);

        return {
            analytics,
            recentPosts,
            scheduledPosts,
            timestamp: new Date()
        };
    }

    async getLatestAnalytics() {
        const latestAnalytics = await Analytics.findOne().sort({ createdAt: -1 });
        return latestAnalytics || {
            metrics: {
                followers: 0,
                impressions: 0,
                engagements: 0,
                engagement_rate: 0
            }
        };
    }

    async getRecentPosts() {
        return await Post.find({ status: 'published' })
            .sort({ published_time: -1 })
            .limit(5);
    }

    async getScheduledPosts() {
        return await Post.find({ 
            status: 'scheduled',
            scheduled_time: { $gte: new Date() }
        })
        .sort({ scheduled_time: 1 })
        .limit(10);
    }

    async updateAnalytics() {
        try {
            // Fetch real data from Facebook API
            const facebookData = await this.facebookService.getPageInsights();
            
            if (facebookData) {
                const analytics = new Analytics({
                    platform: 'facebook',
                    metrics: {
                        followers: facebookData.followers_count || 0,
                        impressions: facebookData.impressions || 0,
                        engagements: facebookData.engagements || 0,
                        engagement_rate: facebookData.engagement_rate || 0
                    },
                    demographics: facebookData.demographics || {},
                    hourly_activity: facebookData.hourly_activity || [],
                    daily_activity: facebookData.daily_activity || []
                });

                await analytics.save();
                
                // Broadcast update to all connected clients
                this.sendDashboardUpdate();
                
                // Send specific analytics update
                this.io.to('dashboard').emit('analytics_update', {
                    type: 'new_data',
                    data: analytics,
                    timestamp: new Date()
                });
            }
        } catch (error) {
            console.error('Error updating analytics:', error);
        }
    }

    async notifyEngagement(postId, engagementType, data) {
        this.io.to('dashboard').emit('engagement_notification', {
            postId,
            type: engagementType,
            data,
            timestamp: new Date()
        });
    }

    async notifyNewFollower(followerData) {
        this.io.to('dashboard').emit('new_follower', {
            follower: followerData,
            timestamp: new Date()
        });
    }
}

module.exports = RealtimeService;
