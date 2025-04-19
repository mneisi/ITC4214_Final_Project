/**
 * SoundSphere Chatbot Module
 * Handles all chatbot interactions and speech recognition features
 */

class SoundSphereChatbot {
    constructor() {
        // UI Elements
        this.chatbotToggle = document.getElementById('chatbotToggle');
        this.chatbotWindow = document.getElementById('chatbotWindow');
        this.chatbotClose = document.getElementById('chatbotClose');
        this.chatbotBody = document.getElementById('chatbotBody');
        this.chatbotInput = document.getElementById('chatbotInput');
        this.sendMessageButton = document.getElementById('sendMessageButton');
        this.voiceInputButton = document.getElementById('voiceInputButton');
        this.typingIndicator = document.getElementById('typing-indicator');
        this.floatingChatButton = document.getElementById('floatingChatButton');
        
        // Immediately close chatbot on new page load to prevent flicker
        if (this.chatbotWindow) {
            this.chatbotWindow.classList.remove('active');
        }
        
        // State variables
        this.conversationId = localStorage.getItem('chatbot_conversation_id') || null;
        this.isRecording = false;
        this.recognition = null;
        this.messageHistory = [];
        this.isInitialized = false;
        this.historyLoaded = window.CHATBOT_CONFIG?.historyLoaded || false;
        this.isVisible = false; // Start as closed, then check localStorage in restoreVisibilityState
        this.lastRequestTime = 0;
        this.minRequestInterval = 1000; // Minimum 1 second between requests
        this.preventAutoRequests = window.CHATBOT_CONFIG?.preventAutoRequests || true;
        this.pageLoadTimestamp = Date.now();
        
        // Initialize the chatbot
        this.init();
    }

    /**
     * Initialize the chatbot functionality
     */
    init() {
        if (this.isInitialized) return;
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initialize speech recognition
        this.initSpeechRecognition();
        
        // Make suggestion chips clickable
        this.setupSuggestionChips();
        
        // Restore chatbot visibility state
        this.restoreVisibilityState();
        
        this.isInitialized = true;
        console.log('SoundSphere Chatbot initialized');
    }
    
