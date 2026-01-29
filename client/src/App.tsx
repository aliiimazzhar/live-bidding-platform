import React, { useEffect, useState } from 'react';
import { Header, AuctionGrid, LoadingSpinner, ErrorMessage } from './components';
import { useAuction } from './hooks/useAuction';
import { socketService } from './services/socket';
import { resetAuctions } from './services/api';

/**
 * Main App Component
 */
const App: React.FC = () => {
  const {
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
  } = useAuction();

  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    const handleConnect = () => setConnectionStatus('connected');
    const handleDisconnect = () => setConnectionStatus('disconnected');
    const handleConnecting = () => setConnectionStatus('connecting');

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('reconnect_attempt', handleConnecting);

    // Initial status
    setConnectionStatus(socket.connected ? 'connected' : 'connecting');

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('reconnect_attempt', handleConnecting);
    };
  }, []);

  const handleReset = async () => {
    try {
      await resetAuctions();
      window.location.reload();
    } catch (err) {
      console.error('Failed to reset auctions:', err);
    }
    setShowResetConfirm(false);
  };

  // Count active auctions and user's winning bids
  const activeAuctions = items.filter((item) => item.status === 'active').length;
  const winningBids = items.filter(
    (item) => item.highestBidderId === userId && item.status === 'active'
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header
        userName={userName}
        onUserNameChange={setUserName}
        connectionStatus={connectionStatus}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-slate-800">{activeAuctions}</span>
              <span className="text-sm text-slate-500">Active Auctions</span>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-green-500">{winningBids}</span>
              <span className="text-sm text-slate-500">Winning Bids</span>
            </div>
          </div>

          {/* Demo Reset Button */}
          <div className="relative">
            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-4 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Reset Demo
            </button>

            {showResetConfirm && (
              <div className="absolute right-0 top-12 bg-white rounded-lg shadow-xl border border-slate-200 p-4 z-50 w-64">
                <p className="text-sm text-slate-600 mb-4">
                  Reset all auctions to their starting state?
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReset}
                    className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorMessage message={error} onRetry={() => window.location.reload()} />
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500">No auction items available</p>
          </div>
        ) : (
          <AuctionGrid
            items={items}
            userId={userId}
            onBid={placeBid}
            lastUpdatedItemId={lastUpdatedItemId}
            bidError={bidError}
            onClearError={clearBidError}
          />
        )}

        {/* Footer Info */}
        <div className="mt-12 text-center text-sm text-slate-400">
          <p>
            Real-time bidding powered by Socket.io • Server-synced timers prevent manipulation
          </p>
          <p className="mt-1">
            Your Bidder ID: <code className="bg-slate-100 px-2 py-0.5 rounded">{userId}</code>
          </p>
        </div>
      </main>
    </div>
  );
};

export default App;
