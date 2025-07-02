"""merge heads

Revision ID: 222c1b640d27
Revises: add_archive_reason_column, ba0f014972c2
Create Date: 2025-03-12 20:44:12.900355

"""

from typing import Sequence, Union

# revision identifiers, used by Alembic.
revision: str = '222c1b640d27'
down_revision: Union[str, None] = ('add_archive_reason_column', 'ba0f014972c2')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
