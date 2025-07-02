"""
Route definitions for the API Gateway.
"""

from fastapi import APIRouter

from server.core import APIGatewayCore

# Import routers from their respective modules
from .api import api_router
from .jobs import job_router
from .sessions import session_router
from .targets import target_router

# Initialize the core API Gateway and database
core = APIGatewayCore()

# Create a list of all routers for easy inclusion
routers = [target_router, session_router, job_router]

# Create main router
router = APIRouter()

# Include all sub-routers
router.include_router(api_router)
router.include_router(session_router)
router.include_router(job_router)
router.include_router(target_router)


# Root endpoint
@router.get('/')
async def root():
    """Root endpoint."""
    return {'message': 'Welcome to the API Gateway'}


# Export all routers
routers = [target_router, session_router, job_router]
