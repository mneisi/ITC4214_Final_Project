from .utils import get_cart_item_count

def cart_context(request):
    """
    Context processor to add cart count to all templates.
    Works for both authenticated and anonymous users.
    """
    return {
        'cart_count': get_cart_item_count(request)
    } 