import { AuthService } from '../services/AuthService.js';
import { logger } from '../utils/logger.js';
export function socketAuthMiddleware(socket, next) {
    try {
        const token = socket.handshake.auth?.token || socket.handshake.query?.token;
        if (token) {
            const authService = AuthService.getInstance();
            const payload = authService.verifyToken(token);
            socket.authUser = payload;
            logger.info(`Authenticated WebSocket connection for user: ${payload.username} (${payload.userId})`);
        }
        // Allow connection even if token is absent (guests can join with custom username)
        next();
    }
    catch (err) {
        logger.warn(`WebSocket authentication failed: ${err.message}`);
        // Non-blocking so guests can still connect or re-auth
        next();
    }
}
