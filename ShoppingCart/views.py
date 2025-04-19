from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from django.utils.crypto import get_random_string
from .models import Cart, CartItem, Order, OrderItem
from Store.models import Product
from Authentication.models import RecentActivity
from .utils import get_or_create_cart, get_cart_item_count
import json
import datetime

def view_cart(request):
    # Get or create cart for the user (authenticated or anonymous)
    cart = get_or_create_cart(request)
    cart_items = cart.items.all().select_related('product')
    
    context = {
        'cart': cart,
        'cart_items': cart_items,
    }
    
    return render(request, 'shopping_cart/cart.html', context)

def add_to_cart(request, product_id):
    product = get_object_or_404(Product, id=product_id)
    
    # Check product availability
    if product.availability == 'Out of Stock':
        messages.error(request, f"Sorry, {product.name} is currently out of stock.")
        return redirect('Store:product_detail', product_slug=product.slug)
    
    # Get or create cart for the user (authenticated or anonymous)
    cart = get_or_create_cart(request)
    
    # Get quantity from request (default to 1)
    quantity = int(request.POST.get('quantity', 1))
    
    # Check if product is already in cart
    cart_item, item_created = CartItem.objects.get_or_create(
        cart=cart,
        product=product,
        defaults={'quantity': quantity}
    )
    
    # If product already exists in cart, update quantity
    if not item_created:
        cart_item.quantity += quantity
        cart_item.save()
    
    # Track user activity if authenticated
    if request.user.is_authenticated:
        RecentActivity.objects.create(
            user=request.user,
            activity_type='added_to_cart',
            product=product
        )
    
    messages.success(request, f"{product.name} has been added to your cart.")
    
    # If AJAX request, return JSON response
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        cart_count = cart.total_items
        return JsonResponse({'success': True, 'cart_count': cart_count})
    
    # Redirect back to the referring page or product detail
    if 'HTTP_REFERER' in request.META:
        return redirect(request.META['HTTP_REFERER'])
    else:
        return redirect('Store:product_detail', product_slug=product.slug)

def update_cart_item(request, item_id):
    # Get the cart based on authentication status
    cart = get_or_create_cart(request)
    cart_item = get_object_or_404(CartItem, id=item_id, cart=cart)
    
    if request.method == 'POST':
        quantity = int(request.POST.get('quantity', 1))
        
        if quantity > 0:
            cart_item.quantity = quantity
            cart_item.save()
            messages.success(request, "Cart updated successfully.")
        else:
            cart_item.delete()
            messages.success(request, f"{cart_item.product.name} has been removed from your cart.")
    
    # If AJAX request, return JSON response
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        cart = cart_item.cart
        return JsonResponse({
            'success': True,
            'cart_total': float(cart.total_price),
            'cart_count': cart.total_items,
            'item_total': float(cart_item.total_price) if cart_item.id else 0
        })
    
    return redirect('ShoppingCart:view_cart')

def remove_from_cart(request, item_id):
    # Get the cart based on authentication status
    cart = get_or_create_cart(request)
    cart_item = get_object_or_404(CartItem, id=item_id, cart=cart)
    
    product_name = cart_item.product.name
    cart_item.delete()
    
    messages.success(request, f"{product_name} has been removed from your cart.")
    
    # If AJAX request, return JSON response
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        return JsonResponse({
            'success': True,
            'cart_total': float(cart.total_price),
            'cart_count': cart.total_items
        })
    
    return redirect('ShoppingCart:view_cart')

def checkout(request):
    # Get the cart based on authentication status
    cart = get_or_create_cart(request)
    
    if not cart.items.exists():
        messages.warning(request, "Your cart is empty. Please add some items before checkout.")
        return redirect('ShoppingCart:view_cart')
    
    # For anonymous users, redirect to login or register page with option to continue as guest
    if not request.user.is_authenticated:
        request.session['checkout_pending'] = True
        context = {
            'cart': cart,
            'cart_items': cart.items.all().select_related('product'),
            'is_anonymous': True,
        }
        return render(request, 'shopping_cart/checkout_options.html', context)
    
    # Get user profile for pre-filling shipping address if user is authenticated
    user_profile = request.user.profile if hasattr(request.user, 'profile') else None
    
    context = {
        'cart': cart,
        'cart_items': cart.items.all().select_related('product'),
        'user_profile': user_profile,
    }
    
    return render(request, 'shopping_cart/checkout.html', context)

def guest_checkout(request):
    # Get the cart based on session
    if not request.session.session_key:
        request.session.create()
    
    try:
        cart = Cart.objects.get(session_key=request.session.session_key, user__isnull=True)
    except Cart.DoesNotExist:
        messages.warning(request, "Your cart is empty. Please add some items before checkout.")
        return redirect('ShoppingCart:view_cart')
    
    if not cart.items.exists():
        messages.warning(request, "Your cart is empty. Please add some items before checkout.")
        return redirect('ShoppingCart:view_cart')
    
    context = {
        'cart': cart,
        'cart_items': cart.items.all().select_related('product'),
        'is_guest': True,
    }
    
    return render(request, 'shopping_cart/checkout.html', context)

