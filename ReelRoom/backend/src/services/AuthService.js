import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { UserModel } from '../database/models/UserModel.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';
import { readJsonFile, writeJsonFile } from '../utils/fileStorage.js';
export class AuthService {
    static instance;
    users = new Map(); // userId -> User
    emailToUserId = new Map(); // email -> userId
    usernameToUserId = new Map(); // username -> userId
    constructor() { }
    static getInstance() {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }
    async loadUsersFromStorage() {
        try {
            let loadedFromMongo = false;
            this.users.clear();
            this.emailToUserId.clear();
            this.usernameToUserId.clear();
            if (mongoose.connection.readyState === 1) {
                try {
                    const dbUsers = await UserModel.find({}).exec();
                    if (dbUsers && dbUsers.length > 0) {
                        for (const doc of dbUsers) {
                            const user = new User(doc.userId, doc.username, doc.email, doc.passwordHash, doc.createdAt);
                            this.users.set(user.id, user);
                            this.emailToUserId.set(user.email.toLowerCase(), user.id);
                            this.usernameToUserId.set(user.username, user.id);
                        }
                        logger.info(`Restored ${dbUsers.length} users from MongoDB Atlas.`);
                        loadedFromMongo = true;
                    }
                }
                catch (err) {
                    logger.warn(`Failed to fetch users from MongoDB: ${err.message}`);
                }
            }
            if (!loadedFromMongo) {
                const localUsers = readJsonFile('users.json', []);
                for (const rawData of localUsers) {
                    const user = new User(rawData.userId || rawData.id, rawData.username, rawData.email, rawData.passwordHash, rawData.createdAt ? new Date(rawData.createdAt) : undefined);
                    this.users.set(user.id, user);
                    this.emailToUserId.set(user.email.toLowerCase(), user.id);
                    this.usernameToUserId.set(user.username, user.id);
                }
                logger.info(`Restored ${localUsers.length} users from local JSON storage.`);
            }
            this.persistUsersToLocalFile();
        }
        catch (err) {
            logger.error(`Error in loadUsersFromStorage: ${err.message}`);
        }
    }
    persistUsersToLocalFile() {
        const rawList = Array.from(this.users.values()).map(u => ({
            userId: u.id,
            username: u.username,
            email: u.email,
            passwordHash: u.passwordHash,
            createdAt: u.createdAt.toISOString()
        }));
        writeJsonFile('users.json', rawList);
    }
    hashPassword(password) {
        return crypto.pbkdf2Sync(password, 'salt_yt_party_2026', 1000, 64, 'sha512').toString('hex');
    }
    async register(username, email, password) {
        const cleanUsername = username.trim();
        const cleanEmail = email.trim().toLowerCase();
        if (this.emailToUserId.has(cleanEmail)) {
            throw new Error('Email is already registered');
        }
        if (this.usernameToUserId.has(cleanUsername)) {
            throw new Error('Username is already taken');
        }
        const userId = 'usr-' + Math.random().toString(36).substring(2, 9);
        const passwordHash = this.hashPassword(password);
        const user = new User(userId, cleanUsername, cleanEmail, passwordHash);
        this.users.set(userId, user);
        this.emailToUserId.set(cleanEmail, userId);
        this.usernameToUserId.set(cleanUsername, userId);
        // Asynchronously persist to MongoDB Atlas if connected
        if (mongoose.connection.readyState === 1) {
            UserModel.create({
                userId,
                username: cleanUsername,
                email: cleanEmail,
                passwordHash
            }).then(() => {
                logger.info(`Persisted user ${cleanUsername} to MongoDB Atlas`);
            }).catch(err => {
                logger.warn(`Failed to persist user ${cleanUsername} to MongoDB: ${err.message}`);
            });
        }
        this.persistUsersToLocalFile();
        const token = this.generateToken(user);
        return { user: user.toJSON(), token };
    }
    async login(emailOrUsername, password) {
        const cleanInput = emailOrUsername.trim();
        let userId = this.emailToUserId.get(cleanInput.toLowerCase()) || this.usernameToUserId.get(cleanInput);
        let user = null;
        if (userId) {
            user = this.users.get(userId) || null;
        }
        // Fallback lookup from MongoDB Atlas if connected
        if (!user && mongoose.connection.readyState === 1) {
            try {
                const dbUser = await UserModel.findOne({
                    $or: [{ email: cleanInput.toLowerCase() }, { username: cleanInput }]
                });
                if (dbUser) {
                    user = new User(dbUser.userId, dbUser.username, dbUser.email, dbUser.passwordHash, dbUser.createdAt);
                    this.users.set(user.id, user);
                    this.emailToUserId.set(user.email.toLowerCase(), user.id);
                    this.usernameToUserId.set(user.username, user.id);
                    this.persistUsersToLocalFile();
                }
            }
            catch (err) {
                logger.error('Error querying user from MongoDB Atlas:', err);
            }
        }
        if (!user) {
            throw new Error('Invalid email/username or password');
        }
        const hash = this.hashPassword(password);
        if (user.passwordHash !== hash) {
            throw new Error('Invalid email/username or password');
        }
        logger.info(`User logged in: ${user.username} (${user.id})`);
        const token = this.generateToken(user);
        return { user: user.toJSON(), token };
    }
    generateToken(user) {
        const payload = {
            userId: user.id,
            username: user.username,
            email: user.email
        };
        return jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' });
    }
    verifyToken(token) {
        try {
            const decoded = jwt.verify(token, config.jwtSecret);
            return decoded;
        }
        catch (err) {
            throw new Error('Invalid or expired token');
        }
    }
    getUserById(userId) {
        return this.users.get(userId) || null;
    }
}
