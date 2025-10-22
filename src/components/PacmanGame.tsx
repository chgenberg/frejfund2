'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Trophy, RotateCcw, Gamepad2, Star } from 'lucide-react';

interface PacmanGameProps {
  onScoreUpdate?: (score: number) => void;
}

export default function PacmanGame({ onScoreUpdate }: PacmanGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [weeklyHighScore, setWeeklyHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [lives, setLives] = useState(3);
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
      pacman: { x: 1, y: 1, direction: 'right', mouthOpen: true, animationFrame: 0 },
      dots: [] as { x: number; y: number; type: 'normal' | 'power' }[],
      walls: [] as { x: number; y: number }[],
      ghosts: [
        { x: COLS - 2, y: ROWS - 2, direction: 'left', color: '#ff0000', scared: false },
        { x: COLS - 2, y: 1, direction: 'down', color: '#00ffff', scared: false },
        { x: 1, y: ROWS - 2, direction: 'right', color: '#ffb8ff', scared: false },
        { x: Math.floor(COLS / 2), y: Math.floor(ROWS / 2), direction: 'up', color: '#ffb852', scared: false },
      ],
      score: 0,
      running: true,
      powerMode: false,
      powerModeTimer: 0,
      level: 1,
    };
    gameStateRef.current = gameState;

    // Generate better maze with corridors
    const maze = [
      '########################',
      '#......#........#......#',
      '#.####.#.######.#.####.#',
      '#o#  #.#.#    #.#.#  #o#',
      '#.####.#.######.#.####.#',
      '#......................#',
      '#.####.##.####.##.####.#',
      '#......##......##......#',
      '######.##########.######',
      '     #.##      ##.#     ',
      '######.##  ##  ##.######',
      '#......##  ##  ##......#',
      '#.####.##########.####.#',
      '#.....o..........o.....#',
      '#.####################.#',
      '#......................#',
      '########################',
    ];

    // Parse maze
    const rowScale = Math.floor(ROWS / maze.length);
    const colScale = Math.floor(COLS / maze[0].length);
    
    for (let y = 0; y < maze.length; y++) {
      for (let x = 0; x < maze[y].length; x++) {
        const scaledX = Math.floor(x * colScale);
        const scaledY = Math.floor(y * rowScale);
        
        if (maze[y][x] === '#') {
          gameState.walls.push({ x: scaledX, y: scaledY });
        } else if (maze[y][x] === '.') {
          gameState.dots.push({ x: scaledX, y: scaledY, type: 'normal' });
        } else if (maze[y][x] === 'o') {
          gameState.dots.push({ x: scaledX, y: scaledY, type: 'power' });
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
        const dot = state.dots[dotIndex];
        state.dots.splice(dotIndex, 1);
        
        if (dot.type === 'power') {
          state.score += 50;
          state.powerMode = true;
          state.powerModeTimer = 80; // ~8 seconds
          state.ghosts.forEach((g: any) => g.scared = true);
        } else {
          state.score += 10;
        }
        
        setScore(state.score);
        onScoreUpdate?.(state.score);
      }

      // Update power mode
      if (state.powerMode) {
        state.powerModeTimer--;
        if (state.powerModeTimer <= 0) {
          state.powerMode = false;
          state.ghosts.forEach((g: any) => g.scared = false);
        }
      }

      // Update ghosts
      state.ghosts.forEach((ghost: any, index: number) => {
        const dx = pacman.x - ghost.x;
        const dy = pacman.y - ghost.y;
        
        let ghostNewX = ghost.x;
        let ghostNewY = ghost.y;

        // Different AI for different ghosts
        if (ghost.scared) {
          // Run away from Pac-Man
          ghostNewX += dx > 0 ? -1 : 1;
          ghostNewY += dy > 0 ? -1 : 1;
        } else if (index === 0) {
          // Red ghost: Direct chase
          if (Math.abs(dx) > Math.abs(dy)) {
            ghostNewX += dx > 0 ? 1 : -1;
          } else {
            ghostNewY += dy > 0 ? 1 : -1;
          }
        } else if (index === 1) {
          // Cyan ghost: Try to cut off
          ghostNewX += dx > 0 ? 1 : -1;
          ghostNewY += dy > 0 ? 1 : -1;
        } else if (index === 2) {
          // Pink ghost: Ambush (4 tiles ahead)
          const ahead = { up: { x: 0, y: -4 }, down: { x: 0, y: 4 }, left: { x: -4, y: 0 }, right: { x: 4, y: 0 } }[pacman.direction] || { x: 0, y: 0 };
          const targetX = pacman.x + ahead.x;
          const targetY = pacman.y + ahead.y;
          const dx2 = targetX - ghost.x;
          const dy2 = targetY - ghost.y;
          if (Math.abs(dx2) > Math.abs(dy2)) {
            ghostNewX += dx2 > 0 ? 1 : -1;
          } else {
            ghostNewY += dy2 > 0 ? 1 : -1;
          }
        } else {
          // Orange ghost: Random patrol
          if (Math.random() < 0.3) {
            const dirs = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
            const dir = dirs[Math.floor(Math.random() * dirs.length)];
            ghostNewX += dir.x;
            ghostNewY += dir.y;
          } else {
            if (Math.abs(dx) > Math.abs(dy)) {
              ghostNewX += dx > 0 ? 1 : -1;
            } else {
              ghostNewY += dy > 0 ? 1 : -1;
            }
          }
        }

        const ghostHitWall = walls.some((w: any) => w.x === ghostNewX && w.y === ghostNewY);
        if (!ghostHitWall && ghostNewX >= 0 && ghostNewX < COLS && ghostNewY >= 0 && ghostNewY < ROWS) {
          ghost.x = ghostNewX;
          ghost.y = ghostNewY;
        }

        // Check collision with ghost
        if (pacman.x === ghost.x && pacman.y === ghost.y) {
          if (ghost.scared) {
            state.score += 200;
            setScore(state.score);
            // Respawn ghost
            ghost.x = COLS - 2;
            ghost.y = ROWS - 2;
            ghost.scared = false;
          } else {
            state.running = false;
            setGameOver(true);
            saveScore(state.score);
          }
        }
      });

      // Win condition
      if (state.dots.length === 0) {
        state.running = false;
        setGameOver(true);
        saveScore(state.score + 500); // Bonus for winning
      }
    };

    const render = (ctx: CanvasRenderingContext2D, state: any) => {
      // Clear with dark background
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add subtle grid lines
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < COLS; x++) {
        ctx.beginPath();
        ctx.moveTo(x * TILE_SIZE, 0);
        ctx.lineTo(x * TILE_SIZE, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < ROWS; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * TILE_SIZE);
        ctx.lineTo(canvas.width, y * TILE_SIZE);
        ctx.stroke();
      }

      // Walls with gradient
      const wallGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      wallGradient.addColorStop(0, '#2563eb');
      wallGradient.addColorStop(1, '#1e40af');
      
      state.walls.forEach((w: any) => {
        ctx.fillStyle = wallGradient;
        ctx.fillRect(w.x * TILE_SIZE + 1, w.y * TILE_SIZE + 1, TILE_SIZE - 2, TILE_SIZE - 2);
        
        // Add subtle highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(w.x * TILE_SIZE + 1, w.y * TILE_SIZE + 1, TILE_SIZE - 2, 2);
      });

      // Dots with glow effect
      state.dots.forEach((d: any) => {
        const cx = d.x * TILE_SIZE + TILE_SIZE / 2;
        const cy = d.y * TILE_SIZE + TILE_SIZE / 2;
        
        if (d.type === 'power') {
          // Power pellet with pulsing glow
          const glowSize = 8 + Math.sin(Date.now() * 0.005) * 2;
          const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowSize);
          glow.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
          glow.addColorStop(0.5, 'rgba(255, 215, 0, 0.3)');
          glow.addColorStop(1, 'rgba(255, 215, 0, 0)');
          ctx.fillStyle = glow;
          ctx.fillRect(cx - glowSize, cy - glowSize, glowSize * 2, glowSize * 2);
          
          ctx.fillStyle = '#ffd700';
          ctx.beginPath();
          ctx.arc(cx, cy, 5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Normal dot with subtle glow
          ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.beginPath();
          ctx.arc(cx, cy, 5, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(cx, cy, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Pac-Man with smooth animation
      const px = state.pacman.x * TILE_SIZE + TILE_SIZE / 2;
      const py = state.pacman.y * TILE_SIZE + TILE_SIZE / 2;
      
      // Glow effect
      const pacGlow = ctx.createRadialGradient(px, py, 0, px, py, TILE_SIZE / 2);
      pacGlow.addColorStop(0, 'rgba(255, 235, 59, 0.3)');
      pacGlow.addColorStop(1, 'rgba(255, 235, 59, 0)');
      ctx.fillStyle = pacGlow;
      ctx.fillRect(px - TILE_SIZE, py - TILE_SIZE, TILE_SIZE * 2, TILE_SIZE * 2);
      
      // Pac-Man body
      ctx.fillStyle = '#ffeb3b';
      ctx.beginPath();
      
      if (state.pacman.mouthOpen) {
        const angle = { up: 1.5, down: 0.5, left: 1, right: 0 }[state.pacman.direction] || 0;
        const mouthAngle = 0.25; // Wider mouth
        ctx.arc(px, py, TILE_SIZE / 2 - 2, (angle + mouthAngle) * Math.PI, (angle + 2 - mouthAngle) * Math.PI);
        ctx.lineTo(px, py);
      } else {
        ctx.arc(px, py, TILE_SIZE / 2 - 2, 0, Math.PI * 2);
      }
      ctx.fill();
      
      // Add eye
      ctx.fillStyle = '#000';
      const eyeOffset = { up: { x: 3, y: -3 }, down: { x: 3, y: 3 }, left: { x: -3, y: -3 }, right: { x: 3, y: -3 } }[state.pacman.direction] || { x: 3, y: -3 };
      ctx.beginPath();
      ctx.arc(px + eyeOffset.x, py + eyeOffset.y, 2, 0, Math.PI * 2);
      ctx.fill();

      // Ghosts with better graphics
      state.ghosts.forEach((ghost: any) => {
        const gx = ghost.x * TILE_SIZE + TILE_SIZE / 2;
        const gy = ghost.y * TILE_SIZE + TILE_SIZE / 2;
        
        // Ghost body
        ctx.fillStyle = ghost.scared ? '#1e40af' : ghost.color;
        ctx.beginPath();
        ctx.arc(gx, gy - 2, TILE_SIZE / 2 - 2, Math.PI, 0, false);
        ctx.lineTo(gx + TILE_SIZE / 2 - 2, gy + TILE_SIZE / 2 - 4);
        
        // Wavy bottom
        for (let i = 3; i >= 0; i--) {
          const wave = Math.sin((Date.now() * 0.01 + i) * 0.5) * 2;
          ctx.lineTo(gx + (i - 2) * 3, gy + TILE_SIZE / 2 - 4 + wave);
        }
        
        ctx.closePath();
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(gx - 4, gy - 2, 3, 0, Math.PI * 2);
        ctx.arc(gx + 4, gy - 2, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Pupils
        ctx.fillStyle = ghost.scared ? '#fff' : '#000';
        const dx = state.pacman.x - ghost.x;
        const dy = state.pacman.y - ghost.y;
        const angle = Math.atan2(dy, dx);
        const pupilOffset = 1.5;
        
        ctx.beginPath();
        ctx.arc(gx - 4 + Math.cos(angle) * pupilOffset, gy - 2 + Math.sin(angle) * pupilOffset, 1.5, 0, Math.PI * 2);
        ctx.arc(gx + 4 + Math.cos(angle) * pupilOffset, gy - 2 + Math.sin(angle) * pupilOffset, 1.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Power mode indicator
      if (state.powerMode) {
        ctx.fillStyle = `rgba(30, 64, 175, ${0.1 + Math.sin(Date.now() * 0.01) * 0.05})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
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
    <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl border border-gray-800 shadow-2xl p-6 relative overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute w-96 h-96 bg-blue-500 rounded-full blur-3xl -top-48 -left-48 animate-pulse" />
        <div className="absolute w-96 h-96 bg-yellow-500 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse delay-1000" />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Gamepad2 className="w-6 h-6 text-yellow-400" />
              <h3 className="text-xl font-bold text-white">FREJA PAC-MAN</h3>
            </div>
            <p className="text-xs text-gray-400">Use arrow keys or WASD • Eat dots • Avoid ghosts!</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05, rotate: -180 }}
            whileTap={{ scale: 0.95 }}
            onClick={resetGame}
            className="p-3 bg-gray-800 rounded-xl hover:bg-gray-700 transition-all group"
          >
            <RotateCcw className="w-5 h-5 text-white group-hover:text-yellow-400" />
          </motion.button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <motion.div 
            className="bg-gray-800/50 backdrop-blur rounded-xl p-3 text-center"
            whileHover={{ scale: 1.02 }}
          >
            <p className="text-xs text-gray-400 mb-1">SCORE</p>
            <motion.p 
              key={score}
              initial={{ scale: 1.5, color: '#fbbf24' }}
              animate={{ scale: 1, color: '#ffffff' }}
              className="text-2xl font-bold"
            >
              {score}
            </motion.p>
          </motion.div>
          
          <motion.div 
            className="bg-gray-800/50 backdrop-blur rounded-xl p-3 text-center"
            whileHover={{ scale: 1.02 }}
          >
            <p className="text-xs text-gray-400 mb-1 flex items-center justify-center gap-1">
              <Trophy className="w-3 h-3 text-yellow-500" />
              PERSONAL BEST
            </p>
            <p className="text-2xl font-bold text-yellow-400">{highScore}</p>
          </motion.div>
          
          <motion.div 
            className="bg-gray-800/50 backdrop-blur rounded-xl p-3 text-center"
            whileHover={{ scale: 1.02 }}
          >
            <p className="text-xs text-gray-400 mb-1 flex items-center justify-center gap-1">
              <Star className="w-3 h-3 text-orange-500" />
              WEEKLY BEST
            </p>
            <p className="text-2xl font-bold text-orange-400">{weeklyHighScore}</p>
          </motion.div>
        </div>

        <div className="relative rounded-xl overflow-hidden shadow-inner">
          <canvas
            ref={canvasRef}
            width={600}
            height={300}
            className="w-full rounded-xl"
            style={{ imageRendering: 'pixelated' }}
          />
          
          {/* Lives indicator */}
          <div className="absolute top-4 right-4 flex gap-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={`w-6 h-6 rounded-full ${
                  i < lives ? 'bg-yellow-400' : 'bg-gray-700'
                } transition-colors`}
              />
            ))}
          </div>
        </div>

        {gameOver && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="mt-4 p-6 bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 to-orange-400/10 animate-pulse" />
            <div className="relative">
              <motion.h4
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}
                className="text-2xl font-bold text-white mb-2"
              >
                GAME OVER!
              </motion.h4>
              <p className="text-lg text-gray-300 mb-1">Final Score: <span className="text-yellow-400 font-bold">{score}</span></p>
              {score > highScore && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-green-400 mb-4"
                >
                  🎉 New Personal Best!
                </motion.p>
              )}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={resetGame}
                className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-black rounded-xl font-bold hover:from-yellow-300 hover:to-orange-300 transition-all shadow-lg"
              >
                PLAY AGAIN
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

