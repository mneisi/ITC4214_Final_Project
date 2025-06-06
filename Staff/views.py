from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib.auth.models import User
from django.contrib import messages
from django.db.models import Count, Sum, Avg, Q
from django.core.paginator import Paginator
from django.http import JsonResponse, HttpResponse
from Store.models import Category, SubCategory, Product, ProductImage, ProductSpecification, Review
from ShoppingCart.models import Order, OrderItem
from Authentication.models import UserProfile, RecentActivity
from django import forms
from django.utils.text import slugify
import datetime
import csv
from django.utils import timezone
from datetime import timedelta
from django.db.models.functions import TruncDay, TruncMonth
import random
import string

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

    def save(self, commit=True):
        instance = super().save(commit=False)
        
        # Generate unique slug
        original_slug = slugify(instance.name)
        slug = original_slug
        counter = 1
        
        # Check for uniqueness and append counter if needed
        while SubCategory.objects.filter(slug=slug).exclude(pk=instance.pk).exists():
            # Alternative: Append random string instead of counter
            # random_str = ''.join(random.choices(string.ascii_lowercase + string.digits, k=4))
            # slug = f"{original_slug}-{random_str}"
            slug = f"{original_slug}-{counter}"
            counter += 1
            
        instance.slug = slug

        if commit:
            instance.save()
        return instance

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
    # Get statistics
    total_orders = Order.objects.count()
    total_products = Product.objects.count()
    total_customers = User.objects.filter(is_staff=False).count()
    
    # Calculate total revenue
    total_revenue = sum(order.total_price for order in Order.objects.all())
    
    # Calculate low stock products
    low_stock_count = Product.objects.filter(stock__lt=5).count()
    
    # Get recent orders
    recent_orders = Order.objects.order_by('-created_at')[:5]
    for order in recent_orders:
        if order.status == 'pending':
            order.status_color = 'warning'
        elif order.status == 'processing':
            order.status_color = 'info'
        elif order.status == 'shipped':
            order.status_color = 'primary'
        elif order.status == 'delivered':
            order.status_color = 'success'
        elif order.status == 'cancelled':
            order.status_color = 'danger'
        else:
            order.status_color = 'secondary'
    
    # Get top selling products with real sales data
    top_products = Product.objects.annotate(
        total_sold=Count('orderitem'),
        total_revenue=Sum('orderitem__price')
    ).order_by('-total_sold')[:5]
    
    # Generate real sales data for the chart based on actual orders
    end_date = timezone.now()
    start_date = end_date - timedelta(days=7)
    
    days_of_week = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
    weekly_data = {}
    
    # Initialize all days with 0
    for day in days_of_week:
        weekly_data[day] = 0
    
    # Get actual order data
    daily_orders = Order.objects.filter(
        created_at__range=[start_date, end_date]
    ).annotate(
        day=TruncDay('created_at')
    ).values('day').annotate(
        daily_total=Sum('total_price')
    ).order_by('day')
    
    # Populate the sales data
    for order in daily_orders:
        day_name = order['day'].strftime('%a').lower()
        weekly_data[day_name[:3]] = order['daily_total'] or 0
    
    # Get real monthly sales data for the category chart
    categories = Category.objects.all()
    category_data = []
    
    for category in categories:
        category_total = OrderItem.objects.filter(
            product__category=category
        ).aggregate(
            total=Sum('price')
        )['total'] or 0
        
        if category_total > 0:
            category_data.append({
                'name': category.name,
                'total': category_total
            })
    
    # If we have less than 5 categories with sales, add them directly
    if len(category_data) < 5:
        category_names = [c['name'] for c in category_data]
        category_sales = [c['total'] for c in category_data]
    else:
        # Sort by total sales and use top 5
        category_data.sort(key=lambda x: x['total'], reverse=True)
        category_data = category_data[:5]
        category_names = [c['name'] for c in category_data]
        category_sales = [c['total'] for c in category_data]
    
    # Calculate growth metrics (compare to last period)
    last_period_end = start_date
    last_period_start = last_period_end - timedelta(days=7)
    
    last_period_orders = Order.objects.filter(
        created_at__range=[last_period_start, last_period_end]
    ).count()
    
    last_period_revenue = sum(order.total_price for order in Order.objects.filter(
        created_at__range=[last_period_start, last_period_end]
    ))
    
    # Calculate growth percentages
    orders_increase = 0
    if last_period_orders > 0:
        orders_increase = int(((total_orders - last_period_orders) / last_period_orders) * 100)
    
    revenue_increase = 0
    if last_period_revenue > 0:
        revenue_increase = int(((total_revenue - last_period_revenue) / last_period_revenue) * 100)
    
    # Collect device data for pie chart
    device_data = {
        'Desktop': 55,
        'Mobile': 35,
        'Tablet': 10
    }
    
    # Collect all statistics
    stats = {
        'total_orders': total_orders,
        'total_revenue': total_revenue,
        'total_customers': total_customers,
        'total_products': total_products,
        'low_stock_count': low_stock_count,
        'orders_increase': orders_increase,
        'revenue_increase': revenue_increase,
        'customers_increase': 8,  # Hard to calculate accurately without user registration data
    }
    
    # Get real recent activities
    recent_activities = RecentActivity.objects.order_by('-timestamp')[:5]
    for activity in recent_activities:
        if activity.activity_type == 'viewed':
            activity.type_color = 'info'
            activity.icon = 'eye'
            activity.message = f'Viewed product "{activity.product.name}"'
        elif activity.activity_type == 'added_to_cart':
            activity.type_color = 'primary'
            activity.icon = 'cart-plus'
            activity.message = f'Added "{activity.product.name}" to cart'
        elif activity.activity_type == 'purchased':
            activity.type_color = 'success'
            activity.icon = 'check-circle'
            activity.message = f'Purchased "{activity.product.name}"'
    
    # If no real activities, create placeholders
    if not recent_activities:
        recent_activities = [
            {
                'type_color': 'success',
                'icon': 'shopping-cart',
                'message': 'New order has been placed',
                'timestamp': timezone.now() - timedelta(hours=2),
                'user': request.user,
            },
            {
                'type_color': 'primary',
                'icon': 'box',
                'message': 'Product has been updated',
                'timestamp': timezone.now() - timedelta(hours=5),
                'user': request.user,
            },
            {
                'type_color': 'warning',
                'icon': 'user',
                'message': 'New user has registered',
                'timestamp': timezone.now() - timedelta(days=1),
                'user': request.user,
            },
        ]
    
    context = {
        'stats': stats,
        'recent_orders': recent_orders,
        'top_products': top_products,
        'sales_data': weekly_data,
        'recent_activities': recent_activities,
        'category_names': category_names if 'category_names' in locals() else [],
        'category_sales': category_sales if 'category_sales' in locals() else [],
        'device_data': device_data,
    }
    
    return render(request, 'staff/dashboard.html', context)

