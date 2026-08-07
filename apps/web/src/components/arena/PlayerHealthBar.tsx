interface PlayerHealthBarProps {
  id: string;
  isMe: boolean;
  index: number;
  hp: number;
}

export function PlayerHealthBar({ id, isMe, index, hp }: PlayerHealthBarProps) {
  const percentage = Math.max(0, Math.min(100, hp));
  const isAlive = hp > 0;

  return (
    <div
      className={`text-sm flex flex-col gap-1 p-2 rounded-lg transition-colors ${isMe ? "bg-blue-900/20 border border-blue-500/30" : "bg-gray-900/40 border border-gray-800"}`}
    >
      <span className="font-bold text-gray-300 text-xs">
        P{index + 1} {isMe ? "(You)" : ""}
      </span>
      <div className="w-20 h-2 bg-gray-950 rounded-full overflow-hidden border border-gray-800 relative">
        <div
          className={`h-full transition-all duration-500 ease-out ${isAlive ? "bg-gradient-to-r from-green-600 to-green-400 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-red-900"}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-[10px] text-gray-500">{Math.round(hp)} / 100</span>
    </div>
  );
}
