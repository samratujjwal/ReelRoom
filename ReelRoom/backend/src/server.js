import http from 'http';
import app from './app.js';
import { setupSocketServer } from './websocket/socketServer.js';
import { config } from './config/index.js';
import { connectDatabase } from './config/database.js';
import { logger } from './utils/logger.js';
import { RoomManager } from './services/RoomManager.js';
import { AuthService } from './services/AuthService.js';
const server = http.createServer(app);
const io = setupSocketServer(server);
async function bootstrap() {
    // Connect to MongoDB Atlas
    await connectDatabase();
    // Load existing persisted data into memory
    await AuthService.getInstance().loadUsersFromStorage();
    await RoomManager.getInstance().loadRoomsFromStorage();
    server.listen(config.port, () => {
        logger.info(`ReelRoom Backend Server running on port ${config.port}`);
    });
}
bootstrap();
export { server, io };
