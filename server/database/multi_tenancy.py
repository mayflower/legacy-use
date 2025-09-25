"""
Multi-tenancy utilities using SQLAlchemy schema translation.
"""

from contextlib import contextmanager
from typing import Optional

import sqlalchemy as sa
from sqlalchemy.orm import Session

from server.database.models import Base, Tenant
from server.database.service import DatabaseService

# Single default DatabaseService (engine + pool) reused across tenant sessions
db_session = DatabaseService()


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

    if tenant_schema:
        schema_translate_map = dict(tenant=tenant_schema)
    else:
        schema_translate_map = None

    connectable = db_session.engine.execution_options(
        schema_translate_map=schema_translate_map
    )

    with Session(autocommit=False, autoflush=False, bind=connectable) as db:
        yield db


def tenant_create(
    name: str,
    schema: str,
    host: str,
    clerk_user_id: str | None = None,
) -> None:
    """Create a new tenant with its schema and tables."""

    # Check schema name against blacklist
    blacklisted_names = {'cloud', 'www', 'admin', 'local', 'api', 'signup', 'auth'}
    if schema.lower() in blacklisted_names:
        raise ValueError(f'Schema name "{schema}" is not allowed (blacklisted)')

    with with_db(schema) as db_tenant:
        # Create tenant record
        tenant = Tenant(
            name=name,
            host=host,
            schema=schema,
            clerk_user_id=clerk_user_id,
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
    with db_session.Session() as session:
        return session.query(Tenant).filter(Tenant.host == host).first()


def get_tenant_by_schema(schema: str) -> Optional[Tenant]:
    """Get tenant by schema."""
    with db_session.Session() as session:
        return session.query(Tenant).filter(Tenant.schema == schema).first()


def get_tenant_by_clerk_user_id(
    clerk_user_id: str, include_api_key: bool = False
) -> Optional[Tenant]:
    """Get tenant by clerk creation ID."""
    with db_session.Session() as session:
        tenant = (
            session.query(Tenant).filter(Tenant.clerk_user_id == clerk_user_id).first()
        )
        if tenant and include_api_key:
            # Load API key from tenant settings
            from server.settings_tenant import get_tenant_setting

            api_key = get_tenant_setting(str(tenant.schema), 'API_KEY')
            # Attach API key to tenant object for convenience
            tenant.api_key = api_key
        return tenant
