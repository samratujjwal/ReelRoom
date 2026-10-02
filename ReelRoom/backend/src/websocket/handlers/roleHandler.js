import { RoomManager } from '../../services/RoomManager.js';
import { PermissionService } from '../../services/PermissionService.js';
import { Role } from '../../models/Participant.js';
import { logger } from '../../utils/logger.js';
export function registerRoleHandlers(io, socket) {
    const roomManager = RoomManager.getInstance();
    socket.on('assign_role', (data) => {
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
            const actor = room.getParticipantBySocketId(socket.id);
            if (!PermissionService.isHost(actor)) {
                logger.warn(`Permission denied: Non-host ${actor?.username} attempted to assign role`);
                socket.emit('error_event', {
                    code: 'UNAUTHORIZED_ROLE',
                    message: 'Permission denied: Only Host can assign roles'
                });
                return;
            }
            if (!data?.userId || !data?.role || !Object.values(Role).includes(data.role)) {
                socket.emit('error_event', { message: 'Invalid userId or role provided' });
                return;
            }
            const updatedParticipant = room.assignRole(data.userId, data.role);
            if (!updatedParticipant) {
                socket.emit('error_event', { message: 'Target participant not found in room' });
                return;
            }
            logger.info(`Host ${actor?.username} assigned role ${data.role} to ${updatedParticipant.username} (${updatedParticipant.userId})`);
            io.to(roomId).emit('role_assigned', {
                userId: updatedParticipant.userId,
                username: updatedParticipant.username,
                role: updatedParticipant.role,
                participants: room.getAllParticipants().map(p => p.toJSON())
            });
            io.to(roomId).emit('room_state', room.toJSON());
        }
        catch (err) {
            logger.error('Error in assign_role handler:', err);
            socket.emit('error_event', { message: err.message });
        }
    });
    socket.on('remove_participant', (data) => {
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
            const actor = room.getParticipantBySocketId(socket.id);
            if (!PermissionService.isHost(actor)) {
                logger.warn(`Permission denied: Non-host ${actor?.username} attempted to remove participant`);
                socket.emit('error_event', {
                    code: 'UNAUTHORIZED_ROLE',
                    message: 'Permission denied: Only Host can remove participants'
                });
                return;
            }
            if (!data?.userId) {
                socket.emit('error_event', { message: 'userId is required' });
                return;
            }
            if (data.userId === actor?.userId) {
                socket.emit('error_event', { message: 'Host cannot remove themselves using remove_participant. Use leave_room instead.' });
                return;
            }
            const removedParticipant = room.removeParticipantByUserId(data.userId);
            if (!removedParticipant) {
                socket.emit('error_event', { message: 'Participant not found in room' });
                return;
            }
            logger.info(`Host ${actor?.username} removed participant ${removedParticipant.username} (${removedParticipant.userId})`);
            // Notify target socket directly and disconnect from room
            const targetSocket = io.sockets.sockets.get(removedParticipant.socketId);
            if (targetSocket) {
                targetSocket.emit('kicked', { message: 'You have been removed from the room by the host' });
                targetSocket.leave(roomId);
                delete targetSocket.roomId;
            }
            // Broadcast participant_removed to remaining participants
            io.to(roomId).emit('participant_removed', {
                userId: removedParticipant.userId,
                participants: room.getAllParticipants().map(p => p.toJSON())
            });
            io.to(roomId).emit('room_state', room.toJSON());
        }
        catch (err) {
            logger.error('Error in remove_participant handler:', err);
            socket.emit('error_event', { message: err.message });
        }
    });
    socket.on('transfer_host', (data) => {
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
            const actor = room.getParticipantBySocketId(socket.id);
            if (!PermissionService.isHost(actor)) {
                socket.emit('error_event', {
                    code: 'UNAUTHORIZED_ROLE',
                    message: 'Permission denied: Only Host can transfer host status'
                });
                return;
            }
            const result = room.transferHost(data.userId);
            if (!result.success || !result.newHost) {
                socket.emit('error_event', { message: 'Failed to transfer host status. Target user not found.' });
                return;
            }
            logger.info(`Host transferred from ${result.oldHost?.username} to ${result.newHost.username}`);
            io.to(roomId).emit('host_transferred', {
                oldHostId: result.oldHost?.userId,
                newHostId: result.newHost.userId,
                newHostUsername: result.newHost.username,
                participants: room.getAllParticipants().map(p => p.toJSON())
            });
            io.to(roomId).emit('role_assigned', {
                userId: result.newHost.userId,
                username: result.newHost.username,
                role: Role.HOST,
                participants: room.getAllParticipants().map(p => p.toJSON())
            });
            io.to(roomId).emit('room_state', room.toJSON());
        }
        catch (err) {
            logger.error('Error in transfer_host handler:', err);
            socket.emit('error_event', { message: err.message });
        }
    });
}
