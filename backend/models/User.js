const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 50
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    profile: {
        firstName: String,
        lastName: String,
        avatar: String,
        bio: String,
        timezone: {
            type: String,
            default: 'UTC'
        }
    },
    social_accounts: {
        facebook: {
            page_id: String,
            access_token: String,
            connected: { type: Boolean, default: false }
        },
        instagram: {
            account_id: String,
            access_token: String,
            connected: { type: Boolean, default: false }
        },
        twitter: {
            account_id: String,
            access_token: String,
            access_token_secret: String,
            connected: { type: Boolean, default: false }
        },
        linkedin: {
            account_id: String,
            access_token: String,
            connected: { type: Boolean, default: false }
        }
    },
    preferences: {
        notification_settings: {
            email_notifications: { type: Boolean, default: true },
            push_notifications: { type: Boolean, default: true },
            engagement_alerts: { type: Boolean, default: true }
        },
        dashboard_settings: {
            default_timeframe: { type: String, default: '7d' },
            auto_refresh: { type: Boolean, default: true },
            chart_preferences: {
                type: Map,
                of: String,
                default: {}
            }
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: Date,
    loginCount: {
        type: Number,
        default: 0
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ createdAt: -1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Virtual for full name
userSchema.virtual('profile.fullName').get(function() {
    return `${this.profile?.firstName || ''} ${this.profile?.lastName || ''}`.trim();
});

// Method to check if user has connected social accounts
userSchema.methods.hasConnectedAccounts = function() {
    const accounts = this.social_accounts;
    return accounts.facebook.connected || 
           accounts.instagram.connected || 
           accounts.twitter.connected || 
           accounts.linkedin.connected;
};

// Method to get connected platforms
userSchema.methods.getConnectedPlatforms = function() {
    const platforms = [];
    const accounts = this.social_accounts;
    
    if (accounts.facebook.connected) platforms.push('facebook');
    if (accounts.instagram.connected) platforms.push('instagram');
    if (accounts.twitter.connected) platforms.push('twitter');
    if (accounts.linkedin.connected) platforms.push('linkedin');
    
    return platforms;
};

module.exports = mongoose.model('User', userSchema);
