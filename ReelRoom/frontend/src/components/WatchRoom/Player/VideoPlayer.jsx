import { useRef, useState, useEffect } from 'react';
import YouTube from 'react-youtube';
import { Play, Pause, Volume2, VolumeX, Maximize2, Clapperboard } from 'lucide-react';
import { useRoom } from '../../../context/RoomContext';
import { useYouTubeSync, extractYouTubeId } from '../../../hooks/useYouTubeSync';
import { SyncStatusBadge } from './SyncStatusBadge';
import { FloatingReactions } from '../Reactions/FloatingReactions';
import { ChangeVideoModal } from '../Controls/ChangeVideoModal';

export const VideoPlayer = () => {
  const { roomState, canControlPlayback, emitPlay, emitPause, emitSeek, emitChangeVideo, setNotification } = useRoom();
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const intervalRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);
  const [currentTimeDisplay, setCurrentTimeDisplay] = useState(0);
  const [durationDisplay, setDurationDisplay] = useState(0);

  const videoId = extractYouTubeId(roomState?.currentVideoUrl || roomState?.videoId || 'dQw4w9WgXcQ');
  const { driftMs, syncStatus, handlePlayerStateChange, handlePlayerSeek } = useYouTubeSync(playerRef);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const opts = {
    height: '100%', width: '100%',
    playerVars: { autoplay: 1, controls: canControlPlayback ? 1 : 0, modestbranding: 1, rel: 0, enablejsapi: 1, fs: 1 },
  };

  const handlePlayerError = (event) => {
    console.warn('YouTube Player error code:', event.data);
    if (event.data === 100) { setNotification({ message: 'Video not found', type: 'warning' }); }
    else if (event.data === 101 || event.data === 150) { setNotification({ message: 'Embedding disabled', type: 'warning' }); }
  };

  const onPlayerReady = (event) => {
    playerRef.current = event.target;
    event.target.setVolume(volume);
    if (isMuted) event.target.mute();
    if (roomState?.isPlaying) {
      try {
        const res = event.target.playVideo();
        if (res && typeof res.catch === 'function') {
          res.catch(() => {
            event.target.mute();
            event.target.playVideo();
          });
        }
      } catch {
        event.target.mute();
        event.target.playVideo();
      }
    }

    intervalRef.current = setInterval(() => {
      if (playerRef.current) {
        try {
          const cur = playerRef.current.getCurrentTime ? playerRef.current.getCurrentTime() : 0;
          const dur = playerRef.current.getDuration ? playerRef.current.getDuration() : 0;
          setCurrentTimeDisplay(cur || 0);
          setDurationDisplay(dur || 0);
        } catch { /* player not ready */ }
      }
    }, 500);
  };

  const togglePlayPause = () => {
    if (!canControlPlayback) return;
    roomState?.isPlaying ? emitPause(currentTimeDisplay) : emitPlay(currentTimeDisplay);
  };

  const handleMuteToggle = () => {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  const handleVolumeChange = (e) => {
    const val = Number(e.target.value);
    setVolume(val);
    if (playerRef.current) {
      playerRef.current.setVolume(val);
      if (val === 0) { setIsMuted(true); }
      else if (isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
      }
    }
  };

  const handleScrubberChange = (e) => {
    if (!canControlPlayback) return;
    handlePlayerSeek(Number(e.target.value));
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    document.fullscreenElement ? document.exitFullscreen() : containerRef.current.requestFullscreen();
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex flex-col gap-4">

      {/* The screen — darkened theatre frame */}
      <div className="rounded-2xl bg-pine p-2 sm:p-2.5 shadow-[0_20px_60px_rgba(24,43,33,0.25)] border border-ink/20">
        <div
          ref={containerRef}
          className="theater-scroll relative w-full aspect-video rounded-xl overflow-hidden bg-black group"
        >
          <div className="w-full h-full">
            <YouTube
              key={videoId}
              videoId={videoId}
              opts={opts}
              onReady={onPlayerReady}
              onStateChange={handlePlayerStateChange}
              onError={handlePlayerError}
              className="w-full h-full"
              iframeClassName="w-full h-full"
            />
          </div>

          <FloatingReactions />

          {/* Overlay controls */}
          <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 bg-gradient-to-t from-black via-black/70 to-transparent opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300 z-30 flex flex-col gap-2.5">

            {/* Scrubber */}
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-[11px] font-mono text-ivory/70 shrink-0 tabular-nums">{formatTime(currentTimeDisplay)}</span>
              <input
                type="range"
                min={0}
                max={durationDisplay || 100}
                value={currentTimeDisplay}
                onChange={handleScrubberChange}
                disabled={!canControlPlayback}
                aria-label="Seek"
                className="w-full h-1 bg-ivory/20 accent-coral rounded-lg cursor-pointer disabled:cursor-not-allowed"
              />
              <span className="text-[11px] font-mono text-ivory/50 shrink-0 tabular-nums">{formatTime(durationDisplay)}</span>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={togglePlayPause}
                  disabled={!canControlPlayback}
                  aria-label={roomState?.isPlaying ? 'Pause' : 'Play'}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                    canControlPlayback
                      ? 'bg-ivory text-ink hover:bg-coral hover:text-ivory'
                      : 'bg-ivory/10 text-ivory/30 cursor-not-allowed'
                  }`}
                >
                  {roomState?.isPlaying
                    ? <Pause className="w-4 h-4 fill-current" />
                    : <Play className="w-4 h-4 fill-current ml-0.5" />}
                </button>

                <div className="flex items-center gap-2 bg-ivory/10 px-2.5 sm:px-3 py-1.5 rounded-full border border-ivory/10">
                  <button onClick={handleMuteToggle} aria-label={isMuted ? 'Unmute' : 'Mute'} className="text-ivory/70 hover:text-ivory">
                    {isMuted || volume === 0
                      ? <VolumeX className="w-3.5 h-3.5 text-coral" />
                      : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    aria-label="Volume"
                    className="w-14 sm:w-20 h-1 bg-ivory/20 accent-coral rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                {canControlPlayback && (
                  <button
                    onClick={() => setIsChangeModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-ivory/10 text-ivory font-medium border border-ivory/15 text-[11px] sm:text-xs py-2 px-3 hover:bg-ivory/20 transition-all active:scale-95"
                  >
                    <Clapperboard className="w-3.5 h-3.5 text-coral" />
                    <span className="hidden sm:inline">Change video</span>
                  </button>
                )}
                <button
                  onClick={toggleFullscreen}
                  aria-label="Fullscreen"
                  className="w-9 h-9 rounded-full bg-ivory/10 hover:bg-ivory/20 border border-ivory/15 flex items-center justify-center text-ivory/70 hover:text-ivory transition-colors"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Now-showing strip */}
      <div className="card p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-2 h-2 rounded-full bg-coral animate-pulse shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <span className="text-[10px] uppercase tracking-[0.18em] text-inksoft font-semibold block">Now showing</span>
            <span className="text-xs font-semibold text-ink font-mono truncate max-w-[180px] sm:max-w-xs block">{videoId}</span>
          </div>
        </div>
        <SyncStatusBadge driftMs={driftMs} syncStatus={syncStatus} />
      </div>

      <ChangeVideoModal
        isOpen={isChangeModalOpen}
        onClose={() => setIsChangeModalOpen(false)}
        onChangeVideo={emitChangeVideo}
        currentVideoUrl={roomState?.currentVideoUrl || ''}
      />
    </div>
  );
};
