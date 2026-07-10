# ERP Production TODO

## Requires dependencies installed by owner

- Run the full verification set in VS Code after dependencies are installed:
  - `pnpm lint`
  - `pnpm exec tsc --noEmit`
  - `pnpm build`
- Re-check the existing `tsconfig.tsbuildinfo` diagnostics after a clean typecheck. It previously recorded missing `template` props in product detail table calls; `components/tovary/detail-shared.tsx` is now backward-compatible, but the clean run still needs confirmation.
- Visually smoke-test `/tovary`, `/tovary/create`, and `/prodazhi` in the browser after dependencies are ready.

## Backend and persistence

- Replace `localStorage` product persistence in `lib/erp/product-catalog.ts` with a real API-backed repository once the backend shape is chosen.
- Add server validation for product SKU/barcode uniqueness, required fields, price precision, stock limits, and category references.
- Introduce durable inventory movements for product creation, sales, transfer, write-off, revaluation, and inventory count results.
- Connect POS payment completion to a sales ledger and stock reservation/decrement workflow.

## Functional ERP gaps

- Finish catalog bulk actions: activate/deactivate, export, delete/archive, update category, update supplier.
- Add product edit/detail pages that read/write through the same product repository.
- Persist table column preferences per user instead of keeping them modal-local.
- Replace placeholder settings pages with real company, store, cashbox, currency, receipt, notification, and app integration settings.
- Consolidate repeated demo arrays across clients, finance, marketing, management, and reports into typed repositories.

## Quality gates

- Add unit tests for product catalog filtering, creation validation, SKU/barcode generation, and POS product search.
- Add Playwright smoke tests for product create -> catalog row appears -> POS search finds product.
- Clean remaining mojibake strings in old components and metadata while preserving the current layout and spacing.
