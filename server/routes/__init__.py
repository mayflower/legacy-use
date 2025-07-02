"""
Routes package for the API Gateway.
"""

from .diagnostics import diagnostics_router
from .routes import api_router, job_router, routers, target_router
from .sessions import session_router, websocket_router

__all__ = [
    'routers',
    'api_router',
    'target_router',
    'session_router',
    'job_router',
    'websocket_router',
    'diagnostics_router',
]
