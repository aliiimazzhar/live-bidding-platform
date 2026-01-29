import { useState, useEffect, useCallback } from 'react';
import { socketService } from '../services/socket';
import { fetchItems } from '../services/api';
import {
  AuctionItem,
  UpdateBidPayload,
  BidErrorPayload,
  AuctionEndedPayload,
  ServerTimePayload,
  BidPlacedPayload,
  SOCKET_EVENTS,
} from '../types';

interface UseAuctionResult {
  items: AuctionItem[];
  loading: boolean;
  error: string | null;
  bidError: BidErrorPayload | null;
  placeBid: (itemId: string, amount: number) => void;
  clearBidError: () => void;
  lastUpdatedItemId: string | null;
  userId: string;
  userName: string;
  setUserName: (name: string) => void;
}

/**
 * Custom hook for managing auction state with real-time updates
 */
export function useAuction(): UseAuctionResult {
  const [items, setItems] = useState<AuctionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bidError, setBidError] = useState<BidErrorPayload | null>(null);
  const [lastUpdatedItemId, setLastUpdatedItemId] = useState<string | null>(null);
  const [userId] = useState(() => {
    // Get or create persistent user ID
    let id = localStorage.getItem('bidder_id');
    if (!id) {
      id = `user_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('bidder_id', id);
    }
    return id;
  });
  const [userName, setUserNameState] = useState(() => {
    return localStorage.getItem('bidder_name') || `Bidder ${Math.floor(Math.random() * 1000)}`;
  });

  const setUserName = useCallback((name: string) => {
    localStorage.setItem('bidder_name', name);
    setUserNameState(name);
  }, []);

  // Initialize socket connection and fetch items
  useEffect(() => {
    const socket = socketService.connect();

    const loadItems = async () => {
      try {
        setLoading(true);
        const { items: fetchedItems, serverTime } = await fetchItems();
        socketService.updateTimeOffset(serverTime);
        setItems(fetchedItems);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load items');
      } finally {
        setLoading(false);
      }
    };

    loadItems();

    // Socket event handlers
    const handleTimeSync = (payload: ServerTimePayload) => {
      socketService.updateTimeOffset(payload.serverTime);
    };

    const handleUpdateBid = (payload: UpdateBidPayload) => {
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === payload.itemId
            ? {
                ...item,
                currentBid: payload.currentBid,
                highestBidderId: payload.highestBidderId,
                highestBidderName: payload.highestBidderName,
              }
            : item
        )
      );
      setLastUpdatedItemId(payload.itemId);
      
      // Clear the flash effect after animation
      setTimeout(() => setLastUpdatedItemId(null), 500);
    };

    const handleBidError = (payload: BidErrorPayload) => {
      setBidError(payload);
      
      // Update local state with server's current bid
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === payload.itemId
            ? { ...item, currentBid: payload.currentBid }
            : item
        )
      );
    };

    const handleAuctionEnded = (payload: AuctionEndedPayload) => {
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === payload.itemId
            ? {
                ...item,
                status: 'ended' as const,
                highestBidderId: payload.winnerId,
                highestBidderName: payload.winnerName,
                currentBid: payload.finalBid,
              }
            : item
        )
      );
    };

    socket.on(SOCKET_EVENTS.TIME_SYNC, handleTimeSync);
    socket.on(SOCKET_EVENTS.UPDATE_BID, handleUpdateBid);
    socket.on(SOCKET_EVENTS.BID_ERROR, handleBidError);
    socket.on(SOCKET_EVENTS.AUCTION_ENDED, handleAuctionEnded);

    // Request time sync on connect
    socket.emit(SOCKET_EVENTS.REQUEST_TIME_SYNC);

    return () => {
      socket.off(SOCKET_EVENTS.TIME_SYNC, handleTimeSync);
      socket.off(SOCKET_EVENTS.UPDATE_BID, handleUpdateBid);
      socket.off(SOCKET_EVENTS.BID_ERROR, handleBidError);
      socket.off(SOCKET_EVENTS.AUCTION_ENDED, handleAuctionEnded);
    };
  }, []);

  const placeBid = useCallback(
    (itemId: string, amount: number) => {
      const socket = socketService.getSocket();
      if (!socket) {
        setBidError({
          itemId,
          error: 'Not connected to server',
          code: 'INVALID_BID',
          currentBid: 0,
        });
        return;
      }

      const payload: BidPlacedPayload = {
        itemId,
        bidderId: userId,
        bidderName: userName,
        amount,
      };

      socket.emit(SOCKET_EVENTS.BID_PLACED, payload);
    },
    [userId, userName]
  );

  const clearBidError = useCallback(() => {
    setBidError(null);
  }, []);

  return {
    items,
    loading,
    error,
    bidError,
    placeBid,
    clearBidError,
    lastUpdatedItemId,
    userId,
    userName,
    setUserName,
  };
}
