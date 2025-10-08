from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from sqlalchemy.orm import Session

from .models import APIDefinition, APIDefinitionVersion


def bootstrap_tenant_defaults(session: Session) -> None:
    """Seed default data for a freshly created tenant schema."""

    _bootstrap_example_calculator_api(session)


def _bootstrap_example_calculator_api(session: Session) -> None:
    """Create the example calculator API if it does not already exist."""

    sample = _get_sample_api_calculator()

    existing = (
        session.query(APIDefinition)
        .filter(APIDefinition.name == sample['name'])
        .first()
    )

    if existing:
        return

    api_definition = APIDefinition(
        name=sample['name'],
        description=sample['description'],
    )
    session.add(api_definition)
    session.flush()  # ensure primary key populated before creating version

    version = APIDefinitionVersion(
        api_definition_id=api_definition.id,
        version_number=sample['version_number'],
        parameters=sample['parameters'],
        prompt=sample['prompt'],
        prompt_cleanup=sample['prompt_cleanup'],
        response_example=sample['response_example'],
        custom_actions=sample['custom_actions'],
    )
    session.add(version)


@lru_cache(maxsize=1)
def _get_sample_api_calculator() -> dict:
    """Load the sample calculator API definition from disk."""

    data_path = Path(__file__).with_name('sample_data') / 'sample_api_calculator.json'
    with data_path.open(encoding='utf-8') as handle:
        return json.load(handle)
