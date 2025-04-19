from django.urls import path
from . import views

app_name = 'chatbot'

urlpatterns = [
    path('', views.chatbot_interface, name='chatbot_interface'),
    path('process/', views.process_message, name='process_message'),
    path('history/<int:conversation_id>/', views.get_chat_history, name='get_chat_history'),
] 