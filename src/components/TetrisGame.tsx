import React, { useEffect, useRef, useState } from "react";
import TetrisBlock from "./TetrisBlock";
import TetrisScore from "./TetrisScore";
import { Button } from "@/components/ui/button";

const BOARD_WIDTH = 8;
const BOARD_HEIGHT = 16;

const TETROMINOS = [
  // I
  {
    shape: [
      [[0, -1], [0, 0], [0, 1], [0, 2]],
      [[-1, 0], [0, 0], [1, 0], [2, 0]],
    ],
    color: "linear-gradient(90deg, #8CE99A 10%, #38A3A5 90%)",
  },
  // O
  {
    shape: [
      [[0, 0], [0, 1], [1, 0], [1, 1]],
    ],
    color: "linear-gradient(135deg, #FFD6E0 40%, #FDCB6E 90%)",
  },
  // T
  {
    shape: [
      [[0, -1], [0, 0], [0, 1], [1, 0]],
      [[-1, 0], [0, 0], [1, 0], [0, 1]],
      [[0, -1], [0, 0], [0, 1], [-1, 0]],
      [[-1, 0], [0, 0], [1, 0], [0, -1]],
    ],
    color: "linear-gradient(135deg, #B388FF 35%, #F3A7F8 100%)",
  },
  // S
  {
    shape: [
      [[0, 0], [0, 1], [1, -1], [1, 0]],
      [[-1, 0], [0, 0], [0, 1], [1, 1]],
    ],
    color: "linear-gradient(135deg, #F9FFB6 10%, #A3FFD6 90%)",
  },
  // Z
  {
    shape: [
      [[0, -1], [0, 0], [1, 0], [1, 1]],
      [[-1, 1], [0, 0], [0, 1], [1, 0]],
    ],
    color: "linear-gradient(135deg, #FFAB91 20%, #FF6F91 85%)",
  },
  // J
  {
    shape: [
      [[0, -1], [0, 0], [0, 1], [1, -1]],
      [[-1, 0], [0, 0], [1, 0], [1, 1]],
      [[0, -1], [0, 0], [0, 1], [-1, 1]],
      [[-1, -1], [-1, 0], [0, 0], [1, 0]],
    ],
    color: "linear-gradient(135deg, #99BBFF 20%, #3F8EFC 100%)",
  },
  // L
  {
    shape: [
      [[0, -1], [0, 0], [0, 1], [1, 1]],
      [[-1, 0], [0, 0], [1, 0], [-1, 1]],
      [[0, -1], [0, 0], [0, 1], [-1, -1]],
      [[-1, 0], [0, 0], [1, 0], [1, -1]],
    ],
    color: "linear-gradient(135deg, #FFC4F7 25%, #FFB6B9 85%)",
  },
];

type BoardCell = {
  color: string | null;
  cleared?: boolean;
};

type Tetromino = typeof TETROMINOS[number];

function getRandomTetromino(): Tetromino {
  return TETROMINOS[Math.floor(Math.random() * TETROMINOS.length)];
}

interface ActiveTetromino {
  type: Tetromino;
  pos: { row: number; col: number };
  rotation: number; // rotate between shapes (0...n)
}

function checkCollision(
  tetro: ActiveTetromino,
  board: BoardCell[][]
): boolean {
  const { type, pos, rotation } = tetro;
  return type.shape[rotation].some(([r, c]) => {
    const row = pos.row + r;
    const col = pos.col + c;
    return (
      row >= BOARD_HEIGHT ||
      col < 0 ||
      col >= BOARD_WIDTH ||
      (row >= 0 && board[row][col].color)
    );
  });
}

function placeTetromino(
  board: BoardCell[][],
  tetro: ActiveTetromino,
  color?: string
): BoardCell[][] {
  const clone = board.map((row) => row.slice());
  tetro.type.shape[tetro.rotation].forEach(([r, c]) => {
    const row = tetro.pos.row + r;
    const col = tetro.pos.col + c;
    if (row >= 0 && row < BOARD_HEIGHT && col >= 0 && col < BOARD_WIDTH) {
      clone[row][col] = {
        color: color ?? tetro.type.color,
      };
    }
  });
  return clone;
}

function clearLines(board: BoardCell[][]): { board: BoardCell[][]; lines: number } {
  let newBoard: BoardCell[][] = [];
  let cleared = 0;
  for (let row = 0; row < BOARD_HEIGHT; row++) {
    if (board[row].every((cell) => cell.color)) {
      cleared++;
      newBoard.unshift(
        Array.from({ length: BOARD_WIDTH }, () => ({ color: null }))
      );
    } else {
      newBoard.push(board[row]);
    }
  }
  return { board: newBoard, lines: cleared };
}

function getHighScore() {
  try {
    return parseInt(localStorage.getItem("tetris_high_score") || "0");
  } catch {
    return 0;
  }
}

function setHighScore(val: number) {
  try {
    localStorage.setItem("tetris_high_score", val.toString());
  } catch {}
}

