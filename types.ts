export type Player = 'India' | 'Pakistan';

export enum GameStatus {
  MENU = 'MENU',
  INNINGS_1 = 'INNINGS_1', // India batting, User (Pak) bowling
  INNINGS_BREAK = 'INNINGS_BREAK',
  INNINGS_2 = 'INNINGS_2', // Pakistan batting, India bowling
  GAME_OVER = 'GAME_OVER'
}

export interface BallOutcome {
  batter: Player;
  bowler: Player;
  batterMove: number;
  bowlerMove: number;
  isOut: boolean;
  runsScored: number;
  commentary: string;
}

export interface GameState {
  status: GameStatus;
  indiaScore: number;
  pakistanScore: number;
  target: number | null;
  balls: BallOutcome[];
  winner: Player | null;
  lastBall: BallOutcome | null;
}