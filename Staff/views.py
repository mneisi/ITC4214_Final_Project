from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib.auth.models import User
from django.contrib import messages
from django.db.models import Count, Sum, Avg, Q
from django.core.paginator import Paginator
from django.http import JsonResponse
from Store.models import Category, SubCategory, Product, ProductImage, ProductSpecification, Review
from ShoppingCart.models import Order, OrderItem
from Authentication.models import UserProfile, RecentActivity
from django import forms
from django.utils.text import slugify
import datetime

def is_staff(user):
    return user.is_staff

class CategoryForm(forms.ModelForm):
    class Meta:
        model = Category
        fields = ['name', 'description', 'image']

class SubCategoryForm(forms.ModelForm):
    class Meta:
        model = SubCategory
        fields = ['category', 'name', 'description', 'image']

class ProductForm(forms.ModelForm):
    class Meta:
        model = Product
        exclude = ['slug', 'created_at', 'updated_at']
        widgets = {
            'description': forms.Textarea(attrs={'rows': 5}),
        }

class ProductImageForm(forms.ModelForm):
    class Meta:
        model = ProductImage
        fields = ['image', 'alt_text', 'is_main']

class ProductSpecificationForm(forms.ModelForm):
    class Meta:
        model = ProductSpecification
        fields = ['name', 'value']

@login_required
@user_passes_test(is_staff)
def staff_dashboard(request):
    # Get counts for dashboard
    total_products = Product.objects.count()
    total_orders = Order.objects.count()
    total_users = User.objects.filter(is_staff=False).count()
    total_categories = Category.objects.count()
    
    # Get recent orders
    recent_orders = Order.objects.order_by('-created_at')[:5]
    
    # Get popular products
    popular_products = Product.objects.annotate(
        num_purchases=Count('activities', filter=Q(activities__activity_type='purchased'))
    ).order_by('-num_purchases')[:5]
    
    # Get stock alerts (products with low stock)
    low_stock_products = Product.objects.filter(
        Q(stock__lte=10) & ~Q(availability='Out of Stock')
    )[:5]
    
    # Get sales data
    today = datetime.date.today()
    month_start = today.replace(day=1)
    year_start = today.replace(month=1, day=1)
    
    # Sales this month
    monthly_sales = Order.objects.filter(
        created_at__gte=month_start
    ).aggregate(total=Sum('total_price'))['total'] or 0
    
    # Sales this year
    yearly_sales = Order.objects.filter(
        created_at__gte=year_start
    ).aggregate(total=Sum('total_price'))['total'] or 0
    
    context = {
        'total_products': total_products,
        'total_orders': total_orders,
        'total_users': total_users,
        'total_categories': total_categories,
        'recent_orders': recent_orders,
        'popular_products': popular_products,
        'low_stock_products': low_stock_products,
        'monthly_sales': monthly_sales,
        'yearly_sales': yearly_sales,
    }
    
    return render(request, 'staff/dashboard.html', context)

@login_required
@user_passes_test(is_staff)
def product_management(request):
    products = Product.objects.all().select_related('category', 'subcategory')
    
    # Filtering
    category_filter = request.GET.get('category')
    brand_filter = request.GET.get('brand')
    availability_filter = request.GET.get('availability')
    search_query = request.GET.get('q')
    
    if category_filter:
        products = products.filter(category__id=category_filter)
    
    if brand_filter:
        products = products.filter(brand=brand_filter)
    
    if availability_filter:
        products = products.filter(availability=availability_filter)
    
    if search_query:
        products = products.filter(
            Q(name__icontains=search_query) | 
            Q(description__icontains=search_query) | 
            Q(sku__icontains=search_query) |
            Q(brand__icontains=search_query)
        )
    
    # Pagination
    paginator = Paginator(products, 15)  # Show 15 products per page
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    # Get filter options
    categories = Category.objects.all()
    brands = Product.objects.values_list('brand', flat=True).distinct()
    availability_choices = Product.AVAILABILITY_CHOICES
    
    context = {
        'page_obj': page_obj,
        'categories': categories,
        'brands': brands,
        'availability_choices': availability_choices,
        'category_filter': category_filter,
        'brand_filter': brand_filter,
        'availability_filter': availability_filter,
        'search_query': search_query,
    }
    
    return render(request, 'staff/product_management.html', context)

