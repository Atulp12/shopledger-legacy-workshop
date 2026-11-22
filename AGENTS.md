# Repository Guidelines

## Stack

ShopLedger is a Node.js application using Express and `body-parser`. It uses CommonJS modules and a static browser UI (`public/index.html`, `public/js/app.js`, and `public/css/style.css`). Application state is stored in `data/db.json`; there is no database service.

## Module Map

- `server.js` configures Express, serves `public/`, mounts `/api` routes, and renders order invoices.
- `routes/` contains the HTTP handlers: `products.js`, `orders.js`, `customers.js`, and `reports.js`.
- `lib/` contains store, order, inventory, pricing, coupon, tax, ledger, report, invoice, and date logic.
- `config.js` contains shop, tax, coupon, inventory, and port configuration.
- `data/db.json` contains products, orders, customers, settlements, audit records, and ID counters.
- `docs/` contains repository documentation.

## Commands

- `npm install` installs the versions locked in `package-lock.json`.
- `npm start` runs `node server.js` on port `3000` unless `PORT` is set.
- `npm test` currently exits with an error: no test suite or test runner is configured.

There are no build, lint, or formatting commands.

## Change Rules

1. Write characterization tests before changing existing behavior. Capture the current behavior first, including edge cases.
2. Change only the module the ticket is about. Do not make unrelated refactors or cross-module cleanup.
3. Tests must never read, write, replace, or otherwise touch `data/db.json`. Use isolated in-memory fixtures instead.
4. Add no dependencies. Do not change `package.json` or `package-lock.json` to bring in packages.
