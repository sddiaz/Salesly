# Salesly - Feature Notes

See README.md for setup and deployment. This file summarizes what the app does.

## Lead management and scoring

- Leads have contact and company fields, a pipeline status (`new`, `contacted`, `qualified`, `proposal`, `negotiation`, `won`, `lost`) and a score.
- Scoring uses Grok with user-defined weighted criteria, returning a score, confidence, strengths, concerns, and next steps. A rule-based fallback runs when the AI is unavailable.

## AI capabilities (`backend/src/services/grok.js`)

1. Lead qualification scoring
2. Personalized message generation (role, industry, and tone aware)
3. Lead strategy consultation, per lead and general
4. Conversation analysis and competitive analysis helpers, exercised by the evaluation framework

## Evaluation framework (`backend/evaluation/run-evals.js`)

Scripted cases for lead scoring, message generation, conversation analysis, and competitive analysis, plus response-time and error tracking. Results are written to `evaluation/results.json`. Run with `npm run eval` in `backend/` (calls the live Grok API).

## Data and auth

- Firestore holds users, leads, activities, and messages, scoped per user.
- Firebase Auth (Google) on the frontend; the API verifies the Firebase ID token on every request.

## Possible future work

- CRM integrations (Salesforce, HubSpot)
- Email sending
- Multi-step outreach sequences
- Team accounts and permissions
