const Joi = require('joi');

const validatePost = (req, res, next) => {
    const schema = Joi.object({
        content: Joi.string().required().min(1).max(5000),
        platforms: Joi.array().items(Joi.string().valid('facebook', 'instagram', 'twitter', 'linkedin')).min(1).required(),
        scheduled_time: Joi.date().optional(),
        tags: Joi.array().items(Joi.string()).optional(),
        media: Joi.array().items(Joi.object({
            type: Joi.string().valid('image', 'video'),
            url: Joi.string().uri()
        })).optional()
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    next();
};

const validateScheduleTime = (req, res, next) => {
    const { scheduled_time } = req.body;
    
    if (scheduled_time) {
        const scheduleDate = new Date(scheduled_time);
        const now = new Date();
        
        if (scheduleDate <= now) {
            return res.status(400).json({ message: 'Scheduled time must be in the future' });
        }
        
        // Check if schedule time is more than 6 months in the future
        const sixMonthsFromNow = new Date();
        sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
        
        if (scheduleDate > sixMonthsFromNow) {
            return res.status(400).json({ message: 'Cannot schedule posts more than 6 months in advance' });
        }
    }
    
    next();
};

module.exports = { validatePost, validateScheduleTime };
