interface PhaseIndicatorProps {
  status: "active" | "revive";
  timeLeft: number;
}

export function PhaseIndicator({ status, timeLeft }: PhaseIndicatorProps) {
  const isRevive = status === "revive";
  const isLowTime = timeLeft <= 10;

  return (
    <div className="flex justify-between items-center mb-8 bg-gray-900/40 p-4 rounded-2xl border border-gray-800/60 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div
          className={`w-3 h-3 rounded-full animate-pulse ${isRevive ? "bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]" : "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"}`}
        />
        <span
          className={`text-sm font-bold uppercase tracking-widest ${isRevive ? "text-orange-400" : "text-blue-400"}`}
        >
          {isRevive ? "Hard Mode: Revive Phase" : "Battle Phase"}
        </span>
      </div>

      <div
        className={`flex items-center gap-2 px-4 py-1.5 rounded-lg border ${
          isLowTime
            ? "bg-red-500/10 border-red-500/30 text-red-400 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.2)]"
            : "bg-gray-800/50 border-gray-700 text-gray-300"
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="text-xl font-mono font-bold">
          00:{timeLeft.toString().padStart(2, "0")}
        </span>
      </div>
    </div>
  );
}
