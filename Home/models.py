from django.db import models

# Create your models here.

class NewsletterSubscription(models.Model):
    """Model for newsletter subscribers"""
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=100, blank=True, null=True)
    subscribed_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return self.email
