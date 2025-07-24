server:
	uv run uvicorn server.server:app --host 0.0.0.0 --port 8088 --reload --reload-dir server --reload-include .env

frontend:
	npm run start

setup:
	touch .env.local
	uv run python generate_api_key.py

docker-start:
	docker run -u root \
		--env-file .env \
		--env-file .env.local \
		-v ${HOME}/.anthropic:/home/legacy-use-mgmt/.anthropic \
		-v /var/run/docker.sock:/var/run/docker.sock \
		-v ${HOME}/.config/gcloud/application_default_credentials.json:/home/legacy-use-mgmt/.config/gcloud/application_default_credentials.json \
		-p 8088:8088 \
		-p 5173:5173 \
		-e LEGACY_USE_DEBUG=1 \
		-v ${PWD}/server:/home/legacy-use-mgmt/server/ \
		-v ${PWD}/app:/home/legacy-use-mgmt/app/ \
		-v ${PWD}/.env.local:/home/legacy-use-mgmt/.env.local \
		--name legacy-use-mgmt \
		--rm -it legacy-use-mgmt:local

docker-build:
	# Build backend with both naming conventions
	docker build -t legacy-use-backend:local -f infra/docker/legacy-use-backend/Dockerfile .
	docker tag legacy-use-backend:local legacy-use-core-backend:local

	# Build frontend with both naming conventions
	docker build -t legacy-use-frontend:local -f infra/docker/legacy-use-frontend/Dockerfile .
	docker tag legacy-use-frontend:local legacy-use-core-frontend:local

	# Build linux-machine with both naming conventions
	docker build -t linux-machine:local -f infra/docker/linux-machine/Dockerfile .
	docker tag linux-machine:local legacy-use-core-linux-machine:local

	# Build other images (keeping original names)
	docker build -t legacy-use-mgmt:local -f infra/docker/legacy-use-mgmt/Dockerfile .
	docker build -t legacy-use-target:local -f infra/docker/legacy-use-target/Dockerfile .

	docker build -t legacy-use-demo-db:local -f infra/docker/legacy-use-demo-db/Dockerfile .
	docker tag legacy-use-demo-db:local legacy-use-core-demo-db:local

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
