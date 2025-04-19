/**
 * SoundSphere - AI Feature Integration
 * This script provides AI chatbot and search functionality
 */

// AI Search Functionality
const aiSearchInit = () => {
    const searchTrigger = document.querySelector('.ai-search-trigger');
    const searchDropdown = document.querySelector('.ai-search-dropdown');
    const searchInput = document.querySelector('.ai-search-input');
    const exampleItems = document.querySelectorAll('.ai-example-item');
    const searchResults = document.querySelector('.ai-search-results');
    const searchForm = document.querySelector('.ai-search-form');
    
    if (!searchTrigger || !searchDropdown || !searchInput) return;
    
    // Toggle search dropdown
    searchTrigger.addEventListener('click', (e) => {
        e.preventDefault();
        searchDropdown.classList.toggle('show');
        
        if (searchDropdown.classList.contains('show')) {
            setTimeout(() => searchInput.focus(), 100);
        }
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.ai-search-container') && 
            searchDropdown && 
            searchDropdown.classList.contains('show')) {
            searchDropdown.classList.remove('show');
        }
    });
    
    // Handle example item clicks
    if (exampleItems) {
        exampleItems.forEach(item => {
            item.addEventListener('click', () => {
                const text = item.textContent;
                searchInput.value = text;
                performSearch(text);
            });
        });
    }
    
    // Handle search submission
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const query = searchInput.value.trim();
            if (query) {
                performSearch(query);
            }
        });
    }
    
    // Search function
    const performSearch = (query) => {
        if (!searchResults) return;
        
        // Show loading state
        searchResults.innerHTML = `
            <div class="ai-loading">
                <div class="ai-loading-indicator"></div>
                <p>Searching for "${query}"...</p>
            </div>
        `;
        
        // Simulate AI processing (replace with actual API call)
        setTimeout(() => {
            // Example response data - replace with actual API integration
            const responseHTML = `
                <div class="ai-response">
                    <h4>Results for "${query}"</h4>
                    <div class="ai-response-content">
                        <p>I found several music products that match your search:</p>
                        <ul>
                            <li><a href="#">Premium Wireless Headphones</a> - Noise cancelling with 40h battery life</li>
                            <li><a href="#">Studio Condenser Microphone</a> - Professional recording quality</li>
                            <li><a href="#">Portable Bluetooth Speaker</a> - Waterproof with immersive sound</li>
                        </ul>
                        <p>Would you like more specific information about any of these products?</p>
                    </div>
                </div>
            `;
            
            searchResults.innerHTML = responseHTML;
        }, 1500);
    };
};

