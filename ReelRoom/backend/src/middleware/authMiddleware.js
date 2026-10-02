import { AuthService } from '../services/AuthService.js';
export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : req.query.token;
    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Access denied: No authentication token provided'
        });
    }
    try {
        const authService = AuthService.getInstance();
        const payload = authService.verifyToken(token);
        req.user = payload;
        next();
    }
    catch (err) {
        return res.status(403).json({
            success: false,
            error: 'Invalid or expired token'
        });
    }
};
