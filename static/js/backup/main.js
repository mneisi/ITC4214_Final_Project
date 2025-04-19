$(document).ready(function() {
    // Initialize Bootstrap tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    });
    
    // Navbar active link
    const currentLocation = location.pathname;
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentLocation) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    // Product quantity selector
    $('.quantity-selector .btn-minus').on('click', function() {
        var input = $(this).siblings('input');
        var value = parseInt(input.val());
        if (value > 1) {
            input.val(value - 1);
        }
    });
    
    $('.quantity-selector .btn-plus').on('click', function() {
        var input = $(this).siblings('input');
        var value = parseInt(input.val());
        input.val(value + 1);
    });
    
    // Back to top button
    $(window).scroll(function() {
        if ($(this).scrollTop() > 300) {
            $('.back-to-top').fadeIn('slow');
        } else {
            $('.back-to-top').fadeOut('slow');
        }
    });
    
    $('.back-to-top').click(function() {
        $('html, body').animate({scrollTop: 0}, 800);
        return false;
    });
    
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
    
    window.addEventListener('scroll', animateOnScroll);
    animateOnScroll(); // Run once on load
    
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
}); 