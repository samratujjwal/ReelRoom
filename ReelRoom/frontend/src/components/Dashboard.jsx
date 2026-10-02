import { useState, useEffect } from 'react';
import { Search, Users, Play, Tv, Trash2 } from 'lucide-react';
import { apiService } from '../services/api';
import { useRoom } from '../context/RoomContext';
import { useAuth } from '../context/AuthContext';
import { extractYouTubeId } from '../hooks/useYouTubeSync';

const FALLBACK_THUMB = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';

export const Dashboard = ({ onOpenAuth, onOpenCreateRoom }) => {
  const { joinRoom } = useRoom();
  const { user, isAuthenticated, token } = useAuth();

  const [myRooms, setMyRooms] = useState([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [isDeleting, setIsDeleting] = useState(null);

  const fetchMyRooms = async () => {
    if (!user) return;
    setIsLoadingRooms(true);
    try {
      const res = await apiService.listMyRooms(user.id);
      const roomsList = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res) ? res : [];
      setMyRooms(roomsList);
    } catch {
      setMyRooms([]);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchMyRooms();
    }
  }, [isAuthenticated, user]);

  const handleJoinRoomCard = (room) => {
    if (!isAuthenticated || !user) {
      onOpenAuth();
      return;
    }
    joinRoom(room.roomId, user.username);
  };

  const handleDeleteRoom = async (roomId) => {
    setMyRooms(prev => prev.filter(r => r.roomId !== roomId));
    setIsDeleting(roomId);
    try {
      await apiService.deleteRoom(roomId, user?.id || 'usr-guest', token || '');
    } catch {
      // Ignore network errors on local remove
    } finally {
      setIsDeleting(null);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="bg-ivory min-h-screen pb-20 pt-14 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="eyebrow mb-3">Members only</p>
          <h2 className="font-display text-3xl font-medium text-ink mb-3">Your dashboard awaits</h2>
          <p className="text-sm text-inksoft mb-6">Log in to see the rooms you've opened and pick up where you left off.</p>
          <button onClick={onOpenAuth} className="btn-primary">
            Log in
          </button>
        </div>
      </div>
    );
  }

  const filteredRooms = myRooms.filter(r =>
    r.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    r.roomId.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="bg-ivory min-h-screen pb-20 pt-10 sm:pt-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

        {/* Header & Search */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-xl">
            <p className="eyebrow mb-3">Your screenings</p>
            <h1 className="font-display text-4xl sm:text-5xl font-medium text-ink tracking-tight">Dashboard</h1>
            <p className="text-sm text-inksoft mt-3 leading-relaxed">Rooms you've opened, ready to resume whenever your audience is.</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-ink/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search your rooms…"
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              className="field !pl-11"
              aria-label="Search your rooms"
            />
          </div>
        </div>

        {/* Room Grid */}
        {isLoadingRooms ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" aria-label="Loading rooms">
            {[1, 2, 3, 4].map(i => (
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
            <h3 className="font-display text-2xl font-semibold text-ink mb-2">No rooms yet</h3>
            <p className="text-sm text-inksoft mb-6 max-w-sm mx-auto">
              {searchFilter ? "Nothing of yours matches that search." : "You haven't opened a screening yet. The projector is warm and waiting."}
            </p>
            {!searchFilter && (
              <button onClick={onOpenCreateRoom} className="btn-primary">
                Start a room
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredRooms.map(room => {
              const videoId = extractYouTubeId(room.currentVideoUrl || room.videoId || room.videoState?.videoId);
              const canDelete = user?.id === room.hostId || user?.username === room.hostUsername;
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
                    <div className="absolute bottom-3 right-3 px-2 py-1 rounded-md bg-ink/70 text-ivory text-[11px] font-semibold flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      {room.participants?.length || 1}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 flex flex-col flex-1 gap-4">
                    <div>
                      <h3 className="font-display text-lg font-semibold text-ink line-clamp-1 mb-1.5" title={room.name}>{room.name}</h3>
                      <div className="flex items-center justify-between text-xs text-inksoft">
                        <span className="font-mono text-[10px] shrink-0 px-2 py-0.5 rounded bg-parchment border hairline">{room.roomId}</span>
                        <span className="text-[11px]">{new Date(room.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="mt-auto pt-1 flex gap-2">
                      <button
                        onClick={() => handleJoinRoomCard(room)}
                        className="btn-primary flex-1 !py-2.5 text-sm"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        <span>Resume</span>
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
