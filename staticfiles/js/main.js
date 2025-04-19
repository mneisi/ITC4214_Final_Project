$(document).ready(function() {
    // Initialize Bootstrap tooltips
    try {
        var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    } catch (error) {
        console.log("Tooltip initialization skipped:", error);
    }
    
    // Theme toggling functionality
    const themeToggleBtn = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;
    
    // Check for saved theme preference or use system preference
    const getInitialTheme = () => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            return savedTheme;
        }
        
        // Check if user has system dark mode preference
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };
    
    // Apply theme
    const applyTheme = (theme) => {
        if (!htmlElement) return;
        
        htmlElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // Update toggle button icon
        if (themeToggleBtn) {
            const iconElement = themeToggleBtn.querySelector('i');
            if (iconElement) {
                if (theme === 'dark') {
                    iconElement.className = 'fas fa-sun';
                    themeToggleBtn.setAttribute('title', 'Switch to light mode');
                } else {
                    iconElement.className = 'fas fa-moon';
                    themeToggleBtn.setAttribute('title', 'Switch to dark mode');
                }
            }
        }
    };
    
    // Initialize theme
    applyTheme(getInitialTheme());
    
    // Toggle theme when button is clicked
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = htmlElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            applyTheme(newTheme);
        });
    }
    
    // Navbar active link
    const currentLocation = location.pathname;
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href === currentLocation) {
            link.classList.add('active');
        } else if (!link.classList.contains('dropdown-toggle')) {
            link.classList.remove('active');
        }
    });
    
    // Product quantity selector
    $('.quantity-selector .btn-minus').on('click', function() {
        var input = $(this).siblings('input');
        if (input.length) {
            var value = parseInt(input.val()) || 1;
            if (value > 1) {
                input.val(value - 1);
            }
        }
    });
    
    $('.quantity-selector .btn-plus').on('click', function() {
        var input = $(this).siblings('input');
        if (input.length) {
            var value = parseInt(input.val()) || 1;
            input.val(value + 1);
        }
    });
    
    // Back to top button
    const backToTop = $('.back-to-top');
    if (backToTop.length) {
        $(window).scroll(function() {
            if ($(this).scrollTop() > 300) {
                backToTop.fadeIn('slow');
            } else {
                backToTop.fadeOut('slow');
            }
        });
        
        backToTop.click(function() {
            $('html, body').animate({scrollTop: 0}, 800);
            return false;
        });
    }
    
    // Animation on scroll
    const animateOnScroll = function() {
        const elements = document.querySelectorAll('.animate-on-scroll');
        elements.forEach(element => {
            const position = element.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;
            if (position < windowHeight - 100) {
                element.classList.add('animated');
            }
        });
    };
    
    if (document.querySelectorAll('.animate-on-scroll').length > 0) {
        window.addEventListener('scroll', animateOnScroll);
        animateOnScroll(); // Run once on load
    }
    
    // Product filtering
    $('.filter-btn').on('click', function() {
        const filterValue = $(this).attr('data-filter');
        
        if (filterValue === 'all') {
            $('.product-card').show();
        } else {
            $('.product-card').hide();
            $(`.product-card[data-category="${filterValue}"]`).show();
        }
        
        $('.filter-btn').removeClass('active');
        $(this).addClass('active');
    });
    
    // AI Search Functionality
    const aiSearchInput = document.querySelector('.ai-search-input');
    const searchDropdown = document.getElementById('searchDropdown');
    const aiButton = document.querySelector('.ai-button');
    const voiceButton = document.querySelector('.voice-button');
    const exampleItems = document.querySelectorAll('.example-item');
    const loadingIndicator = document.querySelector('.loading-indicator');
    
    // Toggle search dropdown
    if (aiButton && searchDropdown) {
        aiButton.addEventListener('click', function(e) {
            e.preventDefault();
            if (searchDropdown.style.display === 'block') {
                searchDropdown.style.display = 'none';
            } else {
                searchDropdown.style.display = 'block';
            }
        });
    }
    
    // Open dropdown on input focus
    if (aiSearchInput && searchDropdown) {
        aiSearchInput.addEventListener('focus', function() {
            searchDropdown.style.display = 'block';
        });
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        if (!searchDropdown) return;
        
        const isSearchArea = event.target.closest('.ai-search-wrapper');
        const isChatbotArea = event.target.closest('.chatbot-container');
        
        if (!isSearchArea && !isChatbotArea && searchDropdown.style.display === 'block') {
            searchDropdown.style.display = 'none';
        }
    });
    
    // Example item clicks
    if (exampleItems.length && aiSearchInput) {
        exampleItems.forEach(item => {
            item.addEventListener('click', function() {
                aiSearchInput.value = this.textContent;
                simulateSearch(this.textContent);
            });
        });
    }
    
    // Handle search input
    let searchTimer;
    if (aiSearchInput && searchDropdown) {
        aiSearchInput.addEventListener('input', function() {
            clearTimeout(searchTimer);
            
            const query = this.value.trim();
            if (query.length > 2) {
                // Set a small delay to simulate thinking
                searchTimer = setTimeout(() => {
                    simulateSearch(query);
                }, 500);
            }
        });
    }
    
    function simulateSearch(query) {
        if (!loadingIndicator || !searchDropdown) return;
        
        const searchResults = document.querySelector('.search-results');
        if (!searchResults) return;
        
        // Show loading
        loadingIndicator.style.display = 'flex';
        searchResults.style.display = 'none';
        
        // Simulate loading delay
        setTimeout(() => {
            loadingIndicator.style.display = 'none';
            searchResults.style.display = 'block';
            
            // Generate AI results based on query
            generateSearchResults(query);
        }, 1000);
    }
    
    function generateSearchResults(query) {
        const searchResults = document.querySelector('.search-results');
        if (!searchResults) return;
        
        query = query.toLowerCase();
        let resultsHTML = '';
        
        // AI Response
        resultsHTML += `
            <div class="result-item">
                <div class="result-icon">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="result-content">
                    <div class="result-title">SoundSphere AI</div>
                    <div class="result-description">
                        ${generateAIResponse(query)}
                    </div>
                </div>
            </div>
        `;
        
        // Add product results based on the query
        if (query.includes('guitar')) {
            resultsHTML += `
                <div class="result-item">
                    <div class="result-icon">
                        <i class="fas fa-guitar"></i>
                    </div>
                    <div class="result-content">
                        <div class="result-title">Yamaha FG800 Acoustic Guitar</div>
                        <div class="result-description">
                            Solid spruce top with nato/okume back and sides - $299.99
                        </div>
                    </div>
                </div>
                <div class="result-item">
                    <div class="result-icon">
                        <i class="fas fa-guitar"></i>
                    </div>
                    <div class="result-content">
                        <div class="result-title">Fender CD-60 Acoustic Guitar</div>
                        <div class="result-description">
                            Dreadnought body with solid spruce top - $329.99
                        </div>
                    </div>
                </div>
            `;
        } else if (query.includes('microphone') || query.includes('mic')) {
            resultsHTML += `
                <div class="result-item">
                    <div class="result-icon">
                        <i class="fas fa-microphone"></i>
                    </div>
                    <div class="result-content">
                        <div class="result-title">Shure SM58 Dynamic Microphone</div>
                        <div class="result-description">
                            Industry standard for vocals, designed for professional applications - $99.99
                        </div>
                    </div>
                </div>
            `;
        } else if (query.includes('headphone') || query.includes('headphones')) {
            resultsHTML += `
                <div class="result-item">
                    <div class="result-icon">
                        <i class="fas fa-headphones"></i>
                    </div>
                    <div class="result-content">
                        <div class="result-title">Sony WH-1000XM4 Headphones</div>
                        <div class="result-description">
                            Wireless industry-leading noise cancelling headphones - $349.99
                        </div>
                    </div>
                </div>
            `;
        } else if (query.includes('drum') || query.includes('drums')) {
            resultsHTML += `
                <div class="result-item">
                    <div class="result-icon">
                        <i class="fas fa-drum"></i>
                    </div>
                    <div class="result-content">
                        <div class="result-title">Alesis Nitro Mesh Kit</div>
                        <div class="result-description">
                            Electronic drum kit with mesh heads for a quiet, realistic feel - $379.99
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Add category result
        resultsHTML += `
            <div class="result-item">
                <div class="result-icon">
                    <i class="fas fa-folder"></i>
                </div>
                <div class="result-content">
                    <div class="result-title">Browse All Products</div>
                    <div class="result-description">
                        See our full collection of high-quality music instruments and accessories
                    </div>
                </div>
            </div>
        `;
        
        searchResults.innerHTML = resultsHTML;
        
        // Make the results clickable
        document.querySelectorAll('.search-results .result-item').forEach(item => {
            item.addEventListener('click', function() {
                // Close the dropdown when result is clicked
                if (searchDropdown) {
                    searchDropdown.style.display = 'none';
                }
                
                // Get the title from the clicked result
                const resultTitle = this.querySelector('.result-title');
                if (resultTitle && resultTitle.textContent !== 'SoundSphere AI' && 
                    resultTitle.textContent !== 'Browse All Products') {
                    // Submit the search form with the product name
                    if (aiSearchInput) {
                        aiSearchInput.value = resultTitle.textContent;
                        aiSearchInput.closest('form').submit();
                    }
                }
            });
        });
    }
    
    function generateAIResponse(query) {
        query = query.toLowerCase();
        
        if (query.includes('beginner') && (query.includes('instrument') || query.includes('instruments'))) {
            return "For beginners, I recommend trying the ukulele, piano keyboard, or acoustic guitar. The ukulele is small and relatively easy to learn. A keyboard allows you to see notes visually, and acoustic guitars are versatile but require a bit more finger strength.";
        }
        else if (query.includes('guitar') && (query.includes('choose') || query.includes('recommend') || query.includes('best'))) {
            return "For acoustic guitars under $500, I'd recommend the Yamaha FG800 or the Fender CD-60. Both offer excellent sound quality and playability at affordable prices.";
        }
        else if (query.includes('microphone') || query.includes('mic')) {
            return "The Shure SM58 is an industry standard for vocals at $99. For studio recording, the Audio-Technica AT2020 offers great quality for the same price.";
        }
        else if (query.includes('headphone') || query.includes('headphones')) {
            return "For studio monitoring, the Sony MDR-7506 ($99) or Beyerdynamic DT 770 PRO ($149) are excellent choices. For noise cancelling, consider the Sony WH-1000XM4 ($349).";
        }
        else if (query.includes('drum') || query.includes('drums')) {
            return "The Alesis Nitro Mesh Kit ($379) is great for beginners wanting an electronic drum set. If you're looking for acoustic, the Pearl Roadshow ($449) offers good value.";
        }
        else if (query.includes('piano') || query.includes('keyboard')) {
            return "For beginners, the Yamaha P-45 ($499) or Casio CDP-S100 ($449) offer weighted keys at an affordable price. Both are excellent for learning.";
        }
        else {
            return "I can help you find the perfect instrument based on your needs and budget. Try asking about specific instruments or categories.";
        }
    }
    
    // Voice input functionality - can be implemented later
    if (voiceButton) {
        voiceButton.addEventListener('click', function(e) {
            e.preventDefault();
            alert('Voice search is coming soon!');
        });
    }
    
    // Chatbot Functionality
    const chatbotToggle = document.getElementById('chatbotToggle');
    const chatbotWindow = document.getElementById('chatbotWindow');
    const chatbotClose = document.getElementById('chatbotClose');
    const chatbotBody = document.getElementById('chatbotBody');
    const chatbotInput = document.getElementById('chatbotInput');
    const sendMessageButton = document.getElementById('sendMessageButton');
    const voiceInputButton = document.getElementById('voiceInputButton');
    const suggestionChips = document.querySelectorAll('.suggestion-chip');
    
    // Toggle chatbot window
    if (chatbotToggle && chatbotWindow) {
        chatbotToggle.addEventListener('click', function() {
            if (chatbotWindow.style.display === 'flex') {
                chatbotWindow.style.display = 'none';
            } else {
                chatbotWindow.style.display = 'flex';
                if (chatbotInput) chatbotInput.focus();
            }
        });
    }
    
    // Close chatbot window
    if (chatbotClose && chatbotWindow) {
        chatbotClose.addEventListener('click', function() {
            chatbotWindow.style.display = 'none';
        });
    }
    
    // Send message when clicking the send button
    if (sendMessageButton) {
        sendMessageButton.addEventListener('click', function() {
            sendMessage();
        });
    }
    
    // Send message on Enter key
    if (chatbotInput) {
        chatbotInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
    
    // Handle suggestion chip clicks
    if (suggestionChips.length) {
        suggestionChips.forEach(chip => {
            chip.addEventListener('click', function() {
                const chipText = this.textContent;
                if (chatbotInput) chatbotInput.value = chipText;
                sendMessage();
            });
        });
    }
    
    // Voice input in chatbot - can be implemented later
    if (voiceInputButton) {
        voiceInputButton.addEventListener('click', function() {
            alert('Voice input is coming soon!');
        });
    }
    
    // Function to send a message
    function sendMessage() {
        if (!chatbotInput || !chatbotBody) return;
        
        const message = chatbotInput.value.trim();
        if (message) {
            // Add user message
            addMessage(message, 'user');
            chatbotInput.value = '';
            
            // Show typing indicator
            showTypingIndicator();
            
            // Simulate bot response after a delay
            setTimeout(() => {
                removeTypingIndicator();
                
                // Generate bot response based on message
                let botResponse = generateBotResponse(message);
                addMessage(botResponse, 'bot');
                
                // Scroll to bottom
                chatbotBody.scrollTop = chatbotBody.scrollHeight;
            }, 1500);
        }
    }
    
    // Function to add a message to the chat
    function addMessage(text, sender) {
        if (!chatbotBody) return;
        
        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}-message`;
        
        // Format links in text
        const formattedText = formatLinks(text);
        
        messageElement.innerHTML = `
            ${formattedText}
            <span class="message-time">${getCurrentTime()}</span>
        `;
        
        chatbotBody.appendChild(messageElement);
        chatbotBody.scrollTop = chatbotBody.scrollHeight;
    }
    
    // Show bot typing indicator
    function showTypingIndicator() {
        if (!chatbotBody) return;
        
        const typingElement = document.createElement('div');
        typingElement.className = 'bot-typing';
        typingElement.id = 'botTyping';
        typingElement.innerHTML = `
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        
        chatbotBody.appendChild(typingElement);
        chatbotBody.scrollTop = chatbotBody.scrollHeight;
    }
    
    // Remove typing indicator
    function removeTypingIndicator() {
        const typingElement = document.getElementById('botTyping');
        if (typingElement) {
            typingElement.remove();
        }
    }
    
    // Get current time formatted
    function getCurrentTime() {
        const now = new Date();
        let hours = now.getHours();
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        
        hours = hours % 12;
        hours = hours ? hours : 12; // Convert 0 to 12
        
        return `${hours}:${minutes} ${ampm}`;
    }
    
    // Format links in text
    function formatLinks(text) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.replace(urlRegex, url => `<a href="${url}" target="_blank">${url}</a>`);
    }
    
    // Generate bot response based on user input
    function generateBotResponse(message) {
        message = message.toLowerCase();
        
        if (message.includes('beginner') && (message.includes('instrument') || message.includes('instruments'))) {
            return "For beginners, I recommend trying the ukulele, piano keyboard, or acoustic guitar. The ukulele is small and relatively easy to learn. A keyboard allows you to see notes visually, and acoustic guitars are versatile but require a bit more finger strength.";
        }
        else if (message.includes('guitar') && (message.includes('choose') || message.includes('recommend'))) {
            return "To help you choose the right guitar, I'll need to know a few things: Are you a beginner? Are you interested in acoustic or electric? What's your budget? What music style do you prefer? For beginners, I often recommend the Yamaha FG800 acoustic ($200-300) or the Squier Stratocaster electric starter pack ($250-350).";
        }
        else if (message.includes('home studio') || message.includes('recording')) {
            return "For a basic home studio setup, you'll need: an audio interface (like the Focusrite Scarlett Solo), a microphone (Shure SM58 for vocals or SM57 for instruments), studio monitors or good headphones, and a Digital Audio Workstation (DAW) software. Would you like specific recommendations based on your budget?";
        }
        else if (message.includes('maintenance') || message.includes('care')) {
            return "Regular instrument maintenance is crucial! For string instruments, wipe them down after playing, change strings periodically, and store in a case with proper humidity. For wind instruments, clean mouthpieces regularly and swab internal moisture. For electronic equipment, keep away from extreme temperatures and dust. Would you like specific care tips for a particular instrument?";
        }
        else if (message.includes('piano') || message.includes('keyboard')) {
            return "Digital pianos and keyboards are great for beginners and experienced players alike. For beginners, I recommend the Yamaha P-45 ($500) or Casio CDP-S100 ($450) for weighted keys at an affordable price. More advanced players might prefer the Roland FP-30X ($700) or Yamaha P-125 ($650) for better sound and touch sensitivity.";
        }
        else if (message.includes('microphone') || message.includes('mic')) {
            return "The best microphone depends on your needs. For vocals, the Shure SM58 ($99) is an industry standard dynamic mic, while the Audio-Technica AT2020 ($99) is a great condenser for studio recording. For podcasts, the Blue Yeti ($130) is popular. For higher-end vocal recording, consider the Rode NT1 ($269) or Shure SM7B ($399).";
        }
        else if (message.includes('drum') || message.includes('percussion')) {
            return "For beginners interested in drums, electronic drum kits are often a good starting point as they're quieter and apartment-friendly. The Alesis Nitro Mesh Kit ($379) offers good value. If you prefer acoustic, consider starting with a practice pad and sticks, then perhaps a snare drum before investing in a full kit.";
        }
        else if (message.includes('price') || message.includes('cost') || message.includes('budget')) {
            return "We have instruments at every price point! Entry-level quality instruments typically start around $150-300 for guitars, $400-600 for digital pianos, $300-500 for beginner drum kits, and $100-300 for basic recording equipment. Premium instruments can range from $1000-3000+. What's your budget and what instrument are you interested in?";
        }
        else if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
            return "Hello there! How can I help you today? I can recommend instruments, answer questions about musical equipment, or help you find the perfect gear for your needs.";
        }
        else {
            return "Thanks for your message! I can help with instrument recommendations, answer questions about musical equipment, provide maintenance tips, or offer guidance for beginners. Feel free to ask about specific instruments, brands, or music topics you're interested in.";
        }
    }
    
    // Initialize the chatbot/search if elements exist
    if (chatbotToggle && chatbotWindow) {
        // Show the chatbot after 3 seconds for new visitors, but only on first visit
        if (!localStorage.getItem('chatbotShown')) {
            setTimeout(() => {
                chatbotWindow.style.display = 'flex';
                localStorage.setItem('chatbotShown', 'true');
            }, 3000);
        }
    }
}); 