"""
Database dependencies with tenant-aware schema mapping.
"""

from typing import Generator

from fastapi import Depends
from sqlalchemy.orm import Session

from server.database.multi_tenancy import with_db
from server.database.service import DatabaseService
from server.utils.tenant_utils import get_tenant


class TenantAwareDatabaseService(DatabaseService):
    """Database service that uses tenant-aware sessions."""

    def __init__(self, tenant_session: Session):
        # Store the tenant session
        self.tenant_session = tenant_session

        # Create a session factory that returns the tenant session
        # We need to handle the session lifecycle properly since the original
        # DatabaseService expects to create and close sessions
        def get_tenant_session():
            # Return a wrapper that doesn't actually close the session
            # since it's managed by the context manager
            class SessionWrapper:
                def __init__(self, session):
                    self._session = session

                def __getattr__(self, name):
                    return getattr(self._session, name)

                def close(self):
                    # Don't actually close the session since it's managed by context
                    pass

            return SessionWrapper(self.tenant_session)

        # Override the Session property to use our tenant session
        self.Session = get_tenant_session


def get_tenant_db(
    tenant: dict = Depends(get_tenant),
) -> Generator[TenantAwareDatabaseService, None, None]:
    """
    Get a database service with tenant-specific schema mapping.

    This function automatically uses the correct schema remapping based on the tenant
    making the request. All queries are then automatically run against the correct tenant.

    Args:
        tenant: Tenant information from get_tenant dependency

    Yields:
        TenantAwareDatabaseService: Database service with tenant schema mapping
    """
    with with_db(tenant['schema']) as db_session:
        db_service = TenantAwareDatabaseService(db_session)
        yield db_service
