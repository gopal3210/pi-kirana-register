# Pi Kirana Register

Mobile-first grocery store management system — Stock, Sales, Expenses, Multi-currency Invoices with QR receipts, and a Summary Dashboard.

## Tech Stack
- React + Vite + Tailwind CSS
- localStorage for all data (no backend, no database)
- `qrcode.react` for QR code generation
- Live Pi/USD/INR/EUR/GBP rates from CoinGecko (cached 5 min)

## Setup
```bash
npm install
npm run dev      # local development
npm run build    # production build → dist/
```

## Deploy to Vercel
Push this repo to GitHub, then import it in Vercel. It's a static Vite app —
no special config or environment variables needed.

## Architecture Notes (decisions made beyond the PRD)

1. **QR receipt — no backend required.** When a sale is checked out, the
   invoice is encoded directly into the QR code's URL (as a base64 JSON
   blob in the hash, e.g. `yourapp.com/#/receipt/xxxx`). When the customer
   scans it, the *same deployed app* detects the hash and renders a
   read-only receipt view — entirely client-side. No server, database, or
   API route needed to serve receipts.
   - Caveat: very large carts (many distinct line items) produce a longer
     URL. For typical kirana-shop basket sizes this is not an issue, but if
     you regularly sell 30+ distinct items in one bill, let me know and we
     can switch to a shortened-payload or backend-lookup approach.

2. **Cost Price (optional).** The PRD only specifies a selling price, but
   the Dashboard needs a cost basis to show real profit. An optional "Cost"
   field was added to the product form. Leave it blank and profit will
   simply equal sales (no cost deducted) until you fill it in.

3. **Exchange rates.** Rates come from CoinGecko's `pi-network` endpoint
   (USD/INR/EUR/GBP cross rates), cached in localStorage for 5 minutes. If
   the live fetch fails (no internet), the last cached rate is used and
   the bill shows an "offline" warning. Secondary currency is configurable
   in Settings (default: INR).

4. **No Pi payment flow (yet).** This PRD only asked for QR → receipt
   viewing, not an actual "Pay with Pi" button. Pi SDK integration is not
   wired in here — same deferred approach as your Shop Manager project.

## Project Structure
```
src/
├── App.jsx              shell, tab nav, global state, hash routing
├── utils.js              localStorage helpers, formatting
├── exchangeRates.js       CoinGecko fetch + cache
└── components/
    ├── Dashboard.jsx
    ├── Stock.jsx
    ├── Sales.jsx
    ├── Cart.jsx
    ├── InvoiceModal.jsx   shown right after checkout (QR + currency)
    ├── Receipt.jsx        customer-facing view (opened via QR scan)
    ├── Expenses.jsx
    ├── InvoiceHistory.jsx
    ├── Settings.jsx
    └── BottomNav.jsx
```

## Known limitation
All data lives in the shopkeeper's own browser (localStorage). It does not
sync across devices. If you later need multi-device sync, that requires
adding a backend — a deliberate scope decision for this build, matching
your "keep it simple, proven, debuggable" preference.
