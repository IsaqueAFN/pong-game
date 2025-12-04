export interface Position {
  x: number;
  y: number;
}

export interface Velocity {
  dx: number;
  dy: number;
}

export interface Ball extends Position, Velocity {
  radius: number;
  speed: number;
}

export interface Paddle extends Position {
  width: number;
  height: number;
  score: number;
}

export enum GameStatus {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
}
