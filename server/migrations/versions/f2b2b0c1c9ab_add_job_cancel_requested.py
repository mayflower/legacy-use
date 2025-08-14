"""
add cancel_requested to jobs

Revision ID: f2b2b0c1c9ab
Revises: f9f9b9e0f1a3
Create Date: 2025-08-12 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
from server.migrations.tenant import for_each_tenant_schema


revision = 'f2b2b0c1c9ab'
down_revision = 'f9f9b9e0f1a3'
branch_labels = None
depends_on = None


@for_each_tenant_schema
def upgrade(schema: str = 'tenant') -> None:
    with op.batch_alter_table('jobs', schema=schema) as batch_op:
        batch_op.add_column(
            sa.Column(
                'cancel_requested',
                sa.Boolean(),
                nullable=False,
                server_default=sa.text('false'),
            )
        )
    # Drop server_default after backfilling the default value to avoid future implicit defaults
    with op.batch_alter_table('jobs', schema=schema) as batch_op:
        batch_op.alter_column('cancel_requested', server_default=None)


@for_each_tenant_schema
def downgrade(schema: str = 'tenant') -> None:
    with op.batch_alter_table('jobs', schema=schema) as batch_op:
        batch_op.drop_column('cancel_requested')
