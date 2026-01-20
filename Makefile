.PHONY: build-frontend build-backend up down

build-frontend:
	docker build -t whosnext-frontend -f frontend/docker/Dockerfile frontend

build-backend:
	docker build -t whosnext-backend -f backend/docker/Dockerfile backend

start:
	docker compose up

stop:
	docker compose down
