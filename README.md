```
competi-app/
│
├── .env
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
│
├── public/                    
│
├── src/
│   ├── pages/                 
│   │   ├── market/[id].tsx    # Single market details & place bet
│   │   ├── cashout.tsx        # Cashout positions page
│   │   └── api/               # API routes (server-side logic)
│   │       ├── markets/
│   │       │   ├── index.ts   # GET markets list (Gamma)
│   │       │   └── [id].ts    # GET single market details (Gamma)
|   |       ├── session        #Create token and url
|   |       |   ├── create.ts  #Create jwt token and url
│   │       ├── positions.ts   # GET user positions (CLOB data API)
│   │       ├── cashout.ts     # POST to cashout (CLOB order)
│   │       ├── placeOrder.ts  # POST to place bet (CLOB order)
│   │       └── trades.ts      # GET recent trades (CLOB data API)
│   │
│   ├── components/            
│   │   ├── PriceChart.tsx
│   │
│   ├── lib/                    # API client wrappers & utils
│   │   ├── gammaClient.ts      # Wrap Gamma API calls
│   │   ├── clobClient.ts       # Wrap CLOB API calls
│   │   ├── auth.ts             # Wallet signing/auth helpers
│   │   └── config.ts           # Reads values from .env
│   │
│   ├── hooks/                  # React hooks for live data
│   │   ├── useMarketHistory.ts
│   │   ├── useMarketData.ts
│   │   ├── usePositions.ts
│   │   ├── useCashout.ts
│   │   └── usePlaceOrder.ts
│   │
│   ├── styles/
│   │   └── globals.css
│   │

```


Flow Diagram: [React Component] → [Hook] → [/api Route] → [lib Client Wrapper] → [Polymarket API] → back to frontend

CashoutButton click → useCashout() → POST /api/cashout?tokenId=123
→ lib/clobClient.cashoutPosition("123")
→ Polymarket CLOB API
→ return success → update UI 

## 1️⃣Create a session token
**POST** http://localhost:3000/api/session/create
**Request Body:**
```json
{
  "discordId": "123456789" // any test Discord user ID
}

Response: {
  "url": "http://localhost:3000/cashout?token=abc123",
  "token": "abc123"
}
```
Use this token in the next API calls.

## 2️⃣ Fetch open positions
**GET** http://localhost:3000/api/positions?token=abc123
```json 
Response: 
[
  {
    "positionId": "pos_1",
    "marketId": "0x123",
    "outcome": "YES",
    "size": 10,
    "price": 0.55,
    "currentCashout": 5.5
  }
]
```

## 3️⃣ Place a bet
**POST** http://localhost:3000/api/placeOrders
**Request Body:**
```json 
 {
  "token": "abc123",
  "tokenId": "502517",     // Gamma market ID
  "amount": 10,           // how much to bet
}
Response: {
  "orderId": "order_1",
  "status": "success",
  "price": 0.556,   // actual price used from CLOB
  "details": { ... }
}
```

## 4️⃣ Cashout a position
**POST** http://localhost:3000/api/cashout
```json
Request Body: {
  "token": "abc123",
  "tokenId": "pos_1",   // position ID you want to cashout
  "amount": 10,         // partial or full position
}
Response: {
  "orderId": "order_2",
  "status": "success",
  "price": 0.602,   // actual price used from CLOB
  "details": { ... }
}
```

The Discord ID is a unique numeric identifier for every Discord user. It’s assigned by Discord itself, not by the app. Enable “Developer Mode” in Discord:
Go to User Settings → Advanced → Developer Mode → ON
Right-click a user → Copy ID
That copied ID is exactly what the Discord bot will receive whenever a user interacts with it (slash commands, button clicks, etc.).

Gamma API gives all the market metadata: question, outcomes (Yes/No), start/end date, etc. When we place a bet, the backend sends an order to CLOB with that marketId and the selected outcome (Yes or No).The price is what we want to buy at, and amount is how much we’re betting.
*	Backend doesn’t need to know which market the user is interacting with in Discord ahead of time.
*	Discord bot: when the user clicks /bet or /cashout in Discord, the bot knows which market or outcome the user selected.
*	The bot then sends a request to backend (or generates a session token URL) that’s tied to that Discord ID.
*	Backend workflow:
1.	Receive session token from frontend (generated via Discord ID).
2.	Look up the wallet address associated with that Discord ID.
3.	Use the token + request body (amount, price, and for cashout, position ID) to place the order.
⦁	Market ID in placeOrders: comes from the Discord bot’s context, not something the frontend or backend decides.
⦁	Handle the request with token + wallet + amount/price and send it to Polymarket/CLOB. 

