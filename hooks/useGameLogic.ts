import { useState, useCallback, useEffect } from 'react';
import { GameState, GameStatus, BallOutcome, Player } from '../types';
import { getRandomCommentary } from '../constants';
import { playSound } from '../utils/audio';
import { generateAICommentary, generateCoachTip } from '../services/ai';

const INITIAL_STATE: GameState = {
  status: GameStatus.MENU,
  indiaScore: 0,
  pakistanScore: 0,
  target: null,
  balls: [],
  winner: null,
  lastBall: null,
};

export const useGameLogic = () => {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [coachTip, setCoachTip] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // LOGIC TO FAVOR INDIA BUT CAP SCORE < 100
  const getComputerMove = useCallback((
    playerMove: number, 
    currentBatter: Player, 
    indiaScore: number, 
    pakistanScore: number, 
    target: number | null
  ): number => {
    let cpuMove = Math.floor(Math.random() * 6) + 1;

    // SCENARIO 1: User is Batting (India)
    if (currentBatter === 'India') {
      // CAP LOGIC: If score is high (>90), CPU becomes deadly to prevent crossing 100 easily
      if (indiaScore >= 92) {
          // 80% chance to guess the player's move (Cheat to keep score < 100)
          if (Math.random() < 0.8) return playerMove;
      }
      
      // Protection Logic (Early Game)
      if (cpuMove === playerMove) {
          // If score < 40, 95% protection
          if (indiaScore < 40 && Math.random() < 0.95) {
             return (playerMove % 6) + 1;
          }
          // If score 40-80, 70% protection
          else if (indiaScore < 80 && Math.random() < 0.70) {
             return (playerMove % 6) + 1;
          }
          // If score > 80, No protection (Let wickets fall)
      }
    } 
    // SCENARIO 2: CPU is Batting (Pakistan)
    else if (currentBatter === 'Pakistan') {
        if (target !== null) {
            const runsNeeded = target - pakistanScore;
            
            // Critical Wicket Taking: If Pakistan is close or India has a low score
            if (runsNeeded <= 12 || (target < 50 && Math.random() < 0.3)) {
               return playerMove; 
            }

            // General difficulty: 40% chance to get out randomly
            if (Math.random() < 0.4) {
                return playerMove;
            }
        }
    }
    return cpuMove;
  }, []);

  const updateCoachTip = async (newState: GameState, isOut: boolean) => {
    const ballsBowled = newState.balls.length;
    const isEndOfOver = ballsBowled > 0 && ballsBowled % 6 === 0;

    if (isOut || isEndOfOver) {
        setIsAiLoading(true);
        const tip = await generateCoachTip(newState);
        if (tip) setCoachTip(tip);
        setIsAiLoading(false);
    }
  };

  const playBall = useCallback(async (userMove: number) => {
    playSound.click();

    setGameState(prevState => {
      if (prevState.status !== GameStatus.INNINGS_1 && prevState.status !== GameStatus.INNINGS_2) {
        return prevState;
      }

      const currentBatter: Player = prevState.status === GameStatus.INNINGS_1 ? 'India' : 'Pakistan';
      const currentBowler: Player = prevState.status === GameStatus.INNINGS_1 ? 'Pakistan' : 'India';

      let batterMove, bowlerMove;

      if (currentBatter === 'India') {
          batterMove = userMove;
          bowlerMove = getComputerMove(userMove, currentBatter, prevState.indiaScore, prevState.pakistanScore, prevState.target);
      } else {
          bowlerMove = userMove;
          batterMove = getComputerMove(userMove, currentBatter, prevState.indiaScore, prevState.pakistanScore, prevState.target);
      }

      const isOut = batterMove === bowlerMove;
      const runsScored = isOut ? 0 : batterMove;

      // Audio Feedback
      if (isOut) setTimeout(() => playSound.wicket(), 100);
      else if (runsScored >= 4) setTimeout(() => runsScored === 6 ? playSound.six() : playSound.four(), 100);
      else setTimeout(() => playSound.hit(), 100);

      const commentary = getRandomCommentary(runsScored, isOut);

      const newBall: BallOutcome = {
        batter: currentBatter,
        bowler: currentBowler,
        batterMove,
        bowlerMove,
        isOut,
        runsScored,
        commentary
      };

      let nextStatus: GameStatus = prevState.status;
      let nextIndiaScore = prevState.indiaScore;
      let nextPakistanScore = prevState.pakistanScore;
      let nextWinner = prevState.winner;
      let nextTarget = prevState.target;

      if (!isOut) {
        if (currentBatter === 'India') nextIndiaScore += runsScored;
        else nextPakistanScore += runsScored;
      }

      // Game Flow Logic
      if (prevState.status === GameStatus.INNINGS_1) {
        if (isOut) {
            nextStatus = GameStatus.INNINGS_BREAK;
            nextTarget = nextIndiaScore + 1;
        }
      } else if (prevState.status === GameStatus.INNINGS_2) {
        if (nextPakistanScore >= (prevState.target || 0)) {
            nextStatus = GameStatus.GAME_OVER;
            nextWinner = 'Pakistan';
            setTimeout(() => playSound.win(), 500);
        } else if (isOut) {
            nextStatus = GameStatus.GAME_OVER;
            nextWinner = 'India';
            setTimeout(() => playSound.win(), 500);
        }
      }

      const nextState = {
        ...prevState,
        status: nextStatus,
        indiaScore: nextIndiaScore,
        pakistanScore: nextPakistanScore,
        target: nextTarget,
        balls: [...prevState.balls, newBall],
        lastBall: newBall,
        winner: nextWinner
      };

      // AI Commentary Trigger (20% chance)
      if (Math.random() < 0.2) {
        generateAICommentary(currentBatter, currentBowler, runsScored, isOut, 
          currentBatter === 'India' ? `Score: ${nextIndiaScore}` : `Chase: ${nextPakistanScore}/${nextTarget}`
        ).then(aiText => {
          if (aiText) {
            setGameState(prev => ({
              ...prev,
              lastBall: prev.lastBall ? { ...prev.lastBall, commentary: aiText } : null
            }));
          }
        });
      }

      // Coach Tip Trigger
      if (!isOut && nextStatus !== GameStatus.GAME_OVER && nextStatus !== GameStatus.INNINGS_BREAK) {
         updateCoachTip(nextState, isOut);
      }

      return nextState;
    });
  }, [getComputerMove]);

  const startInnings2 = useCallback(() => {
    playSound.click();
    setGameState(prev => ({
        ...prev,
        status: GameStatus.INNINGS_2,
        lastBall: null 
    }));
    setCoachTip("Defend the total! Mix up your deliveries.");
  }, []);

  const restartGame = useCallback(() => {
    playSound.click();
    setGameState({ ...INITIAL_STATE, status: GameStatus.INNINGS_1 });
    setCoachTip(null);
  }, []);

  const startGame = useCallback(() => {
    playSound.click();
    setGameState({ ...INITIAL_STATE, status: GameStatus.INNINGS_1 });
    setCoachTip("Welcome to the match! Start by building a solid inning.");
  }, []);

  const goToMenu = useCallback(() => {
      playSound.click();
      setGameState(INITIAL_STATE);
      setCoachTip(null);
  }, []);

  return {
    gameState,
    coachTip,
    isAiLoading,
    playBall,
    startGame,
    startInnings2,
    restartGame,
    goToMenu
  };
};