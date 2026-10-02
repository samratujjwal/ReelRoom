import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { initSocket } from '../services/socket';
import { useAuth } from './AuthContext';
import { extractYouTubeId } from '../hooks/useYouTubeSync';
const normalizeRoomState = (raw) => {
    if (!raw)
        return raw;
    const videoState = raw.videoState || {};
    const videoId = raw.videoId || videoState.videoId || extractYouTubeId(raw.currentVideoUrl || 'dQw4w9WgXcQ');
    const isPlaying = typeof raw.isPlaying === 'boolean'
        ? raw.isPlaying
        : (videoState.playState === 'PLAYING' || raw.playState === 'PLAYING');
    const timestamp = typeof raw.timestamp === 'number'
        ? raw.timestamp
        : (typeof videoState.currentTime === 'number' ? videoState.currentTime : 0);
    const participants = Array.isArray(raw.participants) ? raw.participants : [];
    const hostParticipant = participants.find((p) => p.role === 'Host');
    const hostId = raw.hostId || hostParticipant?.userId || '';
    const hostUsername = raw.hostUsername || hostParticipant?.username || 'Host';
    return {
        roomId: raw.roomId || raw.id || '',
        name: raw.name || 'Watch Party Room',
        hostId,
        hostUsername,
        currentVideoUrl: raw.currentVideoUrl || `https://www.youtube.com/watch?v=${videoId}`,
        videoId,
        isPlaying,
        timestamp,
        lastUpdated: typeof raw.lastUpdated === 'number' ? raw.lastUpdated : Date.now(),
        participants,
        createdAt: raw.createdAt || new Date().toISOString(),
    };
};
const RoomContext = createContext(undefined);
export const RoomProvider = ({ children }) => {
    const { user, token, guestLogin } = useAuth();
    const [roomState, setRoomState] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [floatingReactions, setFloatingReactions] = useState([]);
    const [activeRoomId, setActiveRoomId] = useState(null);
    const [forceSyncTrigger, setForceSyncTrigger] = useState(0);
    const [notification, setNotification] = useState(null);
    const [syncMetrics] = useState({
        driftMs: 0,
        status: 'synced',
        hostTimestamp: 0,
        localTimestamp: 0,
    });
    const socketRef = useRef(null);
    // Track current userId/username in refs so we don't rely on async state in event handlers
    const currentUserIdRef = useRef(null);
    const currentUsernameRef = useRef(null);
    // This prevents the race condition where join_room was emitted before event handlers were registered
    const pendingJoinRef = useRef(null);
    // Helper to show auto-dismissing toast notifications
    const showToast = (message, type = 'info') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 4000);
    };
    // Determine role in current room — use refs for immediate userId/username (avoids async state delay)
    const myUserId = currentUserIdRef.current || user?.id;
    const myUsername = currentUsernameRef.current || user?.username;
    const currentParticipant = roomState?.participants.find(p => (socketRef.current && p.socketId === socketRef.current.id) ||
        (myUserId && p.userId === myUserId) ||
        (myUsername && p.username === myUsername));
    const userRole = currentParticipant?.role || (roomState?.hostId && myUserId && roomState.hostId === myUserId ? 'Host' : 'Participant');
    const isHost = userRole === 'Host' || (Boolean(roomState?.hostId) && Boolean(myUserId) && roomState?.hostId === myUserId);
    const canControlPlayback = isHost || userRole === 'Moderator';
    //  Socket event setup — handlers are registered FIRST, then join_room is emitted ***
    // Previously, join_room was emitted in joinRoom() before this effect ran, causing
    // the server's room_state/user_joined responses to arrive before handlers were set up
    // and be silently dropped. Now the effect emits join_room after registering all handlers.
    useEffect(() => {
        if (!activeRoomId)
            return;
        // Step 1: Initialize socket
        const socket = initSocket(token);
        socketRef.current = socket;
        // Step 2: Register ALL event handlers
        socket.on('room_state', (state) => {
            console.log('📡 [WS] room_state received:', state);
            setRoomState(normalizeRoomState(state));
        });
        socket.on('chat_history', (data) => {
            const msgs = Array.isArray(data.messages) ? data.messages : [];
            const normalized = msgs.map((m) => ({
                id: m.id || 'msg-' + Math.random().toString(36).substring(2, 7),
                userId: m.userId,
                username: m.username,
                role: m.role || 'Participant',
                text: m.message || m.text || '',
                timestamp: typeof m.timestamp === 'string'
                    ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : m.timestamp,
                isSystem: false,
            }));
            if (normalized.length > 0)
                setChatMessages(normalized);
        });
        socket.on('sync_state', (data) => {
            console.log('📡 [WS] sync_state received:', data);
            if (!data)
                return;
            setRoomState(prev => {
                if (!prev)
                    return prev;
                const newVideoId = data.videoId || prev.videoId;
                return {
                    ...prev,
                    videoId: newVideoId,
                    currentVideoUrl: data.currentVideoUrl || `https://www.youtube.com/watch?v=${newVideoId}`,
                    isPlaying: data.playState === 'PLAYING',
                    timestamp: typeof data.currentTime === 'number' ? data.currentTime : prev.timestamp,
                    lastUpdated: Date.now()
                };
            });
        });
        socket.on('user_joined', (data) => {
            const username = data.username;
            const role = data.role || 'Participant';
            showToast(`👋 ${username} joined as ${role}`, 'info');
            setRoomState(prev => {
                if (!prev)
                    return null;
                const updatedParts = Array.isArray(data.participants) ? data.participants : prev.participants;
                return { ...prev, participants: updatedParts };
            });
            setChatMessages(prev => [
                ...prev,
                {
                    id: 'sys-' + Date.now(),
                    userId: 'system',
                    username: 'System',
                    role: 'Host',
                    text: `${username} joined the party.`,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    isSystem: true,
                },
            ]);
        });
        socket.on('user_left', (data) => {
            const username = data.username;
            showToast(`🚪 ${username} left the room`, 'info');
            setRoomState(prev => {
                if (!prev)
                    return null;
                const updatedParts = Array.isArray(data.participants) ? data.participants : prev.participants.filter(p => p.username !== username);
                return { ...prev, participants: updatedParts };
            });
            setChatMessages(prev => [
                ...prev,
                {
                    id: 'sys-' + Date.now(),
                    userId: 'system',
                    username: 'System',
                    role: 'Host',
                    text: `${username} left the room.`,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    isSystem: true,
                },
            ]);
        });
        socket.on('play', (data) => {
            const ts = typeof data.timestamp === 'number' ? data.timestamp : data.currentTime;
            const updatedBy = data.updatedBy || data.triggeredBy;
            setRoomState(prev => prev ? { ...prev, isPlaying: true, timestamp: ts ?? prev.timestamp, lastUpdated: Date.now() } : prev);
            if (updatedBy)
                showToast(`▶️ ${updatedBy} resumed playback`, 'info');
        });
        socket.on('pause', (data) => {
            const ts = typeof data.timestamp === 'number' ? data.timestamp : data.currentTime;
            const updatedBy = data.updatedBy || data.triggeredBy;
            setRoomState(prev => prev ? { ...prev, isPlaying: false, timestamp: ts ?? prev.timestamp, lastUpdated: Date.now() } : prev);
            if (updatedBy)
                showToast(`⏸️ ${updatedBy} paused playback`, 'info');
        });
        socket.on('seek', (data) => {
            const ts = typeof data.timestamp === 'number' ? data.timestamp : data.currentTime ?? data.time;
            const updatedBy = data.updatedBy || data.triggeredBy;
            setRoomState(prev => prev ? { ...prev, timestamp: ts ?? prev.timestamp, lastUpdated: Date.now() } : prev);
            if (updatedBy)
                showToast(`⏩ ${updatedBy} jumped to ${Math.floor(ts || 0)}s`, 'info');
        });
        const handleVideoChange = (data) => {
            const newVideoId = data.videoId || extractYouTubeId(data.currentVideoUrl || data.videoUrl || '');
            const currentVideoUrl = data.currentVideoUrl || data.videoUrl || `https://www.youtube.com/watch?v=${newVideoId}`;
            const updatedBy = data.updatedBy || data.triggeredBy || 'Host';
            // Respect playState from server; default to true (autoplay) if not provided
            const isPlaying = data.playState !== undefined ? data.playState === 'PLAYING' : true;
            setRoomState(prev => prev ? {
                ...prev,
                currentVideoUrl,
                videoId: newVideoId,
                timestamp: 0,
                isPlaying,
                lastUpdated: Date.now()
            } : prev);
            showToast(`🎬 Video changed by ${updatedBy}`, 'success');
            setChatMessages(prev => [
                ...prev,
                {
                    id: 'sys-' + Date.now(),
                    userId: 'system',
                    username: 'System',
                    role: 'Host',
                    text: `Video updated to new YouTube URL.`,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    isSystem: true,
                },
            ]);
        };
        socket.on('change_video', handleVideoChange);
        socket.on('video_changed', handleVideoChange);
        socket.on('role_assigned', (data) => {
            const { userId, username, role, participants } = data;
            showToast(`👑 ${username}'s role updated to ${role}`, 'success');
            setRoomState(prev => {
                if (!prev)
                    return null;
                const updatedParts = Array.isArray(participants) ? participants : prev.participants.map(p => p.userId === userId ? { ...p, role } : p);
                const newHost = updatedParts.find((p) => p.role === 'Host');
                return {
                    ...prev,
                    participants: updatedParts,
                    hostId: newHost ? newHost.userId : prev.hostId,
                    hostUsername: newHost ? newHost.username : prev.hostUsername
                };
            });
        });
        socket.on('participant_removed', (data) => {
            const { userId, username, participants } = data;
            if (username)
                showToast(`❌ ${username} was removed from the room`, 'warning');
            if (user?.id === userId || currentUserIdRef.current === userId) {
                setActiveRoomId(null);
                setRoomState(null);
                setChatMessages([]);
                setFloatingReactions([]);
                showToast('You were removed by the Host.', 'error');
            }
            else {
                setRoomState(prev => {
                    if (!prev)
                        return null;
                    const updatedParts = Array.isArray(participants) ? participants : prev.participants.filter(p => p.userId !== userId);
                    return { ...prev, participants: updatedParts };
                });
            }
        });
        socket.on('kicked', () => {
            setActiveRoomId(null);
            setRoomState(null);
            setChatMessages([]);
            setFloatingReactions([]);
            showToast('You were removed by the Host.', 'error');
        });
        socket.on('host_transferred', (data) => {
            const { newHostId, newHostUsername, participants } = data;
            showToast(`👑 ${newHostUsername} is now the Host!`, 'success');
            setRoomState(prev => {
                if (!prev)
                    return null;
                const updatedParts = Array.isArray(participants) ? participants : prev.participants;
                return {
                    ...prev,
                    hostId: newHostId,
                    hostUsername: newHostUsername,
                    participants: updatedParts
                };
            });
        });
        // Backend emits 'chat_message'
        socket.on('chat_message', (msg) => {
            const normalized = {
                id: msg.id || 'msg-' + Math.random().toString(36).substring(2, 7),
                userId: msg.userId,
                username: msg.username,
                role: msg.role || 'Participant',
                text: msg.message || msg.text || '',
                timestamp: typeof msg.timestamp === 'string'
                    ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : (msg.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
                isSystem: false,
            };
            setChatMessages(prev => [...prev, normalized]);
        });
        // Backend emits 'reaction'
        socket.on('reaction', ({ emoji, username }) => {
            const newReaction = {
                id: 'rx-' + Math.random().toString(36).substring(2, 9),
                emoji,
                username,
                left: Math.floor(Math.random() * 70) + 15,
            };
            setFloatingReactions(prev => [...prev, newReaction]);
            setTimeout(() => {
                setFloatingReactions(prev => prev.filter(r => r.id !== newReaction.id));
            }, 3500);
        });
        socket.on('error_event', (err) => {
            console.warn('[WS] error_event:', err.message);
            showToast(` ${err.message}`, 'error');
        });
        socket.on('error', (err) => {
            showToast(` ${err.message}`, 'error');
        });
        // Step 3: NOW emit join_room — AFTER all handlers are registered
        // This prevents the race condition where the server responds before handlers are set up
        const joinInfo = pendingJoinRef.current;
        if (joinInfo) {
            console.log(` [WS] Emitting join_room for room ${joinInfo.roomId} as ${joinInfo.username}`);
            socket.emit('join_room', {
                roomId: joinInfo.roomId,
                username: joinInfo.username,
                userId: joinInfo.userId
            });
            pendingJoinRef.current = null;
        }
        return () => {
            socket.off('room_state');
            socket.off('chat_history');
            socket.off('sync_state');
            socket.off('user_joined');
            socket.off('user_left');
            socket.off('play');
            socket.off('pause');
            socket.off('seek');
            socket.off('change_video', handleVideoChange);
            socket.off('video_changed', handleVideoChange);
            socket.off('role_assigned');
            socket.off('participant_removed');
            socket.off('kicked');
            socket.off('host_transferred');
            socket.off('chat_message');
            socket.off('reaction');
            socket.off('error_event');
            socket.off('error');
        };
    }, [activeRoomId, token, user]);
    // *** FIX: joinRoom no longer emits join_room directly ***
    // Instead it stores join info in pendingJoinRef and sets activeRoomId.
    // The useEffect above picks up the pending join info and emits join_room
    // AFTER registering all event handlers, eliminating the race condition.
    const joinRoom = (roomId, username) => {
        let currentUser = user;
        if (!currentUser && username) {
            currentUser = guestLogin(username);
        }
        const finalUsername = currentUser?.username || username;
        const finalUserId = currentUser?.id || ('guest-' + Math.random().toString(36).substring(2, 9));
        // Store in refs for immediate access in event handlers
        currentUserIdRef.current = finalUserId;
        currentUsernameRef.current = finalUsername;
        // Store join info for the useEffect to use
        pendingJoinRef.current = { roomId, username: finalUsername, userId: finalUserId };
        setChatMessages([]);
        setActiveRoomId(roomId);
        // NOTE: join_room socket event is now emitted inside the useEffect
    };
    const leaveRoom = () => {
        if (activeRoomId && socketRef.current) {
            socketRef.current.emit('leave_room', { roomId: activeRoomId });
        }
        setActiveRoomId(null);
        setRoomState(null);
        setChatMessages([]);
        setFloatingReactions([]);
        pendingJoinRef.current = null;
    };
    const emitPlay = (time) => {
        if (socketRef.current && activeRoomId) {
            socketRef.current.emit('play', { time });
        }
    };
    const emitPause = (time) => {
        if (socketRef.current && activeRoomId) {
            socketRef.current.emit('pause', { time });
        }
    };
    const emitSeek = (time) => {
        if (socketRef.current && activeRoomId) {
            socketRef.current.emit('seek', { time });
        }
    };
    const emitChangeVideo = (videoUrl) => {
        if (socketRef.current && activeRoomId) {
            socketRef.current.emit('change_video', { videoUrl });
        }
    };
    const emitSendMessage = (message) => {
        if (socketRef.current && activeRoomId && message.trim()) {
            socketRef.current.emit('send_message', { message });
        }
    };
    const emitSendReaction = (emoji) => {
        if (socketRef.current && activeRoomId) {
            socketRef.current.emit('send_reaction', { emoji });
        }
    };
    const emitAssignRole = (userId, role) => {
        if (socketRef.current && activeRoomId) {
            socketRef.current.emit('assign_role', { userId, role });
        }
    };
    const emitRemoveParticipant = (userId) => {
        if (socketRef.current && activeRoomId) {
            socketRef.current.emit('remove_participant', { userId });
        }
    };
    const emitTransferHost = (userId) => {
        if (socketRef.current && activeRoomId) {
            socketRef.current.emit('transfer_host', { userId });
        }
    };
    const triggerForceSync = () => {
        setForceSyncTrigger(prev => prev + 1);
        showToast('🔄 Synchronizing video position with host...', 'info');
    };
    return (_jsx(RoomContext.Provider, { value: {
            roomState,
            chatMessages,
            floatingReactions,
            syncMetrics,
            userRole,
            isHost,
            canControlPlayback,
            activeRoomId,
            joinRoom,
            leaveRoom,
            emitPlay,
            emitPause,
            emitSeek,
            emitChangeVideo,
            emitSendMessage,
            emitSendReaction,
            emitAssignRole,
            emitRemoveParticipant,
            emitTransferHost,
            forceSyncTrigger,
            triggerForceSync,
            notification,
            setNotification,
        }, children: children }));
};
export const useRoom = () => {
    const context = useContext(RoomContext);
    if (!context) {
        throw new Error('useRoom must be used within a RoomProvider');
    }
    return context;
};