1.	Cashout is accurate → always sells at the highest bid price from CLOB.
2.	Bet pricing is accurate → always buys at the lowest ask price from CLOB.
3.	Frontend no longer sends price → avoids stale or outdated prices.



Gamma API (Market Data)

Base URL: https://gamma-api.polymarket.com
1. List Markets
Endpoint: GET /markets
Example:
https://gamma-api.polymarket.com/markets?limit=50&offset=0&active=true

2. Get Single Market Details
Endpoint: GET /markets/{marketId}

3. Historical Price Data (Candles / Timeseries)
Endpoints: GET /markets/{marketId}/candles
Or under “Pricing and Books”: timeseries endpoints
Purpose: Build charts/trend visualizations

4. Fetch Events (Market Grouping)
Endpoint: GET /events
Example:
https://gamma-api.polymarket.com/events?active=true
Use for: Displaying grouped markets by event, sorting, tags, etc.

CLOB API (Trading & Cashout)
Base URLs:
REST: https://clob.polymarket.com
WebSocket: wss://ws-subscriptions-clob.polymarket.com/ws/
Data-only endpoints (e.g., positions): https://data-api.polymarket.com

1. List CLOB Markets (for trading)
Endpoint: GET /markets?next_cursor={cursor}
Usage: Paginated list of all active/tradable markets via CLOB

2. Get Order Book (Live Book via REST)
Endpoint: GET /book/{marketId} or similar REST path (e.g., /books)
Purpose: Retrieve current bids, asks, midpoints for market

3. Place Buy/Sell Order (including cashout)
Endpoint: POST /order
Payload: Signed limit or market order (with EIP-712 data such as price, size, tokenId, side, expiration, signature, etc.)
Auth Level: Requires L2 (API key) headers or signing with private key (L1)


4. User Positions (Data API)
Endpoint: GET /positions
Purpose: Fetch your open positions to show what can be cashed out
Note: Usually part of Data-API suite

5. Get Trades (All Users or by Market/User)
Endpoint: GET https://data-api.polymarket.com/trades?[filters]
Filters: user, market, side, limit, etc.
Purpose: Show recent trades for activity feed

6. WebSocket Feed (Real-time Order Book)
Endpoint: wss://ws-subscriptions-clob.polymarket.com/ws/
Channels: market (for order book updates) and user (if authenticated)
Use it for: Live price updates to drive real-time UI (cashout values, charts)

CLOB Authentication Layers
Level 1 (L1): Use your wallet’s private key to sign EIP-712 messages (POLY_ADDRESS, POLY_SIGNATURE, etc.)
Level 2 (L2): Use generated API key, passphrase, plus HMAC signature for requests



The Discord bot already has the user’s wallet details from their session
When we click “place bet” through Discord, it doesnt pass a private key in the request body.
Instead, the backend looks up the wallet/session for that Discord user, signs the order server-side, and sends it to the CLOB API. 


1.Discord bot → /api/session/create
✅ Generates a 10 minutes token mapped to Discord user and wallet.
✅ Sends URL with token back to user.
This ensures only the Discord user can see their own positions.

2.User clicks URL → frontend reads token
✅ Token stored in query params.
✅ Frontend calls backend APIs passing this token.

3.Fetch positions → /api/positions
✅ Uses token to verify user → fetch wallet address → query Polymarket API.
✅ Returns all open positions for that wallet.
✅ Can be updated with WebSocket subscription for constantly updating cashout values.

4.One-click cashout → /api/cashout
✅ Token validated → wallet resolved → order signed server-side → sent to CLOB.
✅ Only backend handles wallet private key — frontend never sees it.

5.Place bet → /api/placeOrders
✅ Works the same way: token → wallet → sign → send order.
✅ Allows the same Discord flow for placing trades. 



