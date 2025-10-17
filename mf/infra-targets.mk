## MF-Demo in Az:
GIT_SHORT_HASH := $(shell git rev-parse --short HEAD)

mf-azlogin: ## Login onto Azure with user principal
	az login

mf-azdockerlogin: ## Login onto Azure Container Registry
	az acr login -n ${AZ_ACR_NAME}

mf-build-db:
	az acr build \
		--registry ${AZ_ACR_NAME} \
		--registry ${AZ_ACR_NAME} \
		--image legacy-use-db:${GIT_SHORT_HASH} \
		--image legacy-use-db:latest \
		--image legacy-use-demo-db:local \
		-f infra/docker/legacy-use-demo-db/Dockerfile \
		.

mf-build-backend:
	az acr build \
		--registry ${AZ_ACR_NAME} \
		--image legacy-use-backend:${GIT_SHORT_HASH} \
		--image legacy-use-backend:latest \
		--image legacy-use-core-backend:local \
		-f infra/docker/legacy-use-backend/Dockerfile \
		.

mf-build-frontend:
	az acr build \
		--registry ${AZ_ACR_NAME} \
		--image legacy-use-frontend:${GIT_SHORT_HASH} \
		--image legacy-use-frontend:latest \
		--image legacy-use-frontend:local \
		--image legacy-use-core-frontend:local \
		-f infra/docker/legacy-use-frontend/Dockerfile \
		$(shell grep '^VITE_' .env.az | sed 's/^/--build-arg /') \
		.

mf-build-target:
	az acr build \
		--registry ${AZ_ACR_NAME} \
		--image legacy-use-core-linux-machine:${GIT_SHORT_HASH} \
		--image legacy-use-core-linux-machine:latest \
		--image legacy-use-target:local \
		--build-arg TARGETARCH=amd64 \
		-f infra/docker/legacy-use-target/Dockerfile \
		.

mf-build-gnucash:
	az acr build \
		--registry ${AZ_ACR_NAME} \
		--image target-machine-gnucash:${GIT_SHORT_HASH} \
		--image target-machine-gnucash:latest \
		--image legacy-use-core-linux-machine:local \
		--image linux-machine:local \
		-f infra/docker/linux-machine/Dockerfile \
		.

mf-build-all: mf-azlogin mf-azdockerlogin mf-build-db mf-build-backend mf-build-frontend mf-build-target mf-build-gnucash

# vm login as azure user principal
mf-vmlogin:
	az ssh vm -n ${AZ_DEMO_VM_NAME} -g ${AZ_DEMO_VM_RG} -- -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null

mf-get-vm-ip:
	@IP=$$(az vm show \
		--resource-group ${AZ_DEMO_VM_RG} \
		--name ${AZ_DEMO_VM_NAME} \
		-d \
		--query "publicIps" \
		-o tsv); \
	if [ -z "$$IP" ]; then \
		echo "❌ Keine öffentliche IP gefunden!"; \
		exit 1; \
	fi; \
	echo "$$IP"

# login as vm standard user
mf-ssh:
	@IP=$$(make -s mf-get-vm-ip); \
	ssh -i ${AZ_DEMO_VM_SSH_KEY} ${AZ_DEMO_VM_USER}@$$IP -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null

mf-deploy:
	./mf/mf-deploy.sh
