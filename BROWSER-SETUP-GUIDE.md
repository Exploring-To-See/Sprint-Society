# Sprint Society — Browser-Only Setup Guide
# No installations needed. Everything done from your browser.

---

## STEP 1: Create GitHub Account (2 minutes)

1. Open browser → go to github.com
2. Click "Sign up" (top right)
3. Use your PERSONAL email (not PwC)
4. Create a username (e.g., kendu-entertainment)
5. Verify your email when the code arrives
6. You're in!

---

## STEP 2: Create Repository (1 minute)

1. On GitHub, click the "+" icon (top right corner) → "New repository"
2. Repository name: sprint-society
3. Description: AI-powered run club by Kendu Entertainment
4. Select: Public
5. Check ✅ "Add a README file"
6. Click "Create repository"

---

## STEP 3: Upload Files (10 minutes)

GitHub lets you upload files through the browser. You'll need to do this folder by folder
because the browser doesn't support nested folder drag-and-drop well.

### Upload root files first:

1. In your repository on GitHub, click "Add file" → "Upload files"
2. From your File Explorer, open: Desktop > T > sprint-society
3. Drag these ROOT files (not folders) into the upload area:
   - package.json
   - .gitignore
   - .env.example
   - railway.json
   - README.md
   - SETUP-GUIDE.md
4. Click "Commit changes"

### Upload shared/ folder:

1. Click "Add file" → "Create new file"
2. In the filename box, type: shared/package.json
   (typing the slash automatically creates the folder)
3. Copy-paste the contents of shared/package.json from your local file
4. Click "Commit changes"
5. Repeat for: shared/types.ts

### Upload server files:

You'll need to create each file by:
1. Click "Add file" → "Create new file"
2. Type the path (e.g., server/package.json)
3. Paste the contents
4. Commit

Files to create:
- server/package.json
- server/tsconfig.json
- server/src/index.ts
- server/src/config.ts
- server/src/setup-admin.ts
- server/src/database/schema.sql
- server/src/database/db.ts
- server/src/middleware/auth.ts
- server/src/middleware/adminAuth.ts
- server/src/middleware/errorHandler.ts
- server/src/routes/auth.routes.ts
- server/src/routes/strava.routes.ts
- server/src/routes/runs.routes.ts
- server/src/routes/coaching.routes.ts
- server/src/routes/gamification.routes.ts
- server/src/routes/admin.routes.ts
- server/src/services/strava.service.ts
- server/src/engine/ageGrading.ts
- server/src/engine/vo2max.ts
- server/src/engine/tierClassifier.ts
- server/src/engine/paceCalculator.ts
- server/src/engine/challengeGenerator.ts
- server/src/engine/transformationPlan.ts
- server/src/utils/jwt.ts

### Upload client files:

Same process — "Add file" → "Create new file" → paste contents:
- client/package.json
- client/tsconfig.json
- client/vite.config.ts
- client/tailwind.config.ts
- client/postcss.config.js
- client/index.html
- client/src/main.tsx
- client/src/App.tsx
- client/src/index.css
- client/src/lib/api.ts
- client/src/lib/formatters.ts
- client/src/context/AuthContext.tsx
- client/src/components/ui/Button.tsx
- client/src/components/ui/Slider.tsx
- client/src/components/ui/TapGrid.tsx
- client/src/components/ui/ProgressBar.tsx
- client/src/components/layout/AppShell.tsx
- client/src/components/layout/BottomNav.tsx
- client/src/components/registration/RegistrationFlow.tsx
- client/src/components/dashboard/Dashboard.tsx
- client/src/components/dashboard/PaceChart.tsx
- client/src/components/dashboard/ChallengeList.tsx
- client/src/components/coaching/CoachingPanel.tsx
- client/src/components/social/RunCard.tsx
- client/src/pages/HomePage.tsx
- client/src/pages/RegisterPage.tsx
- client/src/pages/DashboardPage.tsx
- client/src/pages/CoachingPage.tsx
- client/src/pages/RunHistoryPage.tsx
- client/src/pages/SharePage.tsx
- client/src/pages/ProfilePage.tsx
- client/src/pages/AdminPage.tsx
- client/src/pages/StravaCallbackPage.tsx

---

## STEP 4: Deploy on Railway (5 minutes)

1. Open: railway.app
2. Click "Login" → "Login with GitHub"
3. Authorize Railway
4. Click "New Project" → "Deploy from GitHub Repo"
5. Select "sprint-society"
6. Click "Deploy Now"

---

## STEP 5: Set Environment Variables

1. Click on your service (the box that appeared)
2. Click "Variables" tab
3. Click "Raw Editor"
4. Paste:

PORT=3001
NODE_ENV=production
JWT_SECRET=sprint-society-2024-random-secret-key-xyz
JWT_EXPIRES_IN=7d
STRAVA_CLIENT_ID=placeholder
STRAVA_CLIENT_SECRET=placeholder
STRAVA_REDIRECT_URI=placeholder
STRAVA_WEBHOOK_VERIFY_TOKEN=sprint-society-webhook
ADMIN_EMAIL=your-email@gmail.com
ADMIN_PASSWORD=YourPassword123!
ADMIN_NAME=Your Name

5. Change ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME to your real details
6. Click "Update Variables"

---

## STEP 6: Generate Public URL

1. Go to Settings tab in your Railway service
2. Under "Networking" → Click "Generate Domain"
3. You get a URL like: sprint-society-abc123.up.railway.app
4. Open it in your phone — your app is LIVE!

---

## STEP 7: Log in as Admin

1. Open your Railway URL
2. Click "Already a member? Log in"
3. Use your ADMIN_EMAIL and ADMIN_PASSWORD
4. You'll see the Admin Panel!

---

## STEP 8: Set up Strava (later, when ready)

1. Go to strava.com/settings/api
2. Create an app (use your Railway URL as website)
3. Set callback domain to your Railway domain
4. Copy Client ID and Secret to Railway variables
5. Redeploy

---

NOTE: Step 3 (uploading files) is tedious but only done once!
After that, everything is automatic.
