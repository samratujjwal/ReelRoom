import { io } from 'socket.io-client';
const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:4000';
let socket = null;
export const initSocket = (token) => {
    if (socket) {
        if (token && socket.io.opts.extraHeaders) {
            socket.io.opts.extraHeaders.Authorization = `Bearer ${token}`;
        }
        return socket;
    }
    socket = io(WS_URL, {
        autoConnect: true,
        transports: ['websocket', 'polling'],
        auth: {
            token: token || '',
        },
    });
    socket.on('connect', () => {
        console.log(' Connected to Watch Party Socket Server:', socket?.id);
    });
    socket.on('connect_error', (err) => {
        console.warn(' Socket connection warning/error:', err.message);
    });
    socket.on('disconnect', (reason) => {
        console.log(' Socket disconnected:', reason);
    });
    return socket;
};
export const getSocket = () => socket;
export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
