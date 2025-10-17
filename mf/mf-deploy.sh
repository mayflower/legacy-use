#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SECRETS_DIR="$PROJECT_ROOT/secrets"

SSH_PRIVATE_KEY=$AZ_DEMO_VM_SSH_KEY
VM_USER=$AZ_DEMO_VM_USER

# echo $SCRIPT_DIR
# exit 0

# Check for SSH private key
if [ ! -f $SSH_PRIVATE_KEY ]; then
  echo "Error: The private SSH key ${SSH_PRIVATE_KEY} is missing. Please install the private key with this name! You can find the key in Vaultwarden"
  exit 1
fi

# read the IP of our VM
VM_IP=$(az vm show \
  --resource-group ${AZ_DEMO_VM_RG} \
  --name ${AZ_DEMO_VM_NAME} \
  -d \
  --query "publicIps" \
  -o tsv)

# create docker-compose.yml and .env file on vm
scp -i ${SSH_PRIVATE_KEY} ${SCRIPT_DIR}/docker-compose.az.yml ${VM_USER}@${VM_IP}:/srv/app/docker-compose.yml
sops -d ${SECRETS_DIR}/demo-vm.env | ssh -i ${SSH_PRIVATE_KEY} ${VM_USER}@${VM_IP} "cat > /srv/app/.env"
ssh -i ${SSH_PRIVATE_KEY} ${VM_USER}@${VM_IP} "cd /srv/app && chown ${VM_USER}:docker docker-compose.yml .env"
# login with system managed identity
# login into container registry
# recreate docker compose stack with fresh pulled images
    # az login --identity && \ können wir uns das sparen?
ssh -i ${SSH_PRIVATE_KEY} ${VM_USER}@${VM_IP} \
  "cd /srv/app && \
    az acr login -n ${AZ_ACR_NAME} && \
    docker compose --profile pull-only up --pull always --no-start && \
    docker compose up -d --force-recreate --pull always"
