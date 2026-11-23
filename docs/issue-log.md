# Issue Log
Format: Problem / Symptom / Root cause / Fix / Result. Result jab measure ho tab bharna (numbers ke saath).

## Found in code review (pending)
| # | Problem | Where | Fix | Result |
|---|---|---|---|---|
| 1 | Spring Boot 3.1.5 (EOL) | pom.xml | Upgrade to current stable | pending |
| 2 | ddl-auto=update (default profile) | application.properties | Flyway + validate | pending |
| 3 | Money stored as Double | Payment.amount, MembershipPlan.price | BigDecimal + NUMERIC(12,2) | pending |
| 4 | Check-in/out stored as String | Attendance | TIMESTAMPTZ | pending |
| 5 | Rate limiter trusts client X-Forwarded-For (spoofable) | RateLimitingFilter | Edge overwrites header (done in nginx); app-level trusted-proxy config | partial |
| 6 | Per-request DB lookups (user, gym, subscription) | TenantInterceptor, SubscriptionFilter | Cache + measure with k6 | pending |
| 7 | Direct cross-module repo access | PaymentService, MemberService, AttendanceService, Dashboard/Report | API calls + Kafka events | pending |
| 8 | Tests run on H2 (MODE=MySQL) but prod is Postgres | application-test.properties | Testcontainers | pending |
| 9 | Frontend test failing already: AuthContext "sets user in memory after successful login" (role expected admin, got none) | frontend/src/tests/context/AuthContext.test.jsx | Investigate | pending |
| 10 | application prod.properties had a space in filename (profile never picked) | resources | Renamed to application-prod.properties | done |
| 11 | .env, bin/, .idea/, .classpath, stray test.java in zips | repo hygiene | Removed from monorepo, .gitignore | done |

## Phase log
(yahan real issues daalte jao: jo sach mein aaye)
