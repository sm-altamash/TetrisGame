
import React from "react";

interface TetrisBlockProps {
  color: string;
}

const TetrisBlock: React.FC<TetrisBlockProps> = ({ color }) => {
  return (
    <div
      className="w-6 h-6 md:w-7 md:h-7 rounded-md shadow-tetris-block border border-white transition-all duration-100"
      style={{
        background: color,
        boxShadow: `0 2px 16px 0 ${color}44`,
      }}
    />
  );
};

export default TetrisBlock;
