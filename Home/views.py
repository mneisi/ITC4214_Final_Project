from django.shortcuts import render
from Store.models import Category, Product

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