    /**
     * Restore the visibility state from localStorage
     */
    restoreVisibilityState() {
        // Don't restore visibility if we're coming from another page
        if (document.referrer) {
            this.isVisible = false;
            localStorage.setItem('chatbot_visible', 'false');
            if (this.chatbotWindow) {
                this.chatbotWindow.classList.remove('active');
            }
            return;
        }
        
        // Only restore visibility if this is a direct page load (not a navigation)
        // Check the localStorage setting only if we're sure this isn't a navigation
        this.isVisible = localStorage.getItem('chatbot_visible') === 'true';
        
        // Only restore if we have a stored state and some time has passed since page load
        const timeSincePageLoad = Date.now() - this.pageLoadTimestamp;
        
        // If it's been less than 500ms since page load, don't restore the state
        if (timeSincePageLoad < 500) {
            this.isVisible = false;
            localStorage.setItem('chatbot_visible', 'false');
            if (this.chatbotWindow) {
                this.chatbotWindow.classList.remove('active');
            }
            return;
        }
        
        // Check if this is a navigation from a form submission
        const lastPage = localStorage.getItem('chatbot_last_page');
        const currentPage = window.CHATBOT_PAGE_ID;
        
        // If this is a new page load after a form submission, keep the chatbot closed
        if (lastPage && lastPage !== currentPage) {
            this.isVisible = false;
            localStorage.setItem('chatbot_visible', 'false');
            if (this.chatbotWindow) {
                this.chatbotWindow.classList.remove('active');
            }
            return;
        }
        
        // If chatbot was previously visible, show it
        if (this.isVisible && this.chatbotWindow) {
            this.chatbotWindow.classList.add('active');
        } else if (this.chatbotWindow) {
            this.chatbotWindow.classList.remove('active');
        }
        
        // Update the last page ID
        localStorage.setItem('chatbot_last_page', currentPage);
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Toggle chatbot visibility
        if (this.chatbotToggle) {
            this.chatbotToggle.addEventListener('click', this.toggleChatbot.bind(this));
        }
        
        if (this.chatbotClose) {
            this.chatbotClose.addEventListener('click', this.toggleChatbot.bind(this));
        }
        
        if (this.floatingChatButton) {
            this.floatingChatButton.addEventListener('click', () => {
                if (!this.chatbotWindow.classList.contains('active')) {
                    this.toggleChatbot();
                }
            });
        }
        
        // Send message handlers
        if (this.sendMessageButton) {
            this.sendMessageButton.addEventListener('click', this.sendMessage.bind(this));
        }
        
        if (this.chatbotInput) {
            this.chatbotInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage();
                }
            });
        }
        
        // Voice input
        if (this.voiceInputButton) {
            this.voiceInputButton.addEventListener('click', this.toggleRecording.bind(this));
        }
        
        // Listen for page unload to reset visibility state if necessary
        window.addEventListener('beforeunload', () => {
            // If the page is being navigated away from or refreshed,
            // we should preserve the chatbot state
            localStorage.setItem('chatbot_visible', this.isVisible.toString());
        });
    }

    /**
     * Check if enough time has passed since the last request to prevent excessive API calls
     * @returns {boolean} True if a request can be made, false otherwise
     */
    canMakeRequest() {
        const now = Date.now();
        if (now - this.lastRequestTime >= this.minRequestInterval) {
            this.lastRequestTime = now;
            return true;
        }
        return false;
    }

    /**
     * Initialize speech recognition if available in the browser
     */
    initSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            // Create speech recognition instance
            this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';
            
            // Speech recognition results
            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.chatbotInput.value = transcript;
                this.stopRecording();
                // Send message after a short delay to give user time to see it
                setTimeout(() => {
                    this.sendMessage();
                }, 500);
            };
            
            // Handle errors
            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.stopRecording();
                this.addMessage("I couldn't hear that. Please try typing instead.", false);
            };
            
            // When recognition stops
            this.recognition.onend = () => {
                this.stopRecording();
            };
            
            // Enable voice button
            if (this.voiceInputButton) {
                this.voiceInputButton.disabled = false;
            }
        } else {
            // Speech recognition not supported
            console.log('Speech recognition not supported in this browser.');
            if (this.voiceInputButton) {
                this.voiceInputButton.disabled = true;
                this.voiceInputButton.title = 'Voice input not supported in this browser';
            }
        }
    }

    /**
     * Start voice recording
     */
    startRecording() {
        if (this.recognition) {
            try {
                this.isRecording = true;
                this.voiceInputButton.classList.add('recording');
                this.recognition.start();
                this.addMessage("I'm listening... speak now", false);
            } catch (error) {
                console.error('Error starting speech recognition:', error);
            }
        }
    }

    /**
     * Stop voice recording
     */
    stopRecording() {
        if (this.recognition && this.isRecording) {
            this.isRecording = false;
            if (this.voiceInputButton) {
                this.voiceInputButton.classList.remove('recording');
            }
            try {
                this.recognition.stop();
            } catch (error) {
                console.error('Error stopping speech recognition:', error);
            }
        }
    }

    /**
     * Toggle voice recording on/off
     */
    toggleRecording() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }

    /**
     * Initialize a new conversation with the backend if needed
     * @returns {Promise} A promise that resolves when conversation is initialized
     */
    initConversation() {
        return new Promise((resolve, reject) => {
            if (this.conversationId) {
                resolve(this.conversationId);
                return;
            }
            
            if (!this.canMakeRequest()) {
                resolve(null);
                return;
            }
            
            // Create a new conversation via AJAX
            fetch('/chatbot/process/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    message: 'hello',
                    conversation_id: '',
                    is_user_initiated: true
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'ignored') {
                    console.log('Initialization request was ignored by server');
                    resolve(null);
                    return;
                }
                
                this.conversationId = data.conversation_id;
                localStorage.setItem('chatbot_conversation_id', this.conversationId);
                resolve(this.conversationId);
            })
            .catch(error => {
                console.error('Error initializing conversation:', error);
                reject(error);
            });
        });
    }

    /**
     * Toggle chatbot window visibility
     */
    toggleChatbot() {
        if (!this.chatbotWindow) return;
        
        if (this.chatbotWindow.classList.contains('active')) {
            this.chatbotWindow.classList.remove('active');
            this.isVisible = false;
            localStorage.setItem('chatbot_visible', 'false');
            
            if (this.isRecording) {
                this.stopRecording();
            }
        } else {
            this.chatbotWindow.classList.add('active');
            this.isVisible = true;
            localStorage.setItem('chatbot_visible', 'true');
            
            // Load history if needed and this isn't an automated request
            if (this.conversationId && !this.historyLoaded && !this.preventAutoRequests) {
                this.loadChatHistory();
            }
            
            setTimeout(() => {
                if (this.chatbotInput) {
                    this.chatbotInput.focus();
                }
            }, 300);
        }
    }

    /**
     * Show typing indicator
     */
    showTypingIndicator() {
        if (this.typingIndicator) {
            this.typingIndicator.style.display = 'block';
            this.scrollToBottom();
        }
    }

    /**
     * Hide typing indicator
     */
    hideTypingIndicator() {
        if (this.typingIndicator) {
            this.typingIndicator.style.display = 'none';
        }
    }

    /**
     * Scroll chat to bottom
     */
    scrollToBottom() {
        if (this.chatbotBody) {
            this.chatbotBody.scrollTop = this.chatbotBody.scrollHeight;
        }
    }

    /**
     * Add message to chat window
     * @param {string} content - Message content
     * @param {boolean} isUser - Whether message is from user (true) or bot (false)
     */
    addMessage(content, isUser = false) {
        if (!this.chatbotBody) return;
        
        const messageElem = document.createElement('div');
        messageElem.className = isUser ? 'message user-message' : 'message bot-message';
        
        messageElem.innerHTML = `
            ${content}
            <span class="message-time">${this.getCurrentTime()}</span>
        `;
        
        // Insert before typing indicator if present
        if (this.typingIndicator) {
            this.chatbotBody.insertBefore(messageElem, this.typingIndicator);
        } else {
            this.chatbotBody.appendChild(messageElem);
        }
        
        this.scrollToBottom();
        
        // Save to history
        this.messageHistory.push({
            role: isUser ? 'user' : 'assistant',
            content: content,
            timestamp: new Date()
        });
    }

    /**
     * Send message to backend and process response
     */
    sendMessage() {
        if (!this.chatbotInput || !this.canMakeRequest()) return;
        
        const message = this.chatbotInput.value.trim();
        if (!message) return;
        
        // Clear input
        this.chatbotInput.value = '';
        
        // Add user message to chat
        this.addMessage(message, true);
        
        // Show typing indicator
        this.showTypingIndicator();
        
        // Get or create conversation ID
        (this.conversationId ? Promise.resolve(this.conversationId) : this.initConversation())
            .then(conversationId => {
                if (!conversationId) {
                    this.hideTypingIndicator();
                    this.addMessage('Sorry, the system is busy. Please try again shortly.');
                    return Promise.reject(new Error('Rate limited'));
                }
                
                // Send to backend
                return fetch('/chatbot/process/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: JSON.stringify({
                        message: message,
                        conversation_id: conversationId,
                        is_user_initiated: true
                    })
                });
            })
            .then(response => response.json())
            .then(data => {
                // Hide typing indicator
                this.hideTypingIndicator();
                
                // Check if request was ignored
                if (data.status === 'ignored') {
                    console.log('Message request was ignored by server');
                    return;
                }
                
                // Add bot response
                if (data.message) {
                    this.addMessage(data.message);
                    if (data.conversation_id && !this.conversationId) {
                        this.conversationId = data.conversation_id;
                        localStorage.setItem('chatbot_conversation_id', this.conversationId);
                    }
                } else if (data.error) {
                    console.error('Error:', data.error);
                    this.addMessage('Sorry, there was an error processing your request.');
                }
            })
            .catch(error => {
                if (error.message === 'Rate limited') return;
                
                console.error('Error:', error);
                this.hideTypingIndicator();
                this.addMessage('Sorry, there was an error connecting to the server.');
            });
    }

    /**
     * Load chat history from the server - only called manually now
     */
    loadChatHistory() {
        // Deliberately disabled to prevent automatic requests
        console.log('Chat history loading is disabled to prevent automatic requests');
        this.historyLoaded = true;
        return;
    }

    /**
     * Clear all messages from the chat window
     */
    clearMessages() {
        if (!this.chatbotBody || !this.typingIndicator) return;
        
        // Remove all message elements but keep the typing indicator
        const messages = this.chatbotBody.querySelectorAll('.message');
        messages.forEach(msg => msg.remove());
        
        // Clear history
        this.messageHistory = [];
    }

    /**
     * Make suggestion chips clickable
     */
    setupSuggestionChips() {
        document.querySelectorAll('.suggestion-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                if (this.chatbotInput) {
                    this.chatbotInput.value = chip.textContent.trim();
                    this.sendMessage();
                }
            });
        });
    }

    /**
     * Get the current time formatted for messages
     * @returns {string} Formatted time string
     */
    getCurrentTime() {
        const now = new Date();
        let hours = now.getHours();
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        
        hours = hours % 12;
        hours = hours ? hours : 12; // Convert 0 to 12
        
        return `${hours}:${minutes} ${ampm}`;
    }

    /**
     * Get CSRF token from cookies
     * @returns {string} CSRF token
     */
    getCsrfToken() {
        const name = 'csrftoken';
        let cookieValue = null;
        
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
}

// Initialize the chatbot but with event listeners for user interaction
document.addEventListener('DOMContentLoaded', () => {
    window.soundSphereChatbot = new SoundSphereChatbot();
}); 