from django.shortcuts import render, redirect
from django.contrib import messages
from django.http import JsonResponse
from Store.models import Category, Product
from .models import NewsletterSubscription

def home(request):
    """Home page view showing featured products and categories"""
    # Get all categories
    categories = Category.objects.all()
    
    # Get featured products
    featured_products = Product.objects.filter(featured=True)[:8]
    
    # Get bestsellers
    bestsellers = Product.objects.filter(bestseller=True)[:4]
    
    # Get new arrivals
    new_arrivals = Product.objects.filter(new_arrival=True)[:4]
    
    context = {
        'categories': categories,
        'featured_products': featured_products,
        'bestsellers': bestsellers,
        'new_arrivals': new_arrivals,
    }
    
    return render(request, 'home/home.html', context)

def subscribe_newsletter(request):
    """Handle newsletter subscription requests"""
    if request.method == 'POST':
        email = request.POST.get('email')
        
        if not email:
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({'success': False, 'message': 'Please provide an email address.'})
            messages.error(request, 'Please provide an email address.')
            return redirect('Home:home')
        
        # Check if already subscribed
        if NewsletterSubscription.objects.filter(email=email).exists():
            subscription = NewsletterSubscription.objects.get(email=email)
            if subscription.is_active:
                if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                    return JsonResponse({'success': False, 'message': 'This email is already subscribed to our newsletter.'})
                messages.info(request, 'This email is already subscribed to our newsletter.')
            else:
                # Reactivate subscription
                subscription.is_active = True
                subscription.save()
                if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                    return JsonResponse({'success': True, 'message': 'Your subscription has been reactivated!'})
                messages.success(request, 'Your subscription has been reactivated!')
        else:
            # Create new subscription
            NewsletterSubscription.objects.create(email=email)
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({'success': True, 'message': 'Thank you for subscribing to our newsletter!'})
            messages.success(request, 'Thank you for subscribing to our newsletter!')
        
        # If it's an AJAX request, return a JSON response
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({'success': True})
            
        # Otherwise redirect back to referring page or home
        if 'HTTP_REFERER' in request.META:
            return redirect(request.META['HTTP_REFERER'])
        return redirect('Home:home')
    
    # If it's not a POST request, redirect to home
    return redirect('Home:home')

def about(request):
    """About page view"""
    return render(request, 'about.html')

def contact(request):
    """Contact page view"""
    return render(request, 'contact.html')

def privacy_policy(request):
    """Privacy policy page view"""
    return render(request, 'privacy-policy.html')

def terms_of_service(request):
    """Terms of service page view"""
    return render(request, 'terms-of-service.html')

def order_tracking(request):
    """Order tracking page view"""
    return render(request, 'order-tracking.html')