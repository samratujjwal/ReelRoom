import { Participant, Role } from './Participant.js';
import { VideoState, PlayState } from './VideoState.js';
import { AuthService } from '../services/AuthService.js';
export class Room {
    id;
    code;
    name;
    hostId;
    hostUsername;
    participants = new Map();
    socketToUserId = new Map();
    videoState;
    chatMessages = [];
    createdAt;
    constructor(id, code, name, creatorUserId, creatorUsername, initialVideoId = 'dQw4w9WgXcQ') {
        this.id = id;
        this.code = code;
        this.name = name;
        this.hostId = creatorUserId;
        this.hostUsername = creatorUsername && creatorUsername.trim() ? creatorUsername.trim() : 'Unknown';
        this.videoState = new VideoState(initialVideoId);
        this.createdAt = new Date();
    }
    getHostId() {
        return this.hostId;
    }
    getVideoState() {
        return this.videoState;
    }
    addParticipant(userId, username, socketId) {
        // If room has no host or creator joins first, assign Host role, else Participant
        const isFirstParticipant = this.participants.size === 0 || userId === this.hostId;
        const initialRole = isFirstParticipant ? Role.HOST : Role.PARTICIPANT;
        if (isFirstParticipant) {
            this.hostId = userId;
        }
        let participant = this.participants.get(userId);
        if (participant) {
            participant.updateSocketId(socketId);
            participant.username = username;
        }
        else {
            participant = new Participant(userId, username, socketId, initialRole);
            this.participants.set(userId, participant);
        }
        this.socketToUserId.set(socketId, userId);
        return participant;
    }
    removeParticipantBySocketId(socketId) {
        const userId = this.socketToUserId.get(socketId);
        if (!userId) {
            return { participant: null, newHost: null };
        }
        this.socketToUserId.delete(socketId);
        const participant = this.participants.get(userId);
        if (participant) {
            this.participants.delete(userId);
        }
        let newHost = null;
        // Auto-reassign host if host left and participants remain
        if (participant && participant.isHost() && this.participants.size > 0) {
            const remaining = Array.from(this.participants.values());
            // Prefer moderator if present, else first remaining participant
            const candidate = remaining.find(p => p.isModerator()) || remaining[0];
            if (candidate) {
                candidate.updateRole(Role.HOST);
                this.hostId = candidate.userId;
                newHost = candidate;
            }
        }
        return { participant: participant || null, newHost };
    }
    removeParticipantByUserId(userId) {
        const participant = this.participants.get(userId);
        if (participant) {
            this.socketToUserId.delete(participant.socketId);
            this.participants.delete(userId);
        }
        return participant || null;
    }
    getParticipantBySocketId(socketId) {
        const userId = this.socketToUserId.get(socketId);
        if (!userId)
            return null;
        return this.participants.get(userId) || null;
    }
    getParticipantByUserId(userId) {
        return this.participants.get(userId) || null;
    }
    getAllParticipants() {
        return Array.from(this.participants.values());
    }
    assignRole(targetUserId, newRole) {
        const participant = this.participants.get(targetUserId);
        if (!participant)
            return null;
        // If making someone host, demote current host to moderator
        if (newRole === Role.HOST) {
            const currentHost = this.participants.get(this.hostId);
            if (currentHost && currentHost.userId !== targetUserId) {
                currentHost.updateRole(Role.MODERATOR);
            }
            this.hostId = targetUserId;
        }
        participant.updateRole(newRole);
        return participant;
    }
    transferHost(newHostUserId) {
        const newHost = this.participants.get(newHostUserId);
        if (!newHost)
            return { success: false };
        const oldHost = this.participants.get(this.hostId);
        if (oldHost) {
            oldHost.updateRole(Role.MODERATOR);
        }
        newHost.updateRole(Role.HOST);
        this.hostId = newHostUserId;
        return { success: true, oldHost: oldHost || undefined, newHost };
    }
    addChatMessage(userId, username, messageText) {
        const messageObj = {
            id: Math.random().toString(36).substring(2, 9),
            userId,
            username,
            message: messageText,
            timestamp: new Date().toISOString()
        };
        this.chatMessages.push(messageObj);
        // Keep last 100 messages in memory
        if (this.chatMessages.length > 100) {
            this.chatMessages.shift();
        }
        return messageObj;
    }
    getChatHistory() {
        return this.chatMessages;
    }
    isEmpty() {
        return this.participants.size === 0;
    }
    toJSON() {
        let resolvedUsername = this.hostUsername;
        if (!resolvedUsername || resolvedUsername === 'Unknown') {
            const user = AuthService.getInstance().getUserById(this.hostId);
            if (user && user.username) {
                resolvedUsername = user.username;
                this.hostUsername = user.username;
            }
            else {
                resolvedUsername = 'Unknown';
            }
        }
        return {
            roomId: this.id,
            code: this.code,
            name: this.name,
            hostId: this.hostId,
            hostUsername: resolvedUsername,
            videoState: this.videoState.toJSON(),
            participants: this.getAllParticipants().map(p => p.toJSON()),
            createdAt: this.createdAt.toISOString()
        };
    }
    static fromJSON(data) {
        const roomId = data.roomId || data.id;
        let hostUsername = data.hostUsername && data.hostUsername !== 'Unknown' ? data.hostUsername : (data.creatorUsername && data.creatorUsername !== 'Unknown' ? data.creatorUsername : null);
        if (!hostUsername && data.hostId) {
            const user = AuthService.getInstance().getUserById(data.hostId);
            if (user && user.username) {
                hostUsername = user.username;
            }
        }
        if (!hostUsername) {
            hostUsername = 'Unknown';
        }
        const room = new Room(roomId, data.code, data.name || 'ReelRoom Watch Room', data.hostId, hostUsername, data.videoState?.videoId || 'dQw4w9WgXcQ');
        if (data.createdAt) {
            room.createdAt = new Date(data.createdAt);
        }
        if (data.videoState) {
            const playState = data.videoState.playState === 'PLAYING' ? PlayState.PLAYING : PlayState.PAUSED;
            const currentTime = typeof data.videoState.currentTime === 'number' ? data.videoState.currentTime : 0;
            room.videoState = new VideoState(data.videoState.videoId || 'dQw4w9WgXcQ', playState, currentTime);
        }
        if (Array.isArray(data.chatMessages)) {
            room.chatMessages = data.chatMessages;
        }
        return room;
    }
}
