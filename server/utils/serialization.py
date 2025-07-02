# Serialization utilities for message history
import logging
from typing import Any, Dict, cast

from anthropic.types.beta import BetaMessageParam

from server.database.models import JobMessage

logger = logging.getLogger(__name__)


def job_message_to_beta_message_param(job_message: JobMessage) -> BetaMessageParam:
    """Converts a JobMessage dictionary (or model instance) to a BetaMessageParam TypedDict."""
    # Deserialize from JSON to plain dict
    restored = {
        'role': job_message.get('role'),
        'content': job_message.get('message_content'),
    }
    # Optional: cast for type checkers (runtime it's still just a dict)
    restored = cast(BetaMessageParam, restored)

    return restored


def beta_message_param_to_job_message_content(
    beta_param: BetaMessageParam,
) -> Dict[str, Any]:
    """
    Converts a BetaMessageParam TypedDict into components needed for a JobMessage
    (role and serialized message_content). Does not create a JobMessage DB model instance.
    """
    return beta_param.get('content')
