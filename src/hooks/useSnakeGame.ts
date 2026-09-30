import { useState, useCallback, useEffect, useRef } from 'react';

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type GameStatus = 'idle' | 'playing' | 'paused' | 'gameover';

export interface Position {
  x: number;
  y: number;
}

const GRID_SIZE = 20;

const SPEED_MAP: Record<Difficulty, number> = {
  easy: 180,
  medium: 120,
  hard: 70,
};

const SCORE_MAP: Record<Difficulty, number> = {
  easy: 5,
  medium: 10,
  hard: 20,
};

function getRandomPosition(snake: Position[]): Position {
  let pos: Position;
  do {
    pos = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (snake.some(seg => seg.x === pos.x && seg.y === pos.y));
  return pos;
}

function getHighScore(difficulty: Difficulty): number {
  try {
    return parseInt(localStorage.getItem(`snake_highscore_${difficulty}`) || '0', 10);
  } catch {
    return 0;
  }
}

function setHighScore(difficulty: Difficulty, score: number): void {
  try {
    localStorage.setItem(`snake_highscore_${difficulty}`, score.toString());
  } catch {
    // ignore
  }
}

const INITIAL_SNAKE: Position[] = [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 },
];

export function useSnakeGame() {
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Position>({ x: 15, y: 10 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [status, setStatus] = useState<GameStatus>('idle');
  const [score, setScore] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [highScore, setHighScoreState] = useState(() => getHighScore('medium'));

  const directionRef = useRef<Direction>('RIGHT');
  const snakeRef = useRef<Position[]>(INITIAL_SNAKE);
  const foodRef = useRef<Position>({ x: 15, y: 10 });
  const scoreRef = useRef(0);
  const statusRef = useRef<GameStatus>('idle');
  const gameLoopRef = useRef<number | null>(null);
  const lastDirectionRef = useRef<Direction>('RIGHT');

  // Sync refs
  useEffect(() => { directionRef.current = direction; }, [direction]);
  useEffect(() => { snakeRef.current = snake; }, [snake]);
  useEffect(() => { foodRef.current = food; }, [food]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { statusRef.current = status; }, [status]);

  const clearGameLoop = useCallback(() => {
    if (gameLoopRef.current !== null) {
      clearInterval(gameLoopRef.current);
      gameLoopRef.current = null;
    }
  }, []);

  const gameOver = useCallback(() => {
    clearGameLoop();
    setStatus('gameover');
    const currentScore = scoreRef.current;
    const currentDifficulty = difficulty;
    const currentHigh = getHighScore(currentDifficulty);
    if (currentScore > currentHigh) {
      setHighScore(currentDifficulty, currentScore);
      setHighScoreState(currentScore);
    }
  }, [clearGameLoop, difficulty]);

  const tick = useCallback(() => {
    if (statusRef.current !== 'playing') return;

    const currentSnake = [...snakeRef.current];
    const head = { ...currentSnake[0] };
    const dir = directionRef.current;

    // Update head position
    switch (dir) {
      case 'UP': head.y -= 1; break;
      case 'DOWN': head.y += 1; break;
      case 'LEFT': head.x -= 1; break;
      case 'RIGHT': head.x += 1; break;
    }

    // Check wall collision
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      gameOver();
      return;
    }

    // Check self collision (skip tail since it will move)
    const willEat = head.x === foodRef.current.x && head.y === foodRef.current.y;
    const bodyToCheck = willEat ? currentSnake : currentSnake.slice(0, -1);
    if (bodyToCheck.some(seg => seg.x === head.x && seg.y === head.y)) {
      gameOver();
      return;
    }

    // Move snake
    const newSnake = [head, ...currentSnake];
    if (willEat) {
      // Don't remove tail - snake grows
      const newFood = getRandomPosition(newSnake);
      setFood(newFood);
      foodRef.current = newFood;
      const newScore = scoreRef.current + SCORE_MAP[difficulty];
      setScore(newScore);
      scoreRef.current = newScore;
    } else {
      newSnake.pop();
    }

    setSnake(newSnake);
    snakeRef.current = newSnake;
    lastDirectionRef.current = dir;
  }, [gameOver, difficulty]);

  const startGameLoop = useCallback(() => {
    clearGameLoop();
    const speed = SPEED_MAP[difficulty];
    gameLoopRef.current = window.setInterval(tick, speed);
  }, [clearGameLoop, tick, difficulty]);

  const startGame = useCallback(() => {
    const initialSnake = [...INITIAL_SNAKE];
    setSnake(initialSnake);
    snakeRef.current = initialSnake;
    const initialFood = getRandomPosition(initialSnake);
    setFood(initialFood);
    foodRef.current = initialFood;
    setScore(0);
    scoreRef.current = 0;
    setDirection('RIGHT');
    directionRef.current = 'RIGHT';
    lastDirectionRef.current = 'RIGHT';
    setStatus('playing');
    statusRef.current = 'playing';
  }, []);

  const pauseGame = useCallback(() => {
    if (statusRef.current === 'playing') {
      clearGameLoop();
      setStatus('paused');
    }
  }, [clearGameLoop]);

  const resumeGame = useCallback(() => {
    if (statusRef.current === 'paused') {
      setStatus('playing');
      statusRef.current = 'playing';
      startGameLoop();
    }
  }, [startGameLoop]);

  const restartGame = useCallback(() => {
    clearGameLoop();
    startGame();
    // Start loop after a tiny delay to ensure state is set
    setTimeout(() => {
      startGameLoop();
    }, 10);
  }, [clearGameLoop, startGame, startGameLoop]);

  const changeDirection = useCallback((newDir: Direction) => {
    const current = lastDirectionRef.current;
    // Prevent reversing
    if (
      (newDir === 'UP' && current === 'DOWN') ||
      (newDir === 'DOWN' && current === 'UP') ||
      (newDir === 'LEFT' && current === 'RIGHT') ||
      (newDir === 'RIGHT' && current === 'LEFT')
    ) {
      return;
    }
    setDirection(newDir);
    directionRef.current = newDir;
  }, []);

  const changeDifficulty = useCallback((newDifficulty: Difficulty) => {
    setDifficulty(newDifficulty);
    setHighScoreState(getHighScore(newDifficulty));
  }, []);

  // Start game loop when game starts
  useEffect(() => {
    if (status === 'playing') {
      startGameLoop();
    }
    return () => clearGameLoop();
  }, [status, startGameLoop, clearGameLoop]);

  // Update high score when difficulty changes
  useEffect(() => {
    setHighScoreState(getHighScore(difficulty));
  }, [difficulty]);

  return {
    snake,
    food,
    direction,
    status,
    score,
    difficulty,
    highScore,
    gridSize: GRID_SIZE,
    startGame,
    pauseGame,
    resumeGame,
    restartGame,
    changeDirection,
    changeDifficulty,
  };
}
