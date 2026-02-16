import React from 'react';

interface ControlsProps {
  onPlay: (num: number) => void;
  disabled: boolean;
  label: string;
}

const Controls: React.FC<ControlsProps> = ({ onPlay, disabled, label }) => {
  const numbers = [1, 2, 3, 4, 5, 6];

  return (
    <div className="w-full max-w-md mx-auto mt-6">
      <p className="text-center text-gray-400 mb-4 text-sm uppercase tracking-widest">{label}</p>
      <div className="grid grid-cols-3 gap-4 px-4">
        {numbers.map((num) => (
          <button
            key={num}
            onClick={() => onPlay(num)}
            disabled={disabled}
            className={`
              h-16 rounded-xl text-2xl font-bold transition-all duration-200 shadow-lg
              ${disabled 
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50' 
                : 'bg-white text-slate-900 hover:bg-indigo-50 hover:scale-105 active:scale-95 active:bg-indigo-100'}
            `}
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Controls;