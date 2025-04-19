from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
import json
import uuid
from .models import Conversation, Message

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
        'body_class': 'chatbot-page',  # Add a body class to identify the chatbot page
    }
    
    return render(request, 'chatbot/chatbot.html', context)

@csrf_exempt
@require_POST
def process_message(request):
    """Process incoming messages from the chatbot interface"""
    try:
        # Block all AJAX requests that aren't explicitly from the chatbot
        if not request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({
                'status': 'ignored',
                'message': 'Only AJAX requests are supported'
            })
            
        # Quick check - if this is an automatic GET request, ignore it
        if request.method == 'GET':
            return JsonResponse({'status': 'ignored', 'message': 'GET requests not supported'})
        
        # Check if this is a form submission (different content type)
        if 'application/json' not in request.headers.get('Content-Type', ''):
            return JsonResponse({
                'status': 'ignored',
                'message': 'Only JSON requests are supported'
            })
        
        # Parse the JSON data
        data = json.loads(request.body)
        user_message = data.get('message', '').strip()
        conversation_id = data.get('conversation_id')
        is_user_initiated = data.get('is_user_initiated', False)
        
        # For automatic requests without explicit user initiation, return minimal response
        if not is_user_initiated:
            return JsonResponse({
                'status': 'ignored',
                'message': 'Request ignored - automatic requests are disabled'
            })
        
        # Check for empty message
        if not user_message:
            return JsonResponse({
                'status': 'ignored', 
                'message': 'No message provided'
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
        
        # Generate a response
        user_message_lower = user_message.lower()
        
        # Check for greetings
        if any(greeting in user_message_lower for greeting in ['hello', 'hi', 'hey', 'greetings']):
            if request.user.is_authenticated:
                response_text = f"Hello {request.user.username}! How can I help you with SoundSphere today?"
            else:
                response_text = "Hello! How can I help you with SoundSphere today?"
        
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
        
        # Help and support
        elif any(word in user_message_lower for word in ['help', 'support', 'issue', 'problem', 'question']):
            response_text = "I'm here to help! Here are some common support topics:"
            response_text += "<ul>"
            response_text += "<li>Account issues</li>"
            response_text += "<li>Order tracking</li>"
            response_text += "<li>Returns and exchanges</li>"
            response_text += "<li>Product troubleshooting</li>"
            response_text += "<li>Payment methods</li>"
            response_text += "</ul>"
            response_text += "What do you need help with specifically?"
        
        # About the website/company
        elif any(word in user_message_lower for word in ['about', 'company', 'soundsphere', 'who', 'website']):
            response_text = "SoundSphere is a premium audio equipment retailer founded in 2023. "
            response_text += "We specialize in high-quality headphones, speakers, and professional audio equipment. "
            response_text += "Our mission is to bring exceptional sound experiences to everyone from casual listeners to audio professionals."
        
        # Thanks
        elif any(word in user_message_lower for word in ['thank', 'thanks', 'appreciate']):
            response_text = "You're welcome! Is there anything else I can help you with today?"
        
        # Shipping and delivery
        elif any(word in user_message_lower for word in ['ship', 'delivery', 'shipping', 'arrive', 'track']):
            response_text = "We offer the following shipping options:"
            response_text += "<ul>"
            response_text += "<li>Standard shipping (3-5 business days): Free on orders over $50</li>"
            response_text += "<li>Express shipping (1-2 business days): $15</li>"
            response_text += "<li>International shipping (7-14 business days): Varies by location</li>"
            response_text += "</ul>"
            response_text += "Once your order ships, you'll receive a tracking number via email."
        
        # Account related
        elif any(word in user_message_lower for word in ['account', 'login', 'register', 'password', 'sign']):
            if request.user.is_authenticated:
                response_text = "You're currently logged in! You can manage your account settings, view order history, and update your preferences from your account dashboard."
            else:
                response_text = "You can easily create an account or log in using the links at the top of the page. Having an account allows you to track orders, save your favorites, and check out faster."
        
        # Recommendations
        elif any(word in user_message_lower for word in ['recommend', 'suggestion', 'best', 'popular', 'trending']):
            response_text = "Here are some of our most popular products right now:"
            response_text += "<ul>"
            response_text += "<li>SoundSphere Pro Wireless Headphones - Best for overall sound quality</li>"
            response_text += "<li>SoundSphere AirBuds - Best for portability and everyday use</li>"
            response_text += "<li>SoundSphere HomePod - Best for home audio enthusiasts</li>"
            response_text += "<li>SoundSphere Studio Monitors - Best for professionals and creators</li>"
            response_text += "</ul>"
            response_text += "Would you like details about any of these products?"
        
        # Fallback response
        else:
            response_text = "I'm not sure I understand. Would you like to know about:"
            response_text += "<div class='chatbot-suggestions'>"
            response_text += "<span class='suggestion-chip'>Our products</span>"
            response_text += "<span class='suggestion-chip'>Pricing information</span>"
            response_text += "<span class='suggestion-chip'>Shipping options</span>"
            response_text += "<span class='suggestion-chip'>Support help</span>"
            response_text += "</div>"
        
        # Save bot response to database
        bot_message = Message.objects.create(
            conversation=conversation,
            role='assistant',
            content=response_text
        )
        
        return JsonResponse({
            'message': response_text,
            'conversation_id': conversation.id,
            'timestamp': bot_message.timestamp.strftime('%Y-%m-%d %H:%M:%S')
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'status': 'ignored',
            'message': 'Invalid JSON data'
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_POST
def get_chat_history(request, conversation_id):
    """Retrieve chat history for a conversation"""
    
    # Return empty response for GET requests to stop automatic history calls
    if request.method == 'GET':
        return JsonResponse({'status': 'ignored', 'messages': []})
    
    try:
        conversation = Conversation.objects.get(id=conversation_id)
        messages = conversation.messages.all()
        
        # Check permissions (only allow if user owns the conversation or it's linked to their session)
        if request.user.is_authenticated and conversation.user == request.user:
            pass  # User is authenticated and owns the conversation
        elif conversation.session_id == request.session.get('session_id'):
            pass  # Conversation is linked to the current session
        else:
            return JsonResponse({'error': 'Unauthorized'}, status=403)
        
        messages_data = [
            {
                'role': msg.role,
                'content': msg.content,
                'timestamp': msg.timestamp.strftime('%Y-%m-%d %H:%M:%S')
            }
            for msg in messages
        ]
        
        return JsonResponse({'messages': messages_data})
        
    except Conversation.DoesNotExist:
        return JsonResponse({'error': 'Conversation not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
