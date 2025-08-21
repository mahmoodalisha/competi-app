## Complete Folder Structure
```
competi-app/
│
├── .env                      # Contains private key & wallet address
├── .env.local
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
|   |   ├── markets/index.tsx  # Shows the market cards
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
│
├── bot/                         # NEW: Discord bot service
│   ├── commands/                # Slash command files
│   │   ├── placebet.js
│   │   └── cashout.js
│   ├── index.js                 # Main Discord bot (was src/index.js)
│   ├── deploy-commands.js       # Registers slash commands
│   └── package.json             # Bot deps (discord.js, dotenv, etc.)
```


Flow Diagram: 

```
[Discord Bot Command (/cashout or /placebet)]
    ↓
Backend: POST /api/session/create (Next.js API route)
    ↓
Generates short-lived token (JWT) tied to Discord user + wallet
    ↓
Returns pop-out URL with token → Discord bot sends link to user
    ↓
User clicks link → opens Next.js page (cashout.tsx or market/[id].tsx)
    ↓
Page loads → reads token from query string
    ↓
Uses hook (usePositions, useMarketData) → calls Next.js API routes
    ↓
API routes use lib/gammaClient.ts and lib/clobClient.ts to call external Polymarket APIs
    ↓
Data returned → UI renders
    ↓
When user clicks "Cashout" or "Place Bet"
    ↓
Frontend POSTs to /api/cashout or /api/placeOrder (with token + params)
    ↓
API route looks up wallet from token → calls CLOB API (real price)
    ↓
Order executed → response sent to frontend

```
1. Discord bot sends /cashout or /placebet
→ This triggers a POST to api/session/create in Next.js backend.

