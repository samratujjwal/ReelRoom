import { Server as SocketIOServer } from 'socket.io';
import { socketAuthMiddleware } from '../middleware/socketAuth.js';
import { registerRoomHandlers } from './handlers/roomHandler.js';
import { registerPlaybackHandlers } from './handlers/playbackHandler.js';
import { registerRoleHandlers } from './handlers/roleHandler.js';
import { registerChatHandlers } from './handlers/chatHandler.js';
import { logger } from '../utils/logger.js';
export function setupSocketServer(httpServer) {
    const io = new SocketIOServer(httpServer, {
        cors: {
            origin: true,
            methods: ['GET', 'POST'],
            credentials: true
        },
        transports: ['websocket', 'polling']
    });
    // Attach auth middleware
    io.use(socketAuthMiddleware);
    io.on('connection', (socket) => {
        logger.info(`New WebSocket client connected: ${socket.id}`);
        // Register modular event handlers
        registerRoomHandlers(io, socket);
        registerPlaybackHandlers(io, socket);
        registerRoleHandlers(io, socket);
        registerChatHandlers(io, socket);
    });
    return io;
}
