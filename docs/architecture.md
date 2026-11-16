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

- Presentation tier decision: Keep the React app thin and route-oriented: each capability page fetches from the matching `/api` route, renders loading/empty/error states, and relies on accessible status/alert patterns instead of embedding business logic in the UI.
- Logic tier decision: Implement the API as a small Express + TypeScript service layer with input validation in the route handlers, shared response formatting, and Mongo-backed data access that keeps validation and error handling consistent across all endpoints.
- Data tier decision: Use Mongoose schemas for `User`, `Team`, `Activity`, and `Workout` with required fields, default arrays, and seed logic that is idempotent and preserves existing records when rerun.
- Activity tracking approach: Accept `userId`, `teamId`, `type`, and `minutes`; validate the references before creating the record; compute `points` and `occurredAt`; and reject malformed or unknown IDs with a deliberate 4xx rather than a cast error.
- Team management approach: Require a non-empty team `name`, keep `mascot` and `members` in the schema, default `members` to an empty array, and preserve submitted member IDs when creating or listing teams.
- Leaderboard approach: Aggregate each team’s total points from activities, sort descending, and assign ranks starting at 1 so the leaderboard is deterministic and easy to render in the UI.
- Workout suggestions approach: Match a user by email, inspect their recent activity patterns or fitness goal, and return the best-fit workout records with a clear human-readable `reason` explaining the match.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`
  - Validates the Mongo schema contracts and seed data invariants. Failures here mean the data model is missing required fields, default values, or idempotent seeding behavior.
- API command: `npm run test:api --prefix octofit-tracker/backend`
  - Validates endpoint contracts for activity creation, team creation, leaderboard ranking, and workout suggestion logic. Failures here mean the logic tier is not honoring the API contract or is returning the wrong status codes/response shapes.
- Frontend command: `npm test --prefix octofit-tracker/frontend`
  - Validates that the React app renders data, loading states, empty states, and accessible alerts correctly for each capability. Failures here usually indicate missing UI logic or API handling rather than backend contract issues.
- Backend build command: `npm run build --prefix octofit-tracker/backend`
  - Checks TypeScript compilation and route/service correctness for the API layer. Build failures point to type mismatches or invalid imports in the backend.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend`
  - Checks the browser bundle and Vite/React build for the presentation tier. Build failures usually indicate component, route, or bundling issues before runtime behavior is even exercised.
