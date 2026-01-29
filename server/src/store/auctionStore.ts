import { v4 as uuidv4 } from 'uuid';
import { AuctionItem, BidEntry } from '../types';

/**
 * In-memory auction store with mutex-like locking for race condition handling
 */
class AuctionStore {
  private items: Map<string, AuctionItem> = new Map();
  private locks: Map<string, boolean> = new Map();
  private lockQueues: Map<string, Array<() => void>> = new Map();

  constructor() {
    this.initializeSampleData();
  }

  /**
   * Initialize sample auction items
   */
  private initializeSampleData(): void {
    const now = Date.now();
    const sampleItems: AuctionItem[] = [
      {
        id: uuidv4(),
        title: 'Vintage Rolex Submariner',
        description: 'Classic 1960s Rolex Submariner in excellent condition',
        imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
        startingPrice: 5000,
        currentBid: 5000,
        highestBidderId: null,
        highestBidderName: null,
        auctionEndTime: now + 5 * 60 * 1000, // 5 minutes
        bidHistory: [],
        status: 'active',
      },
      {
        id: uuidv4(),
        title: 'Rare Pokemon Card Collection',
        description: 'First edition Charizard and complete base set',
        imageUrl: 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=400',
        startingPrice: 2500,
        currentBid: 2500,
        highestBidderId: null,
        highestBidderName: null,
        auctionEndTime: now + 8 * 60 * 1000, // 8 minutes
        bidHistory: [],
        status: 'active',
      },
      {
        id: uuidv4(),
        title: 'Antique Victorian Desk',
        description: 'Mahogany writing desk from 1880, fully restored',
        imageUrl: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400',
        startingPrice: 1200,
        currentBid: 1200,
        highestBidderId: null,
        highestBidderName: null,
        auctionEndTime: now + 3 * 60 * 1000, // 3 minutes
        bidHistory: [],
        status: 'active',
      },
      {
        id: uuidv4(),
        title: 'Signed Michael Jordan Jersey',
        description: 'Authenticated Chicago Bulls #23 jersey with COA',
        imageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400',
        startingPrice: 3000,
        currentBid: 3000,
        highestBidderId: null,
        highestBidderName: null,
        auctionEndTime: now + 10 * 60 * 1000, // 10 minutes
        bidHistory: [],
        status: 'active',
      },
      {
        id: uuidv4(),
        title: 'Limited Edition Art Print',
        description: 'Banksy "Girl with Balloon" numbered print 45/500',
        imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400',
        startingPrice: 800,
        currentBid: 800,
        highestBidderId: null,
        highestBidderName: null,
        auctionEndTime: now + 7 * 60 * 1000, // 7 minutes
        bidHistory: [],
        status: 'active',
      },
      {
        id: uuidv4(),
        title: 'Vintage Gibson Les Paul',
        description: '1959 Gibson Les Paul Standard sunburst finish',
        imageUrl: 'https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?w=400',
        startingPrice: 15000,
        currentBid: 15000,
        highestBidderId: null,
        highestBidderName: null,
        auctionEndTime: now + 12 * 60 * 1000, // 12 minutes
        bidHistory: [],
        status: 'active',
      },
    ];

    sampleItems.forEach((item) => {
      this.items.set(item.id, item);
      this.locks.set(item.id, false);
      this.lockQueues.set(item.id, []);
    });
  }

  /**
   * Acquire lock for an item (mutex pattern for handling race conditions)
   */
  private async acquireLock(itemId: string): Promise<void> {
    return new Promise((resolve) => {
      const tryAcquire = () => {
        if (!this.locks.get(itemId)) {
          this.locks.set(itemId, true);
          resolve();
        } else {
          // Add to queue and wait
          const queue = this.lockQueues.get(itemId) || [];
          queue.push(tryAcquire);
          this.lockQueues.set(itemId, queue);
        }
      };
      tryAcquire();
    });
  }

  /**
   * Release lock for an item
   */
  private releaseLock(itemId: string): void {
    this.locks.set(itemId, false);
    const queue = this.lockQueues.get(itemId) || [];
    const next = queue.shift();
    if (next) {
      this.lockQueues.set(itemId, queue);
      // Use setImmediate to allow the next queued operation to proceed
      setImmediate(next);
    }
  }

  /**
   * Get all auction items
   */
  getAllItems(): AuctionItem[] {
    const now = Date.now();
    return Array.from(this.items.values()).map((item) => ({
      ...item,
      status: item.auctionEndTime <= now ? 'ended' : 'active',
    }));
  }

  /**
   * Get a single item by ID
   */
  getItem(itemId: string): AuctionItem | undefined {
    return this.items.get(itemId);
  }

  /**
   * Place a bid with race condition protection
   * Returns success or error with reason
   */
  async placeBid(
    itemId: string,
    bidderId: string,
    bidderName: string,
    amount: number
  ): Promise<{ success: boolean; error?: string; code?: string; item?: AuctionItem }> {
    // Acquire lock to prevent race conditions
    await this.acquireLock(itemId);

    try {
      const item = this.items.get(itemId);

      if (!item) {
        return { success: false, error: 'Item not found', code: 'INVALID_BID' };
      }

      const now = Date.now();

      // Check if auction has ended
      if (item.auctionEndTime <= now) {
        return { success: false, error: 'Auction has ended', code: 'AUCTION_ENDED' };
      }

      // Check if bid is higher than current bid
      if (amount <= item.currentBid) {
        return {
          success: false,
          error: `Bid must be higher than current bid of $${item.currentBid}`,
          code: 'BID_TOO_LOW',
        };
      }

      // Check if someone already bid this amount (race condition scenario)
      // The lock ensures this check is atomic
      const bidEntry: BidEntry = {
        bidderId,
        bidderName,
        amount,
        timestamp: now,
      };

      // Update item
      item.currentBid = amount;
      item.highestBidderId = bidderId;
      item.highestBidderName = bidderName;
      item.bidHistory.push(bidEntry);

      this.items.set(itemId, item);

      return { success: true, item };
    } finally {
      // Always release the lock
      this.releaseLock(itemId);
    }
  }

  /**
   * Check and update auction statuses
   */
  checkAuctionStatuses(): AuctionItem[] {
    const now = Date.now();
    const endedAuctions: AuctionItem[] = [];

    this.items.forEach((item) => {
      if (item.status === 'active' && item.auctionEndTime <= now) {
        item.status = 'ended';
        this.items.set(item.id, item);
        endedAuctions.push(item);
      }
    });

    return endedAuctions;
  }

  /**
   * Reset auctions for demo purposes (extends time)
   */
  resetAuctions(): void {
    const now = Date.now();
    this.items.forEach((item) => {
      if (item.status === 'ended') {
        item.status = 'active';
        item.auctionEndTime = now + 5 * 60 * 1000; // Reset to 5 minutes
        item.currentBid = item.startingPrice;
        item.highestBidderId = null;
        item.highestBidderName = null;
        item.bidHistory = [];
        this.items.set(item.id, item);
      }
    });
  }
}

// Singleton instance
export const auctionStore = new AuctionStore();
