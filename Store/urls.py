from django.urls import path
from . import views

app_name = 'Store'

urlpatterns = [
    path('', views.product_list, name='product_list'),
    path('category/<slug:category_slug>/', views.category_products, name='category_products'),
    path('subcategory/<slug:subcategory_slug>/', views.subcategory_products, name='subcategory_products'),
    path('product/<slug:product_slug>/', views.product_detail, name='product_detail'),
    path('search/', views.search_products, name='search_products'),
    path('product/add-review/<int:product_id>/', views.add_review, name='add_review'),
    path('recommended/<slug:product_slug>/', views.recommended_products, name='recommended_products'),
] 