2. /api/session/create
→ Generates a short-lived JWT with discordId and wallet address.
→ Returns both a token and a URL (like http://localhost:3000/cashout?token=...).
→ example response shows this.

3. User clicks the link
→ Browser opens Next.js page (cashout.tsx or market/[id].tsx) with the token in the query string.

4. Page loads
→ Reads the token from the query string.
→ Uses hooks (usePositions, useMarketData) to call Next.js API routes.

5. Next.js API routes
→ Inside /api/positions, /api/markets, etc., we use gammaClient.ts and clobClient.ts to hit the Polymarket APIs (Gamma for market data, CLOB for orders).

6. User clicks "Cashout" or "Place Bet"
→ Frontend calls /api/cashout or /api/placeOrder with the token and details.

7. Backend verifies token
→ Extracts wallet + Discord ID from JWT.
→ Calls CLOB API to execute the trade.

8. Order executes
→ Response sent back to the frontend.

## How Cashout is Accurate
Before: <br>
Discord bot was sending a price along with the cashout request.<br>
That price could be stale because it was based on an old snapshot of the orderbook.<br>
If the market moved in those seconds, the cashout could fail or give a worse fill.<br>
Now:<br>
The API now does not accept a price from the frontend anymore.<br>
The backend queries the CLOB orderbook at the moment of cashout, takes the current best bid, and places the sell order at that price<br>
This means the order is always placed at the most competitive available price.<br>

## How Bet Pricing is Accurate 
Before:<br>
The bet price could be outdated <br>
Now:<br>
It queries the CLOB API for the current lowest ask price (cheapest someone is willing to sell at) at the moment the bet is placed<br>
No stale prices are sent from the frontend → server always decides the price in real time.<br>
Key API used here:<br>
CLOB API again, but this time for buying (lowest ask) instead of selling (highest bid).

## How Live Updates Are Solved
I used CLOB WebSocket (NEXT_PUBLIC_CLOB_WS_URL) for real-time price and liquidity changes.<br>
Frontend updates every time the orderbook changes.<br>
And I used Gamma API (NEXT_PUBLIC_GAMMA_API_URL) to fetch market listings and details.<br>

1.	Cashout is accurate → always sells at the highest bid price from CLOB.
2.	Bet pricing is accurate → always buys at the lowest ask price from CLOB.
3.	Frontend no longer sends price → avoids stale or outdated prices.

CashoutButton click → useCashout() → POST /api/cashout?tokenId=123
→ lib/clobClient.cashoutPosition("123")
→ Polymarket CLOB API
→ return success → update UI 

* CLOB API (https://clob.polymarket.com) <br>
Purpose: Live trading engine (Central Limit Order Book). <br>
What it does: <br>
Returns current orderbook (live buy/sell offers). <br>
Places buy or sell orders (bets and cashouts). <br>
Matches trades at the best available price right now. <br>
Use in the project: <br>
For placing bets at the lowest ask price. <br>
For cashouts at the highest bid price. <br>

* CLOB WebSocket (wss://ws-subscriptions-clob.polymarket.com/ws) <br>
Purpose: Live updates to avoid refreshing the page. <br>
What it does: <br>
Streams real-time orderbook changes. <br>
Can instantly update displayed prices and cashout values. <br>

* Data API (https://data-api.polymarket.com) <br>
Purpose: Historical & analytical data. <br>
What it gives: <br>
Past price movements (candlestick data). <br>
Volume over time. <br>
Trade history. <br>
Use in the project: <br>
Displaying market trends in a graph. <br>

## .env file contains 
```
NEXT_PUBLIC_GAMMA_API_URL=https://gamma-api.polymarket.com
NEXT_PUBLIC_CLOB_API_URL=https://clob.polymarket.com
NEXT_PUBLIC_CLOB_WS_URL=wss://ws-subscriptions-clob.polymarket.com/ws
NEXT_PUBLIC_DATA_API_URL=https://data-api.polymarket.com
NEXT_PUBLIC_USE_MOCK=false
POLYGON_RPC_URL=https://polygon-rpc.com
WALLET_PRIVATE_KEY=your_private_key_here
JWT_SECRET=you_secret_key
REDIS_URL=redis://127.0.0.1:6379
```

## 1️⃣Create a session token
**POST** http://localhost:3000/api/session/create
**Request Body:**
```
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
```
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
```
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
```
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




Gamma API (Market Data)

Base URL: https://gamma-api.polymarket.com
1. List Markets <br>
Endpoint: GET /markets <br>
Example: <br>
https://gamma-api.polymarket.com/markets?limit=50&offset=0&active=true

2. Get Single Market Details <br>
Endpoint: GET /markets/{marketId}

3. Historical Price Data (Candles / Timeseries) <br>
Endpoints: GET /markets/{marketId}/candles <br>
Or under “Pricing and Books”: timeseries endpoints <br>
Purpose: Build charts/trend visualizations

4. Fetch Events (Market Grouping)
Endpoint: GET /events <br>
Example: <br>
https://gamma-api.polymarket.com/events?active=true <br>
Use for: Displaying grouped markets by event, sorting, tags, etc.

CLOB API (Trading & Cashout)
Base URLs:
REST: https://clob.polymarket.com <br>
WebSocket: wss://ws-subscriptions-clob.polymarket.com/ws/ <br>
Data-only endpoints (e.g., positions): https://data-api.polymarket.com



The Discord bot already has the user’s wallet details from their session
When we click “place bet” through Discord, it doesnt pass a private key in the request body.
Instead, the backend looks up the wallet/session for that Discord user, signs the order server-side, and sends it to the CLOB API. 


1.Discord bot → /api/session/create
* ✅ Generates a 10 minutes token mapped to Discord user and wallet.
* ✅ Sends URL with token back to user.
This ensures only the Discord user can see their own positions.

2.User clicks URL → frontend reads token
* ✅ Token stored in query params.
* ✅ Frontend calls backend APIs passing this token.

3.Fetch positions → /api/positions
* ✅ Uses token to verify user → fetch wallet address → query Polymarket API.
* ✅ Returns all open positions for that wallet.
* ✅ Can be updated with WebSocket subscription for constantly updating cashout values.

4.One-click cashout → /api/cashout
* ✅ Token validated → wallet resolved → order signed server-side → sent to CLOB.
* ✅ Only backend handles wallet private key — frontend never sees it.

5.Place bet → /api/placeOrders
* ✅ Works the same way: token → wallet → sign → send order.
* ✅ Allows the same Discord flow for placing trades. 


<img width="1846" height="1033" alt="Screenshot 2025-08-18 120443 1" src="https://github.com/user-attachments/assets/572d8436-2bf1-4cb4-a8eb-f89bf817a032" />

Video of the Live graph:

https://github.com/user-attachments/assets/3c817e37-9239-4591-934a-0b74808cba20

<img width="1913" height="969" alt="Screenshot 2025-08-17 015514" src="https://github.com/user-attachments/assets/d1b05a8b-1c1f-4d38-9206-18cd4f8ed7ac" />

<img width="1920" height="1080" alt="Screenshot 2025-08-15 170444" src="https://github.com/user-attachments/assets/26ec055b-95c6-4095-94e1-128fd2dd2ec5" />

<img width="1920" height="1020" alt="Screenshot 2025-08-15 201526" src="https://github.com/user-attachments/assets/2436e55a-0500-4065-96cc-8d575851020f" />

## Mock open positions
<img width="1919" height="972" alt="Screenshot 2025-08-15 215100" src="https://github.com/user-attachments/assets/94b79b99-5bea-4a7a-8d9e-0d1cdd544df5" />


