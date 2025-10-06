#!/bin/bash

sops -d secrets/demo-vm.env > .env.az

echo "Uploading docker-compose.az.yml to Azure Storage..."
az storage blob upload \
    --account-name "$AZ_EXCHANGE_STORAGE_ACCOUNT" \
    --container-name "$AZ_EXCHANGE_CONTAINER" \
    --name "docker-compose.az.yml" \
    --overwrite \
    --file "docker-compose.az.yml" \
    --auth-mode login \
    --only-show-errors
if [[ $? -ne 0 ]]; then
    echo "Upload failed!"
    exit 1
fi

echo "Uploading .env.az to Azure Storage..."
az storage blob upload \
    --account-name "$AZ_EXCHANGE_STORAGE_ACCOUNT" \
    --container-name "$AZ_EXCHANGE_CONTAINER" \
    --name ".env.az" \
    --overwrite \
    --file ".env.az" \
    --auth-mode login \
    --only-show-errors

if [[ $? -ne 0 ]]; then
    echo "Upload failed!"
    exit 1
fi

echo "Upload complete."

echo "Downloading to VM $VM_NAME..."

az vm run-command invoke \
  --resource-group $AZ_DEMO_VM_RG \
  --name $AZ_DEMO_VM_NAME \
  --command-id RunShellScript \
  --scripts @<(cat <<EOF
az login --identity
az storage blob download \
  --account-name $AZ_EXCHANGE_STORAGE_ACCOUNT \
  --container-name $AZ_EXCHANGE_CONTAINER \
  --name docker-compose.az.yml \
  --file /srv/app/docker-compose.yml \
  --auth-mode login
az storage blob download \
  --account-name $AZ_EXCHANGE_STORAGE_ACCOUNT \
  --container-name $AZ_EXCHANGE_CONTAINER \
  --name .env.az \
  --file /srv/app/.env \
  --auth-mode login
cd /srv/app
az login --identity
az acr login -n legacyuse
docker compose up -d --pull always --force-recreate
EOF
)

if [[ $? -ne 0 ]]; then
    echo "Download on VM failed!"
    exit 1
fi

echo "docker-compose.az.yml -> VM /srv/docker-compose.yml"
echo ".env.az               -> VM /srv/.env"
echo "container images updated and recreated"
