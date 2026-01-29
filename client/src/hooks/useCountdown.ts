import { useState, useEffect, useRef } from 'react';
import { socketService } from '../services/socket';

interface UseCountdownOptions {
  onEnd?: () => void;
}

interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  isExpired: boolean;
  formattedTime: string;
  urgencyLevel: 'normal' | 'warning' | 'urgent';
}

/**
 * Calculate countdown values using server-synced time
 */
function calculateCountdown(end: number): CountdownResult {
  const now = socketService.getServerTime();
  const diff = Math.max(0, end - now);
  
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let urgencyLevel: 'normal' | 'warning' | 'urgent' = 'normal';
  if (totalSeconds <= 30) {
    urgencyLevel = 'urgent';
  } else if (totalSeconds <= 60) {
    urgencyLevel = 'warning';
  }

  let formattedTime: string;
  if (days > 0) {
    formattedTime = `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    formattedTime = `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    formattedTime = `${minutes}m ${seconds}s`;
  } else {
    formattedTime = `${seconds}s`;
  }

  return {
    days,
    hours,
    minutes,
    seconds,
    totalSeconds,
    isExpired: diff <= 0,
    formattedTime,
    urgencyLevel,
  };
}

/**
 * Custom hook for synchronized countdown timer
 * Uses server time to prevent client-side manipulation
 */
export function useCountdown(endTime: number, options?: UseCountdownOptions): CountdownResult {
  const [countdown, setCountdown] = useState<CountdownResult>(() => calculateCountdown(endTime));
  const intervalRef = useRef<number | null>(null);
  const hasEndedRef = useRef(false);

  useEffect(() => {
    hasEndedRef.current = false;

    const updateCountdown = () => {
      const result = calculateCountdown(endTime);
      setCountdown(result);

      if (result.isExpired && !hasEndedRef.current) {
        hasEndedRef.current = true;
        options?.onEnd?.();
      }
    };

    updateCountdown();
    intervalRef.current = window.setInterval(updateCountdown, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [endTime, options]);

  return countdown;
}
