#!/usr/bin/env python3
"""
API Key Generator Script

This script checks if an API key is configured in .env and generates a secure one if needed.
It also ensures that the VITE_API_KEY variable always replicates the current API_KEY value.
"""

import os
import secrets
import string


def generate_secure_api_key() -> str:
    """Generate a cryptographically secure API key."""
    # Use a combination of letters, digits, and some safe symbols
    alphabet = string.ascii_letters + string.digits
    # Generate a 32-character secure API key
    return ''.join(secrets.choice(alphabet) for _ in range(32))


def is_api_key_secure(api_key: str) -> bool:
    return bool(api_key) and api_key != 'not-secure-api-key' and len(api_key) >= 16


def read_env_file():
    """Read the .env file and return its contents as a dictionary."""
    env_vars = {}
    if os.path.exists('.env'):
        with open('.env', 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key.strip()] = value.strip()
    return env_vars


def write_env_file(env_vars):
    """Write the environment variables back to .env file."""
    with open('.env', 'w') as f:
        for key, value in env_vars.items():
            f.write(f'{key}={value}\n')


def main():
    """Main function to check and generate API key if needed."""
    print('🔍 Checking API key configuration...')

    env_vars = read_env_file()
    api_key = env_vars.get('API_KEY', '')
    vite_api_key = env_vars.get('VITE_API_KEY', '')

    needs_update = False

    if not api_key or api_key == 'not-secure-api-key':
        api_key = generate_secure_api_key()
        env_vars['API_KEY'] = api_key
        needs_update = True
        print('🧬️ No API key found, generating new secure API key.')
    else:
        print('✅ Secure API_KEY already configured...')

    if vite_api_key != api_key:
        env_vars['VITE_API_KEY'] = api_key
        needs_update = True
        print('♊ Set VITE_API_KEY to match API_KEY.')
    else:
        print('✅ VITE_API_KEY already matches API_KEY.')

    if needs_update:
        write_env_file(env_vars)

    print('\n🎉 API key configuration complete!')
    print('\nAPI keys are now configured for:')
    print('   - Backend server authentication (API_KEY)')
    print('   - Frontend application (VITE_API_KEY)')
    print(f'\nBoth keys are set to: {api_key}')


if __name__ == '__main__':
    main()
