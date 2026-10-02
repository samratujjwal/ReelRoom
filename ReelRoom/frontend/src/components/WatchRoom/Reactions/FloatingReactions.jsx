import { useRoom } from '../../../context/RoomContext';

export const FloatingReactions = () => {
  const { floatingReactions } = useRoom();
  if (floatingReactions.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-40" aria-hidden="true">
      {floatingReactions.map(reaction => (
        <div
          key={reaction.id}
          className="absolute bottom-6 flex flex-col items-center animate-float-reaction"
          style={{ left: `${reaction.left}%` }}
        >
          <span className="text-4xl filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">{reaction.emoji}</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-ivory/95 text-forest border border-ink/10 mt-1 whitespace-nowrap">
            {reaction.username}
          </span>
        </div>
      ))}
    </div>
  );
};
