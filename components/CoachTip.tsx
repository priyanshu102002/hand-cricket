import React from 'react';

interface CoachTipProps {
  tip: string | null;
  loading: boolean;
}

const CoachTip: React.FC<CoachTipProps> = ({ tip, loading }) => {
  if (!tip && !loading) return null;

  return (
    <div className="w-full max-w-md mx-auto mb-4 px-4">
      <div className="bg-indigo-900/40 border border-indigo-500/30 rounded-lg p-3 flex items-start gap-3">
        <div className="mt-1 text-xl">🤖</div>
        <div className="flex-1">
          <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1">
            Gemini Coach
          </h4>
          {loading ? (
            <div className="h-4 w-3/4 bg-indigo-500/20 rounded animate-pulse"></div>
          ) : (
            <p className="text-sm text-indigo-100 italic">"{tip}"</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoachTip;