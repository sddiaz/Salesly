[DEMO](https://drive.google.com/file/d/1za4oTDRFVq4g-CpvKISKvCbDBw_hXFzW/view?usp=sharing)

# Salesly

An AI sales development rep. Salesly uses Grok (xAI) to score leads, draft personalized outreach, and advise on strategy. Each user signs in with Firebase Auth and sees only their own data in Firestore.

## Features

- **Lead management**: create, edit, filter, and track leads through pipeline statuses
- **AI lead scoring**: Grok-based qualification with customizable criteria and a rule-based fallback
- **Personalized messaging**: AI-generated outreach tailored to each lead
- **Grok consultation**: per-lead and general strategy chat
- **Dashboard and analytics**: pipeline stats, status distribution, recent activity
- **Activity tracking**: interaction history per lead
- **Evaluation framework**: scripted tests for scoring, messaging, conversation, and competitive analysis

## Architecture

```
backend/    Express API (Firestore, Firebase Admin, Grok via the OpenAI SDK)
  server.js            entry point; also serves the built frontend from ./public
  src/routes/          REST API (firestore-api.js)
  src/services/        grok.js (AI), firestore.js (data layer)
  evaluation/          AI evaluation framework
  scripts/             demo data seeding
frontend/   React + TypeScript (Create React App), Firebase Auth
Dockerfile  Multi-stage: builds the frontend, then runs the API serving it
render.yaml Render blueprint
```

Every `/api` request must carry `Authorization: Bearer <Firebase ID token>`; the server verifies it and scopes data to that user.

## Local development

Prerequisites: Node 20+, a Firebase project (Auth with Google enabled, Firestore), and an xAI API key.

```bash
# Backend (terminal 1)
cd backend
npm install
cp .env.example .env     # fill in XAI_API_KEY, FIREBASE_PROJECT_ID, and a service account path
npm run dev              # http://localhost:3001

# Frontend (terminal 2)
cd frontend
npm install
cp .env.example .env     # fill in the Firebase web config
npm start                # http://localhost:3000 (proxies /api to :3001)
```

For local development set `NODE_ENV=development` and `FIREBASE_SERVICE_ACCOUNT_PATH` in `backend/.env`. In that mode, requests without a token fall back to a default dev user.

### Environment variables

| Where | Variable | Purpose |
| --- | --- | --- |
| backend | `XAI_API_KEY` | Grok API key (required) |
| backend | `FIREBASE_PROJECT_ID` | Firebase project (required) |
| backend | `FIREBASE_SERVICE_ACCOUNT_JSON` | Service account JSON on one line (production) |
| backend | `FIREBASE_SERVICE_ACCOUNT_PATH` | Service account file (local dev) |
| frontend | `REACT_APP_FIREBASE_*` | Firebase web config, baked in at build time |

## Deploy to Render

1. In Firebase, create a service account key (Project settings > Service accounts) and add your Render domain under Authentication > Settings > Authorized domains.
2. In Render, choose New > Blueprint and select this repo. `render.yaml` defines one Docker web service.
3. Fill in the environment variables it asks for (see the table above). Put the whole service account JSON in `FIREBASE_SERVICE_ACCOUNT_JSON`.
4. Deploy. Health check: `/health`.

The `REACT_APP_FIREBASE_*` values are public web config and are compiled into the frontend, so changing them needs a rebuild.

Run the same image locally with `docker compose up --build` (reads the variables from your shell or a root `.env`).

## Scripts

```bash
cd backend
npm run eval                                    # run AI evaluations (calls the Grok API)
node scripts/seed-demo-data.js <firebase-uid>   # add sample leads for a user
```

## API

All routes are under `/api` and require a bearer token.

- `GET/POST /leads`, `GET/PUT/DELETE /leads/:id`, `PUT /leads/:id/status`
- `POST /leads/:id/score`, `POST /leads/:id/messages/generate`, `POST /leads/:id/messages`
- `POST /leads/:id/activities`
- `POST /leads/:id/consult`, `POST /grok/consult`
- `GET /analytics/dashboard`
- `GET/PUT /user/profile`, `DELETE /user/account`

## Security

Rate limiting (100 requests/minute per IP), input validation with Joi, Helmet security headers with a CSP that allows Firebase Auth, and Firebase ID token verification on every API call.

## License

MIT
