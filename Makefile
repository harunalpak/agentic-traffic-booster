.PHONY: help up down restart logs rebuild clean status health test-kafka test-db

help:
	@echo "Agentic Traffic Booster - Make Commands"
	@echo "========================================"
	@echo "up              - Start all services"
	@echo "down            - Stop all services"
	@echo "restart         - Restart all services"
	@echo "logs            - Follow logs for all services"
	@echo "logs-service    - Follow logs for specific service (make logs-service SERVICE=tweet-scout-service)"
	@echo "rebuild         - Rebuild all services without cache"
	@echo "clean           - Stop and remove all containers, networks, and volumes"
	@echo "status          - Show status of all services"
	@echo "health          - Check health of all services"
	@echo "test-kafka      - Test Kafka connectivity"
	@echo "test-db         - Test database connectivity"

up:
	docker-compose up -d

down:
	docker-compose down

restart:
	docker-compose restart

logs:
	docker-compose logs -f

logs-service:
	docker-compose logs -f $(SERVICE)

rebuild:
	docker-compose build --no-cache
	docker-compose up -d

clean:
	docker-compose down -v --remove-orphans
	docker system prune -f

status:
	docker-compose ps

health:
	@echo "Checking service health..."
	@echo "=========================="
	@curl -s http://localhost:8080/api/health || echo "❌ Product Service DOWN"
	@curl -s http://localhost:8082/api/health || echo "❌ Campaign Service DOWN"
	@curl -s http://localhost:8083/api/health || echo "❌ Social Engine Service DOWN"
	@echo ""
	@echo "Frontend: http://localhost:3000"

test-kafka:
	docker exec atb-kafka kafka-topics --bootstrap-server localhost:9092 --list

test-db:
	docker exec atb-postgres psql -U postgres -d atb_social -c "SELECT 1;"