@login_required
@user_passes_test(is_staff)
def add_product(request):
    if request.method == 'POST':
        product_form = ProductForm(request.POST)
        
        if product_form.is_valid():
            # Save product with slug
            product = product_form.save(commit=False)
            product.slug = slugify(product.name)
            product.save()
            
            messages.success(request, f"Product '{product.name}' has been added successfully.")
            return redirect('Staff:edit_product', product_id=product.id)
    else:
        product_form = ProductForm()
    
    context = {
        'product_form': product_form,
        'title': 'Add Product',
    }
    
    return render(request, 'staff/product_form.html', context)

@login_required
@user_passes_test(is_staff)
def edit_product(request, product_id):
    product = get_object_or_404(Product, id=product_id)
    
    if request.method == 'POST':
        product_form = ProductForm(request.POST, instance=product)
        
        if product_form.is_valid():
            # Save product with slug
            product = product_form.save(commit=False)
            product.slug = slugify(product.name)
            product.save()
            
            messages.success(request, f"Product '{product.name}' has been updated successfully.")
            return redirect('Staff:product_management')
    else:
        product_form = ProductForm(instance=product)
    
    # Get product images and specifications
    product_images = product.images.all()
    product_specs = product.specifications.all()
    
    # Image form
    image_form = ProductImageForm(initial={'product': product})
    
    # Specification form
    spec_form = ProductSpecificationForm(initial={'product': product})
    
    context = {
        'product': product,
        'product_form': product_form,
        'image_form': image_form,
        'spec_form': spec_form,
        'product_images': product_images,
        'product_specs': product_specs,
        'title': 'Edit Product',
    }
    
    return render(request, 'staff/product_form.html', context)

@login_required
@user_passes_test(is_staff)
def delete_product(request, product_id):
    product = get_object_or_404(Product, id=product_id)
    
    if request.method == 'POST':
        product_name = product.name
        product.delete()
        messages.success(request, f"Product '{product_name}' has been deleted successfully.")
        return redirect('Staff:product_management')
    
    context = {
        'product': product,
    }
    
    return render(request, 'staff/confirm_delete_product.html', context)

@login_required
@user_passes_test(is_staff)
def category_management(request):
    categories = Category.objects.all()
    subcategories = SubCategory.objects.all().select_related('category')
    
    context = {
        'categories': categories,
        'subcategories': subcategories,
    }
    
    return render(request, 'staff/category_management.html', context)

@login_required
@user_passes_test(is_staff)
def add_category(request):
    if request.method == 'POST':
        form = CategoryForm(request.POST, request.FILES)
        
        if form.is_valid():
            category = form.save(commit=False)
            category.slug = slugify(category.name)
            category.save()
            
            messages.success(request, f"Category '{category.name}' has been added successfully.")
            return redirect('Staff:category_management')
    else:
        form = CategoryForm()
    
    context = {
        'form': form,
        'title': 'Add Category',
    }
    
    return render(request, 'staff/category_form.html', context)

@login_required
@user_passes_test(is_staff)
def edit_category(request, category_id):
    category = get_object_or_404(Category, id=category_id)
    
    if request.method == 'POST':
        form = CategoryForm(request.POST, request.FILES, instance=category)
        
        if form.is_valid():
            category = form.save(commit=False)
            category.slug = slugify(category.name)
            category.save()
            
            messages.success(request, f"Category '{category.name}' has been updated successfully.")
            return redirect('Staff:category_management')
    else:
        form = CategoryForm(instance=category)
    
    context = {
        'form': form,
        'title': 'Edit Category',
        'category': category,
    }
    
    return render(request, 'staff/category_form.html', context)

@login_required
@user_passes_test(is_staff)
def add_subcategory(request):
    if request.method == 'POST':
        form = SubCategoryForm(request.POST, request.FILES)
        
        if form.is_valid():
            subcategory = form.save(commit=False)
            subcategory.slug = slugify(subcategory.name)
            subcategory.save()
            
            messages.success(request, f"Subcategory '{subcategory.name}' has been added successfully.")
            return redirect('Staff:category_management')
    else:
        form = SubCategoryForm()
    
    context = {
        'form': form,
        'title': 'Add Subcategory',
    }
    
    return render(request, 'staff/subcategory_form.html', context)

