from . import views
from django.urls import path

app_name = "Home"

urlpatterns = [
    path("", views.home, name="home")
]