const TetrisGame: React.FC = () => {
  const [board, setBoard] = useState<BoardCell[][]>(
    Array.from({ length: BOARD_HEIGHT }, () =>
      Array.from({ length: BOARD_WIDTH }, () => ({ color: null }))
    )
  );
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [current, setCurrent] = useState<ActiveTetromino | null>(null);
  const [next, setNext] = useState<Tetromino>(getRandomTetromino());
  const [gameOver, setGameOver] = useState(false);
  const [intervalMs, setIntervalMs] = useState(570);
  const [playing, setPlaying] = useState(false);
  const [isRowClearing, setIsRowClearing] = useState(false);
  const intervalRef = useRef<number | undefined>(undefined);
  const [highScore, setHighScoreState] = useState(() => getHighScore());
  const [justBrokeHighScore, setJustBrokeHighScore] = useState(false);

  const resetGame = () => {
    setBoard(
      Array.from({ length: BOARD_HEIGHT }, () =>
        Array.from({ length: BOARD_WIDTH }, () => ({ color: null }))
      )
    );
    setScore(0);
    setLines(0);
    setCurrent(null);
    setNext(getRandomTetromino());
    setGameOver(false);
    setIntervalMs(570);
    setPlaying(true);
    setJustBrokeHighScore(false);
  };

  useEffect(() => {
    if (score > highScore) {
      setJustBrokeHighScore(true);
      setHighScore(score);
      setHighScoreState(score);
      setTimeout(() => setJustBrokeHighScore(false), 1100);
    }
  }, [score, highScore]);

  const spawnTetromino = React.useCallback(() => {
    const t = next;
    const spawn: ActiveTetromino = {
      type: t,
      pos: { row: -1, col: Math.floor(BOARD_WIDTH / 2) },
      rotation: 0,
    };
    if (checkCollision({ ...spawn, pos: { row: 0, col: Math.floor(BOARD_WIDTH / 2) } }, board)) {
      setGameOver(true);
      setPlaying(false);
      return;
    }
    setCurrent(spawn);
    setNext(getRandomTetromino());
  }, [next, board]);

  useEffect(() => {
    if (!playing || !current || gameOver) return;
    const handle = (e: KeyboardEvent) => {
      if (gameOver) return;
      let moved = { ...current };
      let collided = false;
      if (e.key === "ArrowLeft") {
        moved = { ...current, pos: { ...current.pos, col: current.pos.col - 1 } };
        collided = checkCollision(moved, board);
        if (!collided) {
          setCurrent(moved);
        }
      } else if (e.key === "ArrowRight") {
        moved = { ...current, pos: { ...current.pos, col: current.pos.col + 1 } };
        collided = checkCollision(moved, board);
        if (!collided) {
          setCurrent(moved);
        }
      } else if (e.key === "ArrowDown") {
        moved = { ...current, pos: { ...current.pos, row: current.pos.row + 1 } };
        collided = checkCollision(moved, board);
        if (!collided) {
          setCurrent(moved);
        }
      } else if (e.key === " " || e.key === "ArrowUp") {
        moved = {
          ...current,
          rotation: (current.rotation + 1) % current.type.shape.length,
        };
        if (!checkCollision(moved, board)) {
          setCurrent(moved);
        }
      } else if (e.key.toLowerCase() === "r" && !playing) {
        resetGame();
      } else if (e.key === "Enter" && !playing) {
        resetGame();
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [current, board, playing, gameOver]);

  useEffect(() => {
    if (!playing || gameOver) {
      clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = window.setInterval(() => {
      if (!current) {
        spawnTetromino();
        return;
      }
      const moved = {
        ...current,
        pos: { ...current.pos, row: current.pos.row + 1 },
      };
      if (!checkCollision(moved, board)) {
        setCurrent(moved);
      } else {
        const withPlaced = placeTetromino(board, current);
        const { board: afterCleared, lines: clearedLines } = clearLines(withPlaced);
        if (clearedLines > 0) {
          setIsRowClearing(true);
          setTimeout(() => setIsRowClearing(false), 280);
        }
        setBoard(afterCleared);
        if (clearedLines > 0) {
          setScore((s) => s + [0, 90, 250, 420, 700][clearedLines] || clearedLines * 90);
          setLines((l) => l + clearedLines);
          setIntervalMs((ms) => Math.max(80, ms - 25 * clearedLines));
        }
        setCurrent(null);
      }
    }, intervalMs);

    return () => clearInterval(intervalRef.current);
  }, [intervalMs, playing, current, board, gameOver, spawnTetromino]);

  useEffect(() => {
    if (playing && !current && !gameOver) {
      spawnTetromino();
    }
  }, [current, playing, gameOver, spawnTetromino]);

  const renderBoard = () => {
    let render = board.map((row) => row.slice());
    if (current) {
      current.type.shape[current.rotation].forEach(([r, c]) => {
        const row = current.pos.row + r;
        const col = current.pos.col + c;
        if (
          row >= 0 &&
          row < BOARD_HEIGHT &&
          col >= 0 &&
          col < BOARD_WIDTH
        ) {
          render[row][col] = { color: current.type.color };
        }
      });
    }
    return render;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[420px] select-none animate-fade-in">
      <h2 className="font-quicksand font-black text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-[#29ABE2] via-[#B388FF] to-[#FFD6E0] drop-shadow mb-1 tracking-[-2px] animate-soft-float">
        Tetris Adore
      </h2>
      <TetrisScore
        score={score}
        lines={lines}
        highScore={highScore}
        justBrokeHighScore={justBrokeHighScore}
      />
      <div className="flex gap-7 mb-2">
        <div className="relative p-2 bg-gradient-to-br from-[#FFF8DC] via-[#FFF0F5] to-[#DCF9FF] rounded-2xl shadow-2xl border-[3px] border-[#e1bee7]">
          <div
            className={`grid grid-cols-8 gap-[2.5px] bg-gradient-to-br from-[#e9f2ff] via-[#fff3e0] to-[#f3effd] p-[2.5px] rounded-xl transition-all duration-500 shadow-xl`}
            style={{
              width: "max-content",
              minWidth: "188px",
              boxShadow: "0 4px 38px #f3acf96e",
            }}
          >
            {renderBoard().map((row, rIdx) =>
              row.map((cell, cIdx) => (
                <div key={rIdx + "," + cIdx}
                  className={
                    isRowClearing && cell.color
                      ? "animate-row-clear"
                      : ""
                  }
                >
                  {cell.color ? (
                    <TetrisBlock color={cell.color} />
                  ) : (
                    <div className="w-5 h-5 md:w-6 md:h-6 rounded bg-white/75 border border-[#b0b1e9]/40" />
                  )}
                </div>
              ))
            )}
          </div>
          {justBrokeHighScore && (
            <div className="absolute inset-0 rounded-2xl border-4 border-yellow-300/70 shadow-yellow-200/70 animate-soft-float pointer-events-none" />
          )}
        </div>
        <div className="flex flex-col items-center justify-between py-3">
          <div className="bg-white/80 mb-2 px-2 pt-2 pb-3 rounded-2xl shadow-lg w-20 flex flex-col items-center border border-[#ffe29f]">
            <span className="font-quicksand text-md text-pink-500 font-semibold tracking-tight pb-1">
              NEXT
            </span>
            <div className="mt-1 mb-1 flex" style={{ minHeight: "40px" }}>
              <div className="grid grid-cols-4 gap-[2px]">
                {Array.from({ length: 16 }).map((_, idx) => {
                  const row = Math.floor(idx / 4);
                  const col = idx % 4;
                  const coords = next.shape[0];
                  const match = coords.find(
                    ([r, c]) => r + 1 === row && c + 1 === col
                  );
                  return match ? (
                    <TetrisBlock key={col} color={next.color} />
                  ) : (
                    <div key={col} className="w-4 h-4 bg-gradient-to-br from-[#fff] to-[#f1f0fb] rounded" />
                  );
                })}
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-[#f7ffaf] via-[#ecaefb] to-[#ffe29f] px-3 pb-2 pt-2 rounded-xl w-full mb-1 text-center border border-[#b388ff]/30">
            <div className="font-quicksand font-semibold text-[13px] text-purple-700 mb-1">
              Controls
            </div>
            <div className="text-xs text-gray-600 font-quicksand space-y-1">
              <div>
                <span className="font-bold">← →</span> Move
              </div>
              <div>
                <span className="font-bold">↑/SPACE</span> Rotate
              </div>
              <div>
                <span className="font-bold">↓</span> Fast drop
              </div>
              <div>
                <span className="font-bold">R</span> Restart
              </div>
            </div>
          </div>
          {!playing && (
            <Button
              size="lg"
              className="font-quicksand mt-2 px-7 bg-gradient-to-r from-pink-400 via-purple-400 to-yellow-300 shadow-lg text-white border-none ring-2 ring-[#d8b4fe] hover:scale-105 transition-transform animate-scale-in"
              onClick={resetGame}
              autoFocus
            >
              {gameOver ? "Play Again" : "Start Game"}
            </Button>
          )}
        </div>
      </div>
      {gameOver && (
        <div className="mt-2 text-[18px] font-quicksand text-rose-700 font-bold shadow animate-pulse drop-shadow bg-white/90 rounded-lg px-6 py-2 ring-2 ring-rose-300 animate-fade-in">
          Game Over
        </div>
      )}
      <div className="mt-2 mb-1 text-xs text-gray-400 font-quicksand opacity-80 tracking-wide">
        Made with <span className="text-pink-400 animate-pulse">♥</span> by you · Just Javascript, Tailwind &amp; HTML 🎮
      </div>
    </div>
  );
};

export default TetrisGame;
