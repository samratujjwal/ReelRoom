import { useState } from 'react';
import { LogOut, Copy, Check, QrCode, MessageSquare, Users, Info, Share2 } from 'lucide-react';
import { useRoom } from '../../context/RoomContext';
import { VideoPlayer } from './Player/VideoPlayer';
import { ChatPanel } from './Chat/ChatPanel';
import { ParticipantsPanel } from './Participants/ParticipantsPanel';

export const WatchRoom = () => {
  const { roomState, activeRoomId, leaveRoom, userRole } = useRoom();
  const [activeTab, setActiveTab] = useState('chat');
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  if (!roomState && !activeRoomId) return null;

  const roomShareUrl = `${window.location.origin}?room=${roomState?.roomId || activeRoomId}`;

  const copyRoomLink = () => {
    navigator.clipboard.writeText(roomShareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const tabs = [
    { key: 'chat', label: 'Chat', icon: MessageSquare },
    { key: 'participants', label: 'People', icon: Users },
    { key: 'info', label: 'Programme', icon: Info },
  ];

  return (
    <div className="bg-ivory min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Room header — the marquee */}
        <div className="card p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <div className="w-11 h-11 rounded-xl bg-forest flex items-center justify-center shrink-0">
              <span className="text-xl" aria-hidden="true">🎬</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="font-display text-xl sm:text-2xl font-semibold text-ink truncate">
                  {roomState?.name || 'Screening room'}
                </h1>
                <span className="shrink-0 px-2 py-0.5 rounded-md bg-coral/10 text-coraldeep border border-coral/25 text-[10px] font-bold uppercase tracking-widest">
                  Host · {roomState?.hostUsername}
                </span>
              </div>
              <p className="text-[11px] text-inksoft font-mono truncate mt-0.5">
                Code <span className="text-forest font-semibold">{roomState?.roomId || activeRoomId}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={copyRoomLink}
              className="btn-outline !py-2 !px-3 !text-xs"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-forest" />
                  <span className="text-forest font-semibold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Copy invite</span>
                </>
              )}
            </button>

            <button
              onClick={() => setShowQrModal(true)}
              aria-label="Show QR code"
              className="w-9 h-9 rounded-lg border hairline hover:bg-ink/5 flex items-center justify-center text-inksoft hover:text-ink transition-colors"
            >
              <QrCode className="w-4 h-4" />
            </button>

            <button
              onClick={leaveRoom}
              className="btn-danger-soft !py-2 !px-3 !text-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Leave</span>
            </button>
          </div>
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* Screening room */}
          <div className="lg:col-span-2">
            <VideoPlayer />
          </div>

          {/* Programme column */}
          <div className="space-y-4">
            <div className="flex bg-parchment p-1 rounded-xl border hairline" role="tablist">
              {tabs.map(t => (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={activeTab === t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === t.key ? 'bg-forest text-ivory shadow-sm' : 'text-inksoft hover:text-ink'
                  }`}
                >
                  <t.icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              ))}
            </div>

            <div>
              {activeTab === 'chat' && <ChatPanel />}
              {activeTab === 'participants' && <ParticipantsPanel />}
              {activeTab === 'info' && (
                <div className="card p-5 sm:p-6 space-y-6 h-[480px] lg:h-[560px] overflow-y-auto">
                  <div>
                    <h3 className="font-display text-lg font-semibold text-ink mb-3">Room details</h3>
                    <dl className="text-sm">
                      {[
                        { label: 'Room', value: roomState?.name },
                        { label: 'Host', value: roomState?.hostUsername },
                        { label: 'Your role', value: userRole },
                        { label: 'Sync', value: 'Live' },
                      ].map((item, i) => (
                        <div key={i} className="flex justify-between gap-3 py-2.5 border-b hairline last:border-0">
                          <dt className="text-inksoft text-xs font-medium uppercase tracking-wider">{item.label}</dt>
                          <dd className="font-semibold text-ink text-xs truncate max-w-[170px]">{item.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>

                  <div>
                    <h3 className="font-display text-lg font-semibold text-ink mb-3">House rules</h3>
                    <div className="space-y-2.5 text-xs text-inksoft leading-relaxed">
                      <div className="p-3 rounded-xl bg-parchment/60 border hairline">
                        <strong className="text-ink">👑 Host</strong> — full control: play, pause, seek, change video, manage people, transfer the room.
                      </div>
                      <div className="p-3 rounded-xl bg-parchment/60 border hairline">
                        <strong className="text-ink">🛡️ Moderator</strong> — media control: play, pause, seek, change video.
                      </div>
                      <div className="p-3 rounded-xl bg-parchment/60 border hairline">
                        <strong className="text-ink">👤 Participant &amp; 👁️ Viewer</strong> — settle in: synced video, live chat, reactions.
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={copyRoomLink}
                    className="btn-primary w-full !py-2.5 text-xs"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{copiedLink ? 'Invite copied' : 'Copy invite link'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* QR Modal */}
        {showQrModal && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm"
            onClick={() => setShowQrModal(false)}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="rounded-2xl bg-cream border hairline p-6 max-w-sm w-full text-center space-y-4 animate-rise-in"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="font-display text-xl font-semibold text-ink">Scan to join</h3>
              <div className="bg-white p-3 rounded-xl inline-block mx-auto border hairline">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(roomShareUrl)}`}
                  alt="QR code for this room's invite link"
                  className="w-40 h-40 mx-auto"
                />
              </div>
              <p className="text-xs text-inksoft font-mono break-all">{roomShareUrl}</p>
              <button
                onClick={() => setShowQrModal(false)}
                className="btn-outline w-full !py-2.5 text-xs"
              >
                Close
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