@login_required
def confirm_order(request):
    if request.method != 'POST':
        return redirect('ShoppingCart:checkout')
    
    # Get user's cart
    cart = get_or_create_cart(request)
    
    if not cart.items.exists():
        messages.warning(request, "Your cart is empty. Please add some items before checkout.")
        return redirect('ShoppingCart:view_cart')
    
    # Create order
    order = Order(
        user=request.user,
        order_number=get_random_string(10).upper(),
        total_price=cart.total_price,
        shipping_address=request.POST.get('shipping_address', ''),
        shipping_method=request.POST.get('shipping_method', 'Standard Shipping'),
        payment_method=request.POST.get('payment_method', 'credit_card'),
        payment_status=True,  # Simulate successful payment
    )
    order.save()
    
    # Create order items
    for cart_item in cart.items.all():
        OrderItem.objects.create(
            order=order,
            product=cart_item.product,
            quantity=cart_item.quantity,
            price=cart_item.product.sale_price if cart_item.product.sale_price else cart_item.product.price
        )
        
        # Track user activity
        RecentActivity.objects.create(
            user=request.user,
            activity_type='purchased',
            product=cart_item.product
        )
        
        # Update product stock
        product = cart_item.product
        product.stock -= cart_item.quantity
        if product.stock <= 0:
            product.availability = 'Out of Stock'
        product.save()
    
    # Clear the cart
    cart.items.all().delete()
    
    # Clear checkout_pending session variable if it exists
    if 'checkout_pending' in request.session:
        del request.session['checkout_pending']
    
    messages.success(request, f"Your order #{order.order_number} has been placed successfully!")
    
    return redirect('ShoppingCart:order_detail', order_number=order.order_number)

def guest_confirm_order(request):
    if request.method != 'POST':
        return redirect('ShoppingCart:guest_checkout')
    
    # Get anonymous cart
    if not request.session.session_key:
        messages.warning(request, "Your session has expired. Please add items to your cart again.")
        return redirect('ShoppingCart:view_cart')
    
    try:
        cart = Cart.objects.get(session_key=request.session.session_key, user__isnull=True)
    except Cart.DoesNotExist:
        messages.warning(request, "Your cart is empty. Please add some items before checkout.")
        return redirect('ShoppingCart:view_cart')
    
    if not cart.items.exists():
        messages.warning(request, "Your cart is empty. Please add some items before checkout.")
        return redirect('ShoppingCart:view_cart')
    
    # Collect guest information
    email = request.POST.get('email', '')
    first_name = request.POST.get('first_name', '')
    last_name = request.POST.get('last_name', '')
    
    # Create order for guest
    order = Order(
        user=None,  # No user for guest checkout
        order_number=get_random_string(10).upper(),
        total_price=cart.total_price,
        shipping_address=request.POST.get('shipping_address', ''),
        shipping_method=request.POST.get('shipping_method', 'Standard Shipping'),
        payment_method=request.POST.get('payment_method', 'credit_card'),
        payment_status=True,  # Simulate successful payment
        guest_email=email,
        guest_name=f"{first_name} {last_name}",
    )
    order.save()
    
    # Create order items
    for cart_item in cart.items.all():
        OrderItem.objects.create(
            order=order,
            product=cart_item.product,
            quantity=cart_item.quantity,
            price=cart_item.product.sale_price if cart_item.product.sale_price else cart_item.product.price
        )
        
        # Update product stock
        product = cart_item.product
        product.stock -= cart_item.quantity
        if product.stock <= 0:
            product.availability = 'Out of Stock'
        product.save()
    
    # Clear the cart
    cart.items.all().delete()
    
    # Store order number in session for retrieval
    request.session['guest_order_number'] = order.order_number
    
    messages.success(request, f"Your order #{order.order_number} has been placed successfully!")
    
    return redirect('ShoppingCart:guest_order_confirmation')

def guest_order_confirmation(request):
    order_number = request.session.get('guest_order_number')
    if not order_number:
        messages.warning(request, "No order information found.")
        return redirect('Store:product_list')
    
    try:
        order = Order.objects.get(order_number=order_number, user__isnull=True)
    except Order.DoesNotExist:
        messages.warning(request, "Order not found.")
        return redirect('Store:product_list')
    
    # Clear the session order number
    del request.session['guest_order_number']
    
    context = {
        'order': order,
        'order_items': order.items.all().select_related('product'),
        'is_guest': True,
    }
    
    return render(request, 'shopping_cart/guest_order_confirmation.html', context)

@login_required
def order_history(request):
    orders = Order.objects.filter(user=request.user).order_by('-created_at')
    
    context = {
        'orders': orders,
    }
    
    return render(request, 'shopping_cart/order_history.html', context)

@login_required
def order_detail(request, order_number):
    order = get_object_or_404(Order, order_number=order_number, user=request.user)
    
    context = {
        'order': order,
        'order_items': order.items.all().select_related('product'),
    }
    
    return render(request, 'shopping_cart/order_detail.html', context)
