// Index Creation Script
// Run this to create all necessary indexes for optimal performance

use('social-media-manager');

// Users collection indexes
db.users.createIndex({ "email": 1 }, { unique: true, background: true });
db.users.createIndex({ "isActive": 1 }, { background: true });
db.users.createIndex({ "createdAt": -1 }, { background: true });
db.users.createIndex({ "lastLogin": -1 }, { background: true });
db.users.createIndex({ "role": 1 }, { background: true });

// Instagram accounts collection indexes
db.instagram_accounts.createIndex({ "userId": 1, "isActive": 1 }, { background: true });
db.instagram_accounts.createIndex({ "instagramUserId": 1 }, { unique: true, background: true });
db.instagram_accounts.createIndex({ "username": 1 }, { background: true });
db.instagram_accounts.createIndex({ "tokenExpiry": 1 }, { background: true });
db.instagram_accounts.createIndex({ "userId": 1, "username": 1 }, { background: true });

// Posts collection indexes
db.posts.createIndex({ "userId": 1, "status": 1 }, { background: true });
db.posts.createIndex({ "userId": 1, "createdAt": -1 }, { background: true });
db.posts.createIndex({ "instagramAccountId": 1 }, { background: true });
db.posts.createIndex({ "instagramPostId": 1 }, { unique: true, sparse: true, background: true });
db.posts.createIndex({ "scheduling.scheduledFor": 1, "status": 1 }, { background: true });
db.posts.createIndex({ "scheduling.publishedAt": -1 }, { background: true });
db.posts.createIndex({ "status": 1 }, { background: true });
db.posts.createIndex({ "content.mediaType": 1 }, { background: true });

// Analytics collection indexes  
db.analytics.createIndex({ "postId": 1 }, { unique: true, background: true });
db.analytics.createIndex({ "instagramPostId": 1 }, { unique: true, background: true });
db.analytics.createIndex({ "lastUpdated": -1 }, { background: true });
db.analytics.createIndex({ "metrics.likes": -1 }, { background: true });
db.analytics.createIndex({ "engagement.rate": -1 }, { background: true });

// Compound indexes for complex queries
db.posts.createIndex({ 
  "userId": 1, 
  "status": 1, 
  "createdAt": -1 
}, { background: true });

db.posts.createIndex({ 
  "userId": 1, 
  "content.mediaType": 1, 
  "scheduling.publishedAt": -1 
}, { background: true });

// Text indexes for search functionality
db.posts.createIndex({ 
  "content.caption": "text", 
  "content.hashtags": "text" 
}, { 
  background: true,
  name: "post_search_index"
});

db.users.createIndex({ 
  "name": "text", 
  "email": "text" 
}, { 
  background: true,
  name: "user_search_index"
});

print("All indexes created successfully!");
