"""
Multi-tenancy utilities using SQLAlchemy schema translation.
"""

from contextlib import contextmanager
from typing import Optional

import sqlalchemy as sa
from alembic import script
from alembic.config import Config
from alembic.runtime.migration import MigrationContext
from sqlalchemy.orm import Session

from server.database.models import Base, Tenant
from server.settings import settings


def get_shared_metadata():
    meta = sa.MetaData()
    for table in Base.metadata.tables.values():
        if table.schema != 'tenant':
            table.tometadata(meta)
    return meta


def get_tenant_specific_metadata():
    """Get metadata for tenant-specific tables."""
    meta = sa.MetaData(schema='tenant')
    for table in Base.metadata.tables.values():
        if table.schema == 'tenant':
            table.tometadata(meta)
    return meta


@contextmanager
def with_db(tenant_schema: Optional[str]):
    """Context manager that returns a database session with tenant mapping."""
    from server.database.service import DatabaseService

    db_service = DatabaseService()

    if tenant_schema:
        schema_translate_map = dict(tenant=tenant_schema)
    else:
        schema_translate_map = None

    connectable = db_service.engine.execution_options(
        schema_translate_map=schema_translate_map
    )

    try:
        db = Session(autocommit=False, autoflush=False, bind=connectable)
        yield db
    finally:
        db.close()


def tenant_create(name: str, schema: str, host: str) -> None:
    """Create a new tenant with its schema and tables."""
    # Load Alembic config
    alembic_config = Config(settings.ALEMBIC_CONFIG_PATH)

    with with_db(schema) as db_tenant:
        # Check if migrations are up to date
        context = MigrationContext.configure(db_tenant.connection())
        script_dir = script.ScriptDirectory.from_config(alembic_config)
        if context.get_current_revision() != script_dir.get_current_head():
            raise RuntimeError(
                'Database is not up-to-date. Execute migrations before adding new tenants.'
            )

        # Create tenant record
        tenant = Tenant(
            name=name,
            host=host,
            schema=schema,
        )
        db_tenant.add(tenant)

        # Create schema and tables
        db_tenant.execute(sa.schema.CreateSchema(schema))
        get_tenant_specific_metadata().create_all(bind=db_tenant.connection())

        db_tenant.commit()


def tenant_delete(schema: str) -> None:
    """Delete a tenant and its schema."""
    with with_db(schema) as db_tenant:
        # Drop the schema (this will drop all tables in the schema)
        db_tenant.execute(sa.schema.DropSchema(schema, cascade=True))

        # Remove tenant record
        tenant = db_tenant.query(Tenant).filter(Tenant.schema == schema).first()
        if tenant:
            db_tenant.delete(tenant)

        db_tenant.commit()


def get_tenant_by_host(host: str) -> Optional[Tenant]:
    """Get tenant by host."""
    from server.database.service import DatabaseService

    db_service = DatabaseService()
    session = db_service.Session()
    try:
        return session.query(Tenant).filter(Tenant.host == host).first()
    finally:
        session.close()


def get_tenant_by_schema(schema: str) -> Optional[Tenant]:
    """Get tenant by schema."""
    from server.database.service import DatabaseService

    db_service = DatabaseService()
    session = db_service.Session()
    try:
        return session.query(Tenant).filter(Tenant.schema == schema).first()
    finally:
        session.close()
