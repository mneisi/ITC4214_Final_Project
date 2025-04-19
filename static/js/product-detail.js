document.addEventListener('DOMContentLoaded', function() {
    console.log("Product detail script loaded");
    
    // Product image gallery
    initImageGallery();
    
    // Quantity selector
    initQuantitySelector();
    
    // Review submission
    initReviewForm();
    
    // Product tabs - using Bootstrap's tab functionality
    initProductTabs();
    
    // Related products slider (if exists)
    initRelatedProducts();
    
    // AJAX add to cart functionality
    initAjaxAddToCart();
});

/**
 * Initialize the product image gallery with thumbnails
 */
function initImageGallery() {
    const mainImage = document.getElementById('main-product-image');
    const thumbnails = document.querySelectorAll('.product-thumbnail');
    
    console.log("Gallery init:", mainImage ? "Main image found" : "Main image not found", 
                thumbnails.length + " thumbnails found");
    
    if (!mainImage || thumbnails.length === 0) return;
    
    // Set first thumbnail as active by default if none is already active
    if (!document.querySelector('.product-thumbnail.active-thumbnail')) {
        thumbnails[0].classList.add('active-thumbnail');
    }
    
    // Add click event to each thumbnail
    thumbnails.forEach(thumb => {
        thumb.addEventListener('click', function() {
            // Update main image
            const newSrc = this.getAttribute('data-full-img');
            console.log("Thumbnail clicked, new src:", newSrc);
            
            if (!newSrc) {
                console.warn("No data-full-img attribute found on thumbnail");
                return;
            }
            
            // Add fade transition
            mainImage.classList.add('fade-out');
            
            setTimeout(() => {
                mainImage.src = newSrc;
                mainImage.classList.remove('fade-out');
                mainImage.classList.add('fade-in');
                
                setTimeout(() => {
                    mainImage.classList.remove('fade-in');
                }, 300);
            }, 200);
            
            // Update active thumbnail
            thumbnails.forEach(t => t.classList.remove('active-thumbnail'));
            this.classList.add('active-thumbnail');
        });
    });
    
    // Image zoom on hover
    if (mainImage) {
        const imageContainer = mainImage.parentElement;
        
        mainImage.addEventListener('mousemove', function(e) {
            // Only enable zoom on larger screens
            if (window.innerWidth < 768) return;
            
            const { left, top, width, height } = this.getBoundingClientRect();
            const x = (e.clientX - left) / width;
            const y = (e.clientY - top) / height;
            
            this.style.transformOrigin = `${x * 100}% ${y * 100}%`;
            this.style.transform = 'scale(1.5)';
        });
        
        mainImage.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    }
}

/**
 * Initialize the quantity selector with increment/decrement buttons
 */
function initQuantitySelector() {
    const quantityInput = document.getElementById('quantity');
    const decrementBtn = document.querySelector('.quantity-btn.decrement');
    const incrementBtn = document.querySelector('.quantity-btn.increment');
    
    console.log("Quantity selector init:", 
                quantityInput ? "Input found" : "Input not found", 
                decrementBtn ? "Decrement button found" : "Decrement button not found",
                incrementBtn ? "Increment button found" : "Increment button not found");
    
    if (!quantityInput || !decrementBtn || !incrementBtn) return;
    
    // Ensure minimum quantity is 1
    quantityInput.addEventListener('change', function() {
        if (this.value < 1) this.value = 1;
    });
    
    // Decrement button
    decrementBtn.addEventListener('click', function() {
        if (quantityInput.value > 1) {
            quantityInput.value = parseInt(quantityInput.value) - 1;
            // Trigger change event to update any listeners
            quantityInput.dispatchEvent(new Event('change'));
        }
    });
    
    // Increment button
    incrementBtn.addEventListener('click', function() {
        quantityInput.value = parseInt(quantityInput.value) + 1;
        // Trigger change event to update any listeners
        quantityInput.dispatchEvent(new Event('change'));
    });
}

/**
 * Initialize the review form with star rating system
 */
