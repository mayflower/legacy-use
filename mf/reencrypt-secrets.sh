#!/usr/bin/env bash

# Script to re-encrypt all SOPS-managed secrets
# Run this when adding new keys to .sops.yaml to make secrets accessible to new team members

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SECRETS_DIR="$PROJECT_ROOT/secrets"

echo "🔄 Re-encrypting all SOPS-managed secrets..."
echo "Project root: $PROJECT_ROOT"
echo "Secrets directory: $SECRETS_DIR"

# Check if secrets directory exists
if [ ! -d "$SECRETS_DIR" ]; then
    echo "❌ Secrets directory not found: $SECRETS_DIR"
    exit 1
fi

# Check if .sops.yaml exists
if [ ! -f "$PROJECT_ROOT/.sops.yaml" ]; then
    echo "❌ SOPS configuration not found: $PROJECT_ROOT/.sops.yaml"
    exit 1
fi

# Find all encrypted files in the secrets directory
encrypted_files=$(find "$SECRETS_DIR" -type f \( -name "*.yaml" -o -name "*.yml" -o -name "*.json" -o -name "*.env" \))

if [ -z "$encrypted_files" ]; then
    echo "ℹ️  No encrypted files found in $SECRETS_DIR"
    exit 0
fi

echo "Found encrypted files:"
echo "$encrypted_files"
echo ""

# Re-encrypt each file
for file in $encrypted_files; do
    echo "🔐 Re-encrypting: $(basename "$file")"

    # Use sops updatekeys to re-encrypt with current keys from .sops.yaml
    if sops updatekeys "$file"; then
        echo "✅ Successfully re-encrypted: $(basename "$file")"
    else
        echo "❌ Failed to re-encrypt: $(basename "$file")"
        exit 1
    fi
done

echo ""
echo "🎉 All secrets have been re-encrypted successfully!"
echo "All team members listed in .sops.yaml can now decrypt these files."