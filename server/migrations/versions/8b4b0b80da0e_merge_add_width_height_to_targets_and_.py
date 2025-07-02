"""merge add_width_height_to_targets and 7b6afb9d7ea4

Revision ID: 8b4b0b80da0e
Revises: 7b6afb9d7ea4, add_width_height_to_targets
Create Date: 2025-03-18 16:21:30.044601

"""

from typing import Sequence, Union

# revision identifiers, used by Alembic.
revision: str = '8b4b0b80da0e'
down_revision: Union[str, None] = ('7b6afb9d7ea4', 'add_width_height_to_targets')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
