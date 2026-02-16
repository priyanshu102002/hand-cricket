import React from 'react';
import { Player, GameStatus } from '../types';
import { TEAMS } from '../constants';

interface ResultModalProps {
  status: GameStatus;
  winner: Player | null;
  indiaScore: number;
  pakistanScore: number;
  onRestart: () => void;
  onContinue: () => void;
}

const ResultModal: React.FC<ResultModalProps> = ({ status, winner, indiaScore, pakistanScore, onRestart, onContinue }) => {
  if (status !== GameStatus.GAME_OVER && status !== GameStatus.INNINGS_BREAK) return null;

  const isBreak = status === GameStatus.INNINGS_BREAK;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 p-8 rounded-3xl max-w-sm w-full border border-slate-600 shadow-2xl text-center transform transition-all scale-100">
        
        {isBreak ? (
            <>
                <h2 className="text-2xl font-bold text-white mb-2">Innings Break</h2>
                <div className="text-6xl mb-4">⏸️</div>
                <p className="text-slate-300 mb-6">
                    India has set a target of <strong className="text-yellow-400 text-xl">{indiaScore + 1}</strong> runs.
                    <br/><br/>
                    Can Pakistan chase it down?
                </p>
                <button 
                    onClick={onContinue}
                    className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-lg shadow-green-900/50"
                >
                    Start 2nd Innings
                </button>
            </>
        ) : (
            <>
                <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-wide">Match Ended</h2>
                <div className="text-6xl mb-4 animate-bounce">
                    {winner === 'India' ? '🏆' : (winner === 'Pakistan' ? '🎉' : '🤝')}
                </div>
                
                <div className="space-y-2 mb-8">
                    <p className="text-xl text-slate-200">
                        {winner === 'India' ? (
                            <span className="text-blue-400 font-bold">India Wins!</span>
                        ) : winner === 'Pakistan' ? (
                            <span className="text-green-400 font-bold">Pakistan Wins!</span>
                        ) : (
                            <span className="text-yellow-400 font-bold">It's a Tie!</span>
                        )}
                    </p>
                    <p className="text-sm text-slate-400">
                        IND: {indiaScore} | PAK: {pakistanScore}
                    </p>
                </div>

                <button 
                    onClick={onRestart}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-lg shadow-indigo-900/50"
                >
                    Play Again
                </button>
            </>
        )}

      </div>
    </div>
  );
};

export default ResultModal;