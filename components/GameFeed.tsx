import React from 'react';
import { BallOutcome } from '../types';
import { TEAMS } from '../constants';

interface GameFeedProps {
  lastBall: BallOutcome | null;
}

const GameFeed: React.FC<GameFeedProps> = ({ lastBall }) => {
  if (!lastBall) {
    return (
      <div className="h-48 flex items-center justify-center text-slate-500 border-2 border-dashed border-slate-700 rounded-2xl mb-6">
        <p>Match not started</p>
      </div>
    );
  }

  const { batter, bowler, batterMove, bowlerMove, isOut, commentary } = lastBall;
  
  const batterColor = batter === 'India' ? TEAMS.INDIA.color : TEAMS.PAKISTAN.color;
  const bowlerColor = bowler === 'India' ? TEAMS.INDIA.color : TEAMS.PAKISTAN.color;
  
  const batterBg = batter === 'India' ? 'bg-blue-500/20' : 'bg-green-500/20';
  const bowlerBg = bowler === 'India' ? 'bg-blue-500/20' : 'bg-green-500/20';

  return (
    <div className={`mb-6 flex flex-col items-center transition-all ${isOut ? 'animate-shake' : ''}`}>
      <div className="w-full flex justify-between gap-4 mb-4">
        {/* Batter Card */}
        <div className={`flex-1 rounded-xl p-4 flex flex-col items-center justify-center border border-slate-700 ${batterBg}`}>
          <span className="text-xs uppercase tracking-widest text-slate-400 mb-2">Batting ({batter})</span>
          <div className={`text-6xl font-black ${batterColor} animate-pop`}>
            {batterMove}
          </div>
        </div>

        {/* VS Indicator */}
        <div className="flex flex-col justify-center items-center">
             {isOut ? (
                 <span className="text-red-500 font-black text-2xl animate-bounce">OUT!</span>
             ) : (
                 <span className="text-green-400 font-bold text-xl">+{batterMove}</span>
             )}
        </div>

        {/* Bowler Card */}
        <div className={`flex-1 rounded-xl p-4 flex flex-col items-center justify-center border border-slate-700 ${bowlerBg}`}>
          <span className="text-xs uppercase tracking-widest text-slate-400 mb-2">Bowling ({bowler})</span>
          <div className={`text-6xl font-black ${bowlerColor} animate-pop`}>
            {bowlerMove}
          </div>
        </div>
      </div>
      
      {/* Commentary Box */}
      <div className={`text-center p-3 rounded-lg w-full transition-colors duration-300 ${isOut ? 'bg-red-500/20 text-red-200 border border-red-500/50' : 'bg-slate-800 text-slate-300'}`}>
        <p className="text-sm font-medium">
            {isOut ? "☝️ WICKET!" : "🏏 SHOT!"} <span className="opacity-80 font-normal">{commentary}</span>
        </p>
      </div>
    </div>
  );
};

export default GameFeed;