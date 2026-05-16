# /sprint-ui — Frontend Engineer Review

Deep review and improvement of the UI/UX.

## Tasks:
1. Read all files in `client/src/pages/` and `client/src/components/`
2. Check every component for:
   - TypeScript errors or `any` types that should be specific
   - Missing loading states (spinners/skeletons)
   - Missing error states (what if API fails?)
   - Missing empty states (what if no data?)
   - Mobile responsiveness issues (test at 375px mentally)
   - Broken imports or dead code
3. Check design consistency:
   - Are all cards using `.card` class?
   - Are all labels using `.label` class?
   - Are colors from the design system (no hardcoded hex)?
   - Is spacing consistent (multiples of 4px)?
4. Check accessibility:
   - All buttons have visible text or aria-label
   - All inputs have labels/placeholders
   - Focus states visible
5. Fix everything found. Don't just report — fix.
6. Report: issues found, fixes applied, remaining suggestions
