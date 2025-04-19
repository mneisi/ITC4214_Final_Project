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
    
    // Enhanced theme toggle with local storage and system preference
    const enhanceThemeToggle = () => {
        const themeToggleBtn = document.getElementById('theme-toggle');
        const htmlElement = document.documentElement;
        
        console.log("Theme toggle init:", themeToggleBtn ? "Button found" : "Button not found");
        
        if (!themeToggleBtn || !htmlElement) return;
        
        // Check for saved theme preference or use system preference
        const getInitialTheme = () => {
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme) {
                console.log("Using saved theme preference:", savedTheme);
                return savedTheme;
            }
            
            // Check if user has system dark mode preference
            const systemDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            console.log("Using system preference:", systemDarkMode ? "dark" : "light");
            return systemDarkMode ? 'dark' : 'light';
        };
        
        // Apply theme with transition
        const applyTheme = (theme) => {
            console.log("Applying theme:", theme);
            
            // Add a transition class
            htmlElement.classList.add('theme-transition');
            
            htmlElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
            
            // Update toggle button icon with animation
            const iconElement = themeToggleBtn.querySelector('i');
            if (iconElement) {
                iconElement.style.transform = 'rotate(180deg)';
                
                setTimeout(() => {
                    if (theme === 'dark') {
                        iconElement.className = 'fas fa-sun';
                        themeToggleBtn.setAttribute('title', 'Switch to light mode');
                    } else {
                        iconElement.className = 'fas fa-moon';
                        themeToggleBtn.setAttribute('title', 'Switch to dark mode');
                    }
                    
                    iconElement.style.transform = 'rotate(0)';
                }, 150);
            }
            
            // Remove transition class after theme change
            setTimeout(() => {
                htmlElement.classList.remove('theme-transition');
            }, 500);
        };
        
        // Initialize theme
        applyTheme(getInitialTheme());
        
        // Toggle theme when button is clicked with enhanced animation
        themeToggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log("Theme toggle button clicked");
            
            const currentTheme = htmlElement.getAttribute('data-theme') || 'light';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            console.log("Switching from", currentTheme, "to", newTheme);
            
            // Add click animation
            themeToggleBtn.classList.add('theme-toggle-clicked');
            setTimeout(() => {
                themeToggleBtn.classList.remove('theme-toggle-clicked');
            }, 500);
            
            applyTheme(newTheme);
        });
        
        // Listen for system theme changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
                if (!localStorage.getItem('theme')) {
                    console.log("System theme preference changed:", e.matches ? "dark" : "light");
                    applyTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
    };
    
    enhanceThemeToggle();
    
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
    
    // Product quantity selector with improved animation
    $('.quantity-selector .btn-minus').on('click', function() {
        var input = $(this).siblings('input');
        if (input.length) {
            var value = parseInt(input.val()) || 1;
            if (value > 1) {
                input.val(value - 1).addClass('quantity-changed');
                setTimeout(() => input.removeClass('quantity-changed'), 300);
            }
        }
    });
    
    $('.quantity-selector .btn-plus').on('click', function() {
        var input = $(this).siblings('input');
        if (input.length) {
            var value = parseInt(input.val()) || 1;
            input.val(value + 1).addClass('quantity-changed');
            setTimeout(() => input.removeClass('quantity-changed'), 300);
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
    
    // Enhanced animation on scroll with intersection observer
    const animateOnScroll = function() {
        const elements = document.querySelectorAll('.animate-on-scroll');
        
        if (elements.length > 0 && 'IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animated');
                        // Optionally unobserve after animation
                        // observer.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '0px 0px -100px 0px'
            });
            
            elements.forEach(element => {
                observer.observe(element);
            });
        } else {
            // Fallback for browsers without IntersectionObserver
            elements.forEach(element => {
                element.classList.add('animated');
            });
        }
    };
    
    if (document.querySelectorAll('.animate-on-scroll').length > 0) {
        // Run once on initial load
        document.addEventListener('DOMContentLoaded', animateOnScroll);
    }
    
    // Enhanced hover effects for cards
    const productCards = document.querySelectorAll('.product-card');
    if (productCards.length) {
        productCards.forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.zIndex = '10';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.zIndex = '1';
            });
        });
    }
    
    // Enhance the navbar with scroll behavior
    const enhanceNavbar = () => {
        const navbar = document.querySelector('.navbar');
        if (!navbar) return;
        
        let lastScrollTop = 0;
        
        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            if (scrollTop > 100) {
                navbar.classList.add('navbar-scrolled');
                
                // Hide navbar on scroll down, show on scroll up
                if (scrollTop > lastScrollTop && scrollTop > 200) {
                    navbar.style.transform = 'translateY(-100%)';
                } else {
                    navbar.style.transform = 'translateY(0)';
                }
            } else {
                navbar.classList.remove('navbar-scrolled');
            }
            
            lastScrollTop = scrollTop;
        });
    };
    
    enhanceNavbar();
    
    // Modern toast notifications system
    const toastSystem = {
        container: null,
        
        init() {
            if (this.container) return;
            
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        },
        
        show(message, type = 'info', duration = 3000) {
            this.init();
            
            const toast = document.createElement('div');
            toast.className = `toast toast-${type}`;
            
            const icon = document.createElement('i');
            switch (type) {
                case 'success':
                    icon.className = 'fas fa-check-circle';
                    break;
                case 'error':
                    icon.className = 'fas fa-exclamation-circle';
                    break;
                case 'warning':
                    icon.className = 'fas fa-exclamation-triangle';
                    break;
                default:
                    icon.className = 'fas fa-info-circle';
            }
            
            const text = document.createElement('span');
            text.textContent = message;
            
            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '&times;';
            closeBtn.className = 'toast-close';
            closeBtn.addEventListener('click', () => {
                toast.classList.add('toast-hiding');
                setTimeout(() => toast.remove(), 300);
            });
            
            toast.appendChild(icon);
            toast.appendChild(text);
            toast.appendChild(closeBtn);
            
            this.container.appendChild(toast);
            
            // Animate in
            setTimeout(() => toast.classList.add('toast-visible'), 10);
            
            // Auto dismiss
            if (duration > 0) {
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.classList.add('toast-hiding');
                        setTimeout(() => toast.remove(), 300);
                    }
                }, duration);
            }
            
            return toast;
        },
        
        success(message, duration) {
            return this.show(message, 'success', duration);
        },
        
        error(message, duration) {
            return this.show(message, 'error', duration);
        },
        
        warning(message, duration) {
            return this.show(message, 'warning', duration);
        },
        
        info(message, duration) {
            return this.show(message, 'info', duration);
        }
    };
    
    // Initialize toast system
    document.addEventListener('DOMContentLoaded', () => {
        toastSystem.init();
        
        // Example usage for debugging
        /* 
        setTimeout(() => {
            toastSystem.success('Item added to cart successfully!');
        }, 1000);
        */
    });
    
    // Product image gallery with smooth transitions
    const initializeProductGallery = () => {
        const mainImage = document.getElementById('mainImage');
        const thumbnails = document.querySelectorAll('.thumbnail');
        
        if (!mainImage || !thumbnails.length) return;
        
        thumbnails.forEach(thumb => {
            thumb.addEventListener('click', function() {
                // Add fade transition
                mainImage.style.opacity = '0';
                
                setTimeout(() => {
                    mainImage.src = this.src;
                    mainImage.style.opacity = '1';
                }, 300);
                
                // Remove active class from all thumbnails
                thumbnails.forEach(t => t.classList.remove('active-thumbnail'));
                
                // Add active class to clicked thumbnail
                this.classList.add('active-thumbnail');
            });
        });
    };
    
    initializeProductGallery();
    
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
    
    // Initialize AI Search related functionality
    initAISearch();

    // Initialize newsletter subscription forms
    initNewsletterSubscription();
});

