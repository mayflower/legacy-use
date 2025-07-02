from pathlib import Path
from typing import Any, Dict


def load_prompt(prompt_path: str) -> str:
    """Load a prompt from a file if it starts with @, otherwise return the prompt directly."""
    if not prompt_path.startswith('@'):
        return prompt_path

    # Remove the @ and get the relative path
    file_path = prompt_path[1:]
    # Get the absolute path relative to the project root
    full_path = Path(__file__).parent.parent / file_path

    try:
        with open(full_path, 'r', encoding='utf-8') as f:
            return f.read().strip()
    except FileNotFoundError as err:
        raise ValueError(f'Prompt file not found: {file_path}') from err


def load_api_definitions() -> Dict[str, Any]:
    """Load API definitions from the database.

    This function is a placeholder that should be replaced with actual database access.
    In a real implementation, this would query the database for API definitions.
    """

    # This is a placeholder. In a real implementation, this would query the database
    # for API definitions and return them in the expected format.
    # For now, we're returning a hardcoded empty structure to maintain compatibility.
    return {'api_definitions': []}
