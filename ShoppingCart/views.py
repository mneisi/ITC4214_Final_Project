from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from django.utils.crypto import get_random_string
from .models import Cart, CartItem, Order, OrderItem
from Store.models import Product
from Authentication.models import RecentActivity
import json
import datetime

@login_required
def view_cart(request):
    # Get or create user's cart
    cart, created = Cart.objects.get_or_create(user=request.user)
    cart_items = cart.items.all().select_related('product')
    
    context = {
        'cart': cart,
        'cart_items': cart_items,
    }
    
    return render(request, 'shopping_cart/cart.html', context)

@login_required
def add_to_cart(request, product_id):
    product = get_object_or_404(Product, id=product_id)
    
    # Check product availability
    if product.availability == 'Out of Stock':
        messages.error(request, f"Sorry, {product.name} is currently out of stock.")
        return redirect('Store:product_detail', product_slug=product.slug)
    
    # Get or create user's cart
    cart, created = Cart.objects.get_or_create(user=request.user)
    
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
    
    # Track user activity
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

@login_required
def update_cart_item(request, item_id):
    cart_item = get_object_or_404(CartItem, id=item_id, cart__user=request.user)
    
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

@login_required
def remove_from_cart(request, item_id):
    cart_item = get_object_or_404(CartItem, id=item_id, cart__user=request.user)
    product_name = cart_item.product.name
    cart_item.delete()
    
    messages.success(request, f"{product_name} has been removed from your cart.")
    
    # If AJAX request, return JSON response
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        cart = Cart.objects.get(user=request.user)
        return JsonResponse({
            'success': True,
            'cart_total': float(cart.total_price),
            'cart_count': cart.total_items
        })
    
    return redirect('ShoppingCart:view_cart')

@login_required
def checkout(request):
    # Get user's cart
    cart = get_object_or_404(Cart, user=request.user)
    
    if not cart.items.exists():
        messages.warning(request, "Your cart is empty. Please add some items before checkout.")
        return redirect('ShoppingCart:view_cart')
    
    # Get user profile for pre-filling shipping address
    user_profile = request.user.profile
    
    context = {
        'cart': cart,
        'cart_items': cart.items.all().select_related('product'),
        'user_profile': user_profile,
    }
    
    return render(request, 'shopping_cart/checkout.html', context)

@login_required
def confirm_order(request):
    if request.method != 'POST':
        return redirect('ShoppingCart:checkout')
    
    # Get user's cart
    cart = get_object_or_404(Cart, user=request.user)
    
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
    
    messages.success(request, f"Your order #{order.order_number} has been placed successfully!")
    
    return redirect('ShoppingCart:order_detail', order_number=order.order_number)

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
