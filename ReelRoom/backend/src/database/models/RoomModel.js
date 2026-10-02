import mongoose, { Schema } from 'mongoose';
const RoomSchema = new Schema({
    roomId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    code: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    name: {
        type: String,
        required: true
    },
    hostId: {
        type: String,
        required: true
    },
    hostUsername: {
        type: String,
        default: 'Unknown'
    },
    videoState: {
        videoId: {
            type: String,
            default: 'dQw4w9WgXcQ'
        },
        playState: {
            type: String,
            default: 'PAUSED'
        },
        currentTime: {
            type: Number,
            default: 0
        },
        lastUpdated: {
            type: Date,
            default: Date.now
        }
    },
    chatMessages: [
        {
            id: String,
            userId: String,
            username: String,
            message: String,
            timestamp: { type: Date, default: Date.now }
        }
    ],
    createdAt: { type: Date, default: Date.now }
});
export const RoomModel = mongoose.model('Room', RoomSchema);
