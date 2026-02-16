import React from 'react';
import { TEAMS } from '../constants';
import { GameStatus, Venue } from '../types';

interface ScoreBoardProps {
  indiaScore: number;
  pakistanScore: number;
  status: GameStatus;
  target: number | null;
  venue?: Venue | null;
}

const ScoreBoard: React.FC<ScoreBoardProps> = ({ indiaScore, pakistanScore, status, target, venue }) => {
  const isIndiaBatting = status === GameStatus.INNINGS_1;
  const isPakistanBatting = status === GameStatus.INNINGS_2;

  return (
    <section className="w-full bg-slate-800 p-4 rounded-2xl shadow-xl border border-slate-700 mb-6" aria-label="Scoreboard">
      
      {/* Venue Header (Google Maps Grounding) */}
      {venue && (
          <div className="w-full text-center mb-4 border-b border-slate-700 pb-2">
            <p className="text-xs text-slate-400 uppercase tracking-widest">Live from</p>
            {venue.url ? (
                <a 
                    href={venue.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-sm font-bold text-blue-300 hover:text-blue-200 hover:underline flex items-center justify-center gap-1"
                >
                    📍 {venue.name} <span className="text-[10px] opacity-70">↗</span>
                </a>
            ) : (
                <p className="text-sm font-bold text-slate-300">📍 {venue.name}</p>
            )}
          </div>
      )}

      <div className="flex justify-between items-center">
        {/* India Side */}
        <div className={`flex flex-col items-center flex-1 ${isIndiaBatting ? 'opacity-100 scale-105 transition-transform' : 'opacity-70'}`}>
          <span className="text-4xl mb-1" role="img" aria-label="India Flag">{TEAMS.INDIA.flag}</span>
          <h3 className={`font-bold uppercase tracking-wider ${TEAMS.INDIA.color}`}>India</h3>
          <p className="text-3xl font-bold mt-1" aria-label={`India Score: ${indiaScore}`}>{indiaScore}</p>
          {isIndiaBatting && <span className="text-xs text-blue-300 animate-pulse mt-1">Batting</span>}
        </div>

        {/* VS / Status */}
        <div className="px-4 flex flex-col items-center justify-center">
          <div className="text-slate-500 font-bold text-xl" aria-hidden="true">VS</div>
          {target && (
            <div className="mt-2 bg-slate-900 px-3 py-1 rounded text-xs text-yellow-400 border border-yellow-400/30" role="status">
              Target: {target}
            </div>
          )}
        </div>

        {/* Pakistan Side */}
        <div className={`flex flex-col items-center flex-1 ${isPakistanBatting ? 'opacity-100 scale-105 transition-transform' : 'opacity-70'}`}>
          <span className="text-4xl mb-1" role="img" aria-label="Pakistan Flag">{TEAMS.PAKISTAN.flag}</span>
          <h3 className={`font-bold uppercase tracking-wider ${TEAMS.PAKISTAN.color}`}>Pakistan</h3>
          <p className="text-3xl font-bold mt-1" aria-label={`Pakistan Score: ${pakistanScore}`}>{pakistanScore}</p>
          {isPakistanBatting && <span className="text-xs text-green-300 animate-pulse mt-1">Batting</span>}
        </div>
      </div>
      
      {/* Innings Indicator Bar */}
      <div className="w-full h-1 bg-slate-700 mt-4 rounded-full overflow-hidden flex" role="progressbar" aria-valuenow={status === GameStatus.INNINGS_1 ? 0 : 50} aria-valuemin={0} aria-valuemax={100} aria-label="Match Progress">
        <div 
          className={`h-full transition-all duration-500 ${TEAMS.INDIA.bgColor}`} 
          style={{ width: status === GameStatus.INNINGS_1 ? '100%' : (status === GameStatus.MENU ? '50%' : '0%') }}
        ></div>
        <div 
          className={`h-full transition-all duration-500 ${TEAMS.PAKISTAN.bgColor}`} 
          style={{ width: status === GameStatus.INNINGS_2 ? '100%' : (status === GameStatus.MENU ? '50%' : '0%') }}
        ></div>
      </div>
    </section>
  );
};

export default React.memo(ScoreBoard);