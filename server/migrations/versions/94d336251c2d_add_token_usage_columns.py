"""add_token_usage_columns

Revision ID: 94d336251c2d
Revises: 8b4b0b80da0e
Create Date: 2025-03-25 11:52:12.040393

"""

from typing import Sequence, Union

# revision identifiers, used by Alembic.
revision: str = '94d336251c2d'
down_revision: Union[str, None] = '8b4b0b80da0e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add token usage columns to api_exchanges table
    pass


def downgrade() -> None:
    # Remove token usage columns from api_exchanges table
    pass
