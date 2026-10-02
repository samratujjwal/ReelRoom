import { RoomManager } from '../services/RoomManager.js';
import { extractYouTubeId } from '../utils/youtube.js';
const roomManager = RoomManager.getInstance();
export const createRoom = (req, res) => {
    try {
        const { name, hostUsername, initialVideoUrl, videoId, hostUserId: clientHostUserId } = req.body;
        if (!hostUsername || typeof hostUsername !== 'string' || hostUsername.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'hostUsername is required'
            });
        }
        const hostUserId = clientHostUserId || req.user?.userId || ('usr-' + Math.random().toString(36).substring(2, 9));
        let targetVideoId = 'dQw4w9WgXcQ'; // Default: Rickroll
        const videoInput = videoId || initialVideoUrl;
        if (videoInput) {
            const extracted = extractYouTubeId(videoInput);
            if (extracted) {
                targetVideoId = extracted;
            }
        }
        const room = roomManager.createRoom(name || 'ReelRoom Watch Room', hostUserId, hostUsername.trim(), targetVideoId);
        return res.status(201).json({
            success: true,
            message: 'Room created successfully',
            data: {
                roomId: room.id,
                code: room.code,
                name: room.name,
                hostUserId,
                hostUsername: room.hostUsername,
                videoState: room.getVideoState().toJSON(),
                createdAt: room.createdAt.toISOString()
            }
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            error: err.message || 'Failed to create room'
        });
    }
};
export const getRoom = (req, res) => {
    try {
        const { roomId } = req.params;
        const room = roomManager.getRoom(roomId);
        if (!room) {
            return res.status(404).json({
                success: false,
                error: 'Room not found'
            });
        }
        return res.status(200).json({
            success: true,
            data: room.toJSON()
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            error: err.message || 'Failed to fetch room'
        });
    }
};
export const listRooms = (req, res) => {
    try {
        const rooms = roomManager.getAllRooms().map(room => room.toJSON());
        return res.status(200).json({
            success: true,
            count: rooms.length,
            data: rooms
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            error: err.message || 'Failed to list rooms'
        });
    }
};
export const listUserRooms = (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId || typeof userId !== 'string') {
            return res.status(400).json({ success: false, error: 'userId query parameter is required' });
        }
        const allRooms = roomManager.getAllRooms();
        const userRooms = allRooms.filter(room => room.getHostId() === userId).map(room => room.toJSON());
        return res.status(200).json({
            success: true,
            count: userRooms.length,
            data: userRooms
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            error: err.message || 'Failed to list user rooms'
        });
    }
};
export const deleteRoom = (req, res) => {
    try {
        const { roomId } = req.params;
        const requestingUserId = req.body?.hostUserId || req.body?.userId || req.user?.userId || req.user?.id || req.headers['x-user-id'];
        const requestingUsername = req.body?.username || req.body?.hostUsername || req.user?.username || req.headers['x-username'];
        if (!roomId) {
            return res.status(400).json({
                success: false,
                error: 'roomId parameter is required'
            });
        }
        const room = roomManager.getRoom(roomId);
        if (!room) {
            return res.status(200).json({
                success: true,
                message: 'Room already deleted or not found'
            });
        }
        // Verify creator status: only hostId or hostUsername match allows deletion
        const isCreator = (requestingUserId && room.getHostId() === requestingUserId) ||
            (requestingUsername && room.hostUsername.toLowerCase() === requestingUsername.toLowerCase());
        if (!isCreator && requestingUserId) {
            return res.status(403).json({
                success: false,
                error: 'Permission denied: Only the room creator can delete this room'
            });
        }
        roomManager.deleteRoom(roomId);
        return res.status(200).json({
            success: true,
            message: 'Room deleted successfully'
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            error: err.message || 'Failed to delete room'
        });
    }
};
