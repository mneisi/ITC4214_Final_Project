from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.db.models import Q, Avg
from django.http import JsonResponse
from django.contrib import messages
from django.core.paginator import Paginator
from .models import Category, SubCategory, Product, Review
from Authentication.models import RecentActivity

def product_list(request):
    products = Product.objects.all()
    categories = Category.objects.all()
    featured_products = Product.objects.filter(featured=True)[:8]
    bestsellers = Product.objects.filter(bestseller=True)[:4]
    new_arrivals = Product.objects.filter(new_arrival=True)[:4]
    
    # Filtering
    category_filter = request.GET.get('category')
    subcategory_filter = request.GET.get('subcategory')
    brand_filter = request.GET.get('brand')
    min_price = request.GET.get('min_price')
    max_price = request.GET.get('max_price')
    sort_by = request.GET.get('sort')
    
    if category_filter:
        products = products.filter(category__slug=category_filter)
    
    if subcategory_filter:
        products = products.filter(subcategory__slug=subcategory_filter)
    
    if brand_filter:
        products = products.filter(brand=brand_filter)
    
    if min_price:
        products = products.filter(price__gte=min_price)
    
    if max_price:
        products = products.filter(price__lte=max_price)
    
    if sort_by:
        if sort_by == 'price_asc':
            products = products.order_by('price')
        elif sort_by == 'price_desc':
            products = products.order_by('-price')
        elif sort_by == 'name_asc':
            products = products.order_by('name')
        elif sort_by == 'name_desc':
            products = products.order_by('-name')
        elif sort_by == 'newest':
            products = products.order_by('-created_at')
    
    # Pagination
    paginator = Paginator(products, 12)  # Show 12 products per page
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    # Brands for filtering
    brands = Product.objects.values_list('brand', flat=True).distinct()
    
    context = {
        'page_obj': page_obj,
        'categories': categories,
        'featured_products': featured_products,
        'bestsellers': bestsellers,
        'new_arrivals': new_arrivals,
        'brands': brands,
        'category_filter': category_filter,
        'subcategory_filter': subcategory_filter,
        'brand_filter': brand_filter,
        'min_price': min_price,
        'max_price': max_price,
        'sort_by': sort_by,
    }
    
    return render(request, 'store/product_list.html', context)

def category_products(request, category_slug):
    category = get_object_or_404(Category, slug=category_slug)
    products = Product.objects.filter(category=category)
    subcategories = SubCategory.objects.filter(category=category)
    
    # Filtering
    subcategory_filter = request.GET.get('subcategory')
    brand_filter = request.GET.get('brand')
    min_price = request.GET.get('min_price')
    max_price = request.GET.get('max_price')
    sort_by = request.GET.get('sort')
    
    if subcategory_filter:
        products = products.filter(subcategory__slug=subcategory_filter)
    
    if brand_filter:
        products = products.filter(brand=brand_filter)
    
    if min_price:
        products = products.filter(price__gte=min_price)
    
    if max_price:
        products = products.filter(price__lte=max_price)
    
    if sort_by:
        if sort_by == 'price_asc':
            products = products.order_by('price')
        elif sort_by == 'price_desc':
            products = products.order_by('-price')
        elif sort_by == 'name_asc':
            products = products.order_by('name')
        elif sort_by == 'name_desc':
            products = products.order_by('-name')
        elif sort_by == 'newest':
            products = products.order_by('-created_at')
    
    # Pagination
    paginator = Paginator(products, 12)  # Show 12 products per page
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    # Brands for filtering
    brands = Product.objects.filter(category=category).values_list('brand', flat=True).distinct()
    
    context = {
        'category': category,
        'subcategories': subcategories,
        'page_obj': page_obj,
        'brands': brands,
        'subcategory_filter': subcategory_filter,
        'brand_filter': brand_filter,
        'min_price': min_price,
        'max_price': max_price,
        'sort_by': sort_by,
    }
    
    return render(request, 'store/category_products.html', context)

def subcategory_products(request, subcategory_slug):
    subcategory = get_object_or_404(SubCategory, slug=subcategory_slug)
    products = Product.objects.filter(subcategory=subcategory)
    categories = Category.objects.all()
    
    # Filtering
    brand_filter = request.GET.get('brand')
    min_price = request.GET.get('min_price')
    max_price = request.GET.get('max_price')
    sort_by = request.GET.get('sort')
    
    if brand_filter:
        products = products.filter(brand=brand_filter)
    
    if min_price:
        products = products.filter(price__gte=min_price)
    
    if max_price:
        products = products.filter(price__lte=max_price)
    
    if sort_by:
        if sort_by == 'price_asc':
            products = products.order_by('price')
        elif sort_by == 'price_desc':
            products = products.order_by('-price')
        elif sort_by == 'name_asc':
            products = products.order_by('name')
        elif sort_by == 'name_desc':
            products = products.order_by('-name')
        elif sort_by == 'newest':
            products = products.order_by('-created_at')
    
    # Pagination
    paginator = Paginator(products, 12)  # Show 12 products per page
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    # Brands for filtering
    brands = Product.objects.filter(subcategory=subcategory).values_list('brand', flat=True).distinct()
    
    context = {
        'subcategory': subcategory,
        'category': subcategory.category,
        'categories': categories,
        'page_obj': page_obj,
        'brands': brands,
        'brand_filter': brand_filter,
        'min_price': min_price,
        'max_price': max_price,
        'sort_by': sort_by,
    }
    
    return render(request, 'store/subcategory_products.html', context)

