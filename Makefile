.PHONY: up down logs n8n restart

up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f

n8n:
	open http://localhost:5678

restart:
	docker compose restart
