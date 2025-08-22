class DataProcessor {
    static calculateEngagementRate(likes, comments, shares, impressions) {
        const totalEngagements = likes + comments + shares;
        return impressions > 0 ? ((totalEngagements / impressions) * 100).toFixed(2) : 0;
    }

    static calculateGrowthPercentage(current, previous) {
        if (previous === 0) return current > 0 ? 100 : 0;
        return (((current - previous) / previous) * 100).toFixed(1);
    }

    static formatTimeRange(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        
        return {
            days: daysDiff,
            formatted: `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`
        };
    }

    static aggregateAnalytics(analyticsArray) {
        if (!analyticsArray.length) return null;

        const totals = analyticsArray.reduce((acc, item) => {
            acc.followers += item.metrics.followers || 0;
            acc.impressions += item.metrics.impressions || 0;
            acc.engagements += item.metrics.engagements || 0;
            acc.reach += item.metrics.reach || 0;
            return acc;
        }, { followers: 0, impressions: 0, engagements: 0, reach: 0 });

        return {
            ...totals,
            engagement_rate: this.calculateEngagementRate(
                totals.engagements, 
                0, 
                0, 
                totals.impressions
            ),
            avg_followers: Math.round(totals.followers / analyticsArray.length),
            data_points: analyticsArray.length
        };
    }

    static generateChartData(analyticsArray, metric = 'impressions') {
        return {
            labels: analyticsArray.map(item => 
                new Date(item.createdAt).toLocaleDateString()
            ),
            datasets: [{
                label: metric.charAt(0).toUpperCase() + metric.slice(1),
                data: analyticsArray.map(item => item.metrics[metric] || 0),
                borderColor: this.getMetricColor(metric),
                backgroundColor: this.getMetricColor(metric, 0.1),
                tension: 0.3
            }]
        };
    }

    static getMetricColor(metric, alpha = 1) {
        const colors = {
            impressions: `rgba(67, 97, 238, ${alpha})`,
            engagements: `rgba(247, 37, 133, ${alpha})`,
            followers: `rgba(34, 197, 94, ${alpha})`,
            reach: `rgba(245, 158, 11, ${alpha})`
        };
        return colors[metric] || `rgba(107, 114, 128, ${alpha})`;
    }

    static processPostPerformance(posts) {
        return posts.map(post => {
            const performance = post.performance || {};
            const engagementRate = this.calculateEngagementRate(
                performance.likes || 0,
                performance.comments || 0,
                performance.shares || 0,
                performance.views || 0
            );

            return {
                ...post.toObject(),
                calculated_metrics: {
                    engagement_rate: engagementRate,
                    total_engagements: (performance.likes || 0) + 
                                     (performance.comments || 0) + 
                                     (performance.shares || 0),
                    performance_score: this.calculatePerformanceScore(performance)
                }
            };
        });
    }

    static calculatePerformanceScore(performance) {
        const weights = {
            likes: 1,
            comments: 3,
            shares: 5,
            views: 0.1
        };

        let score = 0;
        Object.keys(weights).forEach(metric => {
            score += (performance[metric] || 0) * weights[metric];
        });

        return Math.round(score);
    }

    static getTopPerformingPosts(posts, limit = 5) {
        const processedPosts = this.processPostPerformance(posts);
        return processedPosts
            .sort((a, b) => b.calculated_metrics.performance_score - a.calculated_metrics.performance_score)
            .slice(0, limit);
    }

    static generateInsightsSummary(analytics, posts) {
        const totalPosts = posts.length;
        const publishedPosts = posts.filter(p => p.status === 'published').length;
        const scheduledPosts = posts.filter(p => p.status === 'scheduled').length;
        
        const avgEngagementRate = analytics?.metrics?.engagement_rate || 0;
        const totalImpressions = analytics?.metrics?.impressions || 0;
        
        return {
            content_performance: {
                total_posts: totalPosts,
                published_posts: publishedPosts,
                scheduled_posts: scheduledPosts,
                avg_engagement_rate: avgEngagementRate
            },
            reach_insights: {
                total_impressions: totalImpressions,
                estimated_reach: Math.round(totalImpressions * 0.8), // Assuming 80% reach rate
                engagement_quality: avgEngagementRate > 3 ? 'High' : avgEngagementRate > 1 ? 'Medium' : 'Low'
            },
            recommendations: this.generateRecommendations(avgEngagementRate, publishedPosts, scheduledPosts)
        };
    }

    static generateRecommendations(engagementRate, publishedCount, scheduledCount) {
        const recommendations = [];

        if (engagementRate < 2) {
            recommendations.push('Consider improving content quality to boost engagement');
        }
        
        if (publishedCount < 5) {
            recommendations.push('Increase posting frequency for better reach');
        }
        
        if (scheduledCount === 0) {
            recommendations.push('Schedule posts in advance for consistent posting');
        }
        
        if (engagementRate > 5) {
            recommendations.push('Great engagement! Consider similar content strategies');
        }

        return recommendations;
    }
}

module.exports = DataProcessor;
