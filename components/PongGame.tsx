import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Ball, Paddle, GameStatus } from '../types';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const PADDLE_WIDTH = 15;
const PADDLE_HEIGHT = 90;
const BALL_RADIUS = 8;
const WINNING_SCORE = 11;
const INITIAL_BALL_SPEED = 6;

const PongGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [scores, setScores] = useState({ player: 0, ai: 0 });

  const ballRef = useRef<Ball>({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    dx: INITIAL_BALL_SPEED,
    dy: INITIAL_BALL_SPEED,
    radius: BALL_RADIUS,
    speed: INITIAL_BALL_SPEED,
  });

  const playerRef = useRef<Paddle>({
    x: 10,
    y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    score: 0,
  });

  const aiRef = useRef<Paddle>({
    x: CANVAS_WIDTH - 25,
    y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    score: 0,
  });

  const resetBall = useCallback((winner: 'player' | 'ai') => {
    const ball = ballRef.current;
    ball.x = CANVAS_WIDTH / 2;
    ball.y = CANVAS_HEIGHT / 2;
    ball.speed = INITIAL_BALL_SPEED;
    
    const direction = winner === 'player' ? 1 : -1;
    ball.dx = direction * ball.speed;
    ball.dy = (Math.random() * 4 - 2) * 1.5; 
  }, []);

  const update = useCallback(() => {
    if (gameStatus !== GameStatus.PLAYING) return;

    const ball = ballRef.current;
    const player = playerRef.current;
    const ai = aiRef.current;

    ball.x += ball.dx;
    ball.y += ball.dy;

    if (ball.y + ball.radius > CANVAS_HEIGHT || ball.y - ball.radius < 0) {
      ball.dy = -ball.dy;
    }

    const aiCenter = ai.y + ai.height / 2;
    const aiSpeed = 4.5; 
    if (aiCenter < ball.y - 10) {
      ai.y += aiSpeed;
    } else if (aiCenter > ball.y + 10) {
      ai.y -= aiSpeed;
    }

    ai.y = Math.max(0, Math.min(CANVAS_HEIGHT - ai.height, ai.y));

    const checkCollision = (p: Paddle) => {
      return (
        ball.x - ball.radius < p.x + p.width &&
        ball.x + ball.radius > p.x &&
        ball.y + ball.radius > p.y &&
        ball.y - ball.radius < p.y + p.height
      );
    };

    let hitPaddle: Paddle | null = null;
    if (checkCollision(player)) hitPaddle = player;
    else if (checkCollision(ai)) hitPaddle = ai;

    if (hitPaddle) {
      let collidePoint = (ball.y - (hitPaddle.y + hitPaddle.height / 2));
      collidePoint = collidePoint / (hitPaddle.height / 2);

      const angleRad = (Math.PI / 4) * collidePoint;

      const direction = (ball.x < CANVAS_WIDTH / 2) ? 1 : -1;

      ball.speed += 0.2;
      ball.dx = direction * ball.speed * Math.cos(angleRad);
      ball.dy = ball.speed * Math.sin(angleRad);
    }

    if (ball.x - ball.radius < 0) {
      ai.score++;
      setScores(prev => ({ ...prev, ai: ai.score }));
      resetBall('ai');
    } else if (ball.x + ball.radius > CANVAS_WIDTH) {
      player.score++;
      setScores(prev => ({ ...prev, player: player.score }));
      resetBall('player');
    }

    if (player.score >= WINNING_SCORE || ai.score >= WINNING_SCORE) {
      setGameStatus(GameStatus.GAME_OVER);
    }

  }, [gameStatus, resetBall]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#111'; 
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 15]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]); 
    ctx.fillStyle = '#fff';
    ctx.fillRect(playerRef.current.x, playerRef.current.y, playerRef.current.width, playerRef.current.height);
    ctx.fillRect(aiRef.current.x, aiRef.current.y, aiRef.current.width, aiRef.current.height);
    ctx.beginPath();
    ctx.arc(ballRef.current.x, ballRef.current.y, ballRef.current.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#0ea5e9';
    ctx.fill();
    ctx.closePath();

  }, []);

  const loop = useCallback(() => {
    update();
    draw();
    requestRef.current = requestAnimationFrame(loop);
  }, [update, draw]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(loop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [loop]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameStatus !== GameStatus.PLAYING) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;

    playerRef.current.y = mouseY - PADDLE_HEIGHT / 2;

    playerRef.current.y = Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, playerRef.current.y));
  };

  const startGame = () => {
    setScores({ player: 0, ai: 0 });
    playerRef.current.score = 0;
    aiRef.current.score = 0;
    resetBall('player');
    setGameStatus(GameStatus.PLAYING);
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative rounded-lg overflow-hidden shadow-2xl border-4 border-gray-700">
        
        <div className="absolute top-4 w-full flex justify-center space-x-24 text-4xl font-mono font-bold text-white opacity-50 pointer-events-none select-none">
          <div>{scores.player}</div>
          <div>{scores.ai}</div>
        </div>

        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onMouseMove={handleMouseMove}
          className="cursor-none touch-none bg-neutral-900 block"
        />

        {gameStatus === GameStatus.IDLE && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
            <h1 className="text-5xl font-bold text-white mb-4 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
              REACT PONG
            </h1>
            <p className="text-gray-300 mb-8">Move your mouse to control the paddle</p>
            <button
              onClick={startGame}
              className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition active:scale-95"
            >
              START GAME
            </button>
          </div>
        )}

        {gameStatus === GameStatus.GAME_OVER && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
            <h2 className="text-5xl font-bold text-white mb-4">
              {scores.player >= WINNING_SCORE ? 'YOU WON!' : 'GAME OVER'}
            </h2>
            <p className="text-gray-300 mb-8 text-xl">
              Score: {scores.player} - {scores.ai}
            </p>
            <button
              onClick={startGame}
              className="px-8 py-3 bg-blue-500 text-white font-bold rounded-full hover:bg-blue-600 transition active:scale-95"
            >
              PLAY AGAIN
            </button>
          </div>
        )}
      </div>
      
      <div className="mt-6 text-gray-500 text-sm">
        Mouse controls enabled. First to {WINNING_SCORE} wins.
      </div>
    </div>
  );
};

export default PongGame;
