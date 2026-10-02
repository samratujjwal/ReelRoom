import { useEffect, useRef, useState } from 'react';
import { useRoom } from '../context/RoomContext';
export function extractYouTubeId(urlOrId) {
    if (!urlOrId)
        return 'dQw4w9WgXcQ';
    const cleaned = urlOrId.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(cleaned))
        return cleaned;
    const match = cleaned.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]{11})/);
    if (match && match[1])
        return match[1];
    // Fallback search for any 11 char ID pattern
    const fallbackMatch = cleaned.match(/[\w-]{11}/);
    return fallbackMatch ? fallbackMatch[0] : 'dQw4w9WgXcQ';
}
export function useYouTubeSync(playerRef) {
    const { roomState, canControlPlayback, forceSyncTrigger, emitPlay, emitPause, emitSeek } = useRoom();
    const isInternalSeeking = useRef(false);
    const [driftMs, setDriftMs] = useState(0);
    const [syncStatus, setSyncStatus] = useState('synced');
    // Helper to get calculated current host video time
    const getExpectedHostTime = () => {
        if (!roomState)
            return 0;
        if (!roomState.isPlaying)
            return roomState.timestamp;
        const elapsedSinceServerUpdate = (Date.now() - (roomState.lastUpdated || Date.now())) / 1000;
        return roomState.timestamp + elapsedSinceServerUpdate;
    };
    // Sync state loop when roomState or forceSyncTrigger updates
    useEffect(() => {
        if (!roomState || !playerRef.current)
            return;
        const player = playerRef.current;
        const expectedTime = getExpectedHostTime();
        try {
            const currentTime = player.getCurrentTime ? player.getCurrentTime() : 0;
            const drift = Math.abs(currentTime - expectedTime);
            setDriftMs(Math.round(drift * 1000));
            if (drift < 1.0) {
                setSyncStatus('synced');
            }
            else if (drift < 2.5) {
                setSyncStatus('syncing');
            }
            else {
                setSyncStatus('desynced');
            }
            // Check if we need to sync play/pause status
            const playerState = player.getPlayerState ? player.getPlayerState() : -1;
            // 1 = PLAYING, 2 = PAUSED
            // If drift is significant (> 1.2s), force seek
            if (drift > 1.2) {
                isInternalSeeking.current = true;
                player.seekTo(expectedTime, true);
                setTimeout(() => { isInternalSeeking.current = false; }, 500);
            }
            if (roomState.isPlaying && playerState !== 1) {
                try {
                    const res = player.playVideo();
                    if (res && typeof res.catch === 'function') {
                        res.catch(() => {
                            if (player.mute)
                                player.mute();
                            player.playVideo();
                        });
                    }
                }
                catch {
                    if (player.mute)
                        player.mute();
                    player.playVideo();
                }
            }
            else if (!roomState.isPlaying && playerState === 1) {
                player.pauseVideo();
            }
        }
        catch (err) {
            console.warn('Sync player status error:', err);
        }
    }, [roomState, forceSyncTrigger]);
    // Handle Player State Changes emitted by user actions on the player controls
    const handlePlayerStateChange = (event) => {
        if (!playerRef.current || isInternalSeeking.current)
            return;
        const playerState = event.data;
        const currentTime = playerRef.current.getCurrentTime();
        if (canControlPlayback) {
            if (playerState === 1) { // PLAYING
                emitPlay(currentTime);
            }
            else if (playerState === 2) { // PAUSED
                emitPause(currentTime);
            }
        }
    };
    const handlePlayerSeek = (newTime) => {
        if (canControlPlayback) {
            isInternalSeeking.current = true;
            emitSeek(newTime);
            setTimeout(() => { isInternalSeeking.current = false; }, 500);
        }
    };
    return {
        driftMs,
        syncStatus,
        getExpectedHostTime,
        handlePlayerStateChange,
        handlePlayerSeek,
    };
}
