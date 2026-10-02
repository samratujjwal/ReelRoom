import { useState, useEffect } from 'react';
import { Plus, ArrowRight, Users, Zap, Search, Shield, MessageSquare, Monitor, Ticket } from 'lucide-react';
import { apiService } from '../services/api';
import { useRoom } from '../context/RoomContext';
import { useAuth } from '../context/AuthContext';

export const Lobby = ({ onOpenCreateRoom, onOpenAuth, onNavigateExplore }) => {
  const { joinRoom } = useRoom();
  const { user, isAuthenticated } = useAuth();

  const [activeRooms, setActiveRooms] = useState([]);
  const [roomIdInput, setRoomIdInput] = useState('');
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);

  const fetchRooms = async () => {
    setIsLoadingRooms(true);
    try {
      const res = await apiService.listRooms();
      const roomsList = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res) ? res : [];
      setActiveRooms(roomsList);
    } catch { setActiveRooms([]); }
    finally { setIsLoadingRooms(false); }
  };

  useEffect(() => {
    fetchRooms();
    const i = setInterval(fetchRooms, 15000);
    return () => clearInterval(i);
  }, []);

  const handleJoinById = (e) => {
    e.preventDefault();
    if (!roomIdInput.trim()) return;
    if (!isAuthenticated || !user) {
      onOpenAuth();
      return;
    }
    joinRoom(roomIdInput.trim(), user.username);
  };

  const totalViewers = activeRooms.reduce((acc, r) => acc + (r.participants?.length || 0), 0);

  const features = [
    {
      num: '01',
      icon: Zap,
      title: 'Frame-accurate sync',
      desc: 'Play, pause and seek land on every screen at once. Drift is measured against the host clock and corrected continuously.',
    },
    {
      num: '02',
      icon: Shield,
      title: 'The host holds the remote',
      desc: 'Hosts and moderators steer playback and manage the room. Roles can be reassigned or handed over gracefully, mid-show.',
    },
    {
      num: '03',
      icon: MessageSquare,
      title: 'Notes in the dark',
      desc: 'A live chat and floating reactions, timed to the frame everyone is watching — like passing notes in a theatre you built together.',
    },
    {
      num: '04',
      icon: Monitor,
      title: 'Every screen, one room',
      desc: 'Phone, laptop or desktop. Share the link or the room code and anyone can take a seat — no installs, no plugins.',
    },
  ];

  return (
    <div className="bg-ivory">

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-14">
          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-12 lg:gap-16 items-center">

            {/* Left — editorial headline */}
            <div className="space-y-7 text-center lg:text-left">
              <p className="eyebrow">A shared screening room for YouTube</p>

              <h1 className="font-display font-medium text-ink leading-[1.04] tracking-tight text-5xl sm:text-6xl xl:text-7xl">
                Watch together.<br />
                <em className="text-coraldeep">Stay in sync.</em>
              </h1>

              <p className="text-base sm:text-lg text-inksoft leading-relaxed max-w-xl mx-auto lg:mx-0">
                ReelRoom keeps everyone's player on the same frame — millisecond-precise,
                across cities and time zones. Pick a video, send the link, and press play
                as one.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-center lg:justify-start">
                <button
                  onClick={isAuthenticated ? onOpenCreateRoom : onOpenAuth}
                  className="btn-primary"
                >
                  <Plus className="w-4 h-4" />
                  <span>Start a room</span>
                </button>

                {onNavigateExplore && (
                  <button onClick={onNavigateExplore} className="btn-outline">
                    <Search className="w-4 h-4" />
                    <span>Browse rooms</span>
                  </button>
                )}
              </div>

              {/* Real figures — from live data only */}
              <div className="flex items-center gap-8 justify-center lg:justify-start pt-2">
                <div>
                  <p className="font-display text-3xl font-semibold text-ink">
                    {isLoadingRooms ? '–' : activeRooms.length}
                  </p>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-inksoft mt-1">Rooms open now</p>
                </div>
                <div className="w-px h-10 bg-ink/10" />
                <div>
                  <p className="font-display text-3xl font-semibold text-ink flex items-center gap-2">
                    <Users className="w-5 h-5 text-forest" />
                    {isLoadingRooms ? '–' : totalViewers}
                  </p>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-inksoft mt-1">Watching now</p>
                </div>
              </div>
            </div>

            {/* Right — admission ticket / quick join */}
            <div className="relative">
              <div className="card p-7 sm:p-8 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-forest flex items-center justify-center shrink-0">
                    <Ticket className="w-5 h-5 text-ivory" />
                  </div>
                  <div>
                    <p className="eyebrow">Admit one</p>
                    <h3 className="font-display text-2xl font-semibold text-ink mt-0.5">Have a ticket?</h3>
                  </div>
                </div>

                <div className="ticket-edge" />

                <p className="text-sm text-inksoft leading-relaxed">
                  Paste a room code or invite link to take your seat. Rooms stay in sync
                  from the moment you join.
                </p>

                <form onSubmit={handleJoinById} className="space-y-4">
                  <div>
                    <label htmlFor="room-code" className="block text-xs font-semibold text-inksoft mb-2">
                      Room code or invite link
                    </label>
                    <input
                      id="room-code"
                      type="text"
                      placeholder="e.g. K7Q2XD"
                      value={roomIdInput}
                      onChange={e => setRoomIdInput(e.target.value)}
                      className="field font-mono tracking-wide"
                      autoComplete="off"
                    />
                  </div>

                  {!isAuthenticated && (
                    <p className="text-xs text-coraldeep bg-coral/10 border border-coral/25 rounded-lg px-3 py-2.5">
                      You'll be asked to <button type="button" onClick={onOpenAuth} className="underline font-semibold">log in</button> before you can join.
                    </p>
                  )}

                  <button type="submit" disabled={!roomIdInput.trim()} className="btn-coral w-full">
                    <span>{isAuthenticated ? 'Take your seat' : 'Log in to join'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="border-t hairline bg-parchment/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="max-w-2xl mb-12">
            <p className="eyebrow mb-3">How it works</p>
            <h2 className="font-display text-3xl sm:text-4xl font-medium text-ink tracking-tight">
              One room, one timeline,<br />every screen.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-ink/10 rounded-2xl overflow-hidden border hairline">
            {features.map((f) => (
              <div key={f.num} className="bg-ivory p-6 sm:p-7 space-y-4 hover:bg-cream transition-colors">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-forest/10 border border-forest/15 flex items-center justify-center text-forest">
                    <f.icon className="w-5 h-5" />
                  </div>
                  <span className="font-display text-sm text-ink/30 italic">{f.num}</span>
                </div>
                <h3 className="font-display text-lg font-semibold text-ink">{f.title}</h3>
                <p className="text-[13px] text-inksoft leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};
