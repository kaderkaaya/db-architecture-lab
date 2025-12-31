import { rateLimit } from "express-rate-limit";

const authLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 10,
    message: {
        error: 'to many attempts for this endpoint',
        retryAfter: '10 minutes',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipFailedRequests: false,
    skipSuccessfulRequests: false
});

export default authLimiter;