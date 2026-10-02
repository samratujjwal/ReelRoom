import mongoose from 'mongoose';
import { Room } from '../models/Room.js';
import { RoomModel } from '../database/models/RoomModel.js';
import { logger } from '../utils/logger.js';
import { readJsonFile, writeJsonFile } from '../utils/fileStorage.js';
export class RoomManager {
    static instance;
    rooms = new Map(); // roomId -> Room
    codeToRoomId = new Map(); // code -> roomId
    isLoaded = false;
    constructor() { }
    static getInstance() {
        if (!RoomManager.instance) {
            RoomManager.instance = new RoomManager();
        }
        return RoomManager.instance;
    }
    async loadRoomsFromStorage() {
        try {
            let loadedFromMongo = false;
            this.rooms.clear();
            this.codeToRoomId.clear();
            if (mongoose.connection.readyState === 1) {
                try {
                    const dbRooms = await RoomModel.find({}).exec();
                    if (dbRooms && dbRooms.length > 0) {
                        for (const doc of dbRooms) {
                            const room = Room.fromJSON({
                                roomId: doc.roomId,
                                code: doc.code,
                                name: doc.name,
                                hostId: doc.hostId,
                                hostUsername: doc.hostUsername,
                                videoState: doc.videoState,
                                chatMessages: doc.chatMessages,
                                createdAt: doc.createdAt
                            });
                            this.rooms.set(room.id, room);
                            this.codeToRoomId.set(room.code, room.id);
                        }
                        logger.info(`Restored ${dbRooms.length} rooms from MongoDB Atlas.`);
                        loadedFromMongo = true;
                    }
                }
                catch (err) {
                    logger.warn(`Failed to fetch rooms from MongoDB: ${err.message}`);
                }
            }
            if (!loadedFromMongo) {
                const localRooms = readJsonFile('rooms.json', []);
                for (const rawData of localRooms) {
                    const room = Room.fromJSON(rawData);
                    this.rooms.set(room.id, room);
                    this.codeToRoomId.set(room.code, room.id);
                }
                logger.info(`Restored ${localRooms.length} rooms from local JSON storage.`);
            }
            this.persistRoomsToLocalFile();
            this.isLoaded = true;
        }
        catch (err) {
            logger.error(`Error in loadRoomsFromStorage: ${err.message}`);
        }
    }
    persistRoomsToLocalFile() {
        const rawList = Array.from(this.rooms.values()).map(r => r.toJSON());
        writeJsonFile('rooms.json', rawList);
    }
    createRoom(name, hostUserId, hostUsername, initialVideoId = 'dQw4w9WgXcQ') {
        const id = 'room-' + Math.random().toString(36).substring(2, 9);
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const room = new Room(id, code, name || 'ReelRoom Watch Room', hostUserId, hostUsername, initialVideoId);
        this.rooms.set(id, room);
        this.codeToRoomId.set(code, id);
        logger.info(`Created new room ${id} with code ${code} by host ${hostUsername} (${hostUserId})`);
        // Async save to MongoDB Atlas if connected
        if (mongoose.connection.readyState === 1) {
            RoomModel.create({
                roomId: id,
                code,
                name: room.name,
                hostId: hostUserId,
                hostUsername: room.hostUsername,
                videoState: room.getVideoState().toJSON(),
                chatMessages: []
            }).catch(err => {
                logger.warn(`Failed to persist room ${id} to MongoDB Atlas: ${err.message}`);
            });
        }
        this.persistRoomsToLocalFile();
        return room;
    }
    saveRoom(room) {
        if (!room)
            return;
        this.rooms.set(room.id, room);
        this.codeToRoomId.set(room.code, room.id);
        if (mongoose.connection.readyState === 1) {
            RoomModel.updateOne({ roomId: room.id }, {
                $set: {
                    name: room.name,
                    hostUsername: room.hostUsername,
                    videoState: room.getVideoState().toJSON(),
                    chatMessages: room.getChatHistory()
                }
            }, { upsert: true }).catch(err => {
                logger.warn(`Failed to update room ${room.id} in MongoDB: ${err.message}`);
            });
        }
        this.persistRoomsToLocalFile();
    }
    getRoom(idOrCode) {
        if (!idOrCode)
            return null;
        // Try direct lookup by roomId
        let room = this.rooms.get(idOrCode);
        if (room)
            return room;
        // Try lookup by uppercase 6-char code
        const roomId = this.codeToRoomId.get(idOrCode.toUpperCase());
        if (roomId) {
            return this.rooms.get(roomId) || null;
        }
        return null;
    }
    getAllRooms() {
        return Array.from(this.rooms.values());
    }
    deleteRoom(roomId) {
        const room = this.rooms.get(roomId);
        if (!room)
            return false;
        this.codeToRoomId.delete(room.code);
        this.rooms.delete(roomId);
        logger.info(`Deleted room ${roomId}`);
        // Remove from MongoDB Atlas if connected
        if (mongoose.connection.readyState === 1) {
            RoomModel.deleteOne({ roomId }).catch(err => {
                logger.warn(`Failed to delete room ${roomId} from MongoDB: ${err.message}`);
            });
        }
        this.persistRoomsToLocalFile();
        return true;
    }
    cleanEmptyRooms(maxAgeMs = 3600000) {
        const now = Date.now();
        for (const [roomId, room] of this.rooms.entries()) {
            if (room.isEmpty() && now - room.createdAt.getTime() > maxAgeMs) {
                this.deleteRoom(roomId);
            }
        }
    }
}
