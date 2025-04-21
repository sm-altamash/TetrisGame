
import React from "react";
import { Trophy } from "lucide-react";

interface TetrisScoreProps {
  score: number;
  lines: number;
  highScore?: number;
  justBrokeHighScore?: boolean;
}

const TetrisScore: React.FC<TetrisScoreProps> = ({
  score,
  lines,
  highScore,
  justBrokeHighScore = false,
}) => (
  <div className="flex flex-col items-center justify-center font-quicksand mb-2 w-full relative">
    <div className={`flex items-center gap-2 px-4 py-2 bg-[rgba(255,255,255,0.9)] rounded-xl shadow mt-1 mb-1 text-base md:text-lg font-semibold text-purple-700 tracking-wide
      ${justBrokeHighScore ? "animate-pulse border-2 border-yellow-400" : ""}
    `}>
      Score: <span className="font-bold">{score}</span>
    </div>
    <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-[#F8F9DE] to-[#A0F4EC] rounded shadow text-xs md:text-base font-medium text-cyan-600 tracking-wide mt-1">
      Lines: <span className="font-semibold">{lines}</span>
    </div>
    {typeof highScore === "number" && (
      <div
        className={`flex items-center gap-2 bg-gradient-to-r from-[#ffc3a0] via-[#ffafbd] to-[#ffe29f] shadow-md rounded-lg px-4 py-1 min-w-[120px] justify-center mt-2 border border-white
        ${justBrokeHighScore ? "animate-bounce scale-110" : ""}
        `}
      >
        <Trophy size={18} className="text-yellow-500 drop-shadow" />
        <span className="font-semibold text-yellow-700 text-xs md:text-base">
          High: <span className="font-bold">{highScore}</span>
        </span>
      </div>
    )}
  </div>
);

export default TetrisScore;