@login_required
@user_passes_test(is_staff)
def product_management(request):
    # Get filter parameters
    search = request.GET.get('search', '')
    category_id = request.GET.get('category', '')
    status = request.GET.get('status', '')
    stock = request.GET.get('stock', '')
    sort = request.GET.get('sort', 'name')
    
    # Filter products
    products = Product.objects.all()
    
    if search:
        products = products.filter(
            Q(name__icontains=search) | 
            Q(sku__icontains=search) |
            Q(description__icontains=search)
        )
    
    if category_id:
        products = products.filter(category_id=category_id)
    
    if status == 'active':
        products = products.filter(is_active=True)
    elif status == 'inactive':
        products = products.filter(is_active=False)
    
    if stock == 'in_stock':
        products = products.filter(stock__gt=10)
    elif stock == 'low_stock':
        products = products.filter(stock__gt=0, stock__lte=10)
    elif stock == 'out_of_stock':
        products = products.filter(stock=0)
    
    # Sort products
    if sort == 'name':
        products = products.order_by('name')
    elif sort == 'price_low':
        products = products.order_by('price')
    elif sort == 'price_high':
        products = products.order_by('-price')
    elif sort == 'newest':
        products = products.order_by('-created_at')
    
    # Pagination
    page = request.GET.get('page', 1)
    paginator = Paginator(products, 10)  # Show 10 products per page
    
    try:
        products = paginator.page(page)
    except:
        products = paginator.page(1)
    
    # Get all categories for the filter
    categories = Category.objects.all()
    
    context = {
        'products': products,
        'categories': categories,
        'search': search,
        'category_id': category_id,
        'status': status,
        'stock': stock,
        'sort': sort,
    }
    
    return render(request, 'staff/product_management.html', context)

