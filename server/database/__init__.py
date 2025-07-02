"""
Database package for the API Gateway.
"""

from .service import DatabaseService

# Create a single shared database instance
db = DatabaseService()

__all__ = ['DatabaseService', 'db']
