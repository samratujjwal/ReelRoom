export var Role;
(function (Role) {
    Role["HOST"] = "Host";
    Role["MODERATOR"] = "Moderator";
    Role["PARTICIPANT"] = "Participant";
    Role["VIEWER"] = "Viewer";
})(Role || (Role = {}));
export class Participant {
    userId;
    username;
    socketId;
    role;
    joinedAt;
    constructor(userId, username, socketId, role = Role.PARTICIPANT) {
        this.userId = userId;
        this.username = username;
        this.socketId = socketId;
        this.role = role;
        this.joinedAt = new Date();
    }
    updateRole(newRole) {
        this.role = newRole;
    }
    updateSocketId(newSocketId) {
        this.socketId = newSocketId;
    }
    isHost() {
        return this.role === Role.HOST;
    }
    isModerator() {
        return this.role === Role.MODERATOR;
    }
    canControlPlayback() {
        return this.role === Role.HOST || this.role === Role.MODERATOR;
    }
    toJSON() {
        return {
            userId: this.userId,
            username: this.username,
            socketId: this.socketId,
            role: this.role,
            joinedAt: this.joinedAt.toISOString()
        };
    }
}
