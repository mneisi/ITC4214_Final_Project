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
        
        // State variables
        this.conversationId = localStorage.getItem('chatbot_conversation_id') || null;
        this.isRecording = false;
        this.recognition = null;
        this.messageHistory = [];
        this.isInitialized = false;
        this.isVisible = false; // ALWAYS START CLOSED
        this.lastRequestTime = 0;
        this.minRequestInterval = 1000; // Prevent spamming API too fast
        this.preventAutoRequests = window.CHATBOT_CONFIG?.preventAutoRequests || true;
        this.pageLoadTimestamp = Date.now();
        
        // Ensure window is closed initially regardless of previous state
        if (this.chatbotWindow) {
            this.chatbotWindow.classList.remove('active');
        }
        // Clear any potentially leftover visibility state from storage
        localStorage.removeItem('chatbot_visible');
        
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
        
        // Chatbot starts closed, no need to restore visibility state here
        
        // Make suggestion chips clickable (if any exist initially)
        this.setupSuggestionChips();
        
        this.isInitialized = true;
        console.log('SoundSphere Chatbot initialized (forced closed)');
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
                // Only open if not already active
                if (this.chatbotWindow && !this.chatbotWindow.classList.contains('active')) {
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
            // Ensure the actual voice toggle function is called
            this.voiceInputButton.addEventListener('click', this.toggleRecording.bind(this));
        }
    }

    /**
     * Check if enough time has passed since the last request to prevent excessive API calls
     * @returns {boolean} True if a request can be made, false otherwise
     */
    canMakeRequest() {
        // Re-enabled basic rate limiting to prevent accidental spamming if backend fails
        const now = Date.now();
        if (now - this.lastRequestTime >= this.minRequestInterval) {
             this.lastRequestTime = now; // Update time only when request is allowed
            return true;
        }
        console.warn('Chatbot request ignored: Too soon since last request.');
        return false;
    }

    /**
     * Initialize speech recognition if available in the browser
     */
    initSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            // Create speech recognition instance
            this.recognition = new SpeechRecognition();
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
                }, 300); // Reduced delay
            };
            
            // Handle errors
            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                let errorMessage = "Speech recognition error.";
                if (event.error === 'no-speech') {
                    errorMessage = "I didn't hear anything. Please try again.";
                } else if (event.error === 'audio-capture') {
                    errorMessage = "Couldn't access microphone. Please check permissions.";
                } else if (event.error === 'not-allowed') {
                    errorMessage = "Microphone access denied. Please allow access in browser settings.";
                }
                this.stopRecording();
                this.addMessage(errorMessage, false);
            };
            
            // When recognition stops
            this.recognition.onend = () => {
                // Ensure recording state is updated even if stopped externally
                if (this.isRecording) {
                    this.stopRecording();
                }
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
        if (this.recognition && !this.isRecording) {
            try {
                this.isRecording = true;
                this.voiceInputButton.classList.add('recording');
                this.recognition.start();
                console.log("Chatbot recording started...");
            } catch (error) {
                console.error('Error starting speech recognition:', error);
                 this.isRecording = false;
                 this.voiceInputButton.classList.remove('recording');
                 this.addMessage("Could not start voice recognition. Please try again.", false);
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
                // Check if recognition is actually running before stopping
                // This avoids errors if it stopped automatically (e.g., on no-speech)
                this.recognition.stop(); 
                console.log("Chatbot recording stopped.");
            } catch (error) {
                // Ignore errors if recognition wasn't running
                if (error.name !== 'InvalidStateError') {
                    console.error('Error stopping speech recognition:', error);
                }
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
     * @returns {Promise} A promise that resolves with the conversation ID or rejects on error
     */
    initConversation() {
        return new Promise((resolve, reject) => {
            if (this.conversationId) {
                resolve(this.conversationId);
                return;
            }
            
            if (!this.canMakeRequest()) {
                 // Reject if rate limited
                reject(new Error('Rate limited: Cannot initialize conversation too quickly.'));
                return;
            }
            
            // Create a new conversation via AJAX
            fetch('/chatbot/process/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCsrfToken(),
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    message: '__init__', // Special message to indicate initialization
                    conversation_id: ''
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success' && data.conversation_id) {
                    this.conversationId = data.conversation_id;
                    localStorage.setItem('chatbot_conversation_id', this.conversationId);
                    console.log('Chatbot conversation initialized:', this.conversationId);
                    resolve(this.conversationId);
                } else {
                    console.error('Error initializing conversation:', data.message || 'Unknown error');
                    reject(new Error(data.message || 'Failed to initialize conversation.'));
                }
            })
            .catch(error => {
                console.error('Network error initializing conversation:', error);
                reject(error);
            });
        });
    }

    /**
     * Toggle chatbot window visibility - SIMPLIFIED
     */
    toggleChatbot() {
        if (!this.chatbotWindow) return;
        
        // Directly toggle the class
        const isActive = this.chatbotWindow.classList.toggle('active');
        this.isVisible = isActive;
        // DO NOT save visibility to localStorage anymore
        // localStorage.setItem('chatbot_visible', isActive.toString()); 

        if (!isActive && this.isRecording) {
            this.stopRecording(); // Stop recording if chat is closed
        }

        if (isActive) {
             // Attempt to init conversation when opened, if needed
             this.initConversation().catch(err => console.error('Failed to init conversation on toggle:', err));
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
            this.typingIndicator.style.display = 'flex'; // Use flex for alignment
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
            // Use smooth scrolling for better UX
            this.chatbotBody.scrollTo({ top: this.chatbotBody.scrollHeight, behavior: 'smooth' });
        }
    }

    /**
     * Add message to chat window
     * @param {string} content - Message content (HTML allowed)
     * @param {boolean} isUser - Whether message is from user (true) or bot (false)
     */
    addMessage(content, isUser = false) {
        if (!this.chatbotBody) return;
        
        const messageElem = document.createElement('div');
        messageElem.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
        
        // Sanitize content before adding? For now, assume backend provides safe HTML
        messageElem.innerHTML = `
            <div class="message-content">${content}</div>
            <span class="message-time">${this.getCurrentTime()}</span>
        `;
        
        // Insert before typing indicator if present
        if (this.typingIndicator && this.typingIndicator.parentNode === this.chatbotBody) {
            this.chatbotBody.insertBefore(messageElem, this.typingIndicator);
        } else {
            this.chatbotBody.appendChild(messageElem);
        }
        
        this.scrollToBottom();
        
        // Save to local history (optional, backend is source of truth)
        this.messageHistory.push({
            role: isUser ? 'user' : 'assistant',
            content: content,
            timestamp: new Date()
        });

        // Re-attach listeners for any new suggestion chips in the message
        messageElem.querySelectorAll('.suggestion-chip').forEach(chip => {
            this.setupSuggestionChipListener(chip);
        });
    }

    /**
     * Send message to backend and process response
     */
    sendMessage() {
        if (!this.chatbotInput) return;
        
        const message = this.chatbotInput.value.trim();
        if (!message) return;

        // Prevent sending if rate limited
        if (!this.canMakeRequest()) {
            // Maybe show a subtle message instead of adding to chat?
            // For now, just log it.
            console.warn("Message sending rate limited.");
            return; 
        }
        
        // Clear input
        this.chatbotInput.value = '';
        
        // Add user message to chat
        this.addMessage(message, true);
        
        // Show typing indicator
        this.showTypingIndicator();
        
        // Ensure conversation is initialized, then send message
        this.initConversation()
            .then(conversationId => {
                // Send to backend
                return fetch('/chatbot/process/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': this.getCsrfToken(),
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: JSON.stringify({
                        message: message,
                        conversation_id: conversationId
                    })
                });
            })
            .then(response => {
                if (!response.ok) {
                    // Handle HTTP errors (e.g., 500 Internal Server Error)
                    return response.json().then(errData => {
                        throw new Error(errData.message || `HTTP error ${response.status}`);
                    }).catch(() => {
                        // Fallback if response body is not JSON or empty
                        throw new Error(`HTTP error ${response.status}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                this.hideTypingIndicator();
                
                if (data.status === 'success') {
                    if (data.message) {
                        this.addMessage(data.message, false);
                        if (data.conversation_id && !this.conversationId) {
                            this.conversationId = data.conversation_id;
                            localStorage.setItem('chatbot_conversation_id', this.conversationId);
                        }
                    } else {
                        // Success but no message? Log warning.
                        console.warn('Chatbot returned success but no message.');
                        this.addMessage("I received your message, but didn't have anything specific to add.", false);
                    }
                } else {
                    // Handle application-level errors reported in JSON
                    console.error('Chatbot API Error:', data.message || data.error || 'Unknown error');
                    this.addMessage(data.message || 'Sorry, there was an error processing your request. Please try again.', false);
                }
            })
            .catch(error => {
                // Handle network errors, rate limiting errors from initConversation, or HTTP errors
                console.error('Error sending message:', error);
                this.hideTypingIndicator();
                // Provide a more specific error message if possible
                let displayError = 'Sorry, there was an error connecting. Please check your connection and try again.';
                if (error.message.includes('Rate limited')) {
                    displayError = 'Too many requests. Please wait a moment before sending another message.';
                }
                this.addMessage(displayError, false);
            });
    }

    /**
     * Load chat history from the server - NOT USED CURRENTLY
     * Kept for potential future use, but disabled by default.
     */
    loadChatHistory() {
        // Deliberately disabled to prevent automatic requests
        if (!this.historyLoaded) {
            console.log('Chat history loading is disabled.');
            this.historyLoaded = true;
        }
        return;
    }

    /**
     * Clear all messages from the chat window
     */
    clearMessages() {
        if (!this.chatbotBody) return;
        
        // Remove all message elements but keep the typing indicator
        const messages = this.chatbotBody.querySelectorAll('.message');
        messages.forEach(msg => msg.remove());
        
        // Clear local history
        this.messageHistory = [];
    }

    /**
     * Setup click listeners for suggestion chips (can be called multiple times)
     */
    setupSuggestionChips() {
        // Use event delegation on the body for dynamically added chips
        if (this.chatbotBody && !this.chatbotBody._suggestionChipDelegateAttached) { // Prevent multiple listeners
             this.chatbotBody.addEventListener('click', (event) => {
                if (event.target.classList.contains('suggestion-chip')) {
                    const chipText = event.target.textContent.trim();
                    if (this.chatbotInput) {
                        this.chatbotInput.value = chipText;
                        this.sendMessage();
                    }
                }
            });
            this.chatbotBody._suggestionChipDelegateAttached = true;
            console.log("Suggestion chip listener attached.");
        }
    }
    
    /** Helper for setupSuggestionChips to avoid repetition */
    setupSuggestionChipListener(chip) {
        // This function is now handled by the event delegation above
        // Kept temporarily for reference, can be removed
        chip.addEventListener('click', () => {
             if (this.chatbotInput) {
                this.chatbotInput.value = chip.textContent.trim();
                this.sendMessage();
            }
        });
    }


    /**
     * Get the current time formatted for messages
     * @returns {string} Formatted time string
     */
    getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }

    /**
     * Get CSRF token from cookies
     * @returns {string | null} CSRF token or null if not found
     */
    getCsrfToken() {
        const name = 'csrftoken';
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                let cookie = cookies[i].trim();
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    return decodeURIComponent(cookie.substring(name.length + 1));
                }
            }
        }
        console.warn('CSRF token not found.');
        return null;
    }
}

// Initialize the chatbot with proper event binding
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.soundSphereChatbot = new SoundSphereChatbot();
        console.log('SoundSphere Chatbot initialized successfully via class');
        
    } catch (error) {
        console.error('Error initializing chatbot class:', error);
    }
}); 