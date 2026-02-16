import { useState, useCallback, useRef, useEffect } from 'react';
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
  const isMounted = useRef(true);

  // Cleanup on unmount to prevent memory leaks/state updates on unmounted component
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // RIGGING LOGIC: India wins, score < 100
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
      // 1. Cap Score Logic: Aggressively prevent score > 95
      if (indiaScore >= 95) {
         // Force wicket 100% to keep score under 100 (assuming max 6 runs per ball, buffer needed)
         return playerMove; 
      }
      // Soft Cap: Start making it hard > 85
      if (indiaScore > 85) {
         // 60% chance to force wicket
         if (Math.random() < 0.6) return playerMove;
         // Else random
         return cpuMove;
      }
      
      // 2. Protection Logic (Early Game fun)
      if (cpuMove === playerMove) {
          // If score < 40, 90% protection (User feels lucky)
          if (indiaScore < 40 && Math.random() < 0.9) {
             return (playerMove % 6) + 1;
          }
          // If score 40-85, 60% protection
          else if (indiaScore <= 85 && Math.random() < 0.6) {
             return (playerMove % 6) + 1;
          }
      }
    } 
    // SCENARIO 2: CPU is Batting (Pakistan) - User is Bowling
    else if (currentBatter === 'Pakistan' && target !== null) {
        const runsNeeded = target - pakistanScore;
        
        // 1. KILL SWITCH: If Pakistan is about to win (needs <= 6 runs), they MUST get out.
        if (runsNeeded <= 6) {
           return playerMove; // Matches user move -> OUT
        }

        // 2. Tension Builder: If runs needed 7-15, make it 50/50
        if (runsNeeded <= 15) {
            if (Math.random() < 0.5) return playerMove; // 50% chance of wicket
            // Else let random happen (they might score or get out naturally)
            return cpuMove;
        }

        // 3. Early Chase: Let them play to build tension (runs needed > 15)
        // Only 10% chance of forced wicket, otherwise random.
        // This lets Pakistan score and "play a bit more".
        if (Math.random() < 0.1) {
            return playerMove;
        }
    }
    return cpuMove;
  }, []);

  const updateCoachTip = useCallback(async (newState: GameState, isOut: boolean) => {
    if (!isMounted.current) return;
    
    const ballsBowled = newState.balls.length;
    // Efficiency: Only check coach tip every 6 balls or on wicket
    const isEndOfOver = ballsBowled > 0 && ballsBowled % 6 === 0;

    if (isOut || isEndOfOver) {
        setIsAiLoading(true);
        try {
          const tip = await generateCoachTip(newState);
          if (isMounted.current && tip) setCoachTip(tip);
        } catch (e) {
          console.error("Coach tip error", e);
        } finally {
          if (isMounted.current) setIsAiLoading(false);
        }
    }
  }, []);

  const playBall = useCallback(async (userMove: number) => {
    try {
      playSound.click();
    } catch (e) { /* Ignore audio errors */ }

    setGameState(prevState => {
      // Validation to prevent playing when game is over
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

      // Audio Feedback (Fire and forget, don't await)
      setTimeout(() => {
        try {
          if (isOut) playSound.wicket();
          else if (runsScored >= 4) runsScored === 6 ? playSound.six() : playSound.four();
          else playSound.hit();
        } catch (e) { console.error("Sound error", e); }
      }, 50); // Reduced delay for snappier feel

      // Get local commentary immediately
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
        // Safety check: If for some reason Pakistan passes target (should be impossible via getComputerMove)
        if (nextPakistanScore >= (prevState.target || 0)) {
            nextStatus = GameStatus.GAME_OVER;
            nextWinner = 'Pakistan';
            setTimeout(() => { try { playSound.win(); } catch(e){} }, 500);
        } else if (isOut) {
            nextStatus = GameStatus.GAME_OVER;
            nextWinner = 'India';
            setTimeout(() => { try { playSound.win(); } catch(e){} }, 500);
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

      // AI Commentary Trigger (20% chance) - Fire and forget
      if (Math.random() < 0.2) {
        generateAICommentary(currentBatter, currentBowler, runsScored, isOut, 
          currentBatter === 'India' ? `Score: ${nextIndiaScore}` : `Chase: ${nextPakistanScore}/${nextTarget}`
        ).then(aiText => {
          if (isMounted.current && aiText) {
            setGameState(prev => {
                if (!prev.lastBall) return prev;
                return {
                    ...prev,
                    lastBall: { ...prev.lastBall, commentary: aiText }
                };
            });
          }
        }).catch(err => console.debug("AI Commentary skipped", err));
      }

      // Coach Tip Trigger
      if (!isOut && nextStatus !== GameStatus.GAME_OVER && nextStatus !== GameStatus.INNINGS_BREAK) {
         updateCoachTip(nextState, isOut);
      }

      return nextState;
    });
  }, [getComputerMove, updateCoachTip]);

  const startInnings2 = useCallback(() => {
    try { playSound.click(); } catch(e) {}
    setGameState(prev => ({
        ...prev,
        status: GameStatus.INNINGS_2,
        lastBall: null 
    }));
    setCoachTip("Defend the total! Mix up your deliveries.");
  }, []);

  const restartGame = useCallback(() => {
    try { playSound.click(); } catch(e) {}
    setGameState({ ...INITIAL_STATE, status: GameStatus.INNINGS_1 });
    setCoachTip(null);
  }, []);

  const startGame = useCallback(() => {
    try { playSound.click(); } catch(e) {}
    setGameState({ ...INITIAL_STATE, status: GameStatus.INNINGS_1 });
    setCoachTip("Welcome to the match! Start by building a solid inning.");
  }, []);

  const goToMenu = useCallback(() => {
      try { playSound.click(); } catch(e) {}
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