@login_required
@user_passes_test(is_staff)
def edit_subcategory(request, subcategory_id):
    subcategory = get_object_or_404(SubCategory, id=subcategory_id)
    
    if request.method == 'POST':
        form = SubCategoryForm(request.POST, request.FILES, instance=subcategory)
        
        if form.is_valid():
            subcategory = form.save(commit=False)
            subcategory.slug = slugify(subcategory.name)
            subcategory.save()
            
            messages.success(request, f"Subcategory '{subcategory.name}' has been updated successfully.")
            return redirect('Staff:category_management')
    else:
        form = SubCategoryForm(instance=subcategory)
    
    context = {
        'form': form,
        'title': 'Edit Subcategory',
        'subcategory': subcategory,
    }
    
    return render(request, 'staff/subcategory_form.html', context)

@login_required
@user_passes_test(is_staff)
def order_management(request):
    orders = Order.objects.all().select_related('user')
    
    # Filtering
    status_filter = request.GET.get('status')
    payment_filter = request.GET.get('payment')
    search_query = request.GET.get('q')
    
    if status_filter:
        orders = orders.filter(status=status_filter)
    
    if payment_filter:
        orders = orders.filter(payment_status=(payment_filter == 'paid'))
    
    if search_query:
        orders = orders.filter(
            Q(order_number__icontains=search_query) | 
            Q(user__username__icontains=search_query) | 
            Q(user__email__icontains=search_query)
        )
    
    # Pagination
    paginator = Paginator(orders, 20)  # Show 20 orders per page
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'page_obj': page_obj,
        'status_choices': Order.ORDER_STATUS,
        'status_filter': status_filter,
        'payment_filter': payment_filter,
        'search_query': search_query,
    }
    
    return render(request, 'staff/order_management.html', context)

@login_required
@user_passes_test(is_staff)
def order_detail(request, order_number):
    order = get_object_or_404(Order, order_number=order_number)
    order_items = order.items.all().select_related('product')
    
    context = {
        'order': order,
        'order_items': order_items,
    }
    
    return render(request, 'staff/order_detail.html', context)

@login_required
@user_passes_test(is_staff)
def update_order_status(request, order_number):
    order = get_object_or_404(Order, order_number=order_number)
    
    if request.method == 'POST':
        new_status = request.POST.get('status')
        
        if new_status in dict(Order.ORDER_STATUS):
            order.status = new_status
            order.save()
            messages.success(request, f"Order #{order.order_number} status has been updated to {order.get_status_display()}.")
        else:
            messages.error(request, "Invalid status value.")
        
        return redirect('Staff:order_detail', order_number=order.order_number)
    
    return redirect('Staff:order_management')

@login_required
@user_passes_test(is_staff)
def user_management(request):
    users = User.objects.filter(is_staff=False).select_related('profile')
    
    # Search filter
    search_query = request.GET.get('q')
    
    if search_query:
        users = users.filter(
            Q(username__icontains=search_query) | 
            Q(email__icontains=search_query) | 
            Q(first_name__icontains=search_query) | 
            Q(last_name__icontains=search_query)
        )
    
    # Pagination
    paginator = Paginator(users, 20)  # Show 20 users per page
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'page_obj': page_obj,
        'search_query': search_query,
    }
    
    return render(request, 'staff/user_management.html', context)

@login_required
@user_passes_test(is_staff)
def user_detail(request, user_id):
    user = get_object_or_404(User, id=user_id, is_staff=False)
    user_profile = user.profile
    
    # Get user's orders
    orders = Order.objects.filter(user=user).order_by('-created_at')
    
    # Get user's recent activities
    activities = RecentActivity.objects.filter(user=user).order_by('-timestamp')[:20]
    
    # Get user's reviews
    reviews = user.reviews.order_by('-created_at')
    
    context = {
        'user': user,
        'user_profile': user_profile,
        'orders': orders,
        'activities': activities,
        'reviews': reviews,
    }
    
    return render(request, 'staff/user_detail.html', context)
