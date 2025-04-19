from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
import json
import uuid
import os
import requests
from .models import Conversation, Message
import logging

# Set up logging
logger = logging.getLogger(__name__)

# OpenAI API settings
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY', '')
OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"

def chatbot_interface(request):
    """Render the chatbot UI page"""
    # Create or get a conversation for the current session
    session_id = request.session.get('session_id')
    
    if not session_id:
        session_id = str(uuid.uuid4())
        request.session['session_id'] = session_id
    
    # If user is logged in, associate conversation with user
    if request.user.is_authenticated:
        conversation, created = Conversation.objects.get_or_create(
            user=request.user, 
            session_id=session_id
        )
    else:
        conversation, created = Conversation.objects.get_or_create(
            session_id=session_id
        )
    
    # Get conversation history
    messages = conversation.messages.all()
    
    context = {
        'conversation_id': conversation.id,
        'messages': messages,
        'body_class': 'chatbot-page', 
    }
    
    return render(request, 'chatbot/chatbot.html', context)

def generate_gpt3_response(user_message, conversation):
    """Generate a response using OpenAI's GPT-3 model"""
    
    # Prepare conversation history in the format expected by OpenAI
    # Get the last 6 messages for context (to avoid exceeding token limits)
    recent_messages = conversation.messages.order_by('-timestamp')[:6]
    messages = [{"role": "system", "content": "You are the SoundSphere AI assistant, a helpful customer service bot for an audio equipment store. Provide concise, accurate information about products, services, and general music questions. Always be friendly and professional. Your responses should be helpful but brief."}]
    
    # Add conversation history in reverse order (oldest first)
    for msg in reversed(list(recent_messages)):
        messages.append({"role": msg.role, "content": msg.content})
    
    # Add the new user message
    messages.append({"role": "user", "content": user_message})
    
    try:
        # Make request to OpenAI API
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {OPENAI_API_KEY}"
        }
        
        data = {
            "model": "gpt-3.5-turbo",  # Using GPT-3.5 Turbo for cost-effectiveness
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 350,  # Limit response length
            "top_p": 1.0,
            "frequency_penalty": 0.0,
            "presence_penalty": 0.0
        }
        
        logger.info(f"Sending request to OpenAI API with {len(messages)} messages")
        response = requests.post(OPENAI_API_URL, headers=headers, json=data, timeout=10)
        response_data = response.json()
        
        if response.status_code == 200 and "choices" in response_data:
            logger.info("Successfully received response from OpenAI API")
            return response_data["choices"][0]["message"]["content"].strip()
        else:
            logger.error(f"OpenAI API error: {response_data}")
            return get_fallback_response(user_message)
            
    except Exception as e:
        logger.error(f"Error calling OpenAI API: {str(e)}")
        return get_fallback_response(user_message)
    
def get_fallback_response(user_message):
    """Generate a fallback response if the API fails"""
    user_message_lower = user_message.lower()
    
    # Check for greetings
    if any(greeting in user_message_lower for greeting in ['hello', 'hi', 'hey', 'greetings']):
        return "Hello! How can I help you with SoundSphere today?"
    
    # Check for product queries
    elif any(word in user_message_lower for word in ['product', 'headphone', 'speaker', 'audio', 'earphone', 'buy']):
        response_text = "We have a great selection of audio products! Our categories include:"
        response_text += "<ul>"
        response_text += "<li>Wireless Headphones</li>"
        response_text += "<li>Earbuds</li>"
        response_text += "<li>Professional Studio Monitors</li>"
        response_text += "<li>Bluetooth Speakers</li>"
        response_text += "<li>Home Audio Systems</li>"
        response_text += "</ul>"
        response_text += "Would you like me to recommend something specific?"
        return response_text
    
    # Check for price inquiries
    elif any(word in user_message_lower for word in ['price', 'cost', 'how much', 'expensive', 'cheap']):
        response_text = "Our products range from budget-friendly to premium options:"
        response_text += "<ul>"
        response_text += "<li>Budget earbuds: $25-$50</li>"
        response_text += "<li>Mid-range headphones: $100-$200</li>"
        response_text += "<li>Premium wireless headphones: $250-$400</li>"
        response_text += "<li>Professional equipment: $500+</li>"
        response_text += "</ul>"
        response_text += "Is there a specific price range you're interested in?"
        return response_text
    
    # Default fallback response
    response_text = "I'm sorry, I'm having trouble connecting to my knowledge base right now. Here are some things I can help with:"
    response_text += "<div class='chatbot-suggestions'>"
    response_text += "<span class='suggestion-chip'>Our products</span>"
    response_text += "<span class='suggestion-chip'>Pricing information</span>"
    response_text += "<span class='suggestion-chip'>Shipping options</span>"
    response_text += "<span class='suggestion-chip'>Support help</span>"
    response_text += "</div>"
    return response_text

