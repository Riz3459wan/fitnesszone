# Gym Platform (Monolith -> Microservices, Strangler Fig)

```
Browser -> Vite dev (5173) -> /api proxy -> EDGE nginx (8000) -> legacy monolith (8080)
                                                  |-> (aage) notification / member / billing ... services
Postgres 5432 | Redis 6379 | Prometheus 9090 | Grafana 3000 | Kafka 9092 (profile: messaging)
```

## Pehli baar chalana
```bash
cp .env.example .env          # phir .env mein JWT_SECRET (openssl rand -base64 48) aur passwords bharo
make up                       # postgres, redis, legacy, edge, prometheus, grafana
make fe                       # dusre terminal mein: frontend -> http://localhost:5173
```

## Verify
| Check | Kaise |
|---|---|
| Edge zinda | `curl localhost:8000/edge/health` -> `ok` |
| Legacy edge ke through | `curl -i localhost:8000/api/auth/check-subdomain?subdomain=test` |
| DBs bane | `docker exec -it gym-postgres psql -U postgres -c "\l"` (gym_db, member_db ... dikhne chahiye) |
| Prometheus | http://localhost:9090/targets |
| Grafana | http://localhost:3000 (Prometheus datasource pehle se hoga) |
| Kafka (optional) | `make up-all` |

## Rules
- `.env` kabhi commit nahi. Real Razorpay keys local pe nahi, sirf TEST keys.
- Services ek doosre ka DB ya code share nahi karengi (contracts/ ke through baat karengi).
- Har problem aur optimization `docs/issue-log.md` mein.

## Extraction order
1. Edge (done) 2. notification 3. member 4. billing 5. attendance (Go) 6. reporting 7. identity