def product_detail(request, product_slug):
    product = get_object_or_404(Product, slug=product_slug)
    reviews = Review.objects.filter(product=product)
    categories = Category.objects.all()
    
    # Related products (same category)
    related_products = Product.objects.filter(category=product.category).exclude(id=product.id)[:4]
    
    # Track user activity for logged-in users
    if request.user.is_authenticated:
        RecentActivity.objects.create(
            user=request.user,
            activity_type='viewed',
            product=product
        )
    
    # Average rating
    avg_rating = reviews.aggregate(Avg('rating'))['rating__avg'] or 0
    
    context = {
        'product': product,
        'reviews': reviews,
        'categories': categories,
        'avg_rating': avg_rating,
        'related_products': related_products,
    }
    
    return render(request, 'store/product_detail.html', context)

def search_products(request):
    query = request.GET.get('q', '')
    category = request.GET.get('category', '')
    categories = Category.objects.all()
    
    if query:
        if category:
            products = Product.objects.filter(
                Q(name__icontains=query) | Q(description__icontains=query) | Q(brand__icontains=query),
                category__slug=category
            )
        else:
            products = Product.objects.filter(
                Q(name__icontains=query) | Q(description__icontains=query) | Q(brand__icontains=query)
            )
    else:
        products = Product.objects.none()
    
    # Filtering
    brand_filter = request.GET.get('brand')
    min_price = request.GET.get('min_price')
    max_price = request.GET.get('max_price')
    sort_by = request.GET.get('sort')
    
    if brand_filter:
        products = products.filter(brand=brand_filter)
    
    if min_price:
        products = products.filter(price__gte=min_price)
    
    if max_price:
        products = products.filter(price__lte=max_price)
    
    if sort_by:
        if sort_by == 'price_asc':
            products = products.order_by('price')
        elif sort_by == 'price_desc':
            products = products.order_by('-price')
        elif sort_by == 'name_asc':
            products = products.order_by('name')
        elif sort_by == 'name_desc':
            products = products.order_by('-name')
        elif sort_by == 'newest':
            products = products.order_by('-created_at')
    
    # Pagination
    paginator = Paginator(products, 12)  # Show 12 products per page
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    # Brands for filtering
    brands = products.values_list('brand', flat=True).distinct()
    
    context = {
        'query': query,
        'page_obj': page_obj,
        'categories': categories,
        'brands': brands,
        'category': category,
        'brand_filter': brand_filter,
        'min_price': min_price,
        'max_price': max_price,
        'sort_by': sort_by,
    }
    
    return render(request, 'store/search_results.html', context)

@login_required
def add_review(request, product_id):
    product = get_object_or_404(Product, id=product_id)
    
    if request.method == 'POST':
        rating = int(request.POST.get('rating', 0))
        comment = request.POST.get('comment', '')
        
        if 1 <= rating <= 5:
            # Check if user already reviewed this product
            existing_review = Review.objects.filter(product=product, user=request.user).first()
            
            if existing_review:
                # Update existing review
                existing_review.rating = rating
                existing_review.comment = comment
                existing_review.save()
                messages.success(request, 'Your review has been updated!')
            else:
                # Create new review
                Review.objects.create(
                    product=product,
                    user=request.user,
                    rating=rating,
                    comment=comment
                )
                
                # Track user activity
                RecentActivity.objects.create(
                    user=request.user,
                    activity_type='rated',
                    product=product
                )
                
                messages.success(request, 'Thank you for your review!')
        else:
            messages.error(request, 'Invalid rating! Please provide a rating between 1 and 5.')
    
    return redirect('Store:product_detail', product_slug=product.slug)

def recommended_products(request, product_slug):
    """Get recommended products based on current product"""
    product = get_object_or_404(Product, slug=product_slug)
    
    # Get products from same category excluding current product
    category_products = Product.objects.filter(category=product.category).exclude(id=product.id)[:3]
    
    # Get products from same brand excluding current product
    brand_products = Product.objects.filter(brand=product.brand).exclude(id=product.id)[:2]
    
    # Combine recommendations, avoiding duplicates
    recommended = list(category_products)
    for item in brand_products:
        if item not in recommended:
            recommended.append(item)
    
    # Limit to 4 items at most
    recommended = recommended[:4]
    
    # Prepare product data for JSON response
    products_data = []
    for prod in recommended:
        # Get first image if available
        image_url = None
        if prod.images.exists():
            image_url = prod.images.first().image.url
        
        # Calculate average rating
        avg_rating = prod.reviews.aggregate(Avg('rating'))['rating__avg'] or 0
        
        # Format product data
        products_data.append({
            'id': prod.id,
            'name': prod.name,
            'slug': prod.slug,
            'price': str(prod.price),
            'sale_price': str(prod.sale_price) if prod.sale_price else None,
            'image': image_url,
            'avg_rating': avg_rating,
            'brand': prod.brand
        })
    
    return JsonResponse({'products': products_data})
