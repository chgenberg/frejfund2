'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Trophy, RotateCcw } from 'lucide-react';

interface PacmanGameProps {
  onScoreUpdate?: (score: number) => void;
}

export default function PacmanGame({ onScoreUpdate }: PacmanGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [weeklyHighScore, setWeeklyHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const gameStateRef = useRef<any>(null);

  useEffect(() => {
    // Load high scores
    const loadScores = async () => {
      try {
        const res = await fetch('/api/pacman/highscore');
        if (res.ok) {
          const data = await res.json();
          setHighScore(data.personalBest || 0);
          setWeeklyHighScore(data.weeklyBest || 0);
        }
      } catch {}
    };
    loadScores();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Game constants
    const TILE_SIZE = 20;
    const COLS = Math.floor(canvas.width / TILE_SIZE);
    const ROWS = Math.floor(canvas.height / TILE_SIZE);

    // Game state
    const gameState = {
      pacman: { x: 1, y: 1, direction: 'right', mouthOpen: true },
      dots: [] as { x: number; y: number }[],
      walls: [] as { x: number; y: number }[],
      ghost: { x: COLS - 2, y: ROWS - 2, direction: 'left' },
      score: 0,
      running: true,
    };
    gameStateRef.current = gameState;

    // Generate simple maze
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        // Walls around edges
        if (x === 0 || x === COLS - 1 || y === 0 || y === ROWS - 1) {
          gameState.walls.push({ x, y });
        }
        // Random internal walls
        else if (Math.random() < 0.1) {
          gameState.walls.push({ x, y });
        }
        // Dots everywhere else
        else {
          gameState.dots.push({ x, y });
        }
      }
    }

    // Controls
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameState.running) return;
      const key = e.key.toLowerCase();
      if (key === 'arrowup' || key === 'w') gameState.pacman.direction = 'up';
      if (key === 'arrowdown' || key === 's') gameState.pacman.direction = 'down';
      if (key === 'arrowleft' || key === 'a') gameState.pacman.direction = 'left';
      if (key === 'arrowright' || key === 'd') gameState.pacman.direction = 'right';
      e.preventDefault();
    };
    window.addEventListener('keydown', handleKeyDown);

    // Game loop
    let lastTime = Date.now();
    let accumulator = 0;
    const MOVE_INTERVAL = 150;

    const gameLoop = () => {
      if (!gameState.running) return;

      const now = Date.now();
      const delta = now - lastTime;
      lastTime = now;
      accumulator += delta;

      if (accumulator >= MOVE_INTERVAL) {
        accumulator -= MOVE_INTERVAL;
        updateGame(gameState);
      }

      render(ctx, gameState);
      requestAnimationFrame(gameLoop);
    };

    const updateGame = (state: any) => {
      // Move Pac-Man
      const { pacman, walls } = state;
      let newX = pacman.x;
      let newY = pacman.y;

      if (pacman.direction === 'up') newY--;
      if (pacman.direction === 'down') newY++;
      if (pacman.direction === 'left') newX--;
      if (pacman.direction === 'right') newX++;

      // Check collision with walls
      const hitWall = walls.some((w: any) => w.x === newX && w.y === newY);
      if (!hitWall && newX >= 0 && newX < COLS && newY >= 0 && newY < ROWS) {
        pacman.x = newX;
        pacman.y = newY;
        pacman.mouthOpen = !pacman.mouthOpen;
      }

      // Collect dots
      const dotIndex = state.dots.findIndex((d: any) => d.x === pacman.x && d.y === pacman.y);
      if (dotIndex >= 0) {
        state.dots.splice(dotIndex, 1);
        state.score += 10;
        setScore(state.score);
        onScoreUpdate?.(state.score);
      }

      // Simple ghost AI (chase Pac-Man)
      const { ghost } = state;
      const dx = pacman.x - ghost.x;
      const dy = pacman.y - ghost.y;
      
      let ghostNewX = ghost.x;
      let ghostNewY = ghost.y;

      if (Math.abs(dx) > Math.abs(dy)) {
        ghostNewX += dx > 0 ? 1 : -1;
      } else {
        ghostNewY += dy > 0 ? 1 : -1;
      }

      const ghostHitWall = walls.some((w: any) => w.x === ghostNewX && w.y === ghostNewY);
      if (!ghostHitWall) {
        ghost.x = ghostNewX;
        ghost.y = ghostNewY;
      }

      // Check collision with ghost
      if (pacman.x === ghost.x && pacman.y === ghost.y) {
        state.running = false;
        setGameOver(true);
        saveScore(state.score);
      }

      // Win condition
      if (state.dots.length === 0) {
        state.running = false;
        setGameOver(true);
        saveScore(state.score + 500); // Bonus for winning
      }
    };

    const render = (ctx: CanvasRenderingContext2D, state: any) => {
      // Clear
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Walls
      ctx.fillStyle = '#4a5568';
      state.walls.forEach((w: any) => {
        ctx.fillRect(w.x * TILE_SIZE, w.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      });

      // Dots
      ctx.fillStyle = '#fbbf24';
      state.dots.forEach((d: any) => {
        ctx.beginPath();
        ctx.arc(
          d.x * TILE_SIZE + TILE_SIZE / 2,
          d.y * TILE_SIZE + TILE_SIZE / 2,
          3,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      });

      // Pac-Man
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      const px = state.pacman.x * TILE_SIZE + TILE_SIZE / 2;
      const py = state.pacman.y * TILE_SIZE + TILE_SIZE / 2;
      
      if (state.pacman.mouthOpen) {
        const angle = { up: 1.5, down: 0.5, left: 1, right: 0 }[state.pacman.direction] || 0;
        ctx.arc(px, py, TILE_SIZE / 2 - 2, angle * Math.PI + 0.2, angle * Math.PI + 1.8 * Math.PI);
        ctx.lineTo(px, py);
      } else {
        ctx.arc(px, py, TILE_SIZE / 2 - 2, 0, Math.PI * 2);
      }
      ctx.fill();

      // Ghost
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(
        state.ghost.x * TILE_SIZE + TILE_SIZE / 2,
        state.ghost.y * TILE_SIZE + TILE_SIZE / 2,
        TILE_SIZE / 2 - 2,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      
      // Ghost eyes
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(state.ghost.x * TILE_SIZE + 7, state.ghost.y * TILE_SIZE + 8, 2, 0, Math.PI * 2);
      ctx.arc(state.ghost.x * TILE_SIZE + 13, state.ghost.y * TILE_SIZE + 8, 2, 0, Math.PI * 2);
      ctx.fill();
    };

    gameLoop();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (gameStateRef.current) gameStateRef.current.running = false;
    };
  }, [gameOver]);

  const saveScore = async (finalScore: number) => {
    try {
      const sessionId = localStorage.getItem('frejfund-session-id');
      await fetch('/api/pacman/highscore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, score: finalScore }),
      });
      if (finalScore > highScore) setHighScore(finalScore);
    } catch {}
  };

  const resetGame = () => {
    setScore(0);
    setGameOver(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-black mb-1">Play While You Wait</h3>
          <p className="text-xs text-gray-600">Use arrow keys or WASD to move</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={resetGame}
          className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </motion.button>
      </div>

      <div className="flex gap-4 text-sm mb-3">
        <div className="flex items-center gap-2">
          <span className="text-gray-600">Score:</span>
          <span className="font-bold text-black">{score}</span>
        </div>
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-600" />
          <span className="text-gray-600">Personal:</span>
          <span className="font-bold text-black">{highScore}</span>
        </div>
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-orange-600" />
          <span className="text-gray-600">Weekly:</span>
          <span className="font-bold text-black">{weeklyHighScore}</span>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={600}
        height={400}
        className="w-full border border-gray-300 rounded-lg"
      />

      {gameOver && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-4 p-4 bg-gray-100 rounded-xl text-center"
        >
          <p className="font-bold text-black mb-2">Game Over!</p>
          <p className="text-sm text-gray-600 mb-3">Final Score: {score}</p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={resetGame}
            className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Play Again
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}

