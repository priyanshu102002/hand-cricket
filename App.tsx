import React, { useState, useEffect } from 'react';
import { GameState, GameStatus, BallOutcome, Player } from './types';
import { getRandomCommentary } from './constants';
import ScoreBoard from './components/ScoreBoard';
import Controls from './components/Controls';
import GameFeed from './components/GameFeed';
import ResultModal from './components/ResultModal';
import CoachTip from './components/CoachTip';
import { playSound } from './utils/audio';
import { generateAICommentary, generateCoachTip } from './services/ai';

const INITIAL_STATE: GameState = {
  status: GameStatus.MENU,
  indiaScore: 0,
  pakistanScore: 0,
  target: null,
  balls: [],
  winner: null,
  lastBall: null,
};

function App() {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [coachTip, setCoachTip] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // LOGIC TO FAVOR INDIA (THE USER)
  const getComputerMove = (
    playerMove: number, 
    currentBatter: Player, 
    indiaScore: number, 
    pakistanScore: number, 
    target: number | null
  ): number => {
    let cpuMove = Math.floor(Math.random() * 6) + 1;

    // SCENARIO 1: User is Batting (India), CPU is Bowling (Pakistan)
    if (currentBatter === 'India') {
      // User is Batting. CPU is Bowling.
      // India needs to score high.
      // If natural RNG causes a wicket (cpuMove === playerMove), prevent it most of the time.
      if (cpuMove === playerMove) {
          // 95% chance to save the wicket to ensure India posts a big total
          if (Math.random() < 0.95) {
             // Pick a different number deterministically
             cpuMove = (playerMove % 6) + 1;
          }
      }
    } 
    // SCENARIO 2: User is Bowling (India), CPU is Batting (Pakistan)
    else if (currentBatter === 'Pakistan') {
        // Pakistan is Batting. User is Bowling.
        // India needs to win. Pakistan must lose.
        
        // If we are in the 2nd innings (target exists)
        if (target !== null) {
            const runsNeeded = target - pakistanScore;
            
            // If Pakistan gets anywhere close (within 10 runs), FORCE WICKET
            if (runsNeeded <= 10) {
               return playerMove; // Matches user move -> Wicket
            }

            // Even if not close, make them prone to wickets (40% chance to just give up wicket)
            if (Math.random() < 0.4) {
                return playerMove;
            }
        }
    }
    return cpuMove;
  };

  const updateCoachTip = async (newState: GameState) => {
    // Only fetch tip occasionally to save quota and not be annoying
    if (Math.random() > 0.3) return; 
    
    setIsAiLoading(true);
    const tip = await generateCoachTip(newState);
    if (tip) setCoachTip(tip);
    setIsAiLoading(false);
  };

  const startGame = () => {
    playSound.click();
    const newState = {
      ...INITIAL_STATE,
      status: GameStatus.INNINGS_1,
    };
    setGameState(newState);
    setCoachTip("Welcome to the match! Start by building a solid inning.");
  };

  const playBall = async (userMove: number) => {
    playSound.click();

    if (gameState.status !== GameStatus.INNINGS_1 && gameState.status !== GameStatus.INNINGS_2) return;
    
    const currentBatter: Player = gameState.status === GameStatus.INNINGS_1 ? 'India' : 'Pakistan';
    const currentBowler: Player = gameState.status === GameStatus.INNINGS_1 ? 'Pakistan' : 'India';

    let batterMove, bowlerMove;

    if (currentBatter === 'India') {
        batterMove = userMove;
        bowlerMove = getComputerMove(userMove, currentBatter, gameState.indiaScore, gameState.pakistanScore, gameState.target);
    } else {
        bowlerMove = userMove;
        batterMove = getComputerMove(userMove, currentBatter, gameState.indiaScore, gameState.pakistanScore, gameState.target);
    }

    const isOut = batterMove === bowlerMove;
    const runsScored = isOut ? 0 : batterMove;

    // Play Sounds
    if (isOut) setTimeout(() => playSound.wicket(), 100);
    else if (runsScored >= 4) setTimeout(() => runsScored === 6 ? playSound.six() : playSound.four(), 100);
    else setTimeout(() => playSound.hit(), 100);

    // Initial static commentary (Immediate feedback)
    let commentary = getRandomCommentary(runsScored, isOut);

    const newBall: BallOutcome = {
      batter: currentBatter,
      bowler: currentBowler,
      batterMove,
      bowlerMove,
      isOut,
      runsScored,
      commentary
    };

    // Calculate next state
    // Explicitly type nextStatus as GameStatus so it doesn't get narrowed to just INNINGS_1 | INNINGS_2
    let nextStatus: GameStatus = gameState.status;
    let nextIndiaScore = gameState.indiaScore;
    let nextPakistanScore = gameState.pakistanScore;
    let nextWinner = gameState.winner;
    let nextTarget = gameState.target;

    if (!isOut) {
      if (currentBatter === 'India') nextIndiaScore += runsScored;
      else nextPakistanScore += runsScored;
    }

    if (gameState.status === GameStatus.INNINGS_1) {
      if (isOut) {
          nextStatus = GameStatus.INNINGS_BREAK;
          nextTarget = nextIndiaScore + 1;
      }
    } else if (gameState.status === GameStatus.INNINGS_2) {
      if (nextPakistanScore >= (gameState.target || 0)) {
          // This should theoretically not happen given our rigorous rigging, but handle it just in case
          nextStatus = GameStatus.GAME_OVER;
          nextWinner = 'Pakistan';
          setTimeout(() => playSound.win(), 500);
      } else if (isOut) {
          nextStatus = GameStatus.GAME_OVER;
          // Since India must win, we ensure logic falls here
          nextWinner = 'India';
          setTimeout(() => playSound.win(), 500);
      }
    }

    const nextState = {
      ...gameState,
      status: nextStatus,
      indiaScore: nextIndiaScore,
      pakistanScore: nextPakistanScore,
      target: nextTarget,
      balls: [...gameState.balls, newBall],
      lastBall: newBall,
      winner: nextWinner
    };

    setGameState(nextState);

    // Trigger AI Features (Commentary + Coach)
    // We update the state with AI commentary asynchronously
    if (isOut || runsScored >= 4 || Math.random() < 0.2) {
      // Fetch dynamic commentary for significant events
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

    // Update Coach Tip occasionally
    if (!isOut && nextStatus !== GameStatus.GAME_OVER) {
       updateCoachTip(nextState);
    }
  };

  const startInnings2 = () => {
    playSound.click();
    setGameState(prev => ({
        ...prev,
        status: GameStatus.INNINGS_2,
        lastBall: null // Reset display for clean start
    }));
    setCoachTip("Defend the total! Mix up your deliveries.");
  };

  const restartGame = () => {
    playSound.click();
    setGameState({
        ...INITIAL_STATE,
        status: GameStatus.INNINGS_1
    });
    setCoachTip(null);
  };

  const goToMenu = () => {
      playSound.click();
      setGameState(INITIAL_STATE);
      setCoachTip(null);
  }

  // Menu Screen
  if (gameState.status === GameStatus.MENU) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-8">
            <div className="animate-pop">
                <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-white to-green-400 mb-2">
                    HAND CRICKET
                </h1>
                <h2 className="text-xl font-bold text-slate-400 tracking-widest">INDIA VS PAKISTAN</h2>
                <div className="mt-2 inline-flex items-center px-2 py-1 bg-indigo-900/50 rounded border border-indigo-500/30">
                  <span className="text-xs text-indigo-300">✨ AI Powered Assistant</span>
                </div>
            </div>

            <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl">
                <p className="text-slate-300 mb-6 leading-relaxed">
                    Welcome to the big match! 
                    <br/>
                    You play as <strong className="text-blue-400">Team India</strong> 🇮🇳.
                    <br/><br/>
                    <strong>Rules:</strong>
                    <br/>
                    1. Choose a number (1-6).
                    <br/>
                    2. Same number = <span className="text-red-400">OUT</span>.
                    <br/>
                    3. Different number = <span className="text-green-400">RUNS</span>.
                </p>
                <button 
                    onClick={startGame}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl text-lg transition-all transform hover:scale-105 shadow-lg shadow-blue-900/50"
                >
                    Start Match
                </button>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center p-4 max-w-lg mx-auto relative">
      {/* Header & Controls */}
      <header className="w-full flex justify-between items-center py-4 mb-2">
        <button 
          onClick={goToMenu} 
          className="text-xs text-slate-500 hover:text-white transition-colors"
          aria-label="Back to Menu"
        >
            ← Menu
        </button>
        <h1 className="text-xl font-bold text-slate-400 uppercase tracking-widest">
            {gameState.status === GameStatus.INNINGS_1 ? '1st Innings' : '2nd Innings'}
        </h1>
        <button 
          onClick={restartGame} 
          className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded-full border border-slate-700 transition-colors"
          aria-label="Restart Game"
        >
            Restart ↻
        </button>
      </header>

      {/* Scoreboard */}
      <ScoreBoard 
        indiaScore={gameState.indiaScore} 
        pakistanScore={gameState.pakistanScore} 
        status={gameState.status}
        target={gameState.target}
      />

      {/* AI Coach Tip */}
      <CoachTip tip={coachTip} loading={isAiLoading} />

      {/* Game Feed Area */}
      <div className="w-full flex-1 flex flex-col justify-center">
          <GameFeed lastBall={gameState.lastBall} />
          
          {/* Controls */}
          <Controls 
            onPlay={playBall} 
            disabled={gameState.status !== GameStatus.INNINGS_1 && gameState.status !== GameStatus.INNINGS_2} 
            label={
                gameState.status === GameStatus.INNINGS_1 
                ? "You are Batting 🇮🇳 (Score Runs)" 
                : "You are Bowling 🇮🇳 (Take Wickets)"
            }
          />
      </div>

      {/* Modals for Break/End */}
      <ResultModal 
        status={gameState.status}
        winner={gameState.winner}
        indiaScore={gameState.indiaScore}
        pakistanScore={gameState.pakistanScore}
        onRestart={restartGame}
        onContinue={startInnings2}
      />
    </div>
  );
}

export default App;