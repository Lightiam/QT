"""
Service layer for the quantum API application.
Contains business logic and external service integrations.
"""

from .openai_service import OpenAIService

__all__ = ['OpenAIService']
