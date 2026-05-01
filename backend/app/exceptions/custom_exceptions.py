"""Domain exceptions raised by the service layer."""


class AppError(Exception):
    """Base class for all in-app domain errors."""


class InsufficientBalance(AppError):
    """Wallet has not enough INR or gold to satisfy the requested debit."""


class InvalidCredentials(AppError):
    pass


class EmailAlreadyRegistered(AppError):
    pass


class InvalidReferralCode(AppError):
    pass


class FDPlanNotFound(AppError):
    pass


class FDNotFound(AppError):
    pass


class FDAlreadySettled(AppError):
    pass


class AmountTooSmall(AppError):
    pass


class FDMinGramsViolation(AppError):
    pass
