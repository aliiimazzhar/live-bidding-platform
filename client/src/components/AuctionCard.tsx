import React, { useState, useEffect, useCallback } from 'react';
import { AuctionItem } from '../types';
import { CountdownTimer } from './CountdownTimer';

interface AuctionCardProps {
  item: AuctionItem;
  userId: string;
  onBid: (itemId: string, amount: number) => void;
  isFlashing: boolean;
  bidError: { itemId: string; error: string } | null;
  onClearError: () => void;
}

/**
 * Auction item card with real-time updates and visual feedback
 */
export const AuctionCard: React.FC<AuctionCardProps> = ({
  item,
  userId,
  onBid,
  isFlashing,
  bidError,
  onClearError,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [previousBid, setPreviousBid] = useState(item.currentBid);
  const [showError, setShowError] = useState(false);

  const isWinning = item.highestBidderId === userId;
  const isEnded = item.status === 'ended';
  const bidIncrement = 10;

  // Handle bid animation
  useEffect(() => {
    if (item.currentBid !== previousBid) {
      setIsAnimating(true);
      setPreviousBid(item.currentBid);
      
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [item.currentBid, previousBid]);

  // Handle error display
  useEffect(() => {
    if (bidError?.itemId === item.id) {
      setShowError(true);
      const timer = setTimeout(() => {
        setShowError(false);
        onClearError();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [bidError, item.id, onClearError]);

  const handleBid = useCallback(() => {
    if (!isEnded) {
      const newBid = item.currentBid + bidIncrement;
      onBid(item.id, newBid);
    }
  }, [item.id, item.currentBid, isEnded, onBid, bidIncrement]);

  // Determine card styling based on state
  const getCardClasses = () => {
    let classes = 'relative bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 ';
    
    if (isEnded) {
      classes += 'opacity-75 grayscale ';
    } else if (isFlashing || isAnimating) {
      classes += isWinning ? 'bid-flash-green ' : 'bid-flash-green ';
    }
    
    if (isWinning && !isEnded) {
      classes += 'ring-2 ring-green-400 ring-offset-2 ';
    }

    return classes;
  };

  return (
    <div className={getCardClasses()}>
      {/* Status Badge */}
      {isWinning && !isEnded && (
        <div className="absolute top-3 right-3 z-10">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500 text-white text-sm font-semibold shadow-lg animate-pulse">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Winning
          </span>
        </div>
      )}

      {isEnded && (
        <div className="absolute top-3 right-3 z-10">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-600 text-white text-sm font-semibold shadow-lg">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            Ended
          </span>
        </div>
      )}

      {/* Outbid Error */}
      {showError && bidError?.itemId === item.id && (
        <div className="absolute top-3 left-3 right-16 z-10">
          <div className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm font-medium shadow-lg animate-bounce-once">
            {bidError.error}
          </div>
        </div>
      )}

      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={item.imageUrl}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=No+Image';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-bold text-slate-800 mb-1 line-clamp-1">
          {item.title}
        </h3>
        <p className="text-sm text-slate-500 mb-4 line-clamp-2">
          {item.description}
        </p>

        {/* Price Display */}
        <div className="mb-4">
          <div className="flex items-baseline gap-2">
            <span className="text-sm text-slate-500">Current Bid:</span>
            <span 
              className={`text-2xl font-bold transition-all duration-300 ${
                isAnimating ? 'text-green-500 scale-110' : 'text-slate-800'
              }`}
            >
              ${item.currentBid.toLocaleString()}
            </span>
          </div>
          {item.highestBidderName && (
            <p className="text-xs text-slate-400 mt-1">
              by {item.highestBidderName}
              {isWinning && ' (You)'}
            </p>
          )}
        </div>

        {/* Countdown Timer */}
        <div className="mb-4 py-2 px-3 bg-slate-50 rounded-lg">
          <CountdownTimer endTime={item.auctionEndTime} />
        </div>

        {/* Bid Button */}
        <button
          onClick={handleBid}
          disabled={isEnded}
          className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${
            isEnded
              ? 'bg-slate-300 cursor-not-allowed'
              : isWinning
              ? 'bg-green-500 hover:bg-green-600 active:scale-95'
              : 'bg-blue-500 hover:bg-blue-600 active:scale-95'
          }`}
        >
          {isEnded ? (
            <>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Auction Closed
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Bid ${(item.currentBid + bidIncrement).toLocaleString()}
            </>
          )}
        </button>

        {/* Starting Price Reference */}
        <p className="text-xs text-slate-400 text-center mt-2">
          Started at ${item.startingPrice.toLocaleString()}
        </p>
      </div>
    </div>
  );
};
