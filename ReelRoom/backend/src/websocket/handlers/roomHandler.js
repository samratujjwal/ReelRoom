import { RoomManager } from '../../services/RoomManager.js';
import { logger } from '../../utils/logger.js';
export function registerRoomHandlers(io, socket) {
    const roomManager = RoomManager.getInstance();
    socket.on('join_room', (data) => {
        try {
            const authUser = socket.authUser;
            const username = authUser?.username || data.username;
            const userId = authUser?.userId || data.userId || socket.id;
            const { roomId } = data;
            if (!roomId || !username) {
                socket.emit('error_event', { message: 'roomId and username are required' });
                return;
            }
            let room = roomManager.getRoom(roomId);
            if (!room) {
                // Auto-create room if joining by new code/ID
                room = roomManager.createRoom('ReelRoom Watch Room', userId, username);
            }
            const participant = room.addParticipant(userId, username, socket.id);
            socket.join(room.id);
            socket.roomId = room.id;
            socket.userId = userId;
            logger.info(`User ${username} (${userId}) joined room ${room.id} with role ${participant.role}`);
            // Broadcast room_state and user_joined to all clients in room
            const roomJSON = room.toJSON();
            io.to(room.id).emit('room_state', roomJSON);
            io.to(room.id).emit('user_joined', {
                userId: participant.userId,
                username: participant.username,
                role: participant.role,
                participants: room.getAllParticipants().map(p => p.toJSON())
            });
            // Send initial sync state to joining client
            const videoStateJSON = room.getVideoState().toJSON();
            socket.emit('sync_state', {
                playState: videoStateJSON.playState,
                currentTime: videoStateJSON.currentTime,
                videoId: videoStateJSON.videoId,
                lastUpdated: videoStateJSON.lastUpdated
            });
            // Send chat history
            socket.emit('chat_history', { messages: room.getChatHistory() });
        }
        catch (err) {
            logger.error('Error in join_room handler:', err);
            socket.emit('error_event', { message: err.message || 'Failed to join room' });
        }
    });
    socket.on('leave_room', (data) => {
        try {
            const roomId = data?.roomId || socket.roomId;
            if (!roomId)
                return;
            const room = roomManager.getRoom(roomId);
            if (!room)
                return;
            const { participant, newHost } = room.removeParticipantBySocketId(socket.id);
            socket.leave(roomId);
            delete socket.roomId;
            if (participant) {
                logger.info(`User ${participant.username} left room ${roomId}`);
                const roomJSON = room.toJSON();
                io.to(roomId).emit('room_state', roomJSON);
                io.to(roomId).emit('user_left', {
                    userId: participant.userId,
                    username: participant.username,
                    participants: room.getAllParticipants().map(p => p.toJSON())
                });
            }
            if (newHost) {
                logger.info(`New host promoted in room ${roomId}: ${newHost.username}`);
                io.to(roomId).emit('role_assigned', {
                    userId: newHost.userId,
                    username: newHost.username,
                    role: newHost.role,
                    participants: room.getAllParticipants().map(p => p.toJSON())
                });
            }
            // Room persists even if empty, so it shows up in dashboard and explore
        }
        catch (err) {
            logger.error('Error in leave_room handler:', err);
        }
    });
    socket.on('disconnect', () => {
        try {
            const roomId = socket.roomId;
            if (!roomId)
                return;
            const room = roomManager.getRoom(roomId);
            if (!room)
                return;
            const { participant, newHost } = room.removeParticipantBySocketId(socket.id);
            if (participant) {
                logger.info(`Socket disconnected, user ${participant.username} left room ${roomId}`);
                const roomJSON = room.toJSON();
                io.to(roomId).emit('room_state', roomJSON);
                io.to(roomId).emit('user_left', {
                    userId: participant.userId,
                    username: participant.username,
                    participants: room.getAllParticipants().map(p => p.toJSON())
                });
            }
            if (newHost) {
                io.to(roomId).emit('role_assigned', {
                    userId: newHost.userId,
                    username: newHost.username,
                    role: newHost.role,
                    participants: room.getAllParticipants().map(p => p.toJSON())
                });
            }
            // Room persists even if empty, so it shows up in dashboard and explore
        }
        catch (err) {
            logger.error('Error in disconnect handler:', err);
        }
    });
}
