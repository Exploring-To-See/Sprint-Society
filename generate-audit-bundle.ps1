# Sprint Society — AI Audit Bundle Generator
# Run this from the sprint-society/ directory
# Generates 3 files on your Desktop for easy sharing

$OutputDir = "$env:USERPROFILE\Desktop\sprint-society-audit"
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

Write-Host "Generating audit bundles in: $OutputDir" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# BUNDLE 1: Algorithm & Classification Engine (~2K lines)
# For: Math/algorithm audits, scoring fairness, classification accuracy
# ============================================================================

$bundle1 = @(
    "CLAUDE.md"
    "shared\types.ts"
    "docs\classification-engine-v2-spec.md"
    "server\src\engine\classification-engine.ts"
    "server\src\engine\ai-profiler.ts"
    "server\src\engine\ageGrading.ts"
    "server\src\engine\vo2max.ts"
    "server\src\engine\tierClassifier.ts"
    "server\src\engine\paceCalculator.ts"
    "server\src\engine\adaptiveEngine.ts"
    "server\src\engine\heartRateZones.ts"
    "server\src\engine\personalRecords.ts"
    "server\src\routes\profiling.routes.ts"
)

$out1 = "$OutputDir\1-algorithm-audit.txt"
"" | Out-File -Encoding utf8 $out1

@"
================================================================================
SPRINT SOCIETY — ALGORITHM & CLASSIFICATION ENGINE AUDIT BUNDLE
================================================================================

Project: Sprint Society (AI-powered run club platform)
Stack: TypeScript, Express, React, Postgres (pg)
Deploy: Vercel (serverless) + Supabase Postgres

PURPOSE OF THIS AUDIT:
Review the runner classification algorithm for:
- Mathematical correctness of scoring formulas
- Fairness across age/gender groups
- Edge cases (new users, returning users, elite athletes)
- Safety rail effectiveness (injury prevention)
- Calibration period logic
- Race vs training validation distinction
- Benchmark table accuracy against real-world running data

FACTOR WEIGHTS (approved after 3 independent audits):
Performance 40% | Volume 15% | Consistency 15% | Recovery 15% | VO2max 10% | Pace Compliance 5%

================================================================================

"@ | Out-File -Encoding utf8 -Append $out1

$sep = '=' * 80
foreach ($file in $bundle1) {
    if (Test-Path $file) {
        "`n$sep`n=== FILE: $file ===`n$sep`n" | Out-File -Encoding utf8 -Append $out1
        Get-Content $file -Raw | Out-File -Encoding utf8 -Append $out1
    }
}

Write-Host "[1/3] Algorithm bundle: $out1" -ForegroundColor Green

# ============================================================================
# BUNDLE 2: Security & Backend (~4K lines)
# For: Security audits, auth review, API review, SQL injection, etc.
# ============================================================================

$bundle2 = @(
    "CLAUDE.md"
    "server\package.json"
    "shared\types.ts"
    "server\src\index.ts"
    "server\src\config.ts"
    "server\src\database\db.ts"
    "server\src\middleware\auth.ts"
    "server\src\middleware\adminAuth.ts"
    "server\src\middleware\errorHandler.ts"
    "server\src\middleware\subscription.ts"
    "server\src\utils\jwt.ts"
    "server\src\services\strava.service.ts"
    "server\src\services\email.service.ts"
    "server\src\services\ai.service.ts"
    "server\src\routes\auth.routes.ts"
    "server\src\routes\password.routes.ts"
    "server\src\routes\strava.routes.ts"
    "server\src\routes\admin.routes.ts"
    "server\src\routes\subscription.routes.ts"
    "server\src\routes\profiling.routes.ts"
    "server\src\routes\runs.routes.ts"
    "server\src\routes\social.routes.ts"
    "server\src\routes\profile.routes.ts"
    "server\src\routes\invite.routes.ts"
    "server\src\routes\feedback.routes.ts"
    "server\src\routes\events.routes.ts"
    "server\src\routes\communities.routes.ts"
    "server\src\routes\notifications.routes.ts"
    "server\src\routes\chat.routes.ts"
    "server\src\routes\ai.routes.ts"
    "server\src\routes\coaching.routes.ts"
    "server\src\routes\gamification.routes.ts"
    "server\src\routes\progress.routes.ts"
    "server\src\routes\training.routes.ts"
    "server\src\routes\heartrate.routes.ts"
    "server\src\routes\records.routes.ts"
    "server\src\routes\adaptive.routes.ts"
    "server\src\routes\onboarding.routes.ts"
    "server\src\routes\admin-audit.routes.ts"
    "server\src\routes\admin-analytics.routes.ts"
    "server\src\routes\admin-flags.routes.ts"
    "server\src\routes\admin-segments.routes.ts"
    "server\src\routes\admin-notifications.routes.ts"
    "server\src\routes\admin-content.routes.ts"
    "server\src\routes\admin-engineering.routes.ts"
    "server\src\routes\admin-moderation.routes.ts"
)

