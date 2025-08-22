const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    platform: { type: String, required: true },
    metrics: {
        followers: { type: Number, default: 0 },
        impressions: { type: Number, default: 0 },
        engagements: { type: Number, default: 0 },
        engagement_rate: { type: Number, default: 0 },
        reach: { type: Number, default: 0 }
    },
    demographics: {
        age_groups: [{
            range: String,
            percentage: Number
        }],
        locations: [{
            country: String,
            percentage: Number
        }],
        gender: {
            male: Number,
            female: Number,
            other: Number
        }
    },
    hourly_activity: [{
        hour: Number,
        activity_score: Number
    }],
    daily_activity: [{
        day: String,
        activity_score: Number
    }]
}, { timestamps: true });

module.exports = mongoose.model('Analytics', analyticsSchema);
