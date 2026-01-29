/**
 * Shared types between client and server
 */
export interface AuctionItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  startingPrice: number;
  currentBid: number;
  highestBidderId: string | null;
  highestBidderName: string | null;
  auctionEndTime: number;
  bidHistory: BidEntry[];
  status: 'active' | 'ended' | 'upcoming';
}

export interface BidEntry {
  bidderId: string;
  bidderName: string;
  amount: number;
  timestamp: number;
}

export interface BidPlacedPayload {
  itemId: string;
  bidderId: string;
  bidderName: string;
  amount: number;
}

export interface UpdateBidPayload {
  itemId: string;
  currentBid: number;
  highestBidderId: string;
  highestBidderName: string;
  timestamp: number;
}

export interface BidErrorPayload {
  itemId: string;
  error: string;
  code: 'OUTBID' | 'AUCTION_ENDED' | 'INVALID_BID' | 'BID_TOO_LOW';
  currentBid: number;
}

export interface ServerTimePayload {
  serverTime: number;
}

export interface AuctionEndedPayload {
  itemId: string;
  winnerId: string | null;
  winnerName: string | null;
  finalBid: number;
}

export const SOCKET_EVENTS = {
  BID_PLACED: 'BID_PLACED',
  REQUEST_TIME_SYNC: 'REQUEST_TIME_SYNC',
  JOIN_AUCTION: 'JOIN_AUCTION',
  LEAVE_AUCTION: 'LEAVE_AUCTION',
  UPDATE_BID: 'UPDATE_BID',
  BID_ERROR: 'BID_ERROR',
  TIME_SYNC: 'TIME_SYNC',
  AUCTION_ENDED: 'AUCTION_ENDED',
  ITEMS_UPDATED: 'ITEMS_UPDATED',
} as const;
