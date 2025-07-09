#!/usr/bin/env python3
"""
API Key Generator Script

This script checks if an API key is configured in the settings and generates a secure one if needed.
It also ensures that the VITE_API_KEY variable always replicates the current API_KEY value.
"""

import secrets
import string

from server.settings import settings


def generate_secure_api_key() -> str:
    """Generate a cryptographically secure API key."""
    # Use a combination of letters, digits, and some safe symbols
    alphabet = string.ascii_letters + string.digits
    # Generate a 32-character secure API key
    return ''.join(secrets.choice(alphabet) for _ in range(32))


def is_api_key_secure(api_key: str) -> bool:
    return bool(api_key) and api_key != 'not-secure-api-key' and len(api_key) >= 16


def main():
    """Main function to check and generate API key if needed."""
    print('🔍 Checking API key configuration...')

    # Check current API_KEY setting from pydantic settings
    api_key_needs_generation = not is_api_key_secure(settings.API_KEY)

    if api_key_needs_generation:
        if settings.API_KEY == 'not-secure-api-key':
            print('⚠️ Default insecure API key detected')
        else:
            print('⚠️ Current API key is not secure enough')

        print('🔑 Generating new secure API key...')
        new_api_key = generate_secure_api_key()

        # Set API_KEY in .env.local file
        settings.API_KEY = new_api_key
        print('✅ Set new secure API_KEY.')

        print(f'🔑 Generated secure API key: {new_api_key}')
    else:
        print('✅ Secure API_KEY already configured...')

    # Check VITE_API_KEY synchronization
    vite_api_key_in_sync = settings.VITE_API_KEY == settings.API_KEY
    if vite_api_key_in_sync:
        print('✅ VITE_API_KEY already matches API_KEY.')
    else:
        settings.VITE_API_KEY = settings.API_KEY
        print('♊ Set VITE_API_KEY to match API_KEY.')

    print('\n🎉 API key configuration complete!')
    print('\nAPI keys are now configured for:')
    print('   - Backend server authentication (API_KEY)')
    print('   - Frontend application (VITE_API_KEY)')
    print(f'\nBoth keys are set to: {settings.API_KEY}')

    if api_key_needs_generation:
        print('\n⚠️ Important: Restart your application to use the new API key.')


if __name__ == '__main__':
    main()
