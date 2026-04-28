# Copilot instructions for Odyssey

## Build, test, and lint commands

### Backend (`backend/`)

- Start backend + PostgreSQL: `docker compose up --build`
- Run migrations in container: `docker compose exec backend python manage.py migrate`
- Lint + format check: `cd backend && ./scripts/validate.sh`
- Run all tests: `cd backend && pytest`
- Run a single test file: `cd backend && pytest apps/tours/tests/test_api.py`
- Run a single test: `cd backend && pytest apps/tours/tests/test_api.py::TestClassName::test_method_name`

### Mobile (`mobile/`)

- Install deps: `cd mobile && npm ci`
- Start Expo: `cd mobile && npx expo start`
- Lint: `cd mobile && npm run lint`
- Format check: `cd mobile && npm run format:check`
- Type-check: `cd mobile && npm run type-check`
- Combined validation: `cd mobile && npm run validate`

### Admin dashboard (`admin-dashboard/`)

- Install deps: `cd admin-dashboard && npm ci`
- Start dev server: `cd admin-dashboard && npm run dev`
- Build: `cd admin-dashboard && npm run build`
- Lint: `cd admin-dashboard && npm run lint`

## High-level architecture

- Monorepo with four top-level apps: `backend/` (Django REST API), `mobile/` (Expo React Native), `admin-dashboard/` (React + Vite staff UI), and `website/` (static landing page).
- Backend routing is centralized in `backend/config/urls.py`. All API endpoints are under `/api/`, with per-domain apps mounted there (`users`, `tours`, `gamification`, `ai_content`, `payments`, and `admin_dashboard`).
- Core backend domain split:
  - `apps/tours`: tours, steps, puzzles, reviews, and filtering/search APIs.
  - `apps/gamification`: tour progress state, XP accrual, and badge awarding.
  - `apps/payments`: subscriptions, credit packs, credit ledger, tour unlocks, and Stripe webhooks.
  - `apps/ai_content`: AI tour generation pipeline (`GeminiService`) that first retrieves real places from Google Maps, then generates constrained content, then stores tours/steps/puzzles.
- Mobile app uses Expo Router groups:
  - `app/(tabs)` for primary app surfaces (map, tours, profile, settings).
  - `app/(tour)` for tour creation/editing flow, wrapped by `TourCreationProvider`.
  - Root providers in `app/_layout.tsx` wire localization and active-tour state.
- Admin dashboard runs separately on Vite and proxies `/api` calls to Django (`admin-dashboard/vite.config.ts`), so backend must be running for dashboard features.

## Key conventions in this repository

- Use `apiRequest` (`mobile/api/APIClient.ts`) for all mobile HTTP calls. Auth is on by default; only use `auth: false` for public endpoints.
- Mobile auth token handling is centralized: request interceptor injects `Bearer` token from `expo-secure-store`, and any `401` clears stored token and surfaces a session-expired error.
- Keep mobile API modules typed (request/response types colocated with each endpoint module under `mobile/api/`).
- Tour/step/review backend routes use DRF nested routers (`/api/tours/{tour_id}/steps/`, `/api/tours/{tour_id}/reviews/`), so client-side endpoint shapes should follow that nested pattern.
- Credit and subscription side effects should go through `CreditService`/`StripeService` in `apps/payments/services/` to preserve transaction history and balance consistency.
- Access checks for paid tours should stay aligned with `CreditService.has_tour_access` and `TourSerializer.get_has_access`; avoid duplicating alternate access logic.
- AI generation quota is enforced before generation (`CreditService.get_ai_generation_allowance` + `record_ai_generation` in `GenerateTourView`); changes to AI flows must keep this gate in place.
- `TourProgress` enforces one active tour per user and includes orphan-progress cleanup logic in both API and mobile resume flow; keep those behaviors compatible when editing progress or tour deletion paths.