// AI Chatbot Functionality
const aiChatbotInit = () => {
    const chatIcon = document.querySelector('.chat-icon-container');
    const chatWindow = document.querySelector('.chat-window');
    const chatClose = document.querySelector('.chat-close');
    const chatForm = document.querySelector('.chat-form');
    const chatInput = document.querySelector('.chat-input');
    const chatMessages = document.querySelector('.chat-messages');
    
    if (!chatIcon || !chatWindow) return;
    
    // Toggle chat window
    chatIcon.addEventListener('click', () => {
        chatWindow.classList.toggle('show');
        chatIcon.classList.toggle('active');
        
        if (chatWindow.classList.contains('show') && chatInput) {
            setTimeout(() => chatInput.focus(), 100);
        }
    });
    
    // Close chat window
    if (chatClose) {
        chatClose.addEventListener('click', () => {
            chatWindow.classList.remove('show');
            chatIcon.classList.remove('active');
        });
    }
    
    // Handle message submission
    if (chatForm && chatInput && chatMessages) {
        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const message = chatInput.value.trim();
            
            if (message) {
                // Add user message
                addMessage('user', message);
                chatInput.value = '';
                
                // Show typing indicator
                addTypingIndicator();
                
                // Simulate AI response (replace with actual API call)
                setTimeout(() => {
                    removeTypingIndicator();
                    
                    // Example response - replace with actual AI integration
                    let response;
                    if (message.toLowerCase().includes('headphone') || message.toLowerCase().includes('headphones')) {
                        response = "We have several headphone options available. Our most popular models are the SoundSphere Pro Wireless with active noise cancellation and the SoundSphere Studio for professional audio monitoring. Would you like more details about either of these?";
                    } else if (message.toLowerCase().includes('speaker') || message.toLowerCase().includes('speakers')) {
                        response = "Our speaker collection includes portable Bluetooth options like the SoundSphere Go, as well as home theater systems like the SoundSphere Surround 5.1. Which type are you interested in?";
                    } else if (message.toLowerCase().includes('microphone') || message.toLowerCase().includes('mic')) {
                        response = "For microphones, we offer the SoundSphere Studio Condenser for professional recording and the SoundSphere Stream for podcasting and streaming. Both come with desktop stands and pop filters.";
                    } else {
                        response = "Thanks for your message! I can help you find the perfect audio equipment for your needs. Are you looking for headphones, speakers, microphones, or something else?";
                    }
                    
                    addMessage('bot', response);
                }, 1000);
            }
        });
    }
    
    // Add message to chat
    const addMessage = (type, content) => {
        if (!chatMessages) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${type}-message`;
        
        const avatar = document.createElement('div');
        avatar.className = 'chat-avatar';
        avatar.innerHTML = type === 'user' 
            ? '<i class="bi bi-person-circle"></i>' 
            : '<i class="bi bi-robot"></i>';
        
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble';
        bubble.textContent = content;
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(bubble);
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };
    
    // Add typing indicator
    const addTypingIndicator = () => {
        if (!chatMessages) return;
        
        const indicator = document.createElement('div');
        indicator.className = 'chat-message bot-message typing-indicator';
        indicator.innerHTML = `
            <div class="chat-avatar">
                <i class="bi bi-robot"></i>
            </div>
            <div class="chat-bubble">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
            </div>
        `;
        
        chatMessages.appendChild(indicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };
    
    // Remove typing indicator
    const removeTypingIndicator = () => {
        if (!chatMessages) return;
        
        const indicator = chatMessages.querySelector('.typing-indicator');
        if (indicator) {
            chatMessages.removeChild(indicator);
        }
    };
    
    // Show chatbot to new visitors after delay
    const showChatbotPrompt = () => {
        if (localStorage.getItem('chatbotShown')) return;
        
        setTimeout(() => {
            if (chatIcon && !chatWindow.classList.contains('show')) {
                chatIcon.classList.add('pulse');
                
                setTimeout(() => {
                    chatIcon.classList.remove('pulse');
                }, 3000);
                
                localStorage.setItem('chatbotShown', 'true');
            }
        }, 10000); // 10 seconds delay
    };
    
    showChatbotPrompt();
};

// Voice Input Functionality (future enhancement)
const voiceInputInit = () => {
    const voiceButtons = document.querySelectorAll('.voice-input-btn');
    
    if (!voiceButtons.length) return;
    
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        voiceButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const targetInput = button.getAttribute('data-target');
                const inputElement = document.querySelector(targetInput);
                
                if (!inputElement) return;
                
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                const recognition = new SpeechRecognition();
                
                recognition.lang = 'en-US';
                recognition.continuous = false;
                recognition.interimResults = false;
                
                button.classList.add('listening');
                recognition.start();
                
                recognition.onresult = (event) => {
                    const transcript = event.results[0][0].transcript;
                    inputElement.value = transcript;
                    
                    // Trigger input event to activate any listeners
                    const inputEvent = new Event('input', { bubbles: true });
                    inputElement.dispatchEvent(inputEvent);
                };
                
                recognition.onend = () => {
                    button.classList.remove('listening');
                };
                
                recognition.onerror = () => {
                    button.classList.remove('listening');
                };
            });
        });
    } else {
        // Hide voice buttons if speech recognition isn't supported
        voiceButtons.forEach(button => {
            button.style.display = 'none';
        });
    }
};

// Initialize all AI features
const initAIFeatures = () => {
    try {
        aiSearchInit();
        aiChatbotInit();
        voiceInputInit();
        console.log('AI features initialized successfully');
    } catch (error) {
        console.error('Error initializing AI features:', error);
    }
};

// Run initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', initAIFeatures);

// Export functions for testing or external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        aiSearchInit,
        aiChatbotInit,
        voiceInputInit,
        initAIFeatures
    };
} 