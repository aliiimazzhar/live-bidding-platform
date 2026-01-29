import { AuctionItem } from '../types';

const API_URL = import.meta.env.PROD ? '' : 'http://localhost:3001';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  serverTime: number;
  error?: string;
}

/**
 * Fetch all auction items
 */
export async function fetchItems(): Promise<{ items: AuctionItem[]; serverTime: number }> {
  const response = await fetch(`${API_URL}/api/items`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch items');
  }

  const result: ApiResponse<AuctionItem[]> = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch items');
  }

  return { items: result.data, serverTime: result.serverTime };
}

/**
 * Fetch a single auction item
 */
export async function fetchItem(itemId: string): Promise<{ item: AuctionItem; serverTime: number }> {
  const response = await fetch(`${API_URL}/api/items/${itemId}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch item');
  }

  const result: ApiResponse<AuctionItem> = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch item');
  }

  return { item: result.data, serverTime: result.serverTime };
}

/**
 * Fetch server time for synchronization
 */
export async function fetchServerTime(): Promise<number> {
  const response = await fetch(`${API_URL}/api/time`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch server time');
  }

  const result = await response.json();
  return result.serverTime;
}

/**
 * Reset all auctions (for demo purposes)
 */
export async function resetAuctions(): Promise<AuctionItem[]> {
  const response = await fetch(`${API_URL}/api/reset`, {
    method: 'POST',
  });
  
  if (!response.ok) {
    throw new Error('Failed to reset auctions');
  }

  const result: ApiResponse<AuctionItem[]> = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to reset auctions');
  }

  return result.data;
}
