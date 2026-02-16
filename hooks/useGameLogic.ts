import { useState, useCallback, useRef, useEffect } from 'react';
import { GameState, GameStatus, BallOutcome, Player } from '../types';
import { getRandomCommentary } from '../constants';
import { playSound, playAICommentary } from '../utils/audio';
import { generateAICommentary, generateCoachTip, getStadiumVenue, generateVoiceCommentary } from '../services/ai';

const INITIAL_STATE: GameState = {
  status: GameStatus.MENU,
  indiaScore: 0,
  pakistanScore: 0,
  target: null,
  balls: [],
  winner: null,
  lastBall: null,
  venue: null,
};

export const useGameLogic = () => {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [coachTip, setCoachTip] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Rigging Logic
  const getComputerMove = useCallback((
    playerMove: number, 
    currentBatter: Player, 
    indiaScore: number, 
    pakistanScore: number, 
    target: number | null
  ): number => {
    let cpuMove = Math.floor(Math.random() * 6) + 1;

    if (currentBatter === 'India') {
      if (indiaScore >= 95) return playerMove; 
      if (indiaScore > 85) {
         if (Math.random() < 0.6) return playerMove;
         return cpuMove;
      }
      if (cpuMove === playerMove) {
          if (indiaScore < 40 && Math.random() < 0.9) return (playerMove % 6) + 1;
          else if (indiaScore <= 85 && Math.random() < 0.6) return (playerMove % 6) + 1;
      }
    } 
    else if (currentBatter === 'Pakistan' && target !== null) {
        const runsNeeded = target - pakistanScore;
        if (runsNeeded <= 6) return playerMove;
        if (runsNeeded <= 15) {
            if (Math.random() < 0.5) return playerMove; 
            return cpuMove;
        }
        if (Math.random() < 0.1) return playerMove;
    }
    return cpuMove;
  }, []);

  const updateCoachTip = useCallback(async (newState: GameState, isOut: boolean) => {
    if (!isMounted.current) return;
    const ballsBowled = newState.balls.length;
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

  // Handle Audio Commentary (TTS)
  const handleTTS = useCallback(async (text: string) => {
    try {
        const audioBase64 = await generateVoiceCommentary(text);
        if (audioBase64 && isMounted.current) {
            playAICommentary(audioBase64);
        }
    } catch(e) {
        console.debug("TTS Error", e);
    }
  }, []);

  const playBall = useCallback(async (userMove: number) => {
    try { playSound.click(); } catch (e) { }

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

      // Local Audio
      setTimeout(() => {
        try {
          if (isOut) playSound.wicket();
          else if (runsScored >= 4) runsScored === 6 ? playSound.six() : playSound.four();
          else playSound.hit();
        } catch (e) { }
      }, 50);

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

      // Trigger TTS for major events (Wickets or Sixes)
      if (isOut || runsScored === 6) {
          handleTTS(commentary);
      }

      let nextStatus: GameStatus = prevState.status;
      let nextIndiaScore = prevState.indiaScore;
      let nextPakistanScore = prevState.pakistanScore;
      let nextWinner = prevState.winner;
      let nextTarget = prevState.target;

      if (!isOut) {
        if (currentBatter === 'India') nextIndiaScore += runsScored;
        else nextPakistanScore += runsScored;
      }

      if (prevState.status === GameStatus.INNINGS_1) {
        if (isOut) {
            nextStatus = GameStatus.INNINGS_BREAK;
            nextTarget = nextIndiaScore + 1;
        }
      } else if (prevState.status === GameStatus.INNINGS_2) {
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

      // AI Text Commentary (Separate from TTS, for the UI text)
      if (Math.random() < 0.2) {
        generateAICommentary(currentBatter, currentBowler, runsScored, isOut, 
          currentBatter === 'India' ? `Score: ${nextIndiaScore}` : `Chase: ${nextPakistanScore}/${nextTarget}`
        ).then(aiText => {
          if (isMounted.current && aiText) {
            setGameState(prev => {
                if (!prev.lastBall) return prev;
                // If we got AI text and it was a major event, maybe speak that instead? 
                // For now, stick to local commentary for TTS speed, update text for UI.
                return {
                    ...prev,
                    lastBall: { ...prev.lastBall, commentary: aiText }
                };
            });
          }
        }).catch(err => console.debug("AI Comm skipped", err));
      }

      if (!isOut && nextStatus !== GameStatus.GAME_OVER && nextStatus !== GameStatus.INNINGS_BREAK) {
         updateCoachTip(nextState, isOut);
      }

      return nextState;
    });
  }, [getComputerMove, updateCoachTip, handleTTS]);

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
    // Preserve the venue when restarting
    setGameState(prev => ({ 
        ...INITIAL_STATE, 
        venue: prev.venue,
        status: GameStatus.INNINGS_1 
    }));
    setCoachTip(null);
  }, []);

  const startGame = useCallback(async () => {
    try { playSound.click(); } catch(e) {}
    
    // Reset state but keep venue momentarily or fetch new one
    setGameState({ ...INITIAL_STATE, status: GameStatus.INNINGS_1 });
    setCoachTip("Welcome to the match! Start by building a solid inning.");
    
    // Fetch Venue (Grounding)
    const venue = await getStadiumVenue();
    if (venue && isMounted.current) {
        setGameState(prev => ({ ...prev, venue }));
    }
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