function initReviewForm() {
    const reviewForm = document.getElementById('review-form');
    const ratingStars = document.querySelectorAll('.rating-star');
    const ratingInput = document.getElementById('rating');
    
    console.log("Review form init:", 
                reviewForm ? "Form found" : "Form not found", 
                ratingStars.length + " stars found",
                ratingInput ? "Rating input found" : "Rating input not found");
    
    if (!reviewForm || !ratingStars.length || !ratingInput) return;
    
    // Star rating system
    ratingStars.forEach(star => {
        star.addEventListener('click', function() {
            const rating = this.getAttribute('data-rating');
            console.log("Star clicked, rating:", rating);
            
            // Update hidden input with rating value
            ratingInput.value = rating;
            
            // Update stars visual state
            ratingStars.forEach(s => {
                if (s.getAttribute('data-rating') <= rating) {
                    s.classList.remove('far');
                    s.classList.add('fas');
                } else {
                    s.classList.remove('fas');
                    s.classList.add('far');
                }
            });
        });
        
        // Hover effects
        star.addEventListener('mouseenter', function() {
            const rating = this.getAttribute('data-rating');
            
            ratingStars.forEach(s => {
                if (s.getAttribute('data-rating') <= rating) {
                    s.classList.remove('far');
                    s.classList.add('fas');
                }
            });
        });
        
        star.addEventListener('mouseleave', function() {
            const selectedRating = ratingInput.value || 0;
            
            ratingStars.forEach(s => {
                const starRating = s.getAttribute('data-rating');
                if (starRating <= selectedRating) {
                    s.classList.remove('far');
                    s.classList.add('fas');
                } else {
                    s.classList.remove('fas');
                    s.classList.add('far');
                }
            });
        });
    });
    
    // Form submission with validation
    if (reviewForm) {
        reviewForm.addEventListener('submit', function(e) {
            if (ratingInput.value === '0') {
                e.preventDefault();
                console.log("Form submission blocked: no rating selected");
                
                // Show error message
                const errorMsg = document.getElementById('rating-error') || document.createElement('div');
                errorMsg.id = 'rating-error';
                errorMsg.className = 'text-danger mt-2';
                errorMsg.textContent = 'Please select a rating';
                
                // Add error message if not already present
                if (!document.getElementById('rating-error')) {
                    document.querySelector('.rating-container').appendChild(errorMsg);
                }
                
                // Highlight rating stars in red
                document.querySelector('.rating-container').classList.add('error');
                
                // Remove error after 3 seconds
                setTimeout(() => {
                    document.querySelector('.rating-container').classList.remove('error');
                    if (errorMsg.parentNode) {
                        errorMsg.parentNode.removeChild(errorMsg);
                    }
                }, 3000);
            }
        });
    }
}

/**
 * Initialize product tabs using Bootstrap's built-in tab functionality
 */
function initProductTabs() {
    // Bootstrap 5 handles the tab functionality automatically through data attributes
    // But we'll add some custom behavior

    // Bootstrap's tab event listeners
    const tabElements = document.querySelectorAll('button[data-bs-toggle="tab"]');
    console.log("Product tabs init:", tabElements.length + " tabs found");
    
    if (tabElements.length === 0) return;
    
    // Add event listeners for tab changes
    tabElements.forEach(tab => {
        tab.addEventListener('shown.bs.tab', function(event) {
            const targetId = event.target.getAttribute('data-bs-target').replace('#', '');
            console.log("Tab shown:", targetId);
            
            // Special handling for recommended products tab
            if (targetId === 'recommended') {
                loadRecommendedProducts();
            }
        });
    });
}

/**
 * Load recommended products content
 */
function loadRecommendedProducts(url) {
    const recommendedContainer = document.getElementById('recommended-products');
    const relatedProductsTab = document.getElementById('recommended');
    
    if (!recommendedContainer || !relatedProductsTab) {
        console.warn("Recommended products container or tab not found");
        return;
    }
    
    console.log("Loading recommended products from:", url);
    
    if (!url) {
        console.warn("No url provided for recommended products");
        return;
    }
    
    // Check if already loaded
    if (recommendedContainer.getAttribute('data-loaded') === 'true') {
        console.log("Recommended products already loaded");
        return;
    }
    
    // Show loading spinner
    recommendedContainer.innerHTML = `
        <div class="col-12 text-center">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    `;
    
    // Load recommended products via AJAX
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log("Recommended products loaded:", data);
            
            let html = '';
            if (!data.products || data.products.length === 0) {
                html = '<div class="col-12"><p>No recommended products found.</p></div>';
            } else {
                for (const product of data.products) {
                    html += generateProductCard(product);
                }
            }
            
            recommendedContainer.innerHTML = html;
            recommendedContainer.setAttribute('data-loaded', 'true');
            
            // Initialize product card hover effects
            initProductCardEffects();
        })
        .catch(error => {
            console.error('Error loading recommended products:', error);
            recommendedContainer.innerHTML = '<div class="col-12"><p class="text-center text-muted">Unable to load recommended products</p></div>';
        });
}

/**
 * Generate HTML for a product card
 */
