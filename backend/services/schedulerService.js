const cron = require('node-cron');
const Post = require('../models/Post');
const FacebookService = require('./facebookService');
const RealtimeService = require('./realtimeService');

class SchedulerService {
    constructor() {
        this.facebookService = new FacebookService(process.env.FACEBOOK_ACCESS_TOKEN);
        this.scheduledJobs = new Map();
    }

    async processScheduledPosts() {
        try {
            const now = new Date();
            const scheduledPosts = await Post.find({
                status: 'scheduled',
                scheduled_time: { $lte: now }
            });

            for (const post of scheduledPosts) {
                await this.publishScheduledPost(post);
            }
        } catch (error) {
            console.error('Error processing scheduled posts:', error);
        }
    }

    async publishScheduledPost(post) {
        try {
            // Publish to Facebook
            if (post.platforms.includes('facebook')) {
                const result = await this.facebookService.publishPost({
                    message: post.content
                });

                if (result) {
                    post.platform_ids.facebook = result.id;
                }
            }

            // Update post status
            post.status = 'published';
            post.published_time = new Date();
            await post.save();

            console.log(`Published scheduled post: ${post._id}`);
            
            // Notify clients in real-time
            if (global.realtimeService) {
                global.realtimeService.io.to('dashboard').emit('post_published', {
                    post: post,
                    timestamp: new Date()
                });
            }

        } catch (error) {
            console.error(`Error publishing post ${post._id}:`, error);
            post.status = 'failed';
            await post.save();
        }
    }

    schedulePost(post) {
        const jobId = post._id.toString();
        
        // Cancel existing job if it exists
        if (this.scheduledJobs.has(jobId)) {
            this.scheduledJobs.get(jobId).cancel();
        }

        // Create new scheduled job
        const scheduledTime = new Date(post.scheduled_time);
        const cronExpression = this.dateToCron(scheduledTime);

        const job = cron.schedule(cronExpression, async () => {
            await this.publishScheduledPost(post);
            this.scheduledJobs.delete(jobId);
        }, { scheduled: false });

        this.scheduledJobs.set(jobId, job);
        job.start();

        console.log(`Scheduled post ${jobId} for ${scheduledTime}`);
    }

    dateToCron(date) {
        const minute = date.getMinutes();
        const hour = date.getHours();
        const day = date.getDate();
        const month = date.getMonth() + 1;
        
        return `${minute} ${hour} ${day} ${month} *`;
    }

    cancelScheduledPost(postId) {
        const jobId = postId.toString();
        if (this.scheduledJobs.has(jobId)) {
            this.scheduledJobs.get(jobId).cancel();
            this.scheduledJobs.delete(jobId);
            console.log(`Canceled scheduled post: ${jobId}`);
        }
    }
}

module.exports = SchedulerService;
