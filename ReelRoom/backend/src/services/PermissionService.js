import { Role } from '../models/Participant.js';
export class PermissionService {
    /**
     * Checks if participant has permission to execute playback actions (play, pause, seek, change_video)
     */
    static canControlPlayback(participant) {
        if (!participant)
            return false;
        return participant.role === Role.HOST || participant.role === Role.MODERATOR;
    }
    /**
     * Checks if participant has host privileges (assign roles, remove participants, transfer host)
     */
    static isHost(participant) {
        if (!participant)
            return false;
        return participant.role === Role.HOST;
    }
    /**
     * Validates whether host can assign a specific role to target participant
     */
    static canAssignRole(actor, targetRole) {
        if (!actor || actor.role !== Role.HOST)
            return false;
        // Host can assign Moderator, Participant, or Viewer, or transfer Host
        return Object.values(Role).includes(targetRole);
    }
    /**
     * Checks if participant can send chat messages (anyone in room)
     */
    static canSendChat(participant) {
        return participant !== null;
    }
}