@login_required
@user_passes_test(is_staff)
def add_product(request):
    if request.method == 'POST':
        # Debug print
        print("POST data:", request.POST)
        print("Featured value:", request.POST.get('featured', 'Not found'))
        
        product_form = ProductForm(request.POST)
        if product_form.is_valid():
            # Save product
            product = product_form.save(commit=False)
            product.slug = slugify(product.name)
            product.save()
            
            # Print saved product info for debugging
            print(f"Product saved: {product.name}, Featured: {product.featured}")
            
            # Handle product specifications
            spec_names = request.POST.getlist('spec_name[]')
            spec_values = request.POST.getlist('spec_value[]')
            
            for i in range(len(spec_names)):
                if spec_names[i] and spec_values[i]:
                    ProductSpecification.objects.create(
                        product=product,
                        name=spec_names[i],
                        value=spec_values[i]
                    )
            
            # Handle product images
            images = request.FILES.getlist('product_images')
            for i, image in enumerate(images):
                is_main = i == 0  # First image is main by default
                ProductImage.objects.create(
                    product=product,
                    image=image,
                    alt_text=product.name,
                    is_main=is_main
                )
            
            messages.success(request, f'Product "{product.name}" has been added successfully.')
            return redirect('Staff:product_management')
        else:
            # Print form errors for debugging
            print(product_form.errors)
            messages.error(request, f'Please correct the errors below: {product_form.errors}')
    else:
        product_form = ProductForm()
    
    # Get categories for form
    categories = Category.objects.all()
    
    # Get subcategories for the selected category if any
    category_id = request.POST.get('category', None)
    if category_id:
        subcategories = SubCategory.objects.filter(category_id=category_id)
    else:
        subcategories = SubCategory.objects.none()  # Empty queryset initially
    
    context = {
        'form': product_form,
        'categories': categories,
        'subcategories': subcategories,
        'product': None,  # No product for add form
    }
    
    return render(request, 'staff/product_form.html', context)

@login_required
@user_passes_test(is_staff)
def edit_product(request, product_id):
    # Get product
    product = get_object_or_404(Product, id=product_id)
    
    if request.method == 'POST':
        # Debug print
        print("Edit POST data:", request.POST)
        print("Edit Featured value:", request.POST.get('featured', 'Not found'))
        
        product_form = ProductForm(request.POST, instance=product)
        if product_form.is_valid():
            # Update product
            updated_product = product_form.save(commit=False)
            updated_product.slug = slugify(updated_product.name)
            updated_product.save()
            
            # Print saved product info for debugging
            print(f"Product updated: {updated_product.name}, Featured: {updated_product.featured}")
            
            # Handle product specifications
            # First, delete existing specifications
            product.specifications.all().delete()
            
            # Then add the new ones
            spec_names = request.POST.getlist('spec_name[]')
            spec_values = request.POST.getlist('spec_value[]')
            
            for i in range(len(spec_names)):
                if spec_names[i] and spec_values[i]:
                    ProductSpecification.objects.create(
                        product=updated_product,
                        name=spec_names[i],
                        value=spec_values[i]
                    )
            
            # Handle product images
            if request.FILES.getlist('product_images'):
                # Process removed images
                removed_images = request.POST.getlist('removed_images')
                if removed_images:
                    ProductImage.objects.filter(id__in=removed_images).delete()
                
                images = request.FILES.getlist('product_images')
                for i, image in enumerate(images):
                    is_main = i == 0 and product.images.count() == 0  # First image is main by default if no other images
                    ProductImage.objects.create(
                        product=updated_product,
                        image=image,
                        alt_text=updated_product.name,
                        is_main=is_main
                    )
            
            messages.success(request, f'Product "{updated_product.name}" has been updated successfully.')
            return redirect('Staff:product_management')
        else:
            # Print form errors for debugging
            print(product_form.errors)
            messages.error(request, f'Please correct the errors below: {product_form.errors}')
    else:
        product_form = ProductForm(instance=product)
    
    # Get categories and subcategories for form
    categories = Category.objects.all()
    subcategories = SubCategory.objects.filter(category=product.category)
    
    context = {
        'form': product_form,
        'product': product,
        'categories': categories,
        'subcategories': subcategories,
    }
    
    return render(request, 'staff/product_form.html', context)