$out2 = "$OutputDir\2-security-backend-audit.txt"
"" | Out-File -Encoding utf8 $out2

@"
================================================================================
SPRINT SOCIETY — SECURITY & BACKEND AUDIT BUNDLE
================================================================================

Project: Sprint Society (AI-powered run club platform)
Stack: TypeScript, Express, Postgres (pg), JWT auth, Google OAuth
Deploy: Vercel (serverless) + Supabase Postgres

PURPOSE OF THIS AUDIT:
Review for:
- Authentication/authorization vulnerabilities (JWT handling, token storage)
- SQL injection (using pg parameterized queries)
- API input validation gaps
- IDOR (insecure direct object references)
- Rate limiting / abuse prevention
- Strava OAuth2 flow security
- Admin panel access control
- Secrets management
- Error information leakage
- CORS / CSRF concerns

ARCHITECTURE NOTES:
- Single Express server, all routes behind JWT middleware
- Admin routes have separate adminAuth middleware
- Strava integration uses OAuth2 with refresh token rotation
- Postgres (pg) — async, pooled (Supabase transaction pooler in production)
- No Redis/session store — stateless JWT only

================================================================================

"@ | Out-File -Encoding utf8 -Append $out2

foreach ($file in $bundle2) {
    if (Test-Path $file) {
        "`n$sep`n=== FILE: $file ===`n$sep`n" | Out-File -Encoding utf8 -Append $out2
        Get-Content $file -Raw | Out-File -Encoding utf8 -Append $out2
    }
}

Write-Host "[2/3] Security bundle: $out2" -ForegroundColor Green

# ============================================================================
# BUNDLE 3: Frontend & UX (~3K lines)
# For: UX review, accessibility, performance, React patterns
# ============================================================================

