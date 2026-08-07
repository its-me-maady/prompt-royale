interface VotingOptionsProps {
  options: string[];
  myVote: number | null;
  onVote: (index: number) => void;
  disabled: boolean;
}

export function VotingOptions({
  options,
  myVote,
  onVote,
  disabled,
}: VotingOptionsProps) {
  return (
    <div className="space-y-4 w-full max-w-2xl mx-auto">
      {options.map((opt, i) => {
        const isSelected = myVote === i;
        const isOtherSelected = myVote !== null && myVote !== i;

        return (
          <button
            key={i}
            onClick={() => onVote(i)}
            disabled={disabled || myVote !== null}
            className={`w-full text-left px-6 py-4 rounded-xl border transition-all duration-300 text-lg group flex items-center gap-4
              ${
                isSelected
                  ? "bg-blue-900/40 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.4)] scale-[1.02]"
                  : isOtherSelected
                    ? "bg-gray-900/30 border-gray-800 opacity-40 scale-95"
                    : "border-gray-800 bg-gray-900/60 backdrop-blur-md hover:border-blue-400/60 hover:bg-gray-800/80 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)] hover:scale-[1.01]"
              }
            `}
          >
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-bold transition-colors
              ${
                isSelected
                  ? "border-blue-400 text-blue-400 bg-blue-900/50"
                  : "border-gray-600 text-gray-500 group-hover:border-blue-400/60 group-hover:text-blue-300"
              }
            `}
            >
              {String.fromCharCode(65 + i)}
            </div>
            <span
              className={`flex-1 transition-colors ${isSelected ? "text-blue-50 font-medium" : "text-gray-300 group-hover:text-gray-100"}`}
            >
              {opt}
            </span>
          </button>
        );
      })}
    </div>
  );
}