/**
 * Initialize AI Search functionality including voice input
 */
function initAISearch() {
    const searchForm = document.querySelector('form.search-form');
    const searchInput = document.querySelector('.ai-search-input');
    const voiceButton = document.querySelector('.voice-button');
    let recognition;
    let isSearchRecording = false;

    if (!searchForm || !searchInput || !voiceButton) {
        console.log("AI Search elements not found, skipping initialization.");
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            searchInput.value = transcript;
            stopSearchRecording();
            // Automatically submit the search form after getting the transcript
            searchForm.submit(); 
        };

        recognition.onerror = (event) => {
            console.error('Search Speech recognition error:', event.error);
            stopSearchRecording();
            // Optionally show a message to the user
            searchInput.placeholder = "Voice input error. Please try again.";
            setTimeout(() => { searchInput.placeholder = "Search products or ask a question..."; }, 3000);
        };

        recognition.onend = () => {
            if (isSearchRecording) {
                stopSearchRecording();
            }
        };

        // Ensure the event listener calls the correct function
        voiceButton.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent any default button action
            toggleSearchRecording(); // Call the function defined within initAISearch
        });

    } else {
        console.log('Speech recognition not supported for search bar.');
        voiceButton.disabled = true;
        voiceButton.title = 'Voice input not supported';
    }

    function startSearchRecording() {
        if (recognition && !isSearchRecording) {
            try {
                searchInput.value = ''; // Clear input field
                searchInput.placeholder = 'Listening...';
                voiceButton.classList.add('recording');
                recognition.start();
                isSearchRecording = true;
                console.log("Search recording started...");
            } catch (error) {
                console.error('Error starting search speech recognition:', error);
                stopSearchRecording(); // Ensure state is reset
            }
        }
    }

    function stopSearchRecording() {
        if (recognition && isSearchRecording) {
            isSearchRecording = false;
            searchInput.placeholder = 'Search products or ask a question...';
            voiceButton.classList.remove('recording');
            try {
                recognition.stop();
                console.log("Search recording stopped.");
            } catch (error) {
                 if (error.name !== 'InvalidStateError') {
                    console.error('Error stopping search speech recognition:', error);
                }
            }
        }
    }

    function toggleSearchRecording() {
        if (isSearchRecording) {
            stopSearchRecording();
        } else {
            startSearchRecording();
        }
    }
}

