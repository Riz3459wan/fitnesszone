# ADR 0001: Strangler Fig with an nginx edge

## Status
Accepted

## Context
Working multi-tenant monolith (Spring Boot, JWT cookie auth, Razorpay) with a React frontend.
A big-bang rewrite is risky: no safety net, long time without a working product.

## Decision
Put a reverse proxy (nginx) in front of the monolith first. Extract one module at a time and
re-point only that route prefix. The frontend keeps calling the same /api/... URLs.
Spring Cloud Gateway is introduced later, when routing needs JWT validation / rate limiting
per route; until then nginx is simpler and has no JVM overhead.

## Consequences
- Zero change in monolith code for step 1; easy rollback (remove one location block).
- Edge must forward Host (tenant fallback uses subdomain) and overwrite X-Forwarded-For
  (monolith rate limiter trusts it).
- Another hop adds ~1 ms latency; measured in Phase 5.
