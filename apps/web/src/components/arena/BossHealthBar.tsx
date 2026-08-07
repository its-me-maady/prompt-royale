export function BossHealthBar({
  currentHp,
  maxHp,
}: {
  currentHp: number;
  maxHp: number;
}) {
  const percentage = Math.max(0, Math.min(100, (currentHp / maxHp) * 100));

  return (
    <div className="text-right flex flex-col items-end">
      <p className="text-xs uppercase tracking-widest text-red-500 font-extrabold mb-2 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse">
        Boss Enemy
      </p>
      <div className="w-64 h-3 bg-gray-900 rounded-full overflow-hidden border border-red-900/50 relative shadow-[0_0_15px_rgba(0,0,0,0.5)]">
        <div
          className="h-full bg-gradient-to-r from-red-800 to-red-500 transition-all duration-500 ease-out shadow-[0_0_15px_rgba(220,38,38,0.8)]"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-[10px] text-gray-500 mt-1">
        {Math.round(currentHp)} / {maxHp} HP
      </p>
    </div>
  );
}
