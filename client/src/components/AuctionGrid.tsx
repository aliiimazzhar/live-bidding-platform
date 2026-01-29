import React from 'react';
import { AuctionItem } from '../types';
import { AuctionCard } from './AuctionCard';
import { BidErrorPayload } from '../types';

interface AuctionGridProps {
  items: AuctionItem[];
  userId: string;
  onBid: (itemId: string, amount: number) => void;
  lastUpdatedItemId: string | null;
  bidError: BidErrorPayload | null;
  onClearError: () => void;
}

/**
 * Grid layout for auction items
 */
export const AuctionGrid: React.FC<AuctionGridProps> = ({
  items,
  userId,
  onBid,
  lastUpdatedItemId,
  bidError,
  onClearError,
}) => {
  // Sort items: active first, then by end time
  const sortedItems = [...items].sort((a, b) => {
    if (a.status === 'ended' && b.status !== 'ended') return 1;
    if (a.status !== 'ended' && b.status === 'ended') return -1;
    return a.auctionEndTime - b.auctionEndTime;
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {sortedItems.map((item) => (
        <AuctionCard
          key={item.id}
          item={item}
          userId={userId}
          onBid={onBid}
          isFlashing={lastUpdatedItemId === item.id}
          bidError={bidError?.itemId === item.id ? bidError : null}
          onClearError={onClearError}
        />
      ))}
    </div>
  );
};
