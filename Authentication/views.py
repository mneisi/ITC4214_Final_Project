from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib import messages
from django.db.models import Q
from .models import UserProfile, RecentActivity
from Store.models import Product
from django.contrib.auth.forms import UserCreationForm
from django import forms

class CustomUserCreationForm(UserCreationForm):
    email = forms.EmailField(required=True)
    first_name = forms.CharField(max_length=30, required=True)
    last_name = forms.CharField(max_length=30, required=True)
    
    class Meta:
        model = User
        fields = ('username', 'email', 'first_name', 'last_name', 'password1', 'password2')
    
    def save(self, commit=True):
        user = super().save(commit=False)
        user.email = self.cleaned_data['email']
        user.first_name = self.cleaned_data['first_name']
        user.last_name = self.cleaned_data['last_name']
        if commit:
            user.save()
        return user

class UserProfileForm(forms.ModelForm):
    class Meta:
        model = UserProfile
        fields = ('profile_picture', 'phone_number', 'address', 'city', 'state', 'zip_code', 'country', 'birth_date')
        widgets = {
            'birth_date': forms.DateInput(attrs={'type': 'date'})
        }

def register(request):
    if request.user.is_authenticated:
        return redirect('Home:home')
    
    if request.method == 'POST':
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            messages.success(request, 'Your account has been created! You are now logged in.')
            return redirect('Authentication:profile')
    else:
        form = CustomUserCreationForm()
    
    context = {'form': form}
    return render(request, 'authentication/register.html', context)

def user_login(request):
    if request.user.is_authenticated:
        return redirect('Home:home')
    
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            login(request, user)
            redirect_url = request.GET.get('next', 'Home:home')
            messages.success(request, f'Welcome back, {user.username}!')
            return redirect(redirect_url)
        else:
            messages.error(request, 'Invalid username or password.')
    
    return render(request, 'authentication/login.html')

@login_required
def user_logout(request):
    logout(request)
    messages.success(request, 'You have been logged out.')
    return redirect('Home:home')

@login_required
def profile(request):
    user_profile = request.user.profile
    
    context = {
        'user_profile': user_profile,
    }
    
    return render(request, 'authentication/profile.html', context)

@login_required
def edit_profile(request):
    user_profile = request.user.profile
    
    if request.method == 'POST':
        user_form = forms.ModelForm(request.POST, instance=request.user)
        profile_form = UserProfileForm(request.POST, request.FILES, instance=user_profile)
        
        if user_form.is_valid() and profile_form.is_valid():
            user_form.save()
            profile_form.save()
            messages.success(request, 'Your profile has been updated!')
            return redirect('Authentication:profile')
    else:
        user_form = forms.ModelForm(instance=request.user, 
                                   fields=('first_name', 'last_name', 'email'))
        profile_form = UserProfileForm(instance=user_profile)
    
    context = {
        'user_form': user_form,
        'profile_form': profile_form,
    }
    
    return render(request, 'authentication/edit_profile.html', context)

@login_required
def dashboard(request):
    # Get recent activities
    recent_activities = RecentActivity.objects.filter(user=request.user).order_by('-timestamp')[:15]
    
    # Get recently viewed products
    recently_viewed = RecentActivity.objects.filter(
        user=request.user, 
        activity_type='viewed'
    ).order_by('-timestamp').values_list('product', flat=True).distinct()[:6]
    recently_viewed_products = Product.objects.filter(id__in=recently_viewed)
    
    # Get recent ratings/reviews
    recent_reviews = request.user.reviews.order_by('-created_at')[:3]
    
    # Get wishlist items
    wishlist_items = request.user.wishlist.all()[:4] if hasattr(request.user, 'wishlist') else []
    
    context = {
        'recent_activities': recent_activities,
        'recently_viewed_products': recently_viewed_products,
        'recent_reviews': recent_reviews,
        'wishlist_items': wishlist_items,
    }
    
    return render(request, 'authentication/dashboard.html', context)

@login_required
def wishlist(request):
    # This is just a placeholder - we'll implement the Wishlist model later
    # For now, let's simulate a wishlist using the activities
    wishlist_activities = RecentActivity.objects.filter(
        user=request.user, 
        activity_type='wishlist'
    ).order_by('-timestamp')
    
    wishlist_product_ids = wishlist_activities.values_list('product', flat=True)
    wishlist_products = Product.objects.filter(id__in=wishlist_product_ids)
    
    context = {
        'wishlist_products': wishlist_products,
    }
    
    return render(request, 'authentication/wishlist.html', context)

@login_required
def add_to_wishlist(request, product_id):
    product = get_object_or_404(Product, id=product_id)
    
    # Check if already in wishlist
    existing_activity = RecentActivity.objects.filter(
        user=request.user,
        product=product,
        activity_type='wishlist'
    ).first()
    
    if not existing_activity:
        # Add to wishlist
        RecentActivity.objects.create(
            user=request.user,
            product=product,
            activity_type='wishlist'
        )
        messages.success(request, f'{product.name} has been added to your wishlist.')
    else:
        messages.info(request, f'{product.name} is already in your wishlist.')
    
    # Redirect back to the referring page or product detail
    if 'HTTP_REFERER' in request.META:
        return redirect(request.META['HTTP_REFERER'])
    else:
        return redirect('Store:product_detail', product_slug=product.slug)

@login_required
def remove_from_wishlist(request, product_id):
    product = get_object_or_404(Product, id=product_id)
    
    # Remove from wishlist
    RecentActivity.objects.filter(
        user=request.user,
        product=product,
        activity_type='wishlist'
    ).delete()
    
    messages.success(request, f'{product.name} has been removed from your wishlist.')
    
    # Redirect back to the referring page or wishlist
    if 'HTTP_REFERER' in request.META and 'wishlist' in request.META['HTTP_REFERER']:
        return redirect('Authentication:wishlist')
    elif 'HTTP_REFERER' in request.META:
        return redirect(request.META['HTTP_REFERER'])
    else:
        return redirect('Authentication:wishlist')
