from django.urls import path
from . import views

app_name = 'Staff'

urlpatterns = [
    path('dashboard/', views.staff_dashboard, name='dashboard'),
    path('products/', views.product_management, name='product_management'),
    path('products/add/', views.add_product, name='add_product'),
    path('products/edit/<int:product_id>/', views.edit_product, name='edit_product'),
    path('products/delete/<int:product_id>/', views.delete_product, name='delete_product'),
    path('categories/', views.category_management, name='category_management'),
    path('categories/add/', views.add_category, name='add_category'),
    path('categories/edit/<int:category_id>/', views.edit_category, name='edit_category'),
    path('subcategories/add/', views.add_subcategory, name='add_subcategory'),
    path('subcategories/edit/<int:subcategory_id>/', views.edit_subcategory, name='edit_subcategory'),
    path('orders/', views.order_management, name='order_management'),
    path('orders/<str:order_number>/', views.order_detail, name='order_detail'),
    path('orders/update-status/<str:order_number>/', views.update_order_status, name='update_order_status'),
    path('users/', views.user_management, name='user_management'),
    path('users/<int:user_id>/', views.user_detail, name='user_detail'),
] 