# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- **Presentation tier decision**: React components for Activities, Teams, Leaderboard, and Workout Suggestions sections with loading/empty/error states. Use `src/api/client.ts` for all API calls. Fetch user email from query param or component state for workout suggestions.
- **Logic tier decision**: Express routes in `src/routes` with dedicated service functions in `src/services`. Route handlers validate input and delegate to services. Services handle business logic and data transformations.
- **Data tier decision**: Mongoose schemas for User, Team, Activity, and Workout with schema-level validation for required fields. Seed data via `src/scripts/seed.ts` using upserts.
- **Activity tracking approach**: POST route validates userId and teamId exist in database (return 400 if not). Service computes `points` based on activity type and stores `occurredAt` as current timestamp. GET returns all activities populated with user and team details.
- **Team management approach**: POST route requires `name` field (return 400 if missing), accepts optional `mascot`. Service stores team and initializes empty `members` array. GET returns all teams with populated member references.
- **Leaderboard approach**: GET route aggregates activities by team, sums points, orders by total descending, and assigns 1-based ranks. Returns `{ leaderboard: [{ teamName, totalPoints, rank }, ...] }`.
- **Workout suggestions approach**: GET route matches userEmail to seeded User record (return 404 if not found). Service analyzes user's recent activities, matches activity type to focus (e.g., "running" → "endurance"), and returns first suggestion with matching focus and explanatory reason.

## Test plan

Record the commands you run and what each failure means.

- **Data-tier command**: `npm run test:data --prefix octofit-tracker/backend`
  - Current failures: User, Team, Activity, Workout schemas missing required field validators
  - After fix: All 5 tests pass when schemas define validators for name, email, fitnessGoal (User); name, mascot (Team); type, user, team, minutes (Activity); and focus, minutes, difficulty (Workout)

- **API command**: `npm run test:api --prefix octofit-tracker/backend`
  - Current failures: POST /api/activities returns 501; POST /api/teams returns 501; GET /api/leaderboard returns empty array; GET /api/workouts/suggestions returns wrong focus
  - After fix: Routes implemented, validation returns 400 for missing/invalid fields, services compute correct points and rank, suggestions match user's recent activity patterns

- **Frontend command**: `npm test --prefix octofit-tracker/frontend`
  - Current failures: All 15 tests fail because components show "Implementation pending" placeholder
  - After fix: Components fetch and display activity list, team list with members, leaderboard with ranks, and personalized workout suggestions; loading and error states render; form submissions create records

- **Backend build command**: `npm run build --prefix octofit-tracker/backend`
  - Validates TypeScript compilation and type safety for routes/services

- **Frontend build command**: `npm run build --prefix octofit-tracker/frontend`
  - Validates React component compilation and Vite bundling
