'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RotateCcw, Gamepad2, Star, Zap, Heart } from 'lucide-react';

interface PacmanGameProps {
  onScoreUpdate?: (score: number) => void;
}

type Difficulty = 'easy' | 'normal' | 'hard';
type Direction = 'up' | 'down' | 'left' | 'right';

export default function PacmanGame({ onScoreUpdate }: PacmanGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [weeklyHighScore, setWeeklyHighScore] = useState(0);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'gameover'>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const gameLoopRef = useRef<number>();
  const gameDataRef = useRef<any>(null);
  const lastUpdateRef = useRef<number>(0);

  // Touch controls
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Difficulty settings
  const difficultySettings = {
    easy: { 
      ghostSpeed: 0.4, 
      pacmanSpeed: 0.6, 
      ghostCount: 2, 
      powerDuration: 8000,
      dotScore: 10,
      powerScore: 50,
      ghostScore: 200
    },
    normal: { 
      ghostSpeed: 0.5, 
      pacmanSpeed: 0.5, 
      ghostCount: 4, 
      powerDuration: 6000,
      dotScore: 10,
      powerScore: 50,
      ghostScore: 200
    },
    hard: { 
      ghostSpeed: 0.6, 
      pacmanSpeed: 0.5, 
      ghostCount: 4, 
      powerDuration: 4000,
      dotScore: 10,
      powerScore: 50,
      ghostScore: 200
    }
  };

  // Load high scores
  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    
    fetch('/api/pacman/highscore')
      .then((res) => res.json())
      .then((data) => {
        setHighScore(data.personalBest || 0);
        setWeeklyHighScore(data.weeklyBest || 0);
      })
      .catch(console.error);
  }, []);

  // Save score
  const saveScore = useCallback(async (finalScore: number) => {
    try {
      const sessionId = localStorage.getItem('frejfund-session-id');
      await fetch('/api/pacman/highscore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, score: finalScore }),
      });
      if (finalScore > highScore) {
        setHighScore(finalScore);
      }
    } catch (error) {
      console.error('Failed to save score:', error);
    }
  }, [highScore]);

  // Start new game
  const startGame = useCallback(() => {
    setGameState('playing');
    setScore(0);
    setLives(3);
    setLevel(1);
    onScoreUpdate?.(0);
  }, [onScoreUpdate]);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const settings = difficultySettings[difficulty];
    
    // Set canvas size based on screen
    const isMobileView = window.innerWidth < 640;
    const CELL_SIZE = isMobileView ? 16 : 20;
    
    // Define maze (19x21 grid)
    const maze = [
      '###################',
      '#........#........#',
      '#o##.###.#.###.##o#',
      '#.................#',
      '#.##.#.#####.#.##.#',
      '#....#...#...#....#',
      '###.####.#.####.###',
      '  #.#...G.G...#.#  ',
      '###.#.## - ##.#.###',
      '#.....#G G G#.....#',
      '###.#.#######.#.###',
      '  #.#.........#.#  ',
      '###.#.#######.#.###',
      '#........#........#',
      '#.##.###.#.###.##.#',
      '#o.#.....P.....#.o#',
      '##.#.#.#####.#.#.##',
      '#....#...#...#....#',
      '#.#######.#######.#',
      '#.................#',
      '###################'
    ];

    const ROWS = maze.length;
    const COLS = maze[0].length;
    
    canvas.width = COLS * CELL_SIZE;
    canvas.height = ROWS * CELL_SIZE;

    // Parse maze and create game objects
    const walls: {x: number, y: number}[] = [];
    const dots: {x: number, y: number}[] = [];
    const powerPellets: {x: number, y: number}[] = [];
    const ghostHome: {x: number, y: number}[] = [];
    let pacmanStart = { x: 9, y: 15 };

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const cell = maze[y][x];
        switch (cell) {
          case '#':
            walls.push({ x, y });
            break;
          case '.':
            dots.push({ x, y });
            break;
          case 'o':
            powerPellets.push({ x, y });
            break;
          case 'G':
            ghostHome.push({ x, y });
            break;
          case 'P':
            pacmanStart = { x, y };
            dots.push({ x, y });
            break;
        }
      }
    }

    // Initialize game data
    gameDataRef.current = {
      pacman: {
        x: pacmanStart.x,
        y: pacmanStart.y,
        direction: 'right' as Direction,
        nextDirection: 'right' as Direction,
        animFrame: 0,
        moveTimer: 0
      },
      ghosts: settings.ghostCount > 0 ? [
        { 
          x: ghostHome[0]?.x || 8, 
          y: ghostHome[0]?.y || 7, 
          color: '#ff0000', 
          name: 'blinky',
          mode: 'scatter',
          direction: 'up' as Direction,
          moveTimer: 0,
          scared: false,
          scaredTimer: 0
        },
        { 
          x: ghostHome[1]?.x || 10, 
          y: ghostHome[1]?.y || 7, 
          color: '#00ffff', 
          name: 'inky',
          mode: 'scatter',
          direction: 'down' as Direction,
          moveTimer: 0,
          scared: false,
          scaredTimer: 0
        },
        { 
          x: ghostHome[2]?.x || 8, 
          y: ghostHome[2]?.y || 9, 
          color: '#ffb8ff', 
          name: 'pinky',
          mode: 'scatter',
          direction: 'up' as Direction,
          moveTimer: 0,
          scared: false,
          scaredTimer: 0
        },
        { 
          x: ghostHome[3]?.x || 10, 
          y: ghostHome[3]?.y || 9, 
          color: '#ffb852', 
          name: 'clyde',
          mode: 'scatter',
          direction: 'down' as Direction,
          moveTimer: 0,
          scared: false,
          scaredTimer: 0
        }
      ].slice(0, settings.ghostCount) : [],
      dots: [...dots],
      powerPellets: [...powerPellets],
      walls,
      score: 0,
      lives: lives,
      level: level,
      gameTime: 0
    };

    // Helper functions
    const isWall = (x: number, y: number) => {
      return walls.some(wall => wall.x === Math.floor(x) && wall.y === Math.floor(y));
    };

    const getOppositeDirection = (dir: Direction): Direction => {
      const opposites = { up: 'down', down: 'up', left: 'right', right: 'left' };
      return opposites[dir] as Direction;
    };

    const getDirectionVector = (dir: Direction) => {
      const vectors = {
        up: { x: 0, y: -1 },
        down: { x: 0, y: 1 },
        left: { x: -1, y: 0 },
        right: { x: 1, y: 0 }
      };
      return vectors[dir];
    };

    const canMove = (x: number, y: number, dir: Direction) => {
      const vec = getDirectionVector(dir);
      const newX = x + vec.x;
      const newY = y + vec.y;
      
      // Handle tunnel
      if (newX < 0 || newX >= COLS) return true;
      
      return !isWall(newX, newY);
    };

    // Ghost AI
    const getGhostTarget = (ghost: any, pacman: any) => {
      if (ghost.scared) {
        // Run away from Pacman
        return {
          x: ghost.x < pacman.x ? 0 : COLS - 1,
          y: ghost.y < pacman.y ? 0 : ROWS - 1
        };
      }

      switch (ghost.name) {
        case 'blinky': // Red - Direct chase
          return { x: pacman.x, y: pacman.y };
          
        case 'pinky': // Pink - Ambush 4 tiles ahead
          const pinkVec = getDirectionVector(pacman.direction);
          return {
            x: pacman.x + pinkVec.x * 4,
            y: pacman.y + pinkVec.y * 4
          };
          
        case 'inky': // Cyan - Complex targeting
          const blinky = gameDataRef.current.ghosts.find((g: any) => g.name === 'blinky');
          if (blinky) {
            const pacVec = getDirectionVector(pacman.direction);
            const pivot = {
              x: pacman.x + pacVec.x * 2,
              y: pacman.y + pacVec.y * 2
            };
            return {
              x: pivot.x + (pivot.x - blinky.x),
              y: pivot.y + (pivot.y - blinky.y)
            };
          }
          return { x: pacman.x, y: pacman.y };
          
        case 'clyde': // Orange - Shy behavior
          const dist = Math.sqrt(Math.pow(pacman.x - ghost.x, 2) + Math.pow(pacman.y - ghost.y, 2));
          if (dist > 8) {
            return { x: pacman.x, y: pacman.y };
          } else {
            return { x: 0, y: ROWS - 1 }; // Bottom left corner
          }
          
        default:
          return { x: pacman.x, y: pacman.y };
      }
    };

    const chooseGhostDirection = (ghost: any, target: { x: number, y: number }) => {
      const possibleDirs: Direction[] = ['up', 'down', 'left', 'right'];
      const opposite = getOppositeDirection(ghost.direction);
      
      // Can't reverse direction unless at intersection
      const validDirs = possibleDirs.filter(dir => {
        if (dir === opposite) return false;
        return canMove(ghost.x, ghost.y, dir);
      });

      if (validDirs.length === 0) {
        // Dead end, must reverse
        return opposite;
      }

      // Choose direction that gets closest to target
      let bestDir = validDirs[0];
      let bestDist = Infinity;

      validDirs.forEach(dir => {
        const vec = getDirectionVector(dir);
        const newX = ghost.x + vec.x;
        const newY = ghost.y + vec.y;
        const dist = Math.sqrt(Math.pow(target.x - newX, 2) + Math.pow(target.y - newY, 2));
        
        if (dist < bestDist) {
          bestDist = dist;
          bestDir = dir;
        }
      });

      return bestDir;
    };

    // Game update logic
    const update = (deltaTime: number) => {
      const data = gameDataRef.current;
      if (!data) return;

      data.gameTime += deltaTime;
      
      // Update Pacman
      const pacman = data.pacman;
      pacman.animFrame += deltaTime * 0.01;
      pacman.moveTimer += deltaTime * settings.pacmanSpeed;

      if (pacman.moveTimer >= 100) {
        pacman.moveTimer = 0;

        // Try to change direction
        if (canMove(pacman.x, pacman.y, pacman.nextDirection)) {
          pacman.direction = pacman.nextDirection;
        }

        // Move in current direction
        if (canMove(pacman.x, pacman.y, pacman.direction)) {
          const vec = getDirectionVector(pacman.direction);
          pacman.x += vec.x;
          pacman.y += vec.y;

          // Handle tunnel
          if (pacman.x < 0) pacman.x = COLS - 1;
          if (pacman.x >= COLS) pacman.x = 0;
        }

        // Collect dots
        const dotIndex = data.dots.findIndex((d: any) => d.x === pacman.x && d.y === pacman.y);
        if (dotIndex >= 0) {
          data.dots.splice(dotIndex, 1);
          data.score += settings.dotScore;
          setScore(data.score);
          onScoreUpdate?.(data.score);
        }

        // Collect power pellets
        const powerIndex = data.powerPellets.findIndex((p: any) => p.x === pacman.x && p.y === pacman.y);
        if (powerIndex >= 0) {
          data.powerPellets.splice(powerIndex, 1);
          data.score += settings.powerScore;
          setScore(data.score);
          onScoreUpdate?.(data.score);
          
          // Make ghosts scared
          data.ghosts.forEach((ghost: any) => {
            ghost.scared = true;
            ghost.scaredTimer = settings.powerDuration;
          });
        }
      }

      // Update ghosts
      data.ghosts.forEach((ghost: any) => {
        ghost.moveTimer += deltaTime * settings.ghostSpeed;

        // Update scared timer
        if (ghost.scared) {
          ghost.scaredTimer -= deltaTime;
          if (ghost.scaredTimer <= 0) {
            ghost.scared = false;
          }
        }

        if (ghost.moveTimer >= 100) {
          ghost.moveTimer = 0;

          // Choose new direction at intersections
          const target = getGhostTarget(ghost, pacman);
          const newDir = chooseGhostDirection(ghost, target);
          ghost.direction = newDir;

          // Move
          const vec = getDirectionVector(ghost.direction);
          ghost.x += vec.x;
          ghost.y += vec.y;

          // Handle tunnel
          if (ghost.x < 0) ghost.x = COLS - 1;
          if (ghost.x >= COLS) ghost.x = 0;
        }

        // Check collision with Pacman
        if (Math.abs(ghost.x - pacman.x) < 0.5 && Math.abs(ghost.y - pacman.y) < 0.5) {
          if (ghost.scared) {
            // Eat ghost
            data.score += settings.ghostScore;
            setScore(data.score);
            onScoreUpdate?.(data.score);
            
            // Reset ghost to home
            const home = ghostHome[data.ghosts.indexOf(ghost)] || { x: 9, y: 9 };
            ghost.x = home.x;
            ghost.y = home.y;
            ghost.scared = false;
            ghost.scaredTimer = 0;
          } else {
            // Lose life
            data.lives--;
            setLives(data.lives);
            
            if (data.lives <= 0) {
              setGameState('gameover');
              saveScore(data.score);
            } else {
              // Reset positions
              pacman.x = pacmanStart.x;
              pacman.y = pacmanStart.y;
              pacman.direction = 'right';
              pacman.nextDirection = 'right';
              
              data.ghosts.forEach((g: any, i: number) => {
                const home = ghostHome[i] || { x: 9, y: 9 };
                g.x = home.x;
                g.y = home.y;
                g.scared = false;
                g.scaredTimer = 0;
              });
            }
          }
        }
      });

      // Check win condition
      if (data.dots.length === 0 && data.powerPellets.length === 0) {
        // Next level
        data.level++;
        setLevel(data.level);
        
        // Reset maze
        data.dots = [...dots];
        data.powerPellets = [...powerPellets];
        
        // Reset positions
        pacman.x = pacmanStart.x;
        pacman.y = pacmanStart.y;
        pacman.direction = 'right';
        pacman.nextDirection = 'right';
        
        data.ghosts.forEach((g: any, i: number) => {
          const home = ghostHome[i] || { x: 9, y: 9 };
          g.x = home.x;
          g.y = home.y;
          g.scared = false;
          g.scaredTimer = 0;
          // Increase ghost speed with level
          settings.ghostSpeed = Math.min(0.8, settings.ghostSpeed + 0.02);
        });
      }
    };

    // Render function
    const render = () => {
      ctx.fillStyle = '#000814';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const data = gameDataRef.current;
      if (!data) return;

      // Draw walls
      ctx.fillStyle = '#1e3a8a';
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      
      data.walls.forEach((wall: any) => {
        const x = wall.x * CELL_SIZE;
        const y = wall.y * CELL_SIZE;
        ctx.fillRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4);
        ctx.strokeRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4);
      });

      // Draw dots
      data.dots.forEach((dot: any) => {
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(
          dot.x * CELL_SIZE + CELL_SIZE / 2,
          dot.y * CELL_SIZE + CELL_SIZE / 2,
          3,
          0,
          Math.PI * 2
        );
        ctx.fill();
      });

      // Draw power pellets with animation
      const pulse = Math.sin(data.gameTime * 0.005) * 0.3 + 0.7;
      data.powerPellets.forEach((pellet: any) => {
        // Glow effect
        const gradient = ctx.createRadialGradient(
          pellet.x * CELL_SIZE + CELL_SIZE / 2,
          pellet.y * CELL_SIZE + CELL_SIZE / 2,
          0,
          pellet.x * CELL_SIZE + CELL_SIZE / 2,
          pellet.y * CELL_SIZE + CELL_SIZE / 2,
          10 * pulse
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(
          pellet.x * CELL_SIZE,
          pellet.y * CELL_SIZE,
          CELL_SIZE,
          CELL_SIZE
        );
        
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(
          pellet.x * CELL_SIZE + CELL_SIZE / 2,
          pellet.y * CELL_SIZE + CELL_SIZE / 2,
          6 * pulse,
          0,
          Math.PI * 2
        );
        ctx.fill();
      });

      // Draw Pacman
      const pacman = data.pacman;
      ctx.save();
      ctx.translate(
        pacman.x * CELL_SIZE + CELL_SIZE / 2,
        pacman.y * CELL_SIZE + CELL_SIZE / 2
      );

      // Rotate based on direction
      const rotations = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };
      ctx.rotate(rotations[pacman.direction]);

      // Draw Pacman body with animated mouth
      const mouthAngle = Math.abs(Math.sin(pacman.animFrame * 5)) * 0.4;
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(0, 0, CELL_SIZE / 2 - 2, mouthAngle, Math.PI * 2 - mouthAngle);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();

      // Eye
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(-2, -5, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Draw ghosts
      data.ghosts.forEach((ghost: any) => {
        ctx.save();
        ctx.translate(
          ghost.x * CELL_SIZE + CELL_SIZE / 2,
          ghost.y * CELL_SIZE + CELL_SIZE / 2
        );

        // Ghost body
        ctx.fillStyle = ghost.scared 
          ? (ghost.scaredTimer < 2000 && Math.floor(ghost.scaredTimer / 200) % 2 ? '#ffffff' : '#2563eb')
          : ghost.color;
        
        ctx.beginPath();
        ctx.arc(0, -4, CELL_SIZE / 2 - 2, Math.PI, 0, false);
        ctx.lineTo(CELL_SIZE / 2 - 2, CELL_SIZE / 2 - 4);
        
        // Wavy bottom
        for (let i = 3; i >= 0; i--) {
          const x = (i / 3) * (CELL_SIZE - 4) - CELL_SIZE / 2 + 2;
          const y = CELL_SIZE / 2 - 4 + Math.sin(data.gameTime * 0.01 + i) * 2;
          ctx.lineTo(x, y);
        }
        
        ctx.closePath();
        ctx.fill();

        // Eyes
        if (!ghost.scared || ghost.scaredTimer > 2000 || Math.floor(ghost.scaredTimer / 200) % 2) {
          // Eye whites
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(-5, -4, 3, 0, Math.PI * 2);
          ctx.arc(5, -4, 3, 0, Math.PI * 2);
          ctx.fill();

          // Pupils
          if (!ghost.scared) {
            ctx.fillStyle = '#000';
            const dx = pacman.x - ghost.x;
            const dy = pacman.y - ghost.y;
            const angle = Math.atan2(dy, dx);
            const pupilDist = 1.5;
            
            ctx.beginPath();
            ctx.arc(-5 + Math.cos(angle) * pupilDist, -4 + Math.sin(angle) * pupilDist, 1.5, 0, Math.PI * 2);
            ctx.arc(5 + Math.cos(angle) * pupilDist, -4 + Math.sin(angle) * pupilDist, 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        ctx.restore();
      });

      // Draw UI
      // Lives
      ctx.fillStyle = '#fde047';
      for (let i = 0; i < data.lives; i++) {
        ctx.save();
        ctx.translate(10 + i * 25, canvas.height - 15);
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0.2, Math.PI * 2 - 0.2);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // Level
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`Level ${data.level}`, canvas.width - 10, canvas.height - 5);
    };

    // Main game loop
    const gameLoop = (timestamp: number) => {
      if (gameState !== 'playing') return;

      const deltaTime = timestamp - lastUpdateRef.current;
      lastUpdateRef.current = timestamp;

      // Cap delta time to prevent large jumps
      const cappedDelta = Math.min(deltaTime, 100);

      update(cappedDelta);
      render();

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    // Input handling
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameDataRef.current) return;

      const keyMap: Record<string, Direction> = {
        'ArrowUp': 'up',
        'ArrowDown': 'down',
        'ArrowLeft': 'left',
        'ArrowRight': 'right',
        'w': 'up',
        's': 'down',
        'a': 'left',
        'd': 'right'
      };

      const direction = keyMap[e.key];
      if (direction) {
        gameDataRef.current.pacman.nextDirection = direction;
        e.preventDefault();
      }

      if (e.key === 'Escape' && gameState === 'playing') {
        setGameState('paused');
      } else if (e.key === 'Escape' && gameState === 'paused') {
        setGameState('playing');
      }
    };

    // Touch controls
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current || !gameDataRef.current) return;

      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;

      // Determine swipe direction
      if (Math.abs(dx) > Math.abs(dy)) {
        gameDataRef.current.pacman.nextDirection = dx > 0 ? 'right' : 'left';
      } else {
        gameDataRef.current.pacman.nextDirection = dy > 0 ? 'down' : 'up';
      }

      touchStartRef.current = null;
    };

    // Add event listeners
    window.addEventListener('keydown', handleKeyDown);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Start game loop
    lastUpdateRef.current = performance.now();
    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchend', handleTouchEnd);
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, difficulty, lives, level, onScoreUpdate, saveScore]);

  // Resume game when paused
  useEffect(() => {
    if (gameState === 'playing' && gameLoopRef.current === undefined) {
      lastUpdateRef.current = performance.now();
      const gameLoop = (timestamp: number) => {
        if (gameState !== 'playing') return;
        // Game loop will be restarted by the main useEffect
      };
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
  }, [gameState]);

  const resetGame = () => {
    setGameState('menu');
    setScore(0);
    setLives(3);
    setLevel(1);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-4 sm:p-6 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-6 h-6 text-yellow-400" />
            <h3 className="text-xl font-bold text-white">FREJA PAC-MAN</h3>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={resetGame}
            className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
          >
            <RotateCcw className="w-5 h-5 text-white" />
          </motion.button>
        </div>

        {/* Score Display */}
        {gameState !== 'menu' && (
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4">
            <div className="bg-gray-800/50 backdrop-blur rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">SCORE</p>
              <motion.p
                key={score}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="text-xl sm:text-2xl font-bold text-white"
              >
                {score}
              </motion.p>
            </div>
            
            <div className="bg-gray-800/50 backdrop-blur rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400 mb-1 flex items-center justify-center gap-1">
                <Trophy className="w-3 h-3" />
                BEST
              </p>
              <p className="text-xl sm:text-2xl font-bold text-yellow-400">{highScore}</p>
            </div>
            
            <div className="bg-gray-800/50 backdrop-blur rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400 mb-1 flex items-center justify-center gap-1">
                <Star className="w-3 h-3" />
                WEEKLY
              </p>
              <p className="text-xl sm:text-2xl font-bold text-orange-400">{weeklyHighScore}</p>
            </div>
          </div>
        )}

        {/* Game Canvas */}
        <div className="relative rounded-xl overflow-hidden bg-black">
          <canvas
            ref={canvasRef}
            className="w-full h-auto"
            style={{ 
              imageRendering: 'pixelated',
              touchAction: 'none',
              maxHeight: '60vh'
            }}
          />

          {/* Menu Overlay */}
          <AnimatePresence>
            {gameState === 'menu' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/90 flex items-center justify-center p-4"
              >
                <div className="text-center max-w-sm">
                  <motion.h2
                    initial={{ y: -20 }}
                    animate={{ y: 0 }}
                    className="text-3xl sm:text-4xl font-bold text-yellow-400 mb-6"
                  >
                    FREJA PAC-MAN
                  </motion.h2>

                  <div className="mb-6">
                    <p className="text-gray-300 mb-4">Select Difficulty</p>
                    <div className="flex gap-2 justify-center flex-wrap">
                      {(['easy', 'normal', 'hard'] as Difficulty[]).map((diff) => (
                        <button
                          key={diff}
                          onClick={() => setDifficulty(diff)}
                          className={`px-4 py-2 rounded-lg font-bold transition-all ${
                            difficulty === diff
                              ? 'bg-yellow-500 text-black scale-105'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          {diff.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={startGame}
                    className="px-8 py-3 bg-yellow-500 text-black font-bold text-lg rounded-lg hover:bg-yellow-400 transition-colors"
                  >
                    START GAME
                  </motion.button>

                  <div className="mt-6 text-sm text-gray-400">
                    <p className="mb-2">{isMobile ? 'Swipe to move' : 'Arrow keys or WASD'}</p>
                    <p>Eat all dots • Avoid ghosts • Power pellets make ghosts blue!</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pause Overlay */}
          <AnimatePresence>
            {gameState === 'paused' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 flex items-center justify-center"
              >
                <div className="text-center">
                  <h3 className="text-3xl font-bold text-white mb-4">PAUSED</h3>
                  <p className="text-gray-300 mb-4">Press ESC to resume</p>
                  <button
                    onClick={() => setGameState('playing')}
                    className="px-6 py-2 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400"
                  >
                    RESUME
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Game Over Overlay */}
          <AnimatePresence>
            {gameState === 'gameover' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-0 bg-black/90 flex items-center justify-center p-4"
              >
                <div className="text-center">
                  <motion.h2
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                    className="text-3xl sm:text-4xl font-bold text-white mb-4"
                  >
                    GAME OVER!
                  </motion.h2>
                  
                  <p className="text-xl text-gray-300 mb-2">Final Score</p>
                  <p className="text-4xl sm:text-5xl font-bold text-yellow-400 mb-6">{score}</p>
                  
                  {score > highScore && (
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-green-400 font-bold mb-4 flex items-center justify-center gap-2"
                    >
                      <Zap className="w-5 h-5" />
                      NEW HIGH SCORE!
                    </motion.p>
                  )}
                  
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={startGame}
                      className="px-6 py-3 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors"
                    >
                      PLAY AGAIN
                    </button>
                    <button
                      onClick={resetGame}
                      className="px-6 py-3 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      MENU
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Controls Info */}
        <div className="mt-4 text-center text-xs text-gray-500">
          {isMobile 
            ? 'Swipe to change direction' 
            : 'Arrow keys or WASD to move • ESC to pause'
          }
        </div>
      </div>
    </div>
  );
}