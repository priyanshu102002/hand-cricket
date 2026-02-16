import React, { useState } from 'react';
import { GameState, GameStatus, BallOutcome, Player } from './types';
import { getRandomCommentary } from './constants';
import ScoreBoard from './components/ScoreBoard';
import Controls from './components/Controls';
import GameFeed from './components/GameFeed';
import ResultModal from './components/ResultModal';
import { playSound } from './utils/audio';

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
    // Goal: CPU should be bad at guessing User's move to let India score.
    if (currentBatter === 'India') {
      // If CPU accidentally matches User (Wicket), small chance to "fumble" and change number
      // unless India is scoring unreasonably high (>100).
      if (cpuMove === playerMove) {
        const survivalChance = 0.5; // 50% chance to survive a wicket
        if (Math.random() < survivalChance) {
          let newMove = Math.floor(Math.random() * 6) + 1;
          // Ensure new move is different
          while (newMove === playerMove) {
             newMove = Math.floor(Math.random() * 6) + 1;
          }
          cpuMove = newMove;
        }
      }
    } 
    // SCENARIO 2: User is Bowling (India), CPU is Batting (Pakistan)
    // Goal: CPU should be prone to getting out or scoring low.
    else if (currentBatter === 'Pakistan') {
        // If CPU is NOT matching User (Safe), chance to "misread" and pick User's number (Wicket)
        if (cpuMove !== playerMove) {
             // If Pakistan is close to winning, increase choke probability
             let chokeChance = 0.2; 
             if (target && (target - pakistanScore < 15)) {
                 chokeChance = 0.5;
             }
             
             if (Math.random() < chokeChance) {
                 cpuMove = playerMove; // Suicide move (Wicket)
             }
        }
    }

    return cpuMove;
  };

  const startGame = () => {
    playSound.click();
    setGameState({
      ...INITIAL_STATE,
      status: GameStatus.INNINGS_1,
    });
  };

  const playBall = (userMove: number) => {
    playSound.click();

    if (gameState.status !== GameStatus.INNINGS_1 && gameState.status !== GameStatus.INNINGS_2) return;

    // INNINGS 1: India Bat (User), Pakistan Bowl (CPU)
    // INNINGS 2: Pakistan Bat (CPU), India Bowl (User)
    
    const currentBatter: Player = gameState.status === GameStatus.INNINGS_1 ? 'India' : 'Pakistan';
    const currentBowler: Player = gameState.status === GameStatus.INNINGS_1 ? 'Pakistan' : 'India';

    // If User is India (Batting), User Input = batterMove
    // If User is India (Bowling), User Input = bowlerMove
    let batterMove, bowlerMove;

    if (currentBatter === 'India') {
        // User is Batting
        batterMove = userMove;
        bowlerMove = getComputerMove(userMove, currentBatter, gameState.indiaScore, gameState.pakistanScore, gameState.target);
    } else {
        // User is Bowling
        bowlerMove = userMove;
        batterMove = getComputerMove(userMove, currentBatter, gameState.indiaScore, gameState.pakistanScore, gameState.target);
    }

    const isOut = batterMove === bowlerMove;
    const runsScored = isOut ? 0 : batterMove;

    // Play Sounds
    if (isOut) {
        setTimeout(() => playSound.wicket(), 100);
    } else if (runsScored === 6) {
        setTimeout(() => playSound.six(), 100);
    } else if (runsScored === 4) {
        setTimeout(() => playSound.four(), 100);
    } else {
        setTimeout(() => playSound.hit(), 100);
    }

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

    setGameState(prev => {
      let nextStatus = prev.status;
      let nextIndiaScore = prev.indiaScore;
      let nextPakistanScore = prev.pakistanScore;
      let nextWinner = prev.winner;
      let nextTarget = prev.target;

      // Update Scores
      if (!isOut) {
        if (currentBatter === 'India') {
          nextIndiaScore += runsScored;
        } else {
          nextPakistanScore += runsScored;
        }
      }

      // Check Inning/Game End Conditions
      if (prev.status === GameStatus.INNINGS_1) {
        if (isOut) {
            // Innings 1 Over
            nextStatus = GameStatus.INNINGS_BREAK;
            nextTarget = nextIndiaScore + 1;
        }
      } else if (prev.status === GameStatus.INNINGS_2) {
        // Check win condition for Pakistan
        if (nextPakistanScore >= (prev.target || 0)) {
            nextStatus = GameStatus.GAME_OVER;
            nextWinner = 'Pakistan';
            setTimeout(() => playSound.win(), 500); // Sad win sound? Or just end sound
        } else if (isOut) {
            // Pakistan All Out
            nextStatus = GameStatus.GAME_OVER;
            if (nextPakistanScore < (prev.target || 0) - 1) {
                nextWinner = 'India';
                setTimeout(() => playSound.win(), 500);
            } else if (nextPakistanScore === (prev.target || 0) - 1) {
                // Tie scenario (scores level and out)
                nextWinner = null; // Tie
                setTimeout(() => playSound.win(), 500);
            } else {
                // If scores are equal but wicket falls, match isn't necessarily over in normal cricket 
                // but in hand cricket usually "all out" ends it.
                // If scores were level and out happens -> Tie.
                 if (nextPakistanScore === (prev.target || 0) - 1) nextWinner = null;
                 else nextWinner = 'India';
                 setTimeout(() => playSound.win(), 500);
            }
        }
      }

      return {
        ...prev,
        status: nextStatus,
        indiaScore: nextIndiaScore,
        pakistanScore: nextPakistanScore,
        target: nextTarget,
        balls: [...prev.balls, newBall],
        lastBall: newBall,
        winner: nextWinner
      };
    });
  };

  const startInnings2 = () => {
    playSound.click();
    setGameState(prev => ({
        ...prev,
        status: GameStatus.INNINGS_2,
        lastBall: null // Reset display for clean start
    }));
  };

  const restartGame = () => {
    playSound.click();
    setGameState({
        ...INITIAL_STATE,
        status: GameStatus.INNINGS_1
    });
  };

  const goToMenu = () => {
      playSound.click();
      setGameState(INITIAL_STATE);
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
            
            <p className="text-xs text-slate-600">Built with React & Tailwind</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center p-4 max-w-lg mx-auto relative">
      {/* Header & Controls */}
      <header className="w-full flex justify-between items-center py-4 mb-2">
        <button onClick={goToMenu} className="text-xs text-slate-500 hover:text-white transition-colors">
            ← Menu
        </button>
        <h1 className="text-xl font-bold text-slate-400 uppercase tracking-widest">
            {gameState.status === GameStatus.INNINGS_1 ? '1st Innings' : '2nd Innings'}
        </h1>
        <button onClick={restartGame} className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded-full border border-slate-700 transition-colors">
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