
import React from "react";

interface TetrisScoreProps {
  score: number;
  lines: number;
}

const TetrisScore: React.FC<TetrisScoreProps> = ({ score, lines }) => (
  <div className="flex flex-col items-center justify-center font-quicksand mb-2">
    <div className="px-4 py-2 bg-white/80 rounded shadow mt-1 mb-1 text-base md:text-lg font-semibold text-purple-700 tracking-wide">
      Score: <span className="font-bold">{score}</span>
    </div>
    <div className="px-4 py-1 bg-white/70 rounded shadow text-xs md:text-base font-medium text-violet-500 tracking-wide">
      Lines: <span className="font-bold">{lines}</span>
    </div>
  </div>
);

export default TetrisScore;
