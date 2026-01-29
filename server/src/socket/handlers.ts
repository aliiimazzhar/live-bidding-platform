import { Server, Socket } from 'socket.io';
import { auctionStore } from '../store/auctionStore';
import {
  BidPlacedPayload,
  SOCKET_EVENTS,
  UpdateBidPayload,
  BidErrorPayload,
  AuctionEndedPayload,
} from '../types';

/**
 * Socket.io event handlers for real-time bidding
 */
export function setupSocketHandlers(io: Server): void {
  io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Send initial time sync
    socket.emit(SOCKET_EVENTS.TIME_SYNC, { serverTime: Date.now() });

    // Handle time sync requests
    socket.on(SOCKET_EVENTS.REQUEST_TIME_SYNC, () => {
      socket.emit(SOCKET_EVENTS.TIME_SYNC, { serverTime: Date.now() });
    });

    // Handle bid placement
    socket.on(SOCKET_EVENTS.BID_PLACED, async (payload: BidPlacedPayload) => {
      console.log(`Bid received from ${payload.bidderName}: $${payload.amount} on item ${payload.itemId}`);

      const result = await auctionStore.placeBid(
        payload.itemId,
        payload.bidderId,
        payload.bidderName,
        payload.amount
      );

      if (result.success && result.item) {
        // Broadcast successful bid to ALL connected clients
        const updatePayload: UpdateBidPayload = {
          itemId: payload.itemId,
          currentBid: result.item.currentBid,
          highestBidderId: result.item.highestBidderId!,
          highestBidderName: result.item.highestBidderName!,
          timestamp: Date.now(),
        };

        io.emit(SOCKET_EVENTS.UPDATE_BID, updatePayload);
        console.log(`Bid accepted: $${payload.amount} by ${payload.bidderName}`);
      } else {
        // Send error only to the bidder who made the failed bid
        const item = auctionStore.getItem(payload.itemId);
        const errorPayload: BidErrorPayload = {
          itemId: payload.itemId,
          error: result.error || 'Bid failed',
          code: result.code as BidErrorPayload['code'],
          currentBid: item?.currentBid || 0,
        };

        socket.emit(SOCKET_EVENTS.BID_ERROR, errorPayload);
        console.log(`Bid rejected: ${result.error}`);
      }
    });

    // Handle joining specific auction room
    socket.on(SOCKET_EVENTS.JOIN_AUCTION, (itemId: string) => {
      socket.join(`auction:${itemId}`);
      console.log(`Client ${socket.id} joined auction: ${itemId}`);
    });

    // Handle leaving auction room
    socket.on(SOCKET_EVENTS.LEAVE_AUCTION, (itemId: string) => {
      socket.leave(`auction:${itemId}`);
      console.log(`Client ${socket.id} left auction: ${itemId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  // Periodic auction status check
  setInterval(() => {
    const endedAuctions = auctionStore.checkAuctionStatuses();

    endedAuctions.forEach((item) => {
      const payload: AuctionEndedPayload = {
        itemId: item.id,
        winnerId: item.highestBidderId,
        winnerName: item.highestBidderName,
        finalBid: item.currentBid,
      };

      io.emit(SOCKET_EVENTS.AUCTION_ENDED, payload);
      console.log(`Auction ended: ${item.title} - Winner: ${item.highestBidderName || 'No winner'}`);
    });
  }, 1000); // Check every second

  // Periodic time sync broadcast (every 30 seconds)
  setInterval(() => {
    io.emit(SOCKET_EVENTS.TIME_SYNC, { serverTime: Date.now() });
  }, 30000);
}
