"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.AppError = void 0;
class AppError extends Error {
    constructor(message, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'AppError';
    }
}
exports.AppError = AppError;
const errorHandler = (err, _req, res, _next) => {
    if (err.name === 'AppError') {
        const appErr = err;
        return res.status(appErr.statusCode).json({ success: false, error: appErr.message });
    }
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }
    if (err.name === 'ZodError') {
        return res.status(422).json({ success: false, error: 'Validation error', details: err.message });
    }
    console.error('Unhandled error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map