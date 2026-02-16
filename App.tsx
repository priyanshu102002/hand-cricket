import React, { useEffect } from 'react';
import { GameStatus } from './types';
import ScoreBoard from './components/ScoreBoard';
import Controls from './components/Controls';
import GameFeed from './components/GameFeed';
import ResultModal from './components/ResultModal';
import CoachTip from './components/CoachTip';
import { useGameLogic } from './hooks/useGameLogic';

function App() {
  const {
    gameState,
    coachTip,
    isAiLoading,
    playBall,
    startGame,
    startInnings2,
    restartGame,
    goToMenu
  } = useGameLogic();

  // Keyboard Event Listener
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key;
      // Check if key is 1-6
      if (['1', '2', '3', '4', '5', '6'].includes(key)) {
        playBall(parseInt(key, 10));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [playBall]);

  // Menu Screen
  if (gameState.status === GameStatus.MENU) {
    return (
      <main className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <section className="max-w-md w-full text-center space-y-8">
            <div className="animate-pop">
                <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-white to-green-400 mb-2">
                    HAND CRICKET
                </h1>
                <h2 className="text-xl font-bold text-slate-400 tracking-widest">INDIA VS PAKISTAN</h2>
                <div className="mt-2 inline-flex items-center px-2 py-1 bg-indigo-900/50 rounded border border-indigo-500/30">
                  <span className="text-xs text-indigo-300">✨ AI Powered Assistant</span>
                </div>
            </div>

            <article className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl">
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
                <div className="flex flex-col gap-3">
                  <button 
                      onClick={startGame}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl text-lg transition-all transform hover:scale-105 shadow-lg shadow-blue-900/50"
                  >
                      Start Match
                  </button>
                  <p className="text-xs text-slate-500 uppercase tracking-widest mt-2">
                    Tip: Use Keyboard Numbers 1-6
                  </p>
                </div>
            </article>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 flex flex-col items-center p-4 max-w-lg mx-auto relative">
      {/* Header & Controls */}
      <header className="w-full flex justify-between items-center py-4 mb-2">
        <button 
          onClick={goToMenu} 
          className="text-xs text-slate-500 hover:text-white transition-colors focus:outline-none focus:text-white"
          aria-label="Back to Menu"
        >
            ← Menu
        </button>
        <h1 className="text-xl font-bold text-slate-400 uppercase tracking-widest">
            {gameState.status === GameStatus.INNINGS_1 ? '1st Innings' : '2nd Innings'}
        </h1>
        <button 
          onClick={restartGame} 
          className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded-full border border-slate-700 transition-colors focus:ring-2 focus:ring-blue-500"
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
        venue={gameState.venue}
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
                ? "You are Batting 🇮🇳 (Press 1-6)" 
                : "You are Bowling 🇮🇳 (Press 1-6)"
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
    </main>
  );
}

export default App;