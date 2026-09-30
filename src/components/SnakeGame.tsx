import { useEffect, useRef, useCallback } from 'react';
import { useSnakeGame, Direction, Difficulty } from '../hooks/useSnakeGame';
import { useSwipe } from '../hooks/useSwipe';

export default function SnakeGame() {
  const {
    snake,
    food,
    direction,
    status,
    score,
    difficulty,
    speed,
    highScore,
    gridSize,
    startGame,
    pauseGame,
    resumeGame,
    restartGame,
    changeDirection,
    changeDifficulty,
    changeSpeed,
  } = useSnakeGame();

  const boardRef = useRef<HTMLDivElement>(null);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          if (status === 'playing') changeDirection('UP');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          if (status === 'playing') changeDirection('DOWN');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          if (status === 'playing') changeDirection('LEFT');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          if (status === 'playing') changeDirection('RIGHT');
          break;
        case ' ':
          e.preventDefault();
          if (status === 'playing') pauseGame();
          else if (status === 'paused') resumeGame();
          else if (status === 'idle' || status === 'gameover') restartGame();
          break;
        case 'Enter':
          e.preventDefault();
          if (status === 'idle' || status === 'gameover') restartGame();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, changeDirection, pauseGame, resumeGame, restartGame]);

  // Swipe controls
  useSwipe(boardRef, (dir: Direction) => {
    if (status === 'playing') {
      changeDirection(dir);
    }
  });

  const getSnakeSegmentClass = useCallback((index: number) => {
    if (index === 0) return 'snake-head';
    return 'snake-body';
  }, []);

  const renderBoard = () => {
    const cells = [];
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const snakeIndex = snake.findIndex(seg => seg.x === x && seg.y === y);
        const isFood = food.x === x && food.y === y;
        const isSnake = snakeIndex !== -1;

        let cellClass = 'game-cell';
        if (isSnake) cellClass += ` ${getSnakeSegmentClass(snakeIndex)}`;
        if (isFood) cellClass += ' food-cell';

        cells.push(
          <div
            key={`${x}-${y}`}
            className={cellClass}
            style={{
              gridColumn: x + 1,
              gridRow: y + 1,
            }}
          />
        );
      }
    }
    return cells;
  };

  const handleStartPause = () => {
    if (status === 'idle' || status === 'gameover') {
      restartGame();
    } else if (status === 'playing') {
      pauseGame();
    } else if (status === 'paused') {
      resumeGame();
    }
  };

  const difficulties: { value: Difficulty; label: string; color: string }[] = [
    { value: 'easy', label: 'Easy', color: 'from-green-400 to-green-600' },
    { value: 'medium', label: 'Medium', color: 'from-yellow-400 to-orange-500' },
    { value: 'hard', label: 'Hard', color: 'from-red-400 to-red-600' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 flex flex-col items-center justify-center p-4 select-none">
      {/* Header */}
      <div className="w-full max-w-lg mb-4">
        <h1 className="text-3xl md:text-4xl font-bold text-center bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-2">
          🐍 Snake Game
        </h1>
        <p className="text-gray-400 text-center text-sm">
          Arrow keys / WASD to move • Space to pause • Swipe on mobile
        </p>
      </div>

      {/* Score Panel */}
      <div className="w-full max-w-lg flex justify-between items-center mb-4 px-2">
        <div className="flex flex-col items-center">
          <span className="text-xs text-gray-400 uppercase tracking-wider">Score</span>
          <span className="text-2xl font-bold text-white">{score}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-xs text-gray-400 uppercase tracking-wider">High Score</span>
          <span className="text-2xl font-bold text-amber-400">{highScore}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-xs text-gray-400 uppercase tracking-wider">Length</span>
          <span className="text-2xl font-bold text-emerald-400">{snake.length}</span>
        </div>
      </div>

      {/* Game Board */}
      <div
        ref={boardRef}
        className="relative w-full max-w-lg aspect-square rounded-xl overflow-hidden border-2 border-gray-700 shadow-2xl shadow-green-900/20"
        style={{ touchAction: 'none' }}
      >
        {/* Grid background */}
        <div className="absolute inset-0 bg-gray-800/90">
          <div
            className="grid h-full w-full"
            style={{
              gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
              gridTemplateRows: `repeat(${gridSize}, 1fr)`,
              gap: '1px',
            }}
          >
            {renderBoard()}
          </div>
        </div>

        {/* Overlay for idle/gameover/paused */}
        {status !== 'playing' && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center z-10 animate-fade-in">
            {status === 'idle' && (
              <>
                <div className="text-5xl mb-4 animate-bounce">🐍</div>
                <p className="text-white text-xl font-semibold mb-2">Ready to Play?</p>
                <p className="text-gray-300 text-sm mb-6">Press Start or hit Space</p>
              </>
            )}
            {status === 'paused' && (
              <>
                <div className="text-5xl mb-4">⏸️</div>
                <p className="text-white text-xl font-semibold mb-2">Paused</p>
                <p className="text-gray-300 text-sm mb-6">Press Space to resume</p>
              </>
            )}
            {status === 'gameover' && (
              <>
                <div className="text-5xl mb-4">💀</div>
                <p className="text-white text-xl font-semibold mb-1">Game Over!</p>
                <p className="text-gray-300 text-lg mb-1">Score: <span className="text-emerald-400 font-bold">{score}</span></p>
                {score >= highScore && score > 0 && (
                  <p className="text-amber-400 text-sm font-semibold mb-2 animate-pulse">🏆 New High Score!</p>
                )}
                <p className="text-gray-400 text-sm mb-6">Press Space or Restart to play again</p>
              </>
            )}
            <button
              onClick={handleStartPause}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-green-500/30 hover:scale-105 transition-all duration-200 active:scale-95"
            >
              {status === 'idle' ? '▶ Start Game' : status === 'paused' ? '▶ Resume' : '🔄 Play Again'}
            </button>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="w-full max-w-lg mt-4 flex flex-col gap-3">
        {/* Speed Controller */}
        <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">⚡ Speed</span>
            <span className="text-xs font-mono text-emerald-400 bg-gray-700/50 px-2 py-0.5 rounded">
              {speed <= 80 ? 'Fast' : speed <= 130 ? 'Normal' : 'Slow'} ({speed}ms)
            </span>
          </div>
          <input
            type="range"
            min="40"
            max="250"
            step="10"
            value={speed}
            onChange={(e) => changeSpeed(Number(e.target.value))}
            disabled={status === 'playing'}
            className="speed-slider w-full h-2 rounded-full appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <div className="flex justify-between text-[10px] text-gray-500 mt-1 px-0.5">
            <span>🐢 Slow</span>
            <span>🐇 Fast</span>
          </div>
        </div>

        {/* Difficulty Selector */}
        <div className="flex justify-center gap-2">
          {difficulties.map(d => (
            <button
              key={d.value}
              onClick={() => changeDifficulty(d.value)}
              disabled={status === 'playing'}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                difficulty === d.value
                  ? `bg-gradient-to-r ${d.color} text-white shadow-lg scale-105`
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-3">
          <button
            onClick={handleStartPause}
            className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-green-500/30 hover:scale-105 transition-all duration-200 active:scale-95"
          >
            {status === 'playing' ? '⏸ Pause' : status === 'paused' ? '▶ Resume' : '▶ Start'}
          </button>
          <button
            onClick={restartGame}
            className="px-5 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-gray-500/30 hover:scale-105 transition-all duration-200 active:scale-95"
          >
            🔄 Restart
          </button>
        </div>

        {/* Mobile D-Pad */}
        <div className="flex justify-center mt-2 md:hidden">
          <div className="grid grid-cols-3 gap-1 w-36">
            <div />
            <button
              onTouchStart={(e) => { e.preventDefault(); changeDirection('UP'); }}
              className="aspect-square bg-gray-700 rounded-lg flex items-center justify-center text-white text-xl active:bg-gray-600 active:scale-95 transition-all"
            >
              ▲
            </button>
            <div />
            <button
              onTouchStart={(e) => { e.preventDefault(); changeDirection('LEFT'); }}
              className="aspect-square bg-gray-700 rounded-lg flex items-center justify-center text-white text-xl active:bg-gray-600 active:scale-95 transition-all"
            >
              ◀
            </button>
            <div className="aspect-square bg-gray-800 rounded-lg" />
            <button
              onTouchStart={(e) => { e.preventDefault(); changeDirection('RIGHT'); }}
              className="aspect-square bg-gray-700 rounded-lg flex items-center justify-center text-white text-xl active:bg-gray-600 active:scale-95 transition-all"
            >
              ▶
            </button>
            <div />
            <button
              onTouchStart={(e) => { e.preventDefault(); changeDirection('DOWN'); }}
              className="aspect-square bg-gray-700 rounded-lg flex items-center justify-center text-white text-xl active:bg-gray-600 active:scale-95 transition-all"
            >
              ▼
            </button>
            <div />
          </div>
        </div>
      </div>
    </div>
  );
}