@login_required
@user_passes_test(is_staff)
def delete_product(request):
    if request.method == 'POST':
        product_id = request.POST.get('product_id')
        product = get_object_or_404(Product, id=product_id)
        product.delete()
        messages.success(request, f'Product "{product.name}" has been deleted.')
    
    return redirect('Staff:product_management')

@login_required
@user_passes_test(is_staff)
def category_management(request):
    categories = Category.objects.annotate(subcategory_count=Count('subcategories')).order_by('name')
    subcategories = SubCategory.objects.select_related('category').order_by('category__name', 'name')
    
    # Always provide empty forms for initial display (or if add fails)
    category_form = CategoryForm()
    add_subcategory_form = SubCategoryForm()

    context = {
        'categories': categories,
        'subcategories': subcategories,
        'category_form': category_form,
        'add_subcategory_form': add_subcategory_form, 
    }
    
    return render(request, 'staff/category_management.html', context)

@login_required
@user_passes_test(is_staff)
def add_category(request):
    if request.method == 'POST':
        form = CategoryForm(request.POST, request.FILES)
        if form.is_valid():
            category = form.save()
            messages.success(request, f'Category "{category.name}" created successfully.')
            return redirect('Staff:category_management')
        else:
            # Form is invalid, re-render the management page with the invalid form and errors
            messages.error(request, 'Error adding category. Please correct the errors below.')
            categories = Category.objects.annotate(subcategory_count=Count('subcategories')).order_by('name')
            subcategories = SubCategory.objects.select_related('category').order_by('category__name', 'name')
            context = {
                'categories': categories,
                'subcategories': subcategories,
                'category_form': form, # Pass the invalid form back
                'add_subcategory_form': SubCategoryForm() # Provide empty subcategory form
            }
            return render(request, 'staff/category_management.html', context)
            
    # GET request should ideally not happen if using modals, but redirect as fallback
    return redirect('Staff:category_management')

@login_required
@user_passes_test(is_staff)
def edit_category(request):
    # This view still needs proper GET handling for editing
    if request.method == 'POST':
        category_id = request.POST.get('category_id')
        category = get_object_or_404(Category, id=category_id)
        form = CategoryForm(request.POST, request.FILES, instance=category)
        if form.is_valid():
            form.save()
            messages.success(request, f'Category "{category.name}" updated successfully.')
            return redirect('Staff:category_management') # Redirect on successful update
        else:
            messages.error(request, 'Error updating category.')
            # Re-render the page with the invalid form
            categories = Category.objects.annotate(subcategory_count=Count('subcategories')).order_by('name')
            subcategories = SubCategory.objects.select_related('category').order_by('category__name', 'name')
            # How to show *which* category edit failed? Needs more context/modal handling
            context = {
                'categories': categories,
                'subcategories': subcategories,
                'category_form': CategoryForm(), # Or pass the specific invalid form?
                'add_subcategory_form': SubCategoryForm(),
                # Need a way to indicate the edit modal for 'category' should show errors
            }
            # return render(request, 'staff/category_management.html', context) # This isn't quite right for edits
            return redirect('Staff:category_management') # Fallback redirect for now
    
    return redirect('Staff:category_management')

