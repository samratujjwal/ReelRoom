import { RoomManager } from '../../services/RoomManager.js';
import { PermissionService } from '../../services/PermissionService.js';
import { extractYouTubeId } from '../../utils/youtube.js';
import { logger } from '../../utils/logger.js';
export function registerPlaybackHandlers(io, socket) {
    const roomManager = RoomManager.getInstance();
    socket.on('play', (data) => {
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
            if (!PermissionService.canControlPlayback(participant)) {
                logger.warn(`Permission denied for play action to user ${participant?.username} (${participant?.role})`);
                socket.emit('error_event', {
                    code: 'UNAUTHORIZED_ROLE',
                    message: 'Permission denied: Only Host or Moderator can control playback'
                });
                return;
            }
            const videoState = room.getVideoState();
            videoState.play(data?.time);
            const stateJSON = videoState.toJSON();
            logger.info(`Room ${roomId} play at ${stateJSON.currentTime}s by ${participant?.username}`);
            const playPayload = {
                currentTime: stateJSON.currentTime,
                timestamp: stateJSON.currentTime,
                playState: stateJSON.playState,
                videoId: stateJSON.videoId,
                triggeredBy: participant?.username,
                updatedBy: participant?.username
            };
            io.to(roomId).emit('play', playPayload);
            io.to(roomId).emit('sync_state', {
                playState: stateJSON.playState,
                currentTime: stateJSON.currentTime,
                videoId: stateJSON.videoId,
                lastUpdated: stateJSON.lastUpdated
            });
            io.to(roomId).emit('room_state', room.toJSON());
        }
        catch (err) {
            logger.error('Error in play handler:', err);
            socket.emit('error_event', { message: err.message });
        }
    });
    socket.on('pause', (data) => {
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
            if (!PermissionService.canControlPlayback(participant)) {
                logger.warn(`Permission denied for pause action to user ${participant?.username} (${participant?.role})`);
                socket.emit('error_event', {
                    code: 'UNAUTHORIZED_ROLE',
                    message: 'Permission denied: Only Host or Moderator can control playback'
                });
                return;
            }
            const videoState = room.getVideoState();
            videoState.pause(data?.time);
            const stateJSON = videoState.toJSON();
            logger.info(`Room ${roomId} pause at ${stateJSON.currentTime}s by ${participant?.username}`);
            const pausePayload = {
                currentTime: stateJSON.currentTime,
                timestamp: stateJSON.currentTime,
                playState: stateJSON.playState,
                videoId: stateJSON.videoId,
                triggeredBy: participant?.username,
                updatedBy: participant?.username
            };
            io.to(roomId).emit('pause', pausePayload);
            io.to(roomId).emit('sync_state', {
                playState: stateJSON.playState,
                currentTime: stateJSON.currentTime,
                videoId: stateJSON.videoId,
                lastUpdated: stateJSON.lastUpdated
            });
            io.to(roomId).emit('room_state', room.toJSON());
        }
        catch (err) {
            logger.error('Error in pause handler:', err);
            socket.emit('error_event', { message: err.message });
        }
    });
    socket.on('seek', (data) => {
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
            if (!PermissionService.canControlPlayback(participant)) {
                logger.warn(`Permission denied for seek action to user ${participant?.username} (${participant?.role})`);
                socket.emit('error_event', {
                    code: 'UNAUTHORIZED_ROLE',
                    message: 'Permission denied: Only Host or Moderator can seek video'
                });
                return;
            }
            if (typeof data?.time !== 'number' || isNaN(data.time)) {
                socket.emit('error_event', { message: 'Invalid seek time provided' });
                return;
            }
            const videoState = room.getVideoState();
            videoState.seek(data.time);
            const stateJSON = videoState.toJSON();
            logger.info(`Room ${roomId} seek to ${data.time}s by ${participant?.username}`);
            const seekPayload = {
                time: stateJSON.currentTime,
                currentTime: stateJSON.currentTime,
                timestamp: stateJSON.currentTime,
                playState: stateJSON.playState,
                videoId: stateJSON.videoId,
                triggeredBy: participant?.username,
                updatedBy: participant?.username
            };
            io.to(roomId).emit('seek', seekPayload);
            io.to(roomId).emit('sync_state', {
                playState: stateJSON.playState,
                currentTime: stateJSON.currentTime,
                videoId: stateJSON.videoId,
                lastUpdated: stateJSON.lastUpdated
            });
            io.to(roomId).emit('room_state', room.toJSON());
        }
        catch (err) {
            logger.error('Error in seek handler:', err);
            socket.emit('error_event', { message: err.message });
        }
    });
    socket.on('change_video', (data) => {
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
            if (!PermissionService.canControlPlayback(participant)) {
                logger.warn(`Permission denied for change_video action to user ${participant?.username} (${participant?.role})`);
                socket.emit('error_event', {
                    code: 'UNAUTHORIZED_ROLE',
                    message: 'Permission denied: Only Host or Moderator can change video'
                });
                return;
            }
            const rawInput = data?.videoId || data?.videoUrl;
            if (!rawInput) {
                socket.emit('error_event', { message: 'videoId or videoUrl is required' });
                return;
            }
            const extractedId = extractYouTubeId(rawInput);
            if (!extractedId) {
                socket.emit('error_event', { message: 'Invalid YouTube URL or Video ID' });
                return;
            }
            const videoState = room.getVideoState();
            videoState.setVideo(extractedId);
            videoState.play(0); // Autoplay the new video from the beginning
            const stateJSON = videoState.toJSON();
            logger.info(`Room ${roomId} video changed to ${extractedId} by ${participant?.username}`);
            const changeVideoPayload = {
                videoId: extractedId,
                currentVideoUrl: `https://www.youtube.com/watch?v=${extractedId}`,
                playState: stateJSON.playState,
                currentTime: stateJSON.currentTime,
                timestamp: stateJSON.currentTime,
                triggeredBy: participant?.username,
                updatedBy: participant?.username
            };
            io.to(roomId).emit('change_video', changeVideoPayload);
            io.to(roomId).emit('video_changed', changeVideoPayload);
            io.to(roomId).emit('sync_state', {
                playState: stateJSON.playState,
                currentTime: stateJSON.currentTime,
                videoId: stateJSON.videoId,
                lastUpdated: stateJSON.lastUpdated
            });
            roomManager.saveRoom(room);
            io.to(roomId).emit('room_state', room.toJSON());
        }
        catch (err) {
            logger.error('Error in change_video handler:', err);
            socket.emit('error_event', { message: err.message });
        }
    });
}
