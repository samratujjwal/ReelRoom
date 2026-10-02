import { useState } from 'react';
import { X, Clapperboard, Link as LinkIcon, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { useRoom } from '../context/RoomContext';

export const CreateRoomModal = ({ isOpen, onClose }) => {
  const { user, token } = useAuth();
  const { joinRoom } = useRoom();
  const [name, setName] = useState('');
  const [initialVideoUrl, setInitialVideoUrl] = useState('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // must be logged in
  if (!user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    if (!name.trim()) {
      setError('Please enter a room name');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await apiService.createRoom({
        name: name.trim(),
        hostUsername: user.username,
        hostUserId: user.id,
        initialVideoUrl: initialVideoUrl.trim()
      }, token);

      if (res.success && res.data?.roomId) {
        joinRoom(res.data.roomId, user.username);
        onClose();
      } else {
        setError(res.error || 'Failed to create room.');
      }
    } catch (err) {
      setError(err.message || 'Error connecting to room creation service.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-cream border hairline p-6 sm:p-8 relative shadow-[0_24px_80px_rgba(32,35,31,0.25)] animate-rise-in">

        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-inksoft hover:text-ink w-8 h-8 rounded-full hover:bg-ink/5 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-11 h-11 rounded-xl bg-forest flex items-center justify-center shrink-0">
            <Clapperboard className="w-5 h-5 text-ivory" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-medium text-ink">Open a screening</h2>
            <p className="text-xs text-inksoft mt-0.5">Pick a film, send the link, press play as one.</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-coral/10 border border-coral/25 text-coraldeep text-xs flex items-center gap-2" role="alert">
            <span>⚠️</span><span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="room-name" className="block text-xs font-semibold text-inksoft mb-2">Room name</label>
            <input
              id="room-name"
              type="text"
              placeholder="Friday night classics"
              value={name}
              onChange={e => setName(e.target.value)}
              className="field"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="room-video" className="block text-xs font-semibold text-inksoft mb-2">Opening video</label>
            <div className="relative">
              <LinkIcon className="w-4 h-4 text-ink/35 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="room-video"
                type="text"
                placeholder="https://www.youtube.com/watch?v=…"
                value={initialVideoUrl}
                onChange={e => setInitialVideoUrl(e.target.value)}
                className="field !pl-10 font-mono text-[13px]"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-forest/5 border border-forest/15 text-xs text-forest flex items-start gap-2.5 leading-relaxed">
            <Crown className="w-4 h-4 text-coraldeep shrink-0 mt-0.5" />
            <span>As host, you hold the remote — play, pause, seek, change the video, and manage who's in the room.</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-outline flex-1">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
              {isSubmitting ? 'Opening…' : 'Open room'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