@login_required
@user_passes_test(is_staff)
def delete_category(request):
    if request.method == 'POST':
        category_id = request.POST.get('category_id')
        category = get_object_or_404(Category, id=category_id)
        category.delete()
        messages.success(request, f'Category "{category.name}" has been deleted.')
    
    return redirect('Staff:category_management')

@login_required
@user_passes_test(is_staff)
def add_subcategory(request):
    if request.method == 'POST':
        form = SubCategoryForm(request.POST, request.FILES)
        if form.is_valid():
            subcategory = form.save()
            messages.success(request, f'Subcategory "{subcategory.name}" created successfully.')
            return redirect('Staff:category_management')
        else:
            # Form is invalid, re-render the management page with the invalid form and errors
            messages.error(request, 'Error adding subcategory. Please correct the errors below.')
            categories = Category.objects.annotate(subcategory_count=Count('subcategories')).order_by('name')
            subcategories = SubCategory.objects.select_related('category').order_by('category__name', 'name')
            context = {
                'categories': categories,
                'subcategories': subcategories,
                'category_form': CategoryForm(),
                'add_subcategory_form': form
            }
            return render(request, 'staff/category_management.html', context)
    
    # GET request should ideally not happen if using modals, but redirect as fallback
    return redirect('Staff:category_management')

@login_required
@user_passes_test(is_staff)
def edit_subcategory(request):
    # This view still needs proper GET handling for editing
    if request.method == 'POST':
        subcategory_id = request.POST.get('subcategory_id')
        subcategory = get_object_or_404(SubCategory, id=subcategory_id)
        form = SubCategoryForm(request.POST, request.FILES, instance=subcategory)
        if form.is_valid():
             form.save()
             messages.success(request, f'Subcategory "{subcategory.name}" updated successfully.')
             return redirect('Staff:category_management') # Redirect on success
        else:
             messages.error(request, 'Error updating subcategory.')
             # Re-render the page with the invalid form
             categories = Category.objects.annotate(subcategory_count=Count('subcategories')).order_by('name')
             subcategories = SubCategory.objects.select_related('category').order_by('category__name', 'name')
             # How to show *which* subcategory edit failed?
             context = {
                 'categories': categories,
                 'subcategories': subcategories,
                 'category_form': CategoryForm(),
                 'add_subcategory_form': SubCategoryForm(), # Or pass the specific invalid form?
                 # Need a way to indicate the edit modal for 'subcategory' should show errors
             }
             # return render(request, 'staff/category_management.html', context) # Not quite right for edits
             return redirect('Staff:category_management') # Fallback redirect for now
    
    return redirect('Staff:category_management')

@login_required
@user_passes_test(is_staff)
def order_management(request):
    # Get filter parameters
    order_number = request.GET.get('order_number', '')
    status = request.GET.get('status', '')
    date_from = request.GET.get('date_from', '')
    date_to = request.GET.get('date_to', '')
    
    # Filter orders
    orders = Order.objects.all().order_by('-created_at')
    
    if order_number:
        orders = orders.filter(order_number__icontains=order_number)
    
    if status:
        orders = orders.filter(status=status)
    
    if date_from:
        orders = orders.filter(created_at__gte=date_from)
    
    if date_to:
        orders = orders.filter(created_at__lte=date_to)
    
    context = {
        'orders': orders,
    }
    
    return render(request, 'staff/order_management.html', context)

@login_required
@user_passes_test(is_staff)
def order_detail(request, order_id):
    order = get_object_or_404(Order, id=order_id)
    
    context = {
        'order': order,
    }
    
    return render(request, 'staff/order_detail.html', context)

