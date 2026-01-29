import { Router, Request, Response } from 'express';
import { auctionStore } from '../store/auctionStore';

const router = Router();

/**
 * GET /api/items
 * Returns all auction items with current status
 */
router.get('/items', (_req: Request, res: Response) => {
  try {
    const items = auctionStore.getAllItems();
    res.json({
      success: true,
      data: items,
      serverTime: Date.now(),
    });
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch items',
    });
  }
});

/**
 * GET /api/items/:id
 * Returns a single auction item
 */
router.get('/items/:id', (req: Request, res: Response) => {
  try {
    const item = auctionStore.getItem(req.params.id);
    
    if (!item) {
      res.status(404).json({
        success: false,
        error: 'Item not found',
      });
      return;
    }

    res.json({
      success: true,
      data: item,
      serverTime: Date.now(),
    });
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch item',
    });
  }
});

/**
 * GET /api/time
 * Returns current server time for synchronization
 */
router.get('/time', (_req: Request, res: Response) => {
  res.json({
    serverTime: Date.now(),
  });
});

/**
 * POST /api/reset
 * Reset all auctions (for demo purposes)
 */
router.post('/reset', (_req: Request, res: Response) => {
  try {
    auctionStore.resetAuctions();
    const items = auctionStore.getAllItems();
    res.json({
      success: true,
      message: 'Auctions reset successfully',
      data: items,
    });
  } catch (error) {
    console.error('Error resetting auctions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset auctions',
    });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: Date.now(),
  });
});

export default router;
