.PHONY: server frontend test server-tests docker-start docker-linux-vm dev-docker prod stop logs ensure-env docker-build-backend docker-build-frontend docker-build-linux-machine docker-build-demo-db docker-build-target docker-build-all

ensure-env:
	@if [ ! -f .env ]; then \
		echo "📝 Creating .env file..."; \
		touch .env; \
		echo "# Legacy Use Environment Variables" >> .env; \
		echo "# Add your environment variables here" >> .env; \
	else \
		echo "✅ .env file already exists"; \
	fi

db-migrate:
	uv run alembic -c server/alembic.ini upgrade head

server:
	uv run uvicorn server.server:app --host 0.0.0.0 --port 8088 --reload --reload-dir server --reload-include .env

frontend:
	pnpm run start

test: server-tests
server-tests:
	uv run pytest

# Docker Compose Commands
docker-dev: ensure-env
	@echo "🚀 Starting legacy-use in DEVELOPMENT mode with hot-reloading..."
	docker-compose -f docker-compose.yml -f docker-compose.dev-override.yml up

docker-prod: ensure-env
	@echo "🚀  Starting legacy-use in PRODUCTION mode..."
	@if curl -s --connect-timeout 1 http://169.254.169.254/latest/meta-data/ > /dev/null 2>&1; then \
		echo "🌐 Detected AWS environment"; \
		echo "🔐 Retrieving DATABASE_URL from AWS Secrets Manager"; \
		SECRET_NAME="legacy-use-mgmt-database-url"; \
		export DATABASE_URL=$$(aws secretsmanager get-secret-value --secret-id $$SECRET_NAME --query SecretString --output text); \
	fi
	@echo "🔧 Starting services in production mode..."
	docker-compose up -d

# Individual Docker Build Targets
docker-build-target:
	@echo "🔨 Building legacy-use-target..."
	docker build -t legacy-use-target:local -f infra/docker/legacy-use-target/Dockerfile .

docker-build-backend:
	@echo "🔨 Building backend..."
	docker build -t legacy-use-backend:local -f infra/docker/legacy-use-backend/Dockerfile .
	docker tag legacy-use-backend:local legacy-use-core-backend:local

docker-build-frontend:
	@echo "🔨 Building frontend..."
	docker build -t legacy-use-frontend:local -f infra/docker/legacy-use-frontend/Dockerfile .
	docker tag legacy-use-frontend:local legacy-use-core-frontend:local

docker-build-linux-machine:
	@echo "🔨 Building linux-machine..."
	docker build -t linux-machine:local -f infra/docker/linux-machine/Dockerfile .
	docker tag linux-machine:local legacy-use-core-linux-machine:local

docker-build-demo-db:
	@echo "🔨 Building demo-db..."
	docker build -t legacy-use-demo-db:local -f infra/docker/legacy-use-demo-db/Dockerfile .
	docker tag legacy-use-demo-db:local legacy-use-core-demo-db:local

# Combined Build Target
docker-build-all: docker-build-target docker-build-backend docker-build-frontend docker-build-linux-machine docker-build-demo-db
	@echo "✅ All Docker images built successfully!"

# Legacy alias for backward compatibility
docker-build: docker-build-all

docker-linux-vm:
	docker run -d \
		--name legacy-use-linux-machine \
		-e VNC_PASSWORD=password123 \
		-e USER=developer \
		-e PASSWORD=developer123 \
		-e RESOLUTION=1024x768 \
		-v linux-home:/home/developer \
		-v linux-workspace:/workspace \
		-v /dev/shm:/dev/shm \
		--workdir /workspace \
		--health-cmd='curl -f http://localhost/ || exit 1' \
		--health-interval=3s \
		--health-timeout=2s \
		--health-retries=10 \
		legacy-use-core-linux-machine:local


## MF-Demo in Az:
GIT_SHORT_HASH := $(shell git rev-parse --short HEAD)

mf-azlogin: ## Login onto Azure with user principal
	az login --tenant ${AZ_TENANT_ID}

mf-azdockerlogin: ## Login onto Azure Container Registry
	az acr login -n ${AZ_ACR_NAME}

mf-build-demo-db:
	az acr build \
		--registry ${AZ_ACR_NAME} \
		--image legacy-use-db:${GIT_SHORT_HASH} \
		--image legacy-use-db:latest \
		-f infra/docker/legacy-use-demo-db/Dockerfile \
		.

mf-build-demo-backend:
	az acr build \
		--registry ${AZ_ACR_NAME} \
		--image legacy-use-backend:${GIT_SHORT_HASH} \
		--image legacy-use-backend:latest \
		-f infra/docker/legacy-use-backend/Dockerfile \
		.

mf-build-demo-frontend:
	az acr build \
		--registry ${AZ_ACR_NAME} \
		--image legacy-use-frontend:${GIT_SHORT_HASH} \
		--image legacy-use-frontend:latest \
		-f infra/docker/legacy-use-frontend/Dockerfile \
		--build-arg VITE_PROXY_TARGET=https://tenant-default.legacy-use.az.mayflower.cloud \
		.

mf-build-demo-all: mf-azlogin mf-azdockerlogin mf-build-demo-db mf-build-demo-backend mf-build-demo-frontend

mf-vmssh:
	az ssh vm -n ${AZ_DEMO_VM_NAME} -g ${AZ_DEMO_VM_RG} -- -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null

mf-deploy-demo:
	./mf-deploy-demo.sh
