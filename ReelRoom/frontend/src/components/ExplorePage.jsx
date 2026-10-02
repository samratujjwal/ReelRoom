import { useState, useEffect } from 'react';
import { Search, Users, Play, Tv, Trash2 } from 'lucide-react';
import { apiService } from '../services/api';
import { useRoom } from '../context/RoomContext';
import { useAuth } from '../context/AuthContext';
import { extractYouTubeId } from '../hooks/useYouTubeSync';

const FALLBACK_THUMB = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';

export const ExplorePage = ({ onOpenAuth }) => {
  const { joinRoom } = useRoom();
  const { user, isAuthenticated, token } = useAuth();

  const [activeRooms, setActiveRooms] = useState([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [isDeleting, setIsDeleting] = useState(null);

  const fetchRooms = async () => {
    setIsLoadingRooms(true);
    try {
      const res = await apiService.listRooms();
      const roomsList = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res) ? res : [];
      setActiveRooms(roomsList);
    } catch {
      setActiveRooms([]);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    const i = setInterval(fetchRooms, 15000);
    return () => clearInterval(i);
  }, []);

  const handleJoinRoomCard = (room) => {
    if (!isAuthenticated || !user) {
      onOpenAuth();
      return;
    }
    joinRoom(room.roomId, user.username);
  };

  const handleDeleteRoom = async (roomId) => {
    setActiveRooms(prev => prev.filter(r => r.roomId !== roomId));
    setIsDeleting(roomId);
    try {
      await apiService.deleteRoom(roomId, user?.id || 'usr-guest', token || '');
    } catch {
      // Ignore network errors on local remove
    } finally {
      setIsDeleting(null);
    }
  };

  const filteredRooms = activeRooms.filter(r =>
    r.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    (r.hostUsername && r.hostUsername.toLowerCase().includes(searchFilter.toLowerCase())) ||
    r.roomId.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="bg-ivory min-h-screen pb-20 pt-10 sm:pt-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

        {/* Header & Search */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-xl">
            <p className="eyebrow mb-3">Now showing</p>
            <h1 className="font-display text-4xl sm:text-5xl font-medium text-ink tracking-tight">Explore rooms</h1>
            <p className="text-sm text-inksoft mt-3 leading-relaxed">Open screenings you can join right now — every one of them synced to the frame.</p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-ink/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, host, or code…"
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              className="field !pl-11"
              aria-label="Search rooms"
            />
          </div>
        </div>

        {/* Room Grid */}
        {isLoadingRooms ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" aria-label="Loading rooms">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="card p-4 h-72 animate-pulse flex flex-col gap-4">
                <div className="h-40 bg-ink/5 rounded-xl" />
                <div className="h-5 bg-ink/5 rounded w-3/4" />
                <div className="h-4 bg-ink/5 rounded w-1/2" />
                <div className="h-10 bg-ink/5 rounded-xl mt-auto" />
              </div>
            ))}
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="card p-16 sm:p-20 text-center flex flex-col items-center justify-center min-h-[40vh]">
            <div className="w-14 h-14 rounded-2xl bg-forest/10 border border-forest/15 flex items-center justify-center text-forest mb-5">
              <Tv className="w-6 h-6" />
            </div>
            <h3 className="font-display text-2xl font-semibold text-ink mb-2">No rooms on the marquee</h3>
            <p className="text-sm text-inksoft max-w-sm mx-auto">
              {searchFilter ? "Nothing matches your search — try a different name, host, or code." : "There are no open screenings right now. Start one and the seats will fill."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredRooms.map(room => {
              const videoId = extractYouTubeId(room.currentVideoUrl || room.videoId || room.videoState?.videoId);
              const canDelete = isAuthenticated && user && (user.id === room.hostId || user.username === room.hostUsername);
              return (
                <article
                  key={room.roomId}
                  className="card overflow-hidden flex flex-col animate-rise-in hover:shadow-[0_8px_30px_rgba(38,61,50,0.12)] hover:-translate-y-0.5 transition-all duration-300"
                >
                  {/* Thumbnail */}
                  <div className="relative w-full aspect-video overflow-hidden bg-pine">
                    <img
                      src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                      alt=""
                      onError={(e) => { e.target.src = FALLBACK_THUMB; }}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-coral text-ivory text-[10px] font-bold tracking-widest flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-ivory animate-pulse" />
                      LIVE
                    </div>
                    <div className="absolute bottom-3 right-3 px-2 py-1 rounded-md bg-ink/70 text-ivory text-[11px] font-semibold flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      {room.participants?.length || 1}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 flex flex-col flex-1 gap-4">
                    <div>
                      <h3 className="font-display text-lg font-semibold text-ink line-clamp-1 mb-1.5" title={room.name}>{room.name}</h3>
                      <div className="flex items-center justify-between gap-2 text-xs text-inksoft">
                        <span className="truncate">hosted by <span className="text-coraldeep font-semibold">{room.hostUsername || 'Unknown'}</span></span>
                        <span className="font-mono text-[10px] shrink-0 px-2 py-0.5 rounded bg-parchment border hairline">{room.roomId}</span>
                      </div>
                    </div>

                    <div className="mt-auto pt-1 flex gap-2">
                      <button
                        onClick={() => handleJoinRoomCard(room)}
                        className="btn-primary flex-1 !py-2.5 text-sm"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        <span>Join room</span>
                      </button>

                      {canDelete && (
                        <button
                          onClick={() => handleDeleteRoom(room.roomId)}
                          disabled={isDeleting === room.roomId}
                          title="Delete room"
                          aria-label={`Delete room ${room.name}`}
                          className="btn-danger-soft !px-3"
                        >
                          {isDeleting === room.roomId ? (
                            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
