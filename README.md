# 🔨 Live Bidding Platform

A real-time auction platform where users compete to buy items in the final seconds. Features server-synchronized timers, race condition handling, and instant visual feedback.

## ✨ Features

### Backend (Node.js + Socket.io)
- **REST API**: `GET /api/items` returns auction items with current bids and end times
- **Real-Time Bidding**: Socket.io for instant bid updates across all clients
- **Race Condition Handling**: Mutex-lock pattern ensures only ONE bid wins when multiple users bid simultaneously

### Frontend (React + Tailwind CSS)
- **Live Dashboard**: Responsive grid of auction items with real-time updates
- **Server-Synced Timers**: Countdown timers use server time - cannot be manipulated client-side
- **Visual Feedback**:
  - ✅ Green flash animation when new bids arrive
  - 🏆 "Winning" badge when you're the highest bidder
  - ❌ Instant "Outbid" error notifications

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/live-bidding-platform.git
cd live-bidding-platform

# Install all dependencies
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..
```

### Running the Application

```bash
# Terminal 1 - Start the backend server
cd server
npm run dev
# Server runs at http://localhost:3001

# Terminal 2 - Start the frontend
cd client
npm run dev
# Frontend runs at http://localhost:5173
```

---

## 🧪 Testing the Synchronization Features

### 1. Testing Server-Synced Countdown Timers

The countdown timers are protected against client-side manipulation. Here's how it works and how to verify:

**How it works:**
```
1. Client connects → Server sends current server time
2. Client calculates offset: serverTime - clientTime
3. All countdowns use: Date.now() + offset
4. Time sync refreshes every 30 seconds via Socket.io
```

**To test:**
1. Open the app in your browser
2. Open Developer Tools (F12) → Console
3. Try changing your system clock - the countdown will NOT be affected
4. The timer uses `socketService.getServerTime()` which always references server time

**Code location:** [client/src/hooks/useCountdown.ts](client/src/hooks/useCountdown.ts)

---

### 2. Testing Race Condition Handling

When two users bid at the exact same millisecond, only ONE bid should be accepted.

**How it works:**
```typescript
async placeBid(itemId, amount) {
  await this.acquireLock(itemId);  // Only one bid processes at a time
  try {
    if (amount > currentBid) {
      // Accept bid
    } else {
      // Reject - someone was faster
    }
  } finally {
    this.releaseLock(itemId);
  }
}
```

**To test:**
1. Open 3+ browser tabs/windows to http://localhost:5173
2. Set a different username in each tab (click on your name in header)
3. Find the same auction item in all tabs
4. Position the "Bid" buttons so you can see all of them
5. **Click "Bid" in all tabs as fast as possible (almost simultaneously)**
6. **Result:** Only ONE bid will be accepted. Other tabs will show "Outbid" error

**Code location:** [server/src/store/auctionStore.ts](server/src/store/auctionStore.ts)

---

### 3. Testing Real-Time Bid Updates

All connected clients should see bid updates instantly.

**To test:**
1. Open the app in 2 different browser windows side by side
2. Place a bid in Window A
3. **Watch Window B** - the price should update with a green flash animation immediately
4. The highest bidder's name updates in real-time

---

## 📡 API Reference

### REST Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/items` | Get all auction items |
| GET | `/api/items/:id` | Get single item |
| GET | `/api/time` | Get server time |
| POST | `/api/reset` | Reset all auctions (demo) |
| GET | `/api/health` | Health check |

### Socket Events

**Client → Server:**
| Event | Payload | Description |
|-------|---------|-------------|
| `BID_PLACED` | `{ itemId, bidderId, bidderName, amount }` | Place a bid |
| `REQUEST_TIME_SYNC` | - | Request server time |

**Server → Client:**
| Event | Payload | Description |
|-------|---------|-------------|
| `UPDATE_BID` | `{ itemId, currentBid, highestBidderId }` | Bid accepted |
| `BID_ERROR` | `{ itemId, error, code }` | Bid rejected |
| `TIME_SYNC` | `{ serverTime }` | Server time for sync |
| `AUCTION_ENDED` | `{ itemId, winnerId, finalBid }` | Auction completed |

---

## 📁 Project Structure

```
live-bidding-platform/
├── server/
│   └── src/
│       ├── index.ts              # Express + Socket.io server
│       ├── routes/api.ts         # REST endpoints
│       ├── socket/handlers.ts    # Real-time event handlers
│       ├── store/auctionStore.ts # In-memory store with mutex locks
│       └── types/index.ts        # TypeScript types
├── client/
│   └── src/
│       ├── App.tsx               # Main component
│       ├── components/           # UI components
│       │   ├── AuctionCard.tsx   # Item card with bid button
│       │   ├── AuctionGrid.tsx   # Grid layout
│       │   ├── CountdownTimer.tsx # Server-synced timer
│       │   └── Header.tsx        # App header
│       ├── hooks/
│       │   ├── useAuction.ts     # Auction state management
│       │   └── useCountdown.ts   # Synchronized countdown
│       └── services/
│           ├── api.ts            # REST API client
│           └── socket.ts         # Socket.io client + time sync
└── package.json
```

---

## 🔐 Security Features

1. **Server-Authoritative Time**: Clients cannot manipulate countdown timers
2. **Server-Side Bid Validation**: All bids are validated on the server
3. **Atomic Bid Processing**: Mutex locks prevent race conditions
4. **Real-Time State Sync**: Clients always receive the true state from server

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express, Socket.io, TypeScript
- **Frontend**: React 18, Vite, Tailwind CSS, TypeScript
- **Real-Time**: WebSocket (Socket.io)

---

## 📄 License

MIT License
