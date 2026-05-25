# Sprint Society — AI Audit Prompts

Copy-paste the relevant bundle file + one of these prompts into another AI.

---

## Step 1: Run the Generator

Open PowerShell in the `sprint-society/` folder and run:

```powershell
.\generate-audit-bundle.ps1
```

This creates 3 files on your Desktop in `sprint-society-audit/`:
- `1-algorithm-audit.txt`
- `2-security-backend-audit.txt`
- `3-frontend-ux-audit.txt`

---

## Step 2: Pick Your Audit Type & Paste the Prompt

### OPTION A: Algorithm & Classification Audit

**File to share:** `1-algorithm-audit.txt`

**Prompt to paste AFTER the file contents:**

```
You are a sports science and software engineering auditor. I'm sharing the full source code of a runner classification engine for an AI-powered run club app.

Please audit this system for:

1. MATHEMATICAL CORRECTNESS
   - Are the scoring formulas sound? Any division-by-zero or boundary issues?
   - Does the interpolation logic in timeToLevel() handle all edge cases?
   - Is the composite weighted score calculation correct?

2. FAIRNESS
   - Is the gender adjustment (13% volume boost for women) appropriate?
   - Does age grading properly normalize across age groups?
   - Are there biases that would systematically over/under-classify certain demographics?

3. RUNNING SCIENCE ACCURACY
   - Are the benchmark times realistic? (Compare against real-world 5K/10K/HM/Marathon distributions)
   - Is the VO2max-to-level mapping reasonable?
   - Are the ACWR safety rail thresholds evidence-based?

4. EDGE CASES
   - New user with zero data
   - Returning user after 6-month break
   - Elite runner (sub-15:00 5K)
   - Older runner (65+) with limited data
   - User with only VO2max watch estimate, no race

5. CALIBRATION & VALIDATION
   - Is the 3-week calibration period sufficient?
   - Is capping at I5 during calibration too restrictive or too generous?
   - Does the race vs provisional distinction add real value?

6. ADVANCEMENT/REGRESSION
   - Are the 3-week advancement and 4/8-week regression rules fair?
   - Could a user game the system?
   - Are there scenarios where someone is stuck and can't advance?

Format your response as:
- P0 (Critical) — must fix before launch
- P1 (Important) — should fix soon
- P2 (Nice to have) — future improvement
- Observations — things that are good / well-designed

For each finding, cite the specific function/line and explain the issue + suggested fix.
```

---

### OPTION B: Security Audit

**File to share:** `2-security-backend-audit.txt`

**Prompt to paste AFTER the file contents:**

```
You are a senior application security engineer conducting a security audit. I'm sharing the full backend source code of a Node.js/Express app with JWT auth, Strava OAuth2 integration, and SQLite database.

Please audit this codebase for:

1. AUTHENTICATION & AUTHORIZATION
   - JWT implementation (signing, verification, expiry, refresh)
   - Admin access control
   - Token storage and transmission
   - Session management

2. INJECTION ATTACKS
   - SQL injection (even with parameterized queries, check for string interpolation)
   - Command injection
   - NoSQL injection (if applicable)
   - Header injection

3. API SECURITY
   - Input validation (missing or insufficient)
   - IDOR (can user A access user B's data?)
   - Mass assignment vulnerabilities
   - Rate limiting gaps
   - Information disclosure in error responses

4. OAUTH2 SECURITY (Strava)
   - State parameter usage (CSRF prevention)
   - Token storage security
   - Redirect URI validation
   - Scope management

5. DATA PROTECTION
   - Sensitive data exposure (passwords, tokens in logs)
   - CORS configuration
   - Cookie security flags
   - Encryption at rest/transit

6. INFRASTRUCTURE
   - Dependency vulnerabilities (based on package.json)
   - Environment variable handling
   - Error handling (stack traces exposed?)
   - File upload risks (if any)

Format your response as:
- CRITICAL — exploitable now, data breach risk
- HIGH — exploitable with effort, should fix before production
- MEDIUM — defense-in-depth, fix in next sprint
- LOW — best practice improvement
- INFO — observations, good practices noted

For each finding: describe the vulnerability, cite the file:line, show proof-of-concept (how to exploit), and provide the fix.
```

---

### OPTION C: Frontend & UX Audit

**File to share:** `3-frontend-ux-audit.txt`

**Prompt to paste AFTER the file contents:**

```
You are a senior frontend engineer and UX specialist. I'm sharing the full React frontend of a mobile-first fitness app. Please audit for:

1. REACT PATTERNS
   - Improper hook usage (useEffect deps, stale closures)
   - Missing error boundaries
   - Unnecessary re-renders (missing memo/useMemo/useCallback)
   - Key prop issues in lists
   - State management patterns

2. PERFORMANCE
   - Bundle size concerns (large imports, tree-shaking issues)
   - Missing lazy loading for routes/components
   - Image optimization
   - Animation performance (layout thrashing, will-change)
   - React Query cache strategy

3. ACCESSIBILITY (WCAG 2.1 AA)
   - Missing ARIA labels
   - Keyboard navigation gaps
   - Color contrast issues
   - Focus management
   - Screen reader compatibility
   - Touch target sizes (44px minimum)

4. MOBILE UX
   - Works at 375px viewport?
   - Touch-friendly interactions
   - Loading states on every async operation
   - Error states user-friendly
   - Offline/slow network handling

5. SECURITY (Frontend)
   - XSS vulnerabilities (dangerouslySetInnerHTML, unescaped user input)
   - Token storage (localStorage vs memory)
   - Sensitive data in client state
   - Route protection (auth guards)

6. CODE QUALITY
   - TypeScript usage (any types, missing generics)
   - Component responsibility (too large? too coupled?)
   - Reusability of UI components
   - Consistent patterns across pages

Format as:
- P0 (Ship blocker)
- P1 (Fix before beta)
- P2 (Improve over time)
- Good patterns (things done well)

Cite component names and approximate locations.
```

---

### OPTION D: Full Stack Review (if AI supports large context)

**For Claude 200K, Gemini 1M, or GPT-4 128K** — paste ALL 3 bundles together with this prompt:

```
You are a full-stack technical auditor. I'm sharing the complete source code of Sprint Society — an AI-powered run club platform built with React + Express + TypeScript + SQLite.

Conduct a comprehensive audit covering:
1. Architecture & design patterns
2. Security vulnerabilities
3. Performance bottlenecks
4. Algorithm correctness (runner classification engine)
5. Code quality & maintainability
6. Scalability concerns
7. UX & accessibility gaps

Prioritize findings by business impact. For each: cite file, explain risk, suggest fix.

End with a "Top 5 Things to Fix Before Launch" list.
```

---

## Step 3: Follow Up

After the initial audit, ask:

```
Based on your audit, what are the 3 biggest risks if this app goes to production with 50 paying users? And what would you change if scaling to 5,000 users?
```

---

## Tips

- **ChatGPT (4o):** 128K context, handles Bundle 1 or 2 easily. Bundle 3 might need splitting.
- **Claude (Opus/Sonnet):** 200K context, can handle any single bundle. All 3 together is tight.
- **Gemini 1.5 Pro:** 1M context, paste everything at once.
- **DeepSeek:** 64K context, use Bundle 1 only or split Bundle 2.

If a bundle is too large, the script already prioritizes the most important files first — you can cut from the bottom.
