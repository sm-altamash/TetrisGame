
// Modern Tetris glow landing

import React from "react";
import TetrisGame from "@/components/TetrisGame";

const Index = () => {
  return (
    <div
      className="min-h-screen flex items-center justify-center w-full"
      style={{
        background: "linear-gradient(102.3deg, #e5deff 8%, #D6BCFA 92%, #fdfcfb 100%)",
      }}
    >
      <div className="max-w-3xl w-full flex flex-col items-center">
        <TetrisGame />
      </div>
    </div>
  );
};

export default Index;
