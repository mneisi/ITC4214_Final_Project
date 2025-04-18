from django.urls import path
from . import views

app_name = 'Staff'

urlpatterns = [
    # Dashboard
    path('', views.staff_dashboard, name='dashboard'),
    path('dashboard/', views.staff_dashboard, name='staff_dashboard'),
    
    # Product Management
    path('products/', views.product_management, name='product_management'),
    path('products/add/', views.add_product, name='add_product'),
    path('products/edit/<int:product_id>/', views.edit_product, name='edit_product'),
    path('products/delete/', views.delete_product, name='delete_product'),
    path('product/form/', views.add_product, name='product_form'),
    path('product/form/<int:product_id>/', views.edit_product, name='product_form'),
    path('get-subcategories/', views.get_subcategories, name='get_subcategories'),
    
    # Category Management
    path('categories/', views.category_management, name='category_management'),
    path('categories/add/', views.add_category, name='add_category'),
    path('categories/edit/', views.edit_category, name='edit_category'),
    path('categories/delete/', views.delete_category, name='delete_category'),
    path('subcategories/add/', views.add_subcategory, name='add_subcategory'),
    path('subcategories/edit/', views.edit_subcategory, name='edit_subcategory'),
    
    # Order Management
    path('orders/', views.order_management, name='order_management'),
    path('orders/<int:order_id>/', views.order_detail, name='order_detail'),
    path('orders/<int:order_id>/update-status/', views.update_order_status, name='update_order_status'),
    path('orders/export/', views.export_orders, name='export_orders'),
    
    # User Management
    path('users/', views.user_management, name='user_management'),
    path('users/<int:user_id>/', views.user_detail, name='user_detail'),
    path('users/add/', views.add_user, name='add_user'),
    path('users/edit/', views.edit_user, name='edit_user'),
    path('users/delete/', views.delete_user, name='delete_user'),
    path('users/<int:user_id>/toggle-status/', views.toggle_user_status, name='toggle_user_status'),
    path('users/<int:user_id>/toggle-staff/', views.toggle_staff_status, name='toggle_staff_status'),
] 