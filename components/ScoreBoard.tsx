import React from 'react';
import { TEAMS } from '../constants';
import { GameStatus } from '../types';

interface ScoreBoardProps {
  indiaScore: number;
  pakistanScore: number;
  status: GameStatus;
  target: number | null;
}

const ScoreBoard: React.FC<ScoreBoardProps> = ({ indiaScore, pakistanScore, status, target }) => {
  const isIndiaBatting = status === GameStatus.INNINGS_1;
  const isPakistanBatting = status === GameStatus.INNINGS_2;
  const isGameOver = status === GameStatus.GAME_OVER;

  return (
    <div className="w-full bg-slate-800 p-4 rounded-2xl shadow-xl border border-slate-700 mb-6">
      <div className="flex justify-between items-center">
        {/* India Side */}
        <div className={`flex flex-col items-center flex-1 ${isIndiaBatting ? 'opacity-100 scale-105 transition-transform' : 'opacity-70'}`}>
          <span className="text-4xl mb-1">{TEAMS.INDIA.flag}</span>
          <h3 className={`font-bold uppercase tracking-wider ${TEAMS.INDIA.color}`}>India</h3>
          <p className="text-3xl font-bold mt-1">{indiaScore}{status === GameStatus.INNINGS_1 ? '' : (status === GameStatus.MENU ? '' : '')}</p>
          {isIndiaBatting && <span className="text-xs text-blue-300 animate-pulse mt-1">Batting</span>}
        </div>

        {/* VS / Status */}
        <div className="px-4 flex flex-col items-center justify-center">
          <div className="text-slate-500 font-bold text-xl">VS</div>
          {target && (
            <div className="mt-2 bg-slate-900 px-3 py-1 rounded text-xs text-yellow-400 border border-yellow-400/30">
              Target: {target}
            </div>
          )}
        </div>

        {/* Pakistan Side */}
        <div className={`flex flex-col items-center flex-1 ${isPakistanBatting ? 'opacity-100 scale-105 transition-transform' : 'opacity-70'}`}>
          <span className="text-4xl mb-1">{TEAMS.PAKISTAN.flag}</span>
          <h3 className={`font-bold uppercase tracking-wider ${TEAMS.PAKISTAN.color}`}>Pakistan</h3>
          <p className="text-3xl font-bold mt-1">{pakistanScore}</p>
          {isPakistanBatting && <span className="text-xs text-green-300 animate-pulse mt-1">Batting</span>}
        </div>
      </div>
      
      {/* Innings Indicator Bar */}
      <div className="w-full h-1 bg-slate-700 mt-4 rounded-full overflow-hidden flex">
        <div 
          className={`h-full transition-all duration-500 ${TEAMS.INDIA.bgColor}`} 
          style={{ width: status === GameStatus.INNINGS_1 ? '100%' : (status === GameStatus.MENU ? '50%' : '0%') }}
        ></div>
        <div 
          className={`h-full transition-all duration-500 ${TEAMS.PAKISTAN.bgColor}`} 
          style={{ width: status === GameStatus.INNINGS_2 ? '100%' : (status === GameStatus.MENU ? '50%' : '0%') }}
        ></div>
      </div>
    </div>
  );
};

export default ScoreBoard;