@csrf_exempt
@require_POST
def process_message(request):
    """Process incoming messages from the chatbot interface"""
    try:
        # Parse the JSON data
        data = json.loads(request.body)
        user_message = data.get('message', '').strip()
        conversation_id = data.get('conversation_id')
        
        # Check for empty message
        if not user_message:
            return JsonResponse({
                'status': 'error', 
                'message': 'Please enter a message.'
            })
        
        # Get the conversation
        try:
            if conversation_id:
                conversation = Conversation.objects.get(id=conversation_id)
            else:
                # Create new conversation
                if request.user.is_authenticated:
                    conversation = Conversation.objects.create(user=request.user)
                else:
                    session_id = request.session.get('session_id', str(uuid.uuid4()))
                    request.session['session_id'] = session_id
                    conversation = Conversation.objects.create(session_id=session_id)
        except Conversation.DoesNotExist:
            # Create new conversation if conversation_id is not valid
            if request.user.is_authenticated:
                conversation = Conversation.objects.create(user=request.user)
            else:
                session_id = request.session.get('session_id', str(uuid.uuid4()))
                request.session['session_id'] = session_id
                conversation = Conversation.objects.create(session_id=session_id)
        
        # Save user message to database
        Message.objects.create(
            conversation=conversation,
            role='user',
            content=user_message
        )
        
        # Generate response using GPT-3
        response_text = generate_gpt3_response(user_message, conversation)
        
        # Save bot response to database
        bot_message = Message.objects.create(
            conversation=conversation,
            role='assistant',
            content=response_text
        )
        
        return JsonResponse({
            'message': response_text,
            'conversation_id': conversation.id,
            'timestamp': bot_message.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
            'status': 'success'
        })
        
    except json.JSONDecodeError:
        logger.error("Invalid JSON in chatbot request")
        return JsonResponse({
            'status': 'error',
            'message': 'Invalid request format.'
        })
    except Exception as e:
        logger.error(f"Chatbot error: {str(e)}")
        return JsonResponse({
            'status': 'error', 
            'message': 'An error occurred. Please try again.',
            'error': str(e)
        }, status=500)

@csrf_exempt
@require_POST
def get_chat_history(request, conversation_id):
    """Retrieve chat history for a conversation"""
    try:
        conversation = Conversation.objects.get(id=conversation_id)
        messages = conversation.messages.all()
        
        # Check permissions (only allow if user owns the conversation or it's linked to their session)
        if request.user.is_authenticated and conversation.user == request.user:
            pass  # User is authenticated and owns the conversation
        elif conversation.session_id == request.session.get('session_id'):
            pass  # Conversation is linked to the current session
        else:
            return JsonResponse({'error': 'Unauthorized', 'status': 'error'}, status=403)
        
        messages_data = [
            {
                'role': msg.role,
                'content': msg.content,
                'timestamp': msg.timestamp.strftime('%Y-%m-%d %H:%M:%S')
            }
            for msg in messages
        ]
        
        return JsonResponse({'messages': messages_data, 'status': 'success'})
        
    except Conversation.DoesNotExist:
        return JsonResponse({'error': 'Conversation not found', 'status': 'error'}, status=404)
    except Exception as e:
        logger.error(f"Chat history error: {str(e)}")
        return JsonResponse({'error': str(e), 'status': 'error'}, status=500)
