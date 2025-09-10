// Database Initialization Script
// Run this script to set up the initial database structure

// Switch to the social media manager database
use('social-media-manager');

// Create admin user
db.createUser({
  user: "admin",
  pwd: "secure_password_here",
  roles: [
    { role: "readWrite", db: "social-media-manager" },
    { role: "dbAdmin", db: "social-media-manager" }
  ]
});

// Create application user
db.createUser({
  user: "app_user",
  pwd: "app_password_here", 
  roles: [
    { role: "readWrite", db: "social-media-manager" }
  ]
});

// Create collections with validation
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "email", "password"],
      properties: {
        name: {
          bsonType: "string",
          minLength: 2,
          maxLength: 50,
          description: "Name must be a string between 2-50 characters"
        },
        email: {
          bsonType: "string",
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
          description: "Email must be a valid email address"
        },
        password: {
          bsonType: "string",
          minLength: 8,
          description: "Password must be at least 8 characters"
        },
        role: {
          enum: ["user", "admin", "moderator"],
          description: "Role must be one of: user, admin, moderator"
        },
        isActive: {
          bsonType: "bool",
          description: "isActive must be a boolean"
        }
      }
    }
  }
});

db.createCollection("instagram_accounts", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "instagramUserId", "username", "accessToken"],
      properties: {
        userId: {
          bsonType: "objectId",
          description: "userId must be a valid ObjectId"
        },
        instagramUserId: {
          bsonType: "string",
          description: "instagramUserId must be a string"
        },
        username: {
          bsonType: "string",
          pattern: "^[a-zA-Z0-9_.]+$",
          description: "Username must contain only letters, numbers, dots and underscores"
        },
        accessToken: {
          bsonType: "string",
          description: "accessToken must be a string"
        },
        accountType: {
          enum: ["PERSONAL", "BUSINESS", "CREATOR"],
          description: "accountType must be PERSONAL, BUSINESS, or CREATOR"
        }
      }
    }
  }
});

db.createCollection("posts", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "instagramAccountId", "content"],
      properties: {
        userId: {
          bsonType: "objectId",
          description: "userId must be a valid ObjectId"
        },
        instagramAccountId: {
          bsonType: "objectId",
          description: "instagramAccountId must be a valid ObjectId"
        },
        content: {
          bsonType: "object",
          required: ["mediaType"],
          properties: {
            mediaType: {
              enum: ["IMAGE", "VIDEO", "CAROUSEL_ALBUM", "REEL", "STORY"],
              description: "mediaType must be one of the specified values"
            },
            caption: {
              bsonType: "string",
              maxLength: 2200,
              description: "Caption cannot exceed 2200 characters"
            }
          }
        },
        status: {
          enum: ["DRAFT", "SCHEDULED", "PUBLISHING", "PUBLISHED", "FAILED", "DELETED"],
          description: "Status must be one of the specified values"
        }
      }
    }
  }
});

db.createCollection("analytics", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["postId", "instagramPostId"],
      properties: {
        postId: {
          bsonType: "objectId",
          description: "postId must be a valid ObjectId"
        },
        instagramPostId: {
          bsonType: "string",
          description: "instagramPostId must be a string"
        },
        metrics: {
          bsonType: "object",
          properties: {
            likes: {
              bsonType: "int",
              minimum: 0,
              description: "likes must be a non-negative integer"
            },
            comments: {
              bsonType: "int", 
              minimum: 0,
              description: "comments must be a non-negative integer"
            },
            reach: {
              bsonType: "int",
              minimum: 0,
              description: "reach must be a non-negative integer"
            }
          }
        }
      }
    }
  }
});

print("Database initialization completed successfully!");
