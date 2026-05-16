# /sprint-backend — Backend Engineer Review

Deep review of API security, performance, and reliability.

## Tasks:
1. Read all files in `server/src/routes/`, `server/src/middleware/`, `server/src/database/`
2. Security audit:
   - All protected routes use `authenticate` middleware
   - All admin routes use `requireAdmin` middleware
   - Input validation on EVERY POST/PUT endpoint (use zod)
   - No SQL injection possible (parameterized queries)
   - Password hashing is bcrypt with salt rounds ≥ 10
   - JWT tokens have reasonable expiry
   - Rate limiting on auth endpoints
3. Performance:
   - No N+1 queries (check JOINs vs multiple queries)
   - Proper indexes exist for frequent queries
   - No full table scans on large tables
4. Reliability:
   - Error handling on every route (try/catch, proper status codes)
   - Database operations are atomic where needed
   - Graceful handling of missing data
5. Fix everything. Then report.
