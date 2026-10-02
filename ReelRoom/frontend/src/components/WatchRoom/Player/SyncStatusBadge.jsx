import { RefreshCw, ShieldCheck } from 'lucide-react';
import { useRoom } from '../../../context/RoomContext';

export const SyncStatusBadge = ({ driftMs, syncStatus }) => {
  const { triggerForceSync, userRole } = useRoom();

  const config = (() => {
    switch (syncStatus) {
      case 'synced':
        return { chip: 'bg-forest/10 border-forest/25 text-forest', dot: 'bg-forest', label: 'In sync' };
      case 'syncing':
        return { chip: 'bg-coral/10 border-coral/30 text-coraldeep', dot: 'bg-coral animate-ping', label: 'Syncing…' };
      case 'desynced':
        return { chip: 'bg-brick/10 border-brick/30 text-brick', dot: 'bg-brick animate-bounce', label: 'Out of sync' };
      default:
        return { chip: 'bg-forest/10 border-forest/25 text-forest', dot: 'bg-forest', label: 'In sync' };
    }
  })();

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full border text-[11px] font-bold ${config.chip}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} aria-hidden="true" />
        <span>{config.label}</span>
        <span className="opacity-60 font-mono tabular-nums">({driftMs}ms)</span>
      </div>

      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-parchment border hairline text-[11px] font-semibold text-inksoft">
        <ShieldCheck className="w-3 h-3 text-forest" />
        <span>{userRole}</span>
      </div>

      <button
        onClick={triggerForceSync}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-coral/10 hover:bg-coral/20 border border-coral/25 text-coraldeep text-[11px] font-semibold transition-all active:scale-95"
        title="Force re-sync"
      >
        <RefreshCw className="w-3 h-3" />
        <span className="hidden sm:inline">Re-sync</span>
      </button>
    </div>
  );
};
