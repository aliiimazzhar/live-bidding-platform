import React from 'react';
import { useCountdown } from '../hooks/useCountdown';

interface CountdownTimerProps {
  endTime: number;
  onEnd?: () => void;
}

/**
 * Synchronized countdown timer component
 * Uses server time to prevent client-side manipulation
 */
export const CountdownTimer: React.FC<CountdownTimerProps> = ({ endTime, onEnd }) => {
  const countdown = useCountdown(endTime, { onEnd });

  if (countdown.isExpired) {
    return (
      <div className="flex items-center gap-2">
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
        <span className="text-red-600 font-semibold">Auction Ended</span>
      </div>
    );
  }

  const urgencyClasses = {
    normal: 'text-slate-600',
    warning: 'text-amber-500 font-semibold',
    urgent: 'text-red-500 font-bold animate-pulse',
  };

  return (
    <div className="flex items-center gap-2">
      <svg
        className={`w-4 h-4 ${urgencyClasses[countdown.urgencyLevel]}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span className={`font-mono ${urgencyClasses[countdown.urgencyLevel]}`}>
        {countdown.formattedTime}
      </span>
      {countdown.urgencyLevel === 'urgent' && (
        <span className="text-xs text-red-500 uppercase tracking-wide">Ending Soon!</span>
      )}
    </div>
  );
};