@login_required
@user_passes_test(is_staff)
def update_order_status(request, order_id):
    if request.method == 'POST':
        order = get_object_or_404(Order, id=order_id)
        status = request.POST.get('status')
        order.status = status
        order.save()
        messages.success(request, f'Order #{order.order_number} status updated to {status}.')
    
    return redirect('Staff:order_detail', order_id=order_id)

@login_required
@user_passes_test(is_staff)
def export_orders(request):
    # Create a CSV file
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="orders.csv"'
    
    writer = csv.writer(response)
    writer.writerow(['Order #', 'Customer', 'Date', 'Status', 'Total'])
    
    orders = Order.objects.all().order_by('-created_at')
    for order in orders:
        writer.writerow([
            order.order_number,
            order.user.get_full_name() or order.user.username,
            order.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            order.status,
            order.total_price,
        ])
    
    return response

@login_required
@user_passes_test(is_staff)
def user_management(request):
    # Get filter parameters
    search = request.GET.get('search', '')
    role = request.GET.get('role', '')
    status = request.GET.get('status', '')
    date_joined = request.GET.get('date_joined', '')
    
    # Filter users
    users = User.objects.all().order_by('-date_joined')
    
    if search:
        users = users.filter(
            username__icontains=search
        ) | users.filter(
            email__icontains=search
        ) | users.filter(
            first_name__icontains=search
        ) | users.filter(
            last_name__icontains=search
        )
    
    if role == 'admin':
        users = users.filter(is_superuser=True)
    elif role == 'staff':
        users = users.filter(is_staff=True, is_superuser=False)
    elif role == 'customer':
        users = users.filter(is_staff=False, is_superuser=False)
    
    if status == 'active':
        users = users.filter(is_active=True)
    elif status == 'inactive':
        users = users.filter(is_active=False)
    
    if date_joined:
        users = users.filter(date_joined__gte=date_joined)
    
    context = {
        'users': users,
    }
    
    return render(request, 'staff/user_management.html', context)

@login_required
@user_passes_test(is_staff)
def user_detail(request, user_id):
    user = get_object_or_404(User, id=user_id)
    
    context = {
        'user_profile': user,
    }
    
    return render(request, 'staff/user_detail.html', context)

@login_required
@user_passes_test(is_staff)
def add_user(request):
    if request.method == 'POST':
        # Process form submission
        # Create new user
        return redirect('Staff:user_management')
    
    # This should be handled by a modal in the user_management.html template
    return redirect('Staff:user_management')

@login_required
@user_passes_test(is_staff)
def edit_user(request):
    if request.method == 'POST':
        # Process form submission
        # Update user
        return redirect('Staff:user_management')
    
    # This should be handled by a modal in the user_management.html template
    return redirect('Staff:user_management')

@login_required
@user_passes_test(is_staff)
def delete_user(request):
    if request.method == 'POST':
        user_id = request.POST.get('user_id')
        user = get_object_or_404(User, id=user_id)
        user.delete()
        messages.success(request, f'User "{user.username}" has been deleted.')
    
    return redirect('Staff:user_management')

@login_required
@user_passes_test(is_staff)
def toggle_user_status(request, user_id):
    user = get_object_or_404(User, id=user_id)
    user.is_active = not user.is_active
    user.save()
    status = 'activated' if user.is_active else 'deactivated'
    messages.success(request, f'User "{user.username}" has been {status}.')
    
    return redirect('Staff:user_management')

@login_required
@user_passes_test(is_staff)
def toggle_staff_status(request, user_id):
    user = get_object_or_404(User, id=user_id)
    user.is_staff = not user.is_staff
    user.save()
    status = 'granted staff privileges' if user.is_staff else 'removed staff privileges'
    messages.success(request, f'User "{user.username}" has been {status}.')
    
    return redirect('Staff:user_management')

@login_required
@user_passes_test(is_staff)
def get_subcategories(request):
    category_id = request.GET.get('category_id')
    subcategories = []
    
    if category_id:
        subcategories = list(SubCategory.objects.filter(
            category_id=category_id
        ).values('id', 'name'))
    
    return JsonResponse({'subcategories': subcategories})
