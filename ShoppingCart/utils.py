from .models import Cart, CartItem

def get_or_create_cart(request):
    """
    Get or create a cart based on user authentication status.
    Returns a Cart object.
    """
    if request.user.is_authenticated:
        # For authenticated users, get or create a cart linked to their account
        cart, created = Cart.objects.get_or_create(user=request.user)
        
        # Check if there's a session cart to merge
        session_key = request.session.session_key
        if session_key:
            try:
                session_cart = Cart.objects.get(session_key=session_key, user__isnull=True)
                # Transfer items from session cart to user cart
                for item in session_cart.items.all():
                    user_cart_item, created = CartItem.objects.get_or_create(
                        cart=cart,
                        product=item.product,
                        defaults={'quantity': item.quantity}
                    )
                    if not created:
                        user_cart_item.quantity += item.quantity
                        user_cart_item.save()
                
                # Delete the session cart after transfer
                session_cart.delete()
            except Cart.DoesNotExist:
                # No session cart exists, nothing to merge
                pass
    else:
        # For anonymous users, create or get a cart linked to their session
        if not request.session.session_key:
            request.session.create()
        
        session_key = request.session.session_key
        cart, created = Cart.objects.get_or_create(session_key=session_key, user__isnull=True)
    
    return cart

def get_cart_item_count(request):
    """
    Get the total number of items in the user's cart.
    Works for both authenticated and anonymous users.
    Returns an integer.
    """
    if request.user.is_authenticated:
        try:
            return request.user.cart.total_items
        except (Cart.DoesNotExist, AttributeError):
            return 0
    else:
        if not request.session.session_key:
            return 0
        
        try:
            cart = Cart.objects.get(session_key=request.session.session_key, user__isnull=True)
            return cart.total_items
        except Cart.DoesNotExist:
            return 0 