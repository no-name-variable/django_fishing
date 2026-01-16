"""
Base use case class for Clean Architecture.
"""
from abc import ABC, abstractmethod
from typing import TypeVar, Generic
from dataclasses import dataclass

InputType = TypeVar('InputType')
OutputType = TypeVar('OutputType')


@dataclass
class UseCaseResult(Generic[OutputType]):
    """Result wrapper for use cases."""
    success: bool
    data: OutputType | None = None
    error: str | None = None

    @classmethod
    def ok(cls, data: OutputType) -> 'UseCaseResult[OutputType]':
        return cls(success=True, data=data)

    @classmethod
    def fail(cls, error: str) -> 'UseCaseResult[OutputType]':
        return cls(success=False, error=error)


class UseCase(ABC, Generic[InputType, OutputType]):
    """Base use case class."""

    @abstractmethod
    def execute(self, input_data: InputType) -> UseCaseResult[OutputType]:
        """Execute the use case."""
        pass
