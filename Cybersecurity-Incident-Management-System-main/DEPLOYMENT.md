# Deployment Guide (Firebase & Cloud Run)

This guide covers deploying the Cybersecurity Incident Management System (CIMS) to Google Cloud Platform using **Firebase Hosting** for the premium frontend and **Google Cloud Run** for the Express backend. This ensures a highly scalable, "soundproof" live system.

## Prerequisites
1. [Google Cloud SDK (gcloud)](https://cloud.google.com/sdk/docs/install) installed.
2. [Firebase CLI](https://firebase.google.com/docs/cli) installed (`npm install -g firebase-tools`).
3. A Google Cloud / Firebase Project created.
4. A Managed PostgreSQL database (e.g., Google Cloud SQL or Supabase) with the connection URL.

## Step 1: Deploy Backend to Cloud Run
The Express backend is containerized and will run securely on Cloud Run.

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Build and submit the Docker image to Google Container Registry (or Artifact Registry):
   ```bash
   gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/cims-backend
   ```
3. Deploy to Cloud Run:
   ```bash
   gcloud run deploy cims-backend \
     --image gcr.io/YOUR_PROJECT_ID/cims-backend \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars="DATABASE_URL=your_postgres_url,NODE_ENV=production"
   ```
   *Note: Ensure your Cloud Run service is named exactly `cims-backend` so Firebase can route to it.*

## Step 2: Build and Deploy Frontend via Firebase Hosting
The frontend is a Vite React application that relies on Firebase rewrites to proxy `/api` requests securely to your Cloud Run backend.

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies and build the static assets:
   ```bash
   npm install
   npm run build
   ```
3. Initialize Firebase (if not already done) and authenticate:
   ```bash
   firebase login
   firebase use --add YOUR_PROJECT_ID
   ```
4. Deploy the frontend from the root directory:
   ```bash
   cd ..
   firebase deploy --only hosting
   ```

## Step 3: Verification
1. Visit the generated Firebase Hosting URL (e.g., `https://your-project-id.web.app`).
2. Verify the AI Dashboard loads successfully and animations trigger.
3. Check the **Incidents** page. The frontend `/api` requests will automatically be routed to the Cloud Run backend without CORS issues.
4. If there are database errors, verify your `DATABASE_URL` in the Cloud Run service environment variables.
