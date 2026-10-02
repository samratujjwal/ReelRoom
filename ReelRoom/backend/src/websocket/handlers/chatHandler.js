import { RoomManager } from '../../services/RoomManager.js';
import { PermissionService } from '../../services/PermissionService.js';
import { logger } from '../../utils/logger.js';
export function registerChatHandlers(io, socket) {
    const roomManager = RoomManager.getInstance();
    socket.on('send_message', (data) => {
        try {
            const roomId = socket.roomId;
            if (!roomId) {
                socket.emit('error_event', { message: 'Not in a room' });
                return;
            }
            const room = roomManager.getRoom(roomId);
            if (!room) {
                socket.emit('error_event', { message: 'Room not found' });
                return;
            }
            const participant = room.getParticipantBySocketId(socket.id);
            if (!PermissionService.canSendChat(participant)) {
                socket.emit('error_event', { message: 'Permission denied' });
                return;
            }
            if (!data?.message || data.message.trim().length === 0) {
                return;
            }
            const chatMsg = room.addChatMessage(participant.userId, participant.username, data.message.trim());
            logger.info(`Chat message in room ${roomId} by ${participant.username}: ${data.message.substring(0, 30)}`);
            const chatPayload = {
                ...chatMsg,
                role: participant.role, // Include role for frontend badge display
            };
            io.to(roomId).emit('chat_message', chatPayload);
        }
        catch (err) {
            logger.error('Error in send_message handler:', err);
            socket.emit('error_event', { message: err.message });
        }
    });
    socket.on('send_reaction', (data) => {
        try {
            const roomId = socket.roomId;
            if (!roomId)
                return;
            const room = roomManager.getRoom(roomId);
            if (!room)
                return;
            const participant = room.getParticipantBySocketId(socket.id);
            if (!participant)
                return;
            if (!data?.emoji)
                return;
            io.to(roomId).emit('reaction', {
                userId: participant.userId,
                username: participant.username,
                emoji: data.emoji,
                timestamp: new Date().toISOString()
            });
        }
        catch (err) {
            logger.error('Error in send_reaction handler:', err);
        }
    });
}
