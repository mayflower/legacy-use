"""add_vpn_username_and_password_rename_authkey

Revision ID: 3814b7855961
Revises: e56b923957b6
Create Date: 2025-06-20 17:24:01.753641

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision: str = '3814b7855961'
down_revision: Union[str, None] = 'e56b923957b6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def column_exists(table: str, column: str) -> bool:
    """Check if a column exists in a table using database-agnostic method."""
    conn = op.get_bind()
    inspector = inspect(conn)
    columns = [col['name'] for col in inspector.get_columns(table)]
    return column in columns


def upgrade() -> None:
    # Add new vpn_username and vpn_password columns if they don't exist
    if not column_exists('targets', 'vpn_username'):
        op.add_column('targets', sa.Column('vpn_username', sa.String(), nullable=True))
    if not column_exists('targets', 'vpn_password'):
        op.add_column('targets', sa.Column('vpn_password', sa.String(), nullable=True))

    # Rename tailscale_authkey to vpn_config if tailscale_authkey exists and vpn_config doesn't
    if column_exists('targets', 'tailscale_authkey') and not column_exists(
        'targets', 'vpn_config'
    ):
        op.alter_column('targets', 'tailscale_authkey', new_column_name='vpn_config')


def downgrade() -> None:
    # Rename vpn_config back to tailscale_authkey if vpn_config exists and tailscale_authkey doesn't
    if column_exists('targets', 'vpn_config') and not column_exists(
        'targets', 'tailscale_authkey'
    ):
        op.alter_column('targets', 'vpn_config', new_column_name='tailscale_authkey')

    # Drop the vpn_username and vpn_password columns if they exist
    if column_exists('targets', 'vpn_password'):
        op.drop_column('targets', 'vpn_password')
    if column_exists('targets', 'vpn_username'):
        op.drop_column('targets', 'vpn_username')
