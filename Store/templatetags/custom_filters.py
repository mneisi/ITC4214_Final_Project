from django import template
from decimal import Decimal

register = template.Library()

@register.filter
def sub(value, arg):
    """Subtract the arg from the value."""
    try:
        return value - arg
    except (ValueError, TypeError):
        try:
            return Decimal(str(value)) - Decimal(str(arg))
        except:
            return 0

@register.filter
def mul(value, arg):
    """Multiply the value by the arg."""
    try:
        return value * arg
    except (ValueError, TypeError):
        try:
            return Decimal(str(value)) * Decimal(str(arg))
        except:
            return 0

@register.filter
def div(value, arg):
    """Divide the value by the arg."""
    try:
        if arg == 0:
            return 0
        return value / arg
    except (ValueError, TypeError):
        try:
            arg = Decimal(str(arg))
            if arg == 0:
                return 0
            return Decimal(str(value)) / arg
        except:
            return 0 