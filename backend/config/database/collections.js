// Collection Setup Script
// Sets up collection configurations and initial data

use('social-media-manager');

// Configure capped collection for system logs
db.createCollection("system_logs", {
  capped: true,
  size: 100000000, // 100MB
  max: 10000
});

// Configure capped collection for audit logs
db.createCollection("audit_logs", {
  capped: true,
  size: 50000000, // 50MB
  max: 5000
});

// Insert initial configuration data
db.app_config.insertOne({
  _id: ObjectId(),
  name: "default_settings",
  settings: {
    maxPostsPerDay: 50,
    maxHashtagsPerPost: 30,
    supportedMediaTypes: ["IMAGE", "VIDEO", "CAROUSEL_ALBUM", "REEL"],
    maxFileSizeMB: 100,
    timezone: "UTC",
    analytics: {
      updateIntervalHours: 6,
      retentionDays: 365
    },
    instagram: {
      apiVersion: "v18.0",
      rateLimits: {
        postsPerHour: 25,
        requestsPerMinute: 200
      }
    }
  },
  createdAt: new Date(),
  updatedAt: new Date()
});

// Insert sample hashtag categories
db.hashtag_categories.insertMany([
  {
    category: "lifestyle",
    hashtags: ["lifestyle", "daily", "life", "mood", "vibes", "inspiration"],
    createdAt: new Date()
  },
  {
    category: "business", 
    hashtags: ["business", "entrepreneur", "success", "marketing", "growth"],
    createdAt: new Date()
  },
  {
    category: "technology",
    hashtags: ["tech", "innovation", "digital", "ai", "automation", "future"],
    createdAt: new Date()
  },
  {
    category: "photography",
    hashtags: ["photography", "photo", "camera", "art", "creative", "capture"],
    createdAt: new Date()
  }
]);

print("Collections and initial data setup completed!");