function generateProductCard(product) {
    let html = `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card product-card h-100">
                <div class="card-img-container">
                    <img src="${product.image || '/static/images/placeholder.jpg'}" alt="${product.name}">
                </div>
                <div class="card-body">
                    <h5 class="product-title">${product.name}</h5>
                    <div class="rating mb-2">`;
    
    // Generate stars for rating
    for (let i = 1; i <= 5; i++) {
        if (i <= Math.floor(product.avg_rating)) {
            html += '<i class="fas fa-star"></i>';
        } else if (i <= Math.ceil(product.avg_rating) && product.avg_rating % 1 !== 0) {
            html += '<i class="fas fa-star-half-alt"></i>';
        } else {
            html += '<i class="far fa-star"></i>';
        }
    }
    
    html += `</div>`;
    
    // Price display
    if (product.sale_price) {
        html += `
            <p class="mb-2">
                <span class="text-decoration-line-through text-muted">$${product.price}</span>
                <span class="product-price">$${product.sale_price}</span>
            </p>`;
    } else {
        html += `<p class="product-price mb-2">$${product.price}</p>`;
    }
    
    html += `
                    <div class="d-flex justify-content-between align-items-center">
                        <a href="/store/product/${product.slug}/" class="btn btn-sm btn-primary">View Details</a>
                        <button type="button" class="btn btn-sm btn-outline">
                            <i class="fas fa-cart-plus"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>`;
    
    return html;
}

/**
 * Initialize hover effects for product cards
 */
function initProductCardEffects() {
    const productCards = document.querySelectorAll('.product-card');
    console.log("Product card effects init:", productCards.length + " cards found");
    
    productCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.classList.add('hover');
        });
        
        card.addEventListener('mouseleave', function() {
            this.classList.remove('hover');
        });
    });
}

/**
 * Initialize related products section
 */
function initRelatedProducts() {
    console.log("Related products init");
    // Load recommended products when tab is clicked
    const recommendedTab = document.getElementById('recommended-tab');
    if (recommendedTab) {
        recommendedTab.addEventListener('click', function() {
            const recommendedContent = document.getElementById('recommended');
            if (recommendedContent && recommendedContent.dataset.url) {
                if (recommendedContent.getAttribute('data-loaded') !== 'true') {
                    loadRecommendedProducts(recommendedContent.dataset.url);
                    recommendedContent.setAttribute('data-loaded', 'true');
                }
            }
        });
    }
}

/**
 * Initialize AJAX Add to Cart functionality
 */
function initAjaxAddToCart() {
    const addToCartForm = document.querySelector('form[action*="add_to_cart"]');
    
    console.log("AJAX Add to Cart init:", addToCartForm ? "Form found" : "Form not found");
    
    if (!addToCartForm) return;
    
    addToCartForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const productId = addToCartForm.action.split('/').pop();
        const quantityInput = document.getElementById('quantity');
        const quantity = quantityInput ? quantityInput.value : 1;
        const submitBtn = addToCartForm.querySelector('button[type="submit"]');
        
        // Show loading state
        if (submitBtn) {
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Adding...';
            submitBtn.disabled = true;
        }
        
        // Create form data
        const formData = new FormData();
        formData.append('quantity', quantity);
        formData.append('csrfmiddlewaretoken', document.querySelector('[name=csrfmiddlewaretoken]').value);
        
        // Send AJAX request
        fetch(addToCartForm.action, {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Update cart count in navbar
                const cartCountBadge = document.getElementById('cart-count');
                if (cartCountBadge) {
                    cartCountBadge.textContent = data.cart_count;
                    cartCountBadge.classList.remove('d-none');
                }
                
                // Show success toast
                if (typeof toastSystem !== 'undefined') {
                    toastSystem.success('Item added to your cart!');
                }
                
                // Add animation to the cart icon
                const cartIcon = document.querySelector('.nav-link i.fa-shopping-cart');
                if (cartIcon) {
                    cartIcon.classList.add('cart-bounce');
                    setTimeout(() => {
                        cartIcon.classList.remove('cart-bounce');
                    }, 1000);
                }
            } else {
                // Show error message
                if (typeof toastSystem !== 'undefined') {
                    toastSystem.error(data.message || 'Error adding item to cart');
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
            if (typeof toastSystem !== 'undefined') {
                toastSystem.error('An error occurred. Please try again.');
            }
        })
        .finally(() => {
            // Restore button state
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-cart-plus me-2"></i>Add to Cart';
                submitBtn.disabled = false;
            }
        });
    });
} 