"""
Custom exceptions for the fishing game.
"""


class FishingGameException(Exception):
    """Base exception for the fishing game."""
    pass


class InsufficientFundsError(FishingGameException):
    """Raised when player doesn't have enough money."""
    pass


class InsufficientLevelError(FishingGameException):
    """Raised when player's level is too low."""
    pass


class EquipmentNotFoundError(FishingGameException):
    """Raised when equipment is not found in inventory."""
    pass


class InvalidGameStateError(FishingGameException):
    """Raised when game action is invalid for current state."""
    pass


class LineBreakError(FishingGameException):
    """Raised when fishing line breaks."""
    pass


class FishEscapedError(FishingGameException):
    """Raised when fish escapes."""
    pass
