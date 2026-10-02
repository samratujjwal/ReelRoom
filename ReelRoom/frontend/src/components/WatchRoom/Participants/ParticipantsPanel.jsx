import { useState } from 'react';
import { Users, Crown, Shield, UserX, MoreVertical, User, Eye } from 'lucide-react';
import { useRoom } from '../../../context/RoomContext';
import { useAuth } from '../../../context/AuthContext';

export const ParticipantsPanel = () => {
  const { roomState, isHost, emitAssignRole, emitRemoveParticipant, emitTransferHost } = useRoom();
  const { user } = useAuth();
  const [activeMenuUserId, setActiveMenuUserId] = useState(null);
  const participants = roomState?.participants || [];

  const handleRoleChange = (targetUserId, newRole) => {
    emitAssignRole(targetUserId, newRole);
    setActiveMenuUserId(null);
  };

  const handleRemove = (targetUserId) => {
    emitRemoveParticipant(targetUserId);
    setActiveMenuUserId(null);
  };

  const handleTransferHost = (targetUserId) => {
    emitTransferHost(targetUserId);
    setActiveMenuUserId(null);
  };

  const roleBadgeClass = (role) =>
    role === 'Host'
      ? 'bg-coral/10 text-coraldeep border-coral/25'
      : role === 'Moderator'
        ? 'bg-forest/10 text-forest border-forest/20'
        : role === 'Viewer'
          ? 'bg-sand/60 text-inksoft border-ink/15'
          : 'bg-ink/5 text-inksoft border-ink/15';

  const roleLabel = (role) =>
    role === 'Host' ? '👑 Host'
      : role === 'Moderator' ? '🛡️ Mod'
        : role === 'Participant' ? '👤 Participant'
          : '👁️ Viewer';

  return (
    <div className="flex flex-col h-[480px] lg:h-[560px] card overflow-hidden">

      {/* Header */}
      <div className="px-4 py-3.5 bg-parchment/60 border-b hairline flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-forest" />
          <h3 className="font-display text-base font-semibold text-ink">In the room</h3>
        </div>
        <span className="role-badge bg-forest/10 text-forest border-forest/20">
          {participants.length} here
        </span>
      </div>

      {/* List */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2 bg-cream">
        {participants.length === 0 && (
          <p className="text-xs text-inksoft text-center py-8">No one here yet — share the invite link.</p>
        )}
        {participants.map(part => {
          const isSelf = part.userId === user?.id || part.username === user?.username;
          const isParticipantHost = part.role === 'Host';

          return (
            <div
              key={part.socketId + part.userId}
              className="p-2.5 rounded-xl bg-parchment/50 border hairline flex items-center justify-between gap-2 hover:bg-parchment transition-colors relative"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-full bg-forest flex items-center justify-center font-bold text-ivory text-xs">
                    {part.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-forest border-2 border-cream absolute -bottom-0.5 -right-0.5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-ink truncate max-w-[100px] sm:max-w-[130px]">{part.username}</span>
                    {isSelf && <span className="text-[10px] text-coraldeep font-bold shrink-0">· you</span>}
                  </div>
                  <span className="text-[10px] text-ink/40 block font-mono tabular-nums">
                    joined {new Date(part.joinedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className={`role-badge ${roleBadgeClass(part.role)}`}>
                  {roleLabel(part.role)}
                </span>

                {isHost && !isSelf && !isParticipantHost && (
                  <div className="relative">
                    <button
                      onClick={() => setActiveMenuUserId(activeMenuUserId === part.userId ? null : part.userId)}
                      aria-label={`Manage ${part.username}`}
                      aria-expanded={activeMenuUserId === part.userId}
                      className="w-7 h-7 rounded-lg hover:bg-ink/10 flex items-center justify-center text-inksoft hover:text-ink transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {activeMenuUserId === part.userId && (
                      <div className="absolute right-0 top-8 z-50 w-48 p-1.5 rounded-xl bg-cream border hairline shadow-[0_16px_40px_rgba(32,35,31,0.2)] space-y-0.5">
                        <div className="px-2.5 py-1.5 text-[10px] font-bold text-inksoft uppercase tracking-widest">Set role</div>

                        {part.role !== 'Moderator' && (
                          <button
                            onClick={() => handleRoleChange(part.userId, 'Moderator')}
                            className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium text-forest hover:bg-forest/10 flex items-center gap-2"
                          >
                            <Shield className="w-3.5 h-3.5" /> Make moderator
                          </button>
                        )}

                        {part.role !== 'Participant' && (
                          <button
                            onClick={() => handleRoleChange(part.userId, 'Participant')}
                            className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium text-inksoft hover:bg-ink/5 flex items-center gap-2"
                          >
                            <User className="w-3.5 h-3.5" /> Make participant
                          </button>
                        )}

                        {part.role !== 'Viewer' && (
                          <button
                            onClick={() => handleRoleChange(part.userId, 'Viewer')}
                            className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium text-inksoft hover:bg-ink/5 flex items-center gap-2"
                          >
                            <Eye className="w-3.5 h-3.5" /> Make viewer
                          </button>
                        )}

                        <div className="border-t hairline my-1" />

                        <button
                          onClick={() => handleTransferHost(part.userId)}
                          className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium text-coraldeep hover:bg-coral/10 flex items-center gap-2"
                        >
                          <Crown className="w-3.5 h-3.5" /> Transfer host
                        </button>

                        <div className="border-t hairline my-1" />

                        <button
                          onClick={() => handleRemove(part.userId)}
                          className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium text-brick hover:bg-brick/10 flex items-center gap-2"
                        >
                          <UserX className="w-3.5 h-3.5" /> Remove
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
