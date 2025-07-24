docker-images:
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

local-linux-vm:
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
