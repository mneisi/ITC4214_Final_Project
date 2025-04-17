from django.urls import path
from . import views

app_name = 'ShoppingCart'

urlpatterns = [
    path('view/', views.view_cart, name='view_cart'),
    path('add/<int:product_id>/', views.add_to_cart, name='add_to_cart'),
    path('update/<int:item_id>/', views.update_cart_item, name='update_cart_item'),
    path('remove/<int:item_id>/', views.remove_from_cart, name='remove_from_cart'),
    path('checkout/', views.checkout, name='checkout'),
    path('confirm-order/', views.confirm_order, name='confirm_order'),
    path('order-history/', views.order_history, name='order_history'),
    path('order-detail/<str:order_number>/', views.order_detail, name='order_detail'),
] 