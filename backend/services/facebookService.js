const axios = require('axios');

class FacebookService {
    constructor(accessToken) {
        this.accessToken = accessToken;
        this.baseURL = 'https://graph.facebook.com/v18.0';
    }

    async getPageInsights() {
        try {
            const [pageInfo, insights, posts] = await Promise.all([
                this.getPageInfo(),
                this.getInsights(),
                this.getRecentPosts()
            ]);

            return {
                followers_count: pageInfo?.followers_count || pageInfo?.fan_count,
                impressions: this.calculateTotalImpressions(insights),
                engagements: this.calculateTotalEngagements(insights),
                engagement_rate: this.calculateEngagementRate(insights),
                demographics: await this.getDemographics(),
                hourly_activity: await this.getHourlyActivity(),
                daily_activity: await this.getDailyActivity(),
                recent_posts: posts
            };
        } catch (error) {
            console.error('Error fetching Facebook insights:', error);
            return null;
        }
    }

    async getPageInfo() {
        const response = await axios.get(`${this.baseURL}/me`, {
            params: {
                fields: 'followers_count,name,fan_count',
                access_token: this.accessToken
            }
        });
        return response.data;
    }

    async getInsights() {
        const response = await axios.get(`${this.baseURL}/me/insights`, {
            params: {
                metric: 'page_impressions,page_engaged_users,page_posts_impressions',
                period: 'day',
                access_token: this.accessToken
            }
        });
        return response.data;
    }

    async getRecentPosts() {
        const response = await axios.get(`${this.baseURL}/me/posts`, {
            params: {
                fields: 'message,created_time,likes.summary(true),shares,comments.summary(true)',
                limit: 10,
                access_token: this.accessToken
            }
        });
        return response.data.data;
    }

    async publishPost(content, scheduledTime = null) {
        try {
            const postData = {
                message: content.message,
                access_token: this.accessToken
            };

            if (content.link) postData.link = content.link;
            if (scheduledTime) postData.scheduled_publish_time = Math.floor(new Date(scheduledTime).getTime() / 1000);

            const endpoint = scheduledTime ? 
                `${this.baseURL}/me/scheduled_posts` : 
                `${this.baseURL}/me/feed`;

            const response = await axios.post(endpoint, postData);
            return response.data;
        } catch (error) {
            console.error('Error publishing post:', error);
            throw error;
        }
    }

    calculateTotalImpressions(insights) {
        if (!insights?.data) return 0;
        const impressionsData = insights.data.find(d => d.name === 'page_impressions');
        return impressionsData?.values?.reduce((sum, val) => sum + val.value, 0) || 0;
    }

    calculateTotalEngagements(insights) {
        if (!insights?.data) return 0;
        const engagementsData = insights.data.find(d => d.name === 'page_engaged_users');
        return engagementsData?.values?.reduce((sum, val) => sum + val.value, 0) || 0;
    }

    calculateEngagementRate(insights) {
        const impressions = this.calculateTotalImpressions(insights);
        const engagements = this.calculateTotalEngagements(insights);
        return impressions > 0 ? ((engagements / impressions) * 100).toFixed(2) : 0;
    }
}

module.exports = FacebookService;
