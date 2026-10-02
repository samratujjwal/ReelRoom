import { Router } from 'express';
import { createRoom, getRoom, listRooms, listUserRooms, deleteRoom } from '../controllers/roomController.js';
const router = Router();
router.post('/', createRoom);
router.get('/', listRooms);
router.get('/my-rooms', listUserRooms);
router.get('/:roomId', getRoom);
router.delete('/:roomId', deleteRoom);
export default router;
