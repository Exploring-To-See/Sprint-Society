# Sprint Society — Complete Setup Guide (Step by Step)

This guide will take you from zero to a live website. No coding knowledge needed.
Follow each step exactly. Screenshots are described so you know what to look for.

---

## PART 1: Install Node.js (needed once)

### Step 1: Download Node.js

1. Open your browser (Chrome/Edge)
2. Go to: https://nodejs.org
3. You'll see two green buttons. Click the one that says **"LTS"** (the left/recommended one)
4. A file will download (something like `node-v20.x.x-x64.msi`)

### Step 2: Install Node.js

1. Open the downloaded file (double-click it)
2. Click **"Next"** on every screen (don't change anything)
3. Click **"Install"**
4. Wait for it to finish
5. Click **"Finish"**

### Step 3: Verify it works

1. Press `Windows key + R` on your keyboard
2. Type `cmd` and press Enter (a black window opens)
3. Type `node --version` and press Enter
4. You should see something like `v20.15.0` (any number is fine)
5. Type `npm --version` and press Enter
6. You should see a number like `10.7.0`
7. If both show numbers, you're good! Close this window.

---

## PART 2: Create a GitHub Account

### Step 4: Sign up for GitHub

1. Go to: https://github.com
2. Click **"Sign up"** (top right corner)
3. Enter your email address
4. Create a password
5. Choose a username (e.g., `kendu-entertainment`)
6. Complete the verification puzzle
7. Click **"Create account"**
8. Check your email for a verification code, enter it

### Step 5: Install GitHub Desktop (easiest way to upload code)

1. Go to: https://desktop.github.com
2. Click **"Download for Windows"**
3. Open the downloaded file
4. It will install automatically
5. When it opens, click **"Sign in to GitHub.com"**
6. It will open your browser — click **"Authorize desktop"**
7. Go back to GitHub Desktop app

---

## PART 3: Upload Sprint Society to GitHub

### Step 6: Create a new repository

1. In GitHub Desktop, click **"File"** menu (top left) → **"New repository"**
2. Fill in:
   - Name: `sprint-society`
   - Description: `AI-powered run club by Kendu Entertainment`
   - Local path: Click **"Choose..."** and navigate to:
     `C:\Users\ivashistha005\OneDrive - PwC\Desktop\T`
     (It will use the `sprint-society` folder that already exists there)
   - Check ✅ **"Initialize this repository with a README"** — UNCHECK this (we already have one)
3. Click **"Create repository"**

**If it says the folder already exists:** Click **"Add Existing Repository"** instead, and point it to:
`C:\Users\ivashistha005\OneDrive - PwC\Desktop\T\sprint-society`

### Step 7: Upload (Push) to GitHub

1. In GitHub Desktop, you should see all the files listed under "Changes" on the left
2. At the bottom left, there's a text box that says "Summary (required)"
3. Type: `Initial commit - Sprint Society`
4. Click the blue **"Commit to main"** button
5. Now click **"Publish repository"** (blue button at the top)
6. A popup appears:
   - Name: `sprint-society` (keep it)
   - Uncheck ❌ "Keep this code private" (Railway needs to access it)
7. Click **"Publish repository"**
8. Done! Your code is now on GitHub.

### Step 8: Verify on GitHub

1. Open browser, go to: https://github.com
2. You should see `sprint-society` in your repositories
3. Click on it — you should see all the folders (client, server, shared)

---

## PART 4: Deploy on Railway

### Step 9: Create Railway account

1. Go to: https://railway.app
2. Click **"Login"** (top right)
3. Click **"Login with GitHub"**
4. Click **"Authorize Railway"** (it connects to your GitHub)
5. You're now logged into Railway

### Step 10: Create a new project

1. Click **"New Project"** (purple button, top right or center of page)
2. Click **"Deploy from GitHub Repo"**
3. You'll see a list of your repositories
4. Click **"sprint-society"**
5. Railway will ask "Deploy now?" — Click **"Deploy Now"**

### Step 11: Wait for first build (it will fail — that's expected!)

1. Railway will try to build your app. It might fail because we haven't set the environment variables yet.
2. That's fine. Move to the next step.

### Step 12: Set Environment Variables

1. In your Railway project, click on the **service** (the purple box that appeared)
2. Click the **"Variables"** tab (on the right side panel)
3. Click **"Raw Editor"** (makes it easier to paste everything at once)
4. Paste this entire block:

```
PORT=3001
NODE_ENV=production
JWT_SECRET=sprint-society-secret-change-this-to-anything-random-2024
JWT_EXPIRES_IN=7d
STRAVA_CLIENT_ID=placeholder
STRAVA_CLIENT_SECRET=placeholder
STRAVA_REDIRECT_URI=placeholder
STRAVA_WEBHOOK_VERIFY_TOKEN=sprint-society-webhook
ADMIN_EMAIL=your-real-email@example.com
ADMIN_PASSWORD=YourSecurePassword123!
ADMIN_NAME=Your Real Name
```

5. **IMPORTANT:** Change these three lines to YOUR details:
   - `ADMIN_EMAIL` → the email you want to log in with as admin
   - `ADMIN_PASSWORD` → a password you'll remember (min 6 characters)
   - `ADMIN_NAME` → your name
6. Click **"Update Variables"**

### Step 13: Set the build command

1. Click the **"Settings"** tab (in the same right panel)
2. Scroll down to **"Build Command"**. Set it to:
   ```
   npm install && npm run build
   ```
3. Scroll down to **"Start Command"**. Set it to:
   ```
   npm start
   ```
4. These might already be auto-detected. If so, leave them.

### Step 14: Redeploy

1. Click **"Deployments"** tab (left panel)
2. Click the three dots (...) on the latest deployment → **"Redeploy"**
3. Wait 2-5 minutes. You'll see the build logs scrolling.
4. When it says **"Deployed"** with a green checkmark, you're live!

### Step 15: Get your live URL

1. In your Railway project, click **"Settings"** tab
2. Scroll to **"Networking"** section
3. Under **"Public Networking"**, click **"Generate Domain"**
4. Railway gives you a URL like: `sprint-society-production.up.railway.app`
5. **This is your live website!** Open it in your phone browser — it works!

---

## PART 5: Create Your Admin Account

### Step 16: Set up admin login

1. In Railway, go to your service
2. Click **"Settings"** tab
3. Find **"Railway Shell"** or click the **"Terminal"** icon
4. Type this command and press Enter:
   ```
   npm run setup:admin
   ```
5. It will say "Admin account created!" with your email/password
6. If there's no terminal option: Don't worry — you can register through the app with the admin email, and we can promote you via the variables

**Alternative (if terminal doesn't work):**
The first account you register with the email matching `ADMIN_EMAIL` in your variables will automatically be treated as admin once we add a small startup script. For now, register normally and I can guide you on promoting the account.

---

## PART 6: Set Up Strava (so runs sync automatically)

### Step 17: Create Strava API app

1. Go to: https://www.strava.com/settings/api
2. If you don't have a Strava account, create one first at strava.com
3. You'll see "My API Application" — click **"Create App"** or fill in the form:
   - Application Name: `Sprint Society`
   - Category: `Club`
   - Club: (leave blank)
   - Website: paste your Railway URL (e.g., `https://sprint-society-production.up.railway.app`)
   - Application Description: `AI-powered run club platform`
   - Authorization Callback Domain: just the domain part — e.g., `sprint-society-production.up.railway.app` (no https://, no slash at end)
4. Check the agreement box
5. Click **"Create"**

### Step 18: Copy Strava credentials to Railway

1. On the Strava API page, you'll see:
   - **Client ID** (a number like `12345`)
   - **Client Secret** (a long string)
2. Go back to Railway → your service → Variables tab
3. Update these three:
   ```
   STRAVA_CLIENT_ID=12345 (your actual Client ID)
   STRAVA_CLIENT_SECRET=abc123xyz (your actual Client Secret)
   STRAVA_REDIRECT_URI=https://sprint-society-production.up.railway.app/strava/callback
   ```
   (Replace the URL with YOUR actual Railway URL)
4. Click **"Update Variables"**
5. Railway will automatically redeploy with the new settings

---

## PART 7: Using Sprint Society

### As Admin (You):

1. Open your Railway URL in any browser (phone or laptop)
2. Click "Already a member? Log in"
3. Enter your ADMIN_EMAIL and ADMIN_PASSWORD
4. You'll see the **Admin Panel** with tabs:
   - **Overview** — total runners, total km, tier breakdown
   - **Runners** — every runner's profile, stats, tier, pace
   - **Sessions** — create/schedule club run sessions
   - **Posts** — write announcements visible to all runners

### As a Runner (your club members):

1. Share your Railway URL with runners (send them the link via WhatsApp/Instagram)
2. They open it on their phone
3. They tap **"Join Sprint Society"**
4. They fill in the quick registration (15 seconds — tap, slide, done)
5. They connect their Strava account (one-time)
6. From now on, every run they record on Strava automatically syncs
7. They see their dashboard: pace chart, tier, challenges, XP, shareable cards

---

## PART 8: Custom Domain (Optional - Later)

If you want `www.sprintsociety.com` instead of the railway URL:

1. Buy a domain from Namecheap, GoDaddy, or Google Domains (~$10/year)
2. In Railway → Settings → Custom Domain → Add your domain
3. Railway will give you DNS records to add
4. Add those records in your domain provider's DNS settings
5. Wait 1-24 hours for it to activate

---

## Troubleshooting

### "Build failed" on Railway
- Check that you pasted ALL environment variables correctly
- Make sure there are no extra spaces in variable values
- Click Redeploy after fixing

### "Cannot connect to Strava"
- Make sure the Authorization Callback Domain in Strava settings EXACTLY matches your Railway domain
- Make sure STRAVA_REDIRECT_URI has the full URL with https:// and /strava/callback at the end

### "Admin login doesn't work"
- Make sure ADMIN_EMAIL and ADMIN_PASSWORD match what you're typing in the login form
- Passwords are case-sensitive

### "Runners can't see their runs"
- They need to connect Strava from their Profile page
- They need to have recorded a run AFTER connecting (old runs sync too, up to 30 days back)

---

## Summary of All Accounts You'll Create

| Service | Link | What for |
|---------|------|----------|
| GitHub | github.com | Stores your code |
| Railway | railway.app | Hosts your website |
| Strava API | strava.com/settings/api | Syncs run data |

---

## Total Cost

| Item | Cost |
|------|------|
| GitHub | Free |
| Railway | Free tier ($5/month if you exceed free hours, usually enough for a club) |
| Strava API | Free (up to 100 requests per 15 min, plenty for a club) |
| Custom domain | ~$10/year (optional) |

---

**That's it! Your Sprint Society is live.** 🎉

Share the URL with your runners and watch the community grow.

*— Sprint Society, a product by Kendu Entertainment*
