const express = require('express');
const router = express.Router();
const Analytics = require('../models/Analytics');

// Get dashboard analytics
router.get('/dashboard', async (req, res) => {
    try {
        const { timeframe = '7d' } = req.query;
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

        const analytics = await Analytics.find({
            createdAt: { $gte: startDate }
        }).sort({ createdAt: -1 });

        const summary = {
            total_followers: analytics[0]?.metrics.followers || 0,
            total_impressions: analytics.reduce((sum, a) => sum + a.metrics.impressions, 0),
            total_engagements: analytics.reduce((sum, a) => sum + a.metrics.engagements, 0),
            avg_engagement_rate: analytics.length > 0 ? 
                analytics.reduce((sum, a) => sum + a.metrics.engagement_rate, 0) / analytics.length : 0,
            growth_data: analytics.map(a => ({
                date: a.createdAt,
                followers: a.metrics.followers,
                impressions: a.metrics.impressions,
                engagements: a.metrics.engagements
            }))
        };

        res.json(summary);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get engagement metrics
router.get('/engagement', async (req, res) => {
    try {
        const latestAnalytics = await Analytics.findOne().sort({ createdAt: -1 });
        
        if (!latestAnalytics) {
            return res.json({ message: 'No analytics data available' });
        }

        res.json({
            engagement_rate: latestAnalytics.metrics.engagement_rate,
            demographics: latestAnalytics.demographics,
            hourly_activity: latestAnalytics.hourly_activity,
            daily_activity: latestAnalytics.daily_activity
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
