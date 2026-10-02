import { Router } from 'express';
import { RoomManager } from '../services/RoomManager.js';
const router = Router();
router.get('/', (req, res) => {
    const roomManager = RoomManager.getInstance();
    const roomsCount = roomManager.getAllRooms().length;
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
        activeRooms: roomsCount
    });
});
export default router;
