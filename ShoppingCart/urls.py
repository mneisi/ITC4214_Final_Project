from django.urls import path
from . import views

app_name = 'ShoppingCart'

urlpatterns = [
    path('view/', views.view_cart, name='view_cart'),
    path('add/<int:product_id>/', views.add_to_cart, name='add_to_cart'),
    path('update/<int:item_id>/', views.update_cart_item, name='update_cart_item'),
    path('remove/<int:item_id>/', views.remove_from_cart, name='remove_from_cart'),
    path('checkout/', views.checkout, name='checkout'),
    path('guest-checkout/', views.guest_checkout, name='guest_checkout'),
    path('confirm-order/', views.confirm_order, name='confirm_order'),
    path('guest-confirm-order/', views.guest_confirm_order, name='guest_confirm_order'),
    path('guest-order-confirmation/', views.guest_order_confirmation, name='guest_order_confirmation'),
    path('order-history/', views.order_history, name='order_history'),
    path('order-detail/<str:order_number>/', views.order_detail, name='order_detail'),
] 