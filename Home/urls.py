from . import views
from django.urls import path

app_name = "Home"

urlpatterns = [
    path("", views.home, name="home"),
    path("newsletter/subscribe/", views.subscribe_newsletter, name="subscribe_newsletter"),
    path("about/", views.about, name="about"),
    path("contact/", views.contact, name="contact"),
    path("privacy-policy/", views.privacy_policy, name="privacy_policy"),
    path("terms-of-service/", views.terms_of_service, name="terms_of_service"),
    path("order-tracking/", views.order_tracking, name="order_tracking"),
]
