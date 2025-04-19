from django.db import models
from django.contrib.auth.models import User

class Cart(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='cart', null=True, blank=True)
    session_key = models.CharField(max_length=40, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['user'],
                condition=models.Q(user__isnull=False),
                name='unique_user_cart'
            ),
            models.UniqueConstraint(
                fields=['session_key'],
                condition=models.Q(session_key__isnull=False),
                name='unique_session_cart'
            ),
        ]
        
    def __str__(self):
        if self.user:
            return f"{self.user.username}'s Cart"
        return f"Anonymous Cart ({self.session_key})"
    
    @property
    def total_price(self):
        return sum(item.total_price for item in self.items.all())
    
    @property
    def total_items(self):
        return sum(item.quantity for item in self.items.all())
    
    def transfer_to_user(self, user):
        """Transfer cart items from an anonymous session cart to a user cart"""
        if not user.is_authenticated:
            return False
        
        try:
            user_cart = Cart.objects.get(user=user)
            # Transfer items from session cart to user cart
            for item in self.items.all():
                user_cart_item, created = CartItem.objects.get_or_create(
                    cart=user_cart,
                    product=item.product,
                    defaults={'quantity': item.quantity}
                )
                if not created:
                    user_cart_item.quantity += item.quantity
                    user_cart_item.save()
            
            # Delete the session cart and its items
            self.delete()
            return True
        except Cart.DoesNotExist:
            # If user has no cart, simply assign this cart to the user
            self.user = user
            self.session_key = None
            self.save()
            return True

class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('Store.Product', on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    added_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('cart', 'product')
    
    def __str__(self):
        return f"{self.quantity} x {self.product.name} in {self.cart}"
    
    @property
    def total_price(self):
        if self.product.sale_price:
            return self.product.sale_price * self.quantity
        return self.product.price * self.quantity

class Order(models.Model):
    ORDER_STATUS = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    )
    
    PAYMENT_METHOD = (
        ('credit_card', 'Credit Card'),
        ('paypal', 'PayPal'),
        ('bank_transfer', 'Bank Transfer'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders', null=True, blank=True)
    guest_email = models.EmailField(null=True, blank=True)
    guest_name = models.CharField(max_length=100, null=True, blank=True)
    order_number = models.CharField(max_length=20, unique=True)
    status = models.CharField(max_length=20, choices=ORDER_STATUS, default='pending')
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    shipping_address = models.TextField()
    shipping_method = models.CharField(max_length=100)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD)
    payment_status = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        if self.user:
            return f"Order #{self.order_number} by {self.user.username}"
        return f"Guest Order #{self.order_number}"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('Store.Product', on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)  # Price at the time of purchase
    
    def __str__(self):
        return f"{self.quantity} x {self.product.name} in Order #{self.order.order_number}"
    
    @property
    def total_price(self):
        return self.price * self.quantity
