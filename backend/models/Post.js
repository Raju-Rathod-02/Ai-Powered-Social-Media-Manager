const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    content: { type: String, required: true },
    platforms: [{ type: String, required: true }],
    status: { 
        type: String, 
        enum: ['draft', 'scheduled', 'published', 'failed'],
        default: 'draft'
    },
    scheduled_time: Date,
    published_time: Date,
    media: [{
        type: String,
        url: String
    }],
    tags: [String],
    performance: {
        likes: { type: Number, default: 0 },
        shares: { type: Number, default: 0 },
        comments: { type: Number, default: 0 },
        views: { type: Number, default: 0 },
        engagement_rate: { type: Number, default: 0 }
    },
    platform_ids: {
        facebook: String,
        instagram: String,
        twitter: String,
        linkedin: String
    }
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);
