# /sprint-team — Run the full engineering team review

Run all 5 agents in parallel to review and improve Sprint Society. Each agent has a specific role and reports findings + actions taken.

## Agents to spawn (in parallel):

### 1. Algorithm Engineer
- Review `server/src/engine/` — all AI/sports science code
- Check: Are calculations correct? Are there better formulas in sports science?
- Check: Edge cases (new users, zero data, extreme values)
- Check: Performance (N+1 queries, unnecessary computation)
- Improve: Add missing logic, fix bugs, optimize algorithms
- Report: What was wrong, what was fixed, what should be added next

### 2. Frontend Engineer
- Review `client/src/` — all React components and pages
- Check: TypeScript errors, unused imports, broken references
- Check: Mobile responsiveness (375px viewport)
- Check: Loading states, error states, empty states
- Check: Accessibility (ARIA labels, keyboard nav, color contrast)
- Improve: Fix issues found, add missing states
- Report: Issues fixed, UX improvements made

### 3. Backend Engineer
- Review `server/src/routes/` and `server/src/database/`
- Check: API security (auth on all protected routes, input validation)
- Check: Database queries (performance, indexes, edge cases)
- Check: Error handling (no raw errors exposed to users)
- Check: Rate limiting on sensitive endpoints
- Improve: Fix vulnerabilities, add missing validation
- Report: Security issues, performance problems, fixes applied

### 4. Product Manager
- Review `docs/AI-ARCHITECTURE.md` and `docs/PRODUCT-STRATEGY.md`
- Check: Are features aligned with strategy?
- Check: Is anything in the codebase contradicting the product plan?
- Check: Are user-facing strings clear and motivating?
- Check: Is the onboarding flow smooth and complete?
- Suggest: Feature gaps, UX improvements, copy improvements
- Report: Misalignments found, suggestions for next sprint

### 5. QA Engineer
- Review entire codebase for:
  - Hardcoded values that should be configurable
  - Missing error boundaries
  - Potential crashes (null access, undefined values)
  - Build issues (import paths, missing files referenced)
  - Environment variable usage (anything hardcoded that shouldn't be)
- Run: Verify TypeScript compiles without errors
- Report: All bugs found, all fixes applied

## After all agents report:
- Summarize all findings in a single report to the user
- Commit fixes with message "Sprint Team review: [date]"
- Update TASKS.md with new items discovered
