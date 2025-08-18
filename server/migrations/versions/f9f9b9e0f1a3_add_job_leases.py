"""
add job lease fields

Revision ID: f9f9b9e0f1a3
Revises: a899d3a8acb6_add_rdp_params
Create Date: 2025-08-12 00:00:00.000000
"""

import sqlalchemy as sa
from alembic import op

from server.migrations.tenant import for_each_tenant_schema

# revision identifiers, used by Alembic.
revision = 'f9f9b9e0f1a3'
down_revision = 'a899d3a8acb6'
branch_labels = None
depends_on = None


@for_each_tenant_schema
def upgrade(schema: str = 'tenant') -> None:
    with op.batch_alter_table('jobs', schema=schema) as batch_op:
        batch_op.add_column(sa.Column('lease_owner', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('lease_expires_at', sa.DateTime(), nullable=True))


@for_each_tenant_schema
def downgrade(schema: str = 'tenant') -> None:
    with op.batch_alter_table('jobs', schema=schema) as batch_op:
        batch_op.drop_column('lease_expires_at')
        batch_op.drop_column('lease_owner')