$bundle3 = @(
    "CLAUDE.md"
    "client\package.json"
    "shared\types.ts"
    "client\src\main.tsx"
    "client\src\App.tsx"
    "client\src\lib\api.ts"
    "client\src\lib\formatters.ts"
    "client\src\lib\shareCard.ts"
    "client\src\context\AuthContext.tsx"
    "client\src\components\layout\AppShell.tsx"
    "client\src\components\layout\BottomNav.tsx"
    "client\src\components\registration\RegistrationFlow.tsx"
    "client\src\components\dashboard\Dashboard.tsx"
    "client\src\components\dashboard\LevelCard.tsx"
    "client\src\components\dashboard\ChallengeList.tsx"
    "client\src\components\dashboard\PaceChart.tsx"
    "client\src\components\dashboard\TrainingLoadRing.tsx"
    "client\src\components\dashboard\PRBanner.tsx"
    "client\src\components\dashboard\ReadinessCard.tsx"
    "client\src\components\dashboard\TodaySession.tsx"
    "client\src\components\dashboard\UpcomingEvents.tsx"
    "client\src\components\dashboard\CommunityActivity.tsx"
    "client\src\components\coaching\CoachingPanel.tsx"
    "client\src\components\chat\ChatFAB.tsx"
    "client\src\components\ai\AIInsights.tsx"
    "client\src\components\social\RunCard.tsx"
    "client\src\components\social\RunnerCardPopup.tsx"
    "client\src\components\events\EventCard.tsx"
    "client\src\components\events\AttendeeAvatars.tsx"
    "client\src\components\communities\CommunityCard.tsx"
    "client\src\components\celebrations\Confetti.tsx"
    "client\src\components\ui\Button.tsx"
    "client\src\components\ui\TapGrid.tsx"
    "client\src\components\ui\Slider.tsx"
    "client\src\components\ui\Skeleton.tsx"
    "client\src\components\ui\ProgressBar.tsx"
    "client\src\components\ui\ErrorBoundary.tsx"
    "client\src\components\ui\UpgradePrompt.tsx"
    "client\src\components\ui\AIErrorMessages.ts"
    "client\src\components\FeedbackButton.tsx"
    "client\src\pages\LandingPage.tsx"
    "client\src\pages\RegisterPage.tsx"
    "client\src\pages\DashboardPage.tsx"
    "client\src\pages\HomePage.tsx"
    "client\src\pages\ProfilePage.tsx"
    "client\src\pages\CoachingPage.tsx"
    "client\src\pages\ChatPage.tsx"
    "client\src\pages\TrainingPage.tsx"
    "client\src\pages\TrainPage.tsx"
    "client\src\pages\RunHistoryPage.tsx"
    "client\src\pages\ProgressPage.tsx"
    "client\src\pages\SharePage.tsx"
    "client\src\pages\HRZonesPage.tsx"
    "client\src\pages\RecordsPage.tsx"
    "client\src\pages\EventsPage.tsx"
    "client\src\pages\EventDetailPage.tsx"
    "client\src\pages\CommunitiesPage.tsx"
    "client\src\pages\CommunityDetailPage.tsx"
    "client\src\pages\CreateCommunityPage.tsx"
    "client\src\pages\NotificationsPage.tsx"
    "client\src\pages\SubscriptionPage.tsx"
    "client\src\pages\AIProfilingPage.tsx"
    "client\src\pages\AIProfilePage.tsx"
    "client\src\pages\UserProfilePage.tsx"
    "client\src\pages\FeedPage.tsx"
    "client\src\pages\AdminPage.tsx"
    "client\src\pages\StravaCallbackPage.tsx"
    "client\src\pages\ForgotPasswordPage.tsx"
    "client\src\pages\ResetPasswordPage.tsx"
)

$out3 = "$OutputDir\3-frontend-ux-audit.txt"
"" | Out-File -Encoding utf8 $out3

@"
================================================================================
SPRINT SOCIETY — FRONTEND & UX AUDIT BUNDLE
================================================================================

Project: Sprint Society (AI-powered run club platform)
Stack: React 18, Vite, TypeScript, TailwindCSS, Framer Motion, Recharts, React Query
Deploy: Vercel (static client + serverless API)

PURPOSE OF THIS AUDIT:
Review for:
- React patterns (proper hooks usage, memo, key props)
- Performance (unnecessary re-renders, bundle size, lazy loading)
- Accessibility (ARIA labels, keyboard nav, contrast, screen reader)
- Mobile-first design (375px viewport target)
- Error/loading state coverage
- Auth flow UX (token handling, redirect logic)
- Component architecture (separation of concerns, reusability)
- TailwindCSS usage patterns
- Animation performance (Framer Motion best practices)

DESIGN PRINCIPLES:
- Mobile-first (375px primary viewport)
- Dark mode only (zinc/slate color palette)
- Minimal typing — tap grids, sliders, gestures preferred
- Loading skeleton on every async operation
- User-friendly error messages, never raw errors

================================================================================

"@ | Out-File -Encoding utf8 -Append $out3

foreach ($file in $bundle3) {
    if (Test-Path $file) {
        "`n$sep`n=== FILE: $file ===`n$sep`n" | Out-File -Encoding utf8 -Append $out3
        Get-Content $file -Raw | Out-File -Encoding utf8 -Append $out3
    }
}

Write-Host "[3/3] Frontend bundle: $out3" -ForegroundColor Green

# ============================================================================
# Summary
# ============================================================================

Write-Host ""
Write-Host "Done! 3 audit bundles created:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  1-algorithm-audit.txt     - Classification engine, scoring, safety rails"
Write-Host "  2-security-backend-audit.txt - Auth, routes, DB, services, admin"
Write-Host "  3-frontend-ux-audit.txt   - React components, pages, UX patterns"
Write-Host ""
Write-Host "Location: $OutputDir" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Open the file you want audited"
Write-Host "  2. Copy-paste into ChatGPT / Claude / Gemini"
Write-Host "  3. Use one of the prompts below"
Write-Host ""
