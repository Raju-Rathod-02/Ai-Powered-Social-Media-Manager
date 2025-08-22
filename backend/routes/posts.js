const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const FacebookService = require('../services/facebookService');

const facebookService = new FacebookService(process.env.FACEBOOK_ACCESS_TOKEN);

// Create new post
router.post('/', async (req, res) => {
    try {
        const { content, platforms, scheduled_time, tags } = req.body;

        const post = new Post({
            content,
            platforms,
            scheduled_time: scheduled_time ? new Date(scheduled_time) : null,
            tags: tags || [],
            status: scheduled_time ? 'scheduled' : 'draft'
        });

        await post.save();

        // If not scheduled, publish immediately
        if (!scheduled_time) {
            const publishResult = await facebookService.publishPost({ message: content });
            if (publishResult) {
                post.status = 'published';
                post.published_time = new Date();
                post.platform_ids.facebook = publishResult.id;
                await post.save();
            }
        }

        res.json(post);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get posts
router.get('/', async (req, res) => {
    try {
        const { status, limit = 20 } = req.query;
        const query = status ? { status } : {};
        
        const posts = await Post.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        res.json(posts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update post performance
router.put('/:id/performance', async (req, res) => {
    try {
        const { id } = req.params;
        const { performance } = req.body;

        const post = await Post.findByIdAndUpdate(
            id,
            { $set: { performance } },
            { new: true }
        );

        res.json(post);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
