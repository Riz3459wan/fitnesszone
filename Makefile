.PHONY: up up-all down logs ps fe nuke
up:
	docker compose up -d --build
up-all:
	docker compose --profile messaging up -d --build
down:
	docker compose --profile messaging down
logs:
	docker compose logs -f --tail=100 legacy edge
ps:
	docker compose --profile messaging ps
fe:
	cd frontend/gym-web && npm ci && npm run dev
# DANGER: saara local data (volumes) delete
nuke:
	docker compose --profile messaging down -v
