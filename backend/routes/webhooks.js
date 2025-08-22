const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Analytics = require('../models/Analytics');
const RealtimeService = require('../services/realtimeService');

// Facebook Webhook verification
router.get('/facebook', (req, res) => {
    const VERIFY_TOKEN = process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN;
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token === VERIFY_TOKEN) {
        console.log('Facebook webhook verified');
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

// Facebook Webhook events
router.post('/facebook', async (req, res) => {
    const body = req.body;

    if (body.object === 'page') {
        body.entry.forEach(async (entry) => {
            // Handle different webhook events
            if (entry.changes) {
                for (const change of entry.changes) {
                    await handleFacebookChange(change);
                }
            }
        });
        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.sendStatus(404);
    }
});

async function handleFacebookChange(change) {
    try {
        const { field, value } = change;

        switch (field) {
            case 'feed':
                if (value.item === 'post') {
                    await handlePostInteraction(value);
                }
                break;
            
            case 'likes':
                await handleLikeUpdate(value);
                break;
            
            case 'comments':
                await handleCommentUpdate(value);
                break;
            
            default:
                console.log('Unhandled webhook field:', field);
        }
    } catch (error) {
        console.error('Error handling Facebook change:', error);
    }
}

async function handlePostInteraction(value) {
    const postId = value.post_id;
    const verb = value.verb; // 'add', 'remove', 'edit'

    // Find the post in our database
    const post = await Post.findOne({ 'platform_ids.facebook': postId });
    
    if (post && global.realtimeService) {
        global.realtimeService.notifyEngagement(post._id, 'post_interaction', {
            type: value.item,
            action: verb,
            timestamp: new Date()
        });
    }
}

async function handleLikeUpdate(value) {
    const postId = value.post_id;
    const post = await Post.findOne({ 'platform_ids.facebook': postId });
    
    if (post) {
        // Update like count (you might need to fetch from API for exact count)
        post.performance.likes = value.likes_count || post.performance.likes + 1;
        await post.save();

        if (global.realtimeService) {
            global.realtimeService.notifyEngagement(post._id, 'like', {
                count: post.performance.likes,
                timestamp: new Date()
            });
        }
    }
}

async function handleCommentUpdate(value) {
    const postId = value.post_id;
    const post = await Post.findOne({ 'platform_ids.facebook': postId });
    
    if (post) {
        post.performance.comments = value.comments_count || post.performance.comments + 1;
        await post.save();

        if (global.realtimeService) {
            global.realtimeService.notifyEngagement(post._id, 'comment', {
                count: post.performance.comments,
                comment: value.message,
                timestamp: new Date()
            });
        }
    }
}

module.exports = router;
