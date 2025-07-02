"""add_vpn_username_and_password_rename_authkey

Revision ID: 3814b7855961
Revises: e56b923957b6
Create Date: 2025-06-20 17:24:01.753641

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = '3814b7855961'
down_revision: Union[str, None] = 'e56b923957b6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new vpn_username and vpn_password columns
    op.add_column('targets', sa.Column('vpn_username', sa.String(), nullable=True))
    op.add_column('targets', sa.Column('vpn_password', sa.String(), nullable=True))

    # Rename tailscale_authkey to vpn_config
    op.alter_column('targets', 'tailscale_authkey', new_column_name='vpn_config')


def downgrade() -> None:
    # Rename vpn_config back to tailscale_authkey
    op.alter_column('targets', 'vpn_config', new_column_name='tailscale_authkey')

    # Drop the vpn_username and vpn_password columns
    op.drop_column('targets', 'vpn_password')
    op.drop_column('targets', 'vpn_username')
