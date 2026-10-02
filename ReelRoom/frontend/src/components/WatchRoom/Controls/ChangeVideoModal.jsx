import { useState } from 'react';
import { X, Clapperboard, Search, CheckCircle2 } from 'lucide-react';
import { extractYouTubeId } from '../../../hooks/useYouTubeSync';

// Staff picks to get the room started
const PRESET_VIDEOS = [
  { title: 'Lofi Hip Hop Radio', url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk', id: 'jfKfPfyJRdk' },
  { title: 'Big Buck Bunny 4K', url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', id: 'aqz-KE-bpKQ' },
  { title: 'Tropical Island', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', id: 'dQw4w9WgXcQ' },
];

export const ChangeVideoModal = ({ isOpen, onClose, onChangeVideo, currentVideoUrl }) => {
  const [inputUrl, setInputUrl] = useState(currentVideoUrl || '');
  const previewId = extractYouTubeId(inputUrl);
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputUrl.trim()) {
      onChangeVideo(inputUrl.trim());
      onClose();
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
          <div className="w-11 h-11 rounded-xl bg-coral flex items-center justify-center shrink-0">
            <Clapperboard className="w-5 h-5 text-ivory" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-medium text-ink">Change the reel</h2>
            <p className="text-xs text-inksoft mt-0.5">Everyone's screen follows — instantly.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="change-video-url" className="block text-xs font-semibold text-inksoft mb-2">YouTube link</label>
            <div className="relative">
              <Search className="w-4 h-4 text-ink/35 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="change-video-url"
                type="text"
                placeholder="https://www.youtube.com/watch?v=…"
                value={inputUrl}
                onChange={e => setInputUrl(e.target.value)}
                className="field !pl-10 font-mono text-[13px]"
                autoFocus
              />
            </div>
          </div>

          {previewId && (
            <div className="p-3 rounded-xl bg-parchment/60 border hairline flex items-center gap-3">
              <div className="relative w-24 h-14 rounded-lg overflow-hidden shrink-0 bg-pine">
                <img
                  src={`https://img.youtube.com/vi/${previewId}/mqdefault.jpg`}
                  alt="Video preview"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';
                  }}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="text-xs font-semibold text-inksoft block">Detected video</span>
                <span className="text-xs font-mono text-forest font-semibold">{previewId}</span>
              </div>
            </div>
          )}

          <div>
            <span className="block text-xs font-semibold text-inksoft mb-2">Quick picks</span>
            <div className="space-y-2">
              {PRESET_VIDEOS.map(preset => (
                <button
                  type="button"
                  key={preset.id}
                  onClick={() => setInputUrl(preset.url)}
                  className={`w-full text-left p-3 rounded-xl border text-xs flex items-center justify-between transition-all ${
                    previewId === preset.id
                      ? 'bg-forest/5 border-forest/25 text-forest font-semibold'
                      : 'bg-parchment/50 border-transparent text-inksoft hover:bg-parchment'
                  }`}
                >
                  <span className="truncate">{preset.title}</span>
                  {previewId === preset.id && <CheckCircle2 className="w-4 h-4 text-forest shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-outline flex-1">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1">
              Roll it
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
