"""Make username nullable in targets table

Revision ID: fcfc272b8ede
Revises: f4ac82882dc0
Create Date: 2025-03-02 16:35:58.443518

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'fcfc272b8ede'
down_revision: Union[str, None] = 'f4ac82882dc0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Get the current database dialect
    bind = op.get_bind()
    dialect_name = bind.dialect.name
    
    if dialect_name == 'sqlite':
        # SQLite doesn't support altering column nullability directly
        # We need to recreate the table with the new schema
        
        # Create a new table with the desired schema
        op.execute("""
        CREATE TABLE targets_new (
            id TEXT PRIMARY KEY,
            name VARCHAR NOT NULL,
            type VARCHAR NOT NULL,
            host VARCHAR NOT NULL,
            port VARCHAR,
            username VARCHAR,
            password VARCHAR NOT NULL,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL
        )
        """)

        # Copy data from the old table to the new table
        op.execute("""
        INSERT INTO targets_new
        SELECT id, name, type, host, port, username, password, created_at, updated_at
        FROM targets
        """)

        # Drop the old table
        op.execute('DROP TABLE targets')

        # Rename the new table to the original name
        op.execute('ALTER TABLE targets_new RENAME TO targets')
    
    elif dialect_name == 'postgresql':
        # PostgreSQL supports ALTER COLUMN directly
        op.alter_column('targets', 'username', nullable=True)
    
    else:
        # For other databases, try the standard approach
        op.alter_column('targets', 'username', nullable=True)


def downgrade() -> None:
    # Get the current database dialect
    bind = op.get_bind()
    dialect_name = bind.dialect.name
    
    if dialect_name == 'sqlite':
        # Revert the changes by recreating the table with non-nullable username
        op.execute("""
        CREATE TABLE targets_new (
            id TEXT PRIMARY KEY,
            name VARCHAR NOT NULL,
            type VARCHAR NOT NULL,
            host VARCHAR NOT NULL,
            port VARCHAR,
            username VARCHAR NOT NULL,
            password VARCHAR NOT NULL,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL
        )
        """)

        # Copy data, ensuring no NULL usernames
        op.execute("""
        INSERT INTO targets_new
        SELECT id, name, type, host, port, COALESCE(username, ''), password, created_at, updated_at
        FROM targets
        """)

        # Drop the old table
        op.execute('DROP TABLE targets')

        # Rename the new table to the original name
        op.execute('ALTER TABLE targets_new RENAME TO targets')
    
    elif dialect_name == 'postgresql':
        # PostgreSQL supports ALTER COLUMN directly
        # First update any NULL values to empty string
        op.execute("UPDATE targets SET username = '' WHERE username IS NULL")
        op.alter_column('targets', 'username', nullable=False)
    
    else:
        # For other databases, try the standard approach
        op.execute("UPDATE targets SET username = '' WHERE username IS NULL")
        op.alter_column('targets', 'username', nullable=False)
