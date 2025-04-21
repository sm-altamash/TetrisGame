
import React, { useEffect, useRef, useState } from "react";
import TetrisBlock from "./TetrisBlock";
import TetrisScore from "./TetrisScore";
import { Button } from "@/components/ui/button";

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const TETROMINOS = [
  // I
  {
    shape: [
      [[0, -1], [0, 0], [0, 1], [0, 2]],
      [[-1, 0], [0, 0], [1, 0], [2, 0]],
    ],
    color: "linear-gradient(135deg, #33C3F0 60%, #8B5CF6 100%)",
  },
  // O
  {
    shape: [
      [[0, 0], [0, 1], [1, 0], [1, 1]],
    ],
    color: "linear-gradient(135deg, #FEF7CD 70%, #FDE1D3 100%)",
  },
  // T
  {
    shape: [
      [[0, -1], [0, 0], [0, 1], [1, 0]],
      [[-1, 0], [0, 0], [1, 0], [0, 1]],
      [[0, -1], [0, 0], [0, 1], [-1, 0]],
      [[-1, 0], [0, 0], [1, 0], [0, -1]],
    ],
    color: "linear-gradient(135deg, #D946EF 50%, #FEC6A1 100%)",
  },
  // S
  {
    shape: [
      [[0, 0], [0, 1], [1, -1], [1, 0]],
      [[-1, 0], [0, 0], [0, 1], [1, 1]],
    ],
    color: "linear-gradient(135deg, #7EE787 20%, #1EAEDB 100%)",
  },
  // Z
  {
    shape: [
      [[0, -1], [0, 0], [1, 0], [1, 1]],
      [[-1, 1], [0, 0], [0, 1], [1, 0]],
    ],
    color: "linear-gradient(135deg, #F97316 70%, #FFDEE2 100%)",
  },
  // J
  {
    shape: [
      [[0, -1], [0, 0], [0, 1], [1, -1]],
      [[-1, 0], [0, 0], [1, 0], [1, 1]],
      [[0, -1], [0, 0], [0, 1], [-1, 1]],
      [[-1, -1], [-1, 0], [0, 0], [1, 0]],
    ],
    color: "linear-gradient(135deg, #403E43 30%, #9b87f5 100%)",
  },
  // L
  {
    shape: [
      [[0, -1], [0, 0], [0, 1], [1, 1]],
      [[-1, 0], [0, 0], [1, 0], [-1, 1]],
      [[0, -1], [0, 0], [0, 1], [-1, -1]],
      [[-1, 0], [0, 0], [1, 0], [1, -1]],
    ],
    color: "linear-gradient(135deg, #E5DEFF 45%, #8A898C 100%)",
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
  const [intervalMs, setIntervalMs] = useState(550);
  const [playing, setPlaying] = useState(false);
  const [isRowClearing, setIsRowClearing] = useState(false);
  const intervalRef = useRef<number | undefined>(undefined);

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
    setIntervalMs(550);
    setPlaying(true);
  };

  // Spawn a new tetromino at the top
  const spawnTetromino = React.useCallback(() => {
    const t = next;
    const spawn: ActiveTetromino = {
      type: t,
      pos: { row: -1, col: Math.floor(BOARD_WIDTH / 2) },
      rotation: 0,
    };
    // Check game over on spawn
    if (checkCollision({ ...spawn, pos: { row: 0, col: Math.floor(BOARD_WIDTH / 2) } }, board)) {
      setGameOver(true);
      setPlaying(false);
      return;
    }
    setCurrent(spawn);
    setNext(getRandomTetromino());
  }, [next, board]);

  // Keyboard controls
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
        // Rotate (cw)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, board, playing, gameOver]);

  // Game main loop (automatic falling)
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
        // Place on board
        const withPlaced = placeTetromino(board, current);
        // Check clear lines
        const { board: afterCleared, lines: clearedLines } = clearLines(withPlaced);
        if (clearedLines > 0) {
          setIsRowClearing(true);
          setTimeout(() => setIsRowClearing(false), 350);
        }
        setBoard(afterCleared);
        if (clearedLines > 0) {
          setScore((s) => s + [0, 100, 300, 500, 800][clearedLines] || clearedLines * 100);
          setLines((l) => l + clearedLines);
          setIntervalMs((ms) => Math.max(100, ms - 20 * clearedLines)); // Speed up slightly
        }
        setCurrent(null);
      }
    }, intervalMs);

    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs, playing, current, board, gameOver]);

  // When no active piece, spawn next
  useEffect(() => {
    if (playing && !current && !gameOver) {
      spawnTetromino();
    }
  }, [current, playing, gameOver, spawnTetromino]);

  // Render combined board (static + current piece)
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
    <div className="flex flex-col items-center justify-center min-h-[600px] select-none">
      <h2 className="font-quicksand font-bold text-3xl md:text-4xl text-violet-700 mb-2 tracking-tight">
        Tetris Glow
      </h2>
      <TetrisScore score={score} lines={lines} />
      <div className="flex gap-5 mb-3">
        <div className="p-2 bg-white/80 rounded-2xl shadow-lg border-2 border-purple-200" style={{
          background: "linear-gradient(135deg, #fdfcfb 0%, #e2d1c3 100%)",
        }}>
          <div
            className={`grid grid-cols-10 gap-[2px] bg-purple-100 p-[2px] rounded-lg transition-all duration-300 shadow`}
            style={{
              width: "max-content",
              minWidth: "252px",
              boxShadow: "0 3px 36px #bf9ff3a3",
            }}
          >
            {renderBoard().map((row, rIdx) =>
              row.map((cell, cIdx) => (
                <div key={rIdx + "," + cIdx} className={
                  isRowClearing && cell.color ? "animate-row-clear" : ""
                }>
                  {cell.color ? <TetrisBlock color={cell.color} /> : <div className="w-6 h-6 md:w-7 md:h-7 rounded-md bg-white/60" />}
                </div>
              ))
            )}
          </div>
        </div>
        {/* Next piece + Controls */}
        <div className="flex flex-col items-center">
          <div className="bg-white/80 mb-3 px-2 pt-2 pb-3 rounded-2xl shadow w-24 flex flex-col items-center">
            <span className="font-quicksand text-md text-gray-500 font-semibold">
              NEXT
            </span>
            <div className="mt-2 mb-1 flex" style={{ minHeight: "48px" }}>
              {/* Show the next piece */}
              <div className="grid grid-cols-4 gap-[2px]">
                {Array.from({ length: 4 * 4 }).map((_, idx) => {
                  const row = Math.floor(idx / 4);
                  const col = idx % 4;
                  const coords = next.shape[0];
                  const match = coords.find(
                    ([r, c]) => r + 1 === row && c + 1 === col
                  );
                  return match ? (
                    <TetrisBlock key={col} color={next.color} />
                  ) : (
                    <div key={col} className="w-5 h-5 bg-gray-200 rounded" />
                  );
                })}
              </div>
            </div>
          </div>
          <div className="bg-white/70 px-2 pb-1 pt-2 rounded-xl w-full mb-2 text-center">
            <div className="font-quicksand font-semibold text-xs text-gray-600 mb-1">
              Controls
            </div>
            <div className="text-xs text-gray-500 font-quicksand">
              <div>
                <span className="font-bold">← →</span> : Move
              </div>
              <div>
                <span className="font-bold">↑ / SPACE</span> : Rotate
              </div>
              <div>
                <span className="font-bold">↓</span> : Fast drop
              </div>
              <div>
                <span className="font-bold">R</span> : Restart
              </div>
            </div>
          </div>
          {!playing && (
            <Button
              size="lg"
              className="font-quicksand mt-2 bg-gradient-to-r from-violet-500 to-fuchsia-400 shadow-lg text-white hover:scale-105 hover:from-violet-700 hover:to-fuchsia-600 transition-transform"
              onClick={resetGame}
              autoFocus
            >
              {gameOver ? "Restart" : "Start Game"}
            </Button>
          )}
        </div>
      </div>
      {gameOver && (
        <div className="mt-2 text-lg font-quicksand text-rose-600 font-bold shadow animate-pulse">
          Game Over
        </div>
      )}
      <div className="mt-3 mb-1 text-xs text-gray-400 font-quicksand opacity-80 tracking-wide">
        Made with ♥ for fun · Arrow keys + Space/Enter to play
      </div>
    </div>
  );
};

export default TetrisGame;