/**
 * Initialize Newsletter Subscription
 * Handles AJAX form submission for newsletter subscription
 */
function initNewsletterSubscription() {
    const newsletterForms = document.querySelectorAll('#newsletterForm, #footerNewsletterForm');
        
    newsletterForms.forEach(form => {
        if (!form) return;
        
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(this);
            const messageDiv = this.id === 'newsletterForm' ? 
                document.getElementById('newsletter-message') : 
                document.getElementById('footer-newsletter-message');
            
            // Disable submit button during submission
            const submitButton = this.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Subscribing...';
            
            // Send AJAX request
            fetch(this.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': getCsrfToken() // Ensure CSRF token is sent
                }
            })
            .then(response => response.json())
            .then(data => {
                // Show success or error message
                if (data.success) {
                    messageDiv.innerHTML = `<div class="alert alert-success mt-3">${data.message || 'Thank you for subscribing!'}</div>`;
                    this.reset();
                } else {
                    messageDiv.innerHTML = `<div class="alert alert-warning mt-3">${data.message || 'An error occurred. Please try again.'}</div>`;
                }
                
                // Re-enable submit button
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
                
                // Hide message after 5 seconds
                setTimeout(() => {
                    messageDiv.innerHTML = '';
                }, 5000);
            })
            .catch(error => {
                console.error('Error:', error);
                messageDiv.innerHTML = '<div class="alert alert-danger mt-3">An error occurred. Please try again later.</div>';
                
                // Re-enable submit button
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
                
                // Hide message after 5 seconds
                setTimeout(() => {
                    messageDiv.innerHTML = '';
                }, 5000);
            });
        });
    });
}

// Helper function to get CSRF token (can be shared or duplicated)
function getCsrfToken() {
    const name = 'csrftoken';
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
} 