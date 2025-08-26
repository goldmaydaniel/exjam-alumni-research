// ExJAM Registration Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functionality
    initSmoothScrolling();
    initScrollEffects();
    initFormEnhancements();
    initAnimations();
    initMobileMenu();
});

// Smooth scrolling for navigation links
function initSmoothScrolling() {
    const navLinks = document.querySelectorAll('a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = targetSection.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Scroll effects for header and sections
function initScrollEffects() {
    const header = document.querySelector('.header');
    let lastScrollTop = 0;
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Header background effect
        if (scrollTop > 100) {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
            header.style.backdropFilter = 'blur(10px)';
        } else {
            header.style.background = 'var(--white)';
            header.style.backdropFilter = 'none';
        }
        
        // Hide/show header on scroll
        if (scrollTop > lastScrollTop && scrollTop > 200) {
            header.style.transform = 'translateY(-100%)';
        } else {
            header.style.transform = 'translateY(0)';
        }
        
        lastScrollTop = scrollTop;
    });
}

// Form enhancements
function initFormEnhancements() {
    const iframe = document.querySelector('.google-form-embed iframe');
    
    if (iframe) {
        // Add loading state
        iframe.addEventListener('load', function() {
            this.style.opacity = '1';
            this.style.transform = 'scale(1)';
        });
        
        // Initial state
        iframe.style.opacity = '0';
        iframe.style.transform = 'scale(0.95)';
        iframe.style.transition = 'all 0.3s ease';
    }
    
    // Form submission tracking
    window.addEventListener('message', function(event) {
        if (event.origin === 'https://docs.google.com') {
            if (event.data && event.data.type === 'form-submit') {
                showSuccessMessage();
            }
        }
    });
}

// Success message after form submission
function showSuccessMessage() {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.innerHTML = `
        <div class="success-content">
            <i class="fas fa-check-circle"></i>
            <h3>Registration Submitted Successfully!</h3>
            <p>Thank you for registering for the ExJAM PG Conference. You will receive a confirmation email shortly.</p>
            <button onclick="this.parentElement.parentElement.remove()">Close</button>
        </div>
    `;
    
    document.body.appendChild(successDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (successDiv.parentElement) {
            successDiv.remove();
        }
    }, 5000);
}

// Scroll animations
function initAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animateElements = document.querySelectorAll('.feature, .step, .expectation-card, .contact-item');
    animateElements.forEach(el => observer.observe(el));
}

// Mobile menu functionality
function initMobileMenu() {
    const nav = document.querySelector('.nav');
    const header = document.querySelector('.header-content');
    
    // Create mobile menu button
    const mobileMenuBtn = document.createElement('button');
    mobileMenuBtn.className = 'mobile-menu-btn';
    mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
    mobileMenuBtn.style.display = 'none';
    
    header.appendChild(mobileMenuBtn);
    
    // Mobile menu functionality
    mobileMenuBtn.addEventListener('click', function() {
        nav.classList.toggle('nav-open');
        this.innerHTML = nav.classList.contains('nav-open') ? 
            '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!nav.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
            nav.classList.remove('nav-open');
            mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
        }
    });
    
    // Show/hide mobile menu button based on screen size
    function checkScreenSize() {
        if (window.innerWidth <= 768) {
            mobileMenuBtn.style.display = 'block';
            nav.classList.add('nav-mobile');
        } else {
            mobileMenuBtn.style.display = 'none';
            nav.classList.remove('nav-mobile', 'nav-open');
        }
    }
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
}

// Add CSS for mobile menu and animations
const additionalCSS = `
    /* Mobile Menu Styles */
    .mobile-menu-btn {
        background: none;
        border: none;
        font-size: 1.5rem;
        color: var(--exjam-blue);
        cursor: pointer;
        padding: 0.5rem;
        display: none;
    }
    
    .nav-mobile {
        position: fixed;
        top: 100%;
        left: 0;
        right: 0;
        background: var(--white);
        flex-direction: column;
        padding: 2rem;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        transform: translateY(-100%);
        transition: transform 0.3s ease;
        z-index: 999;
    }
    
    .nav-mobile.nav-open {
        transform: translateY(0);
    }
    
    .nav-mobile a {
        padding: 1rem 0;
        border-bottom: 1px solid var(--gray-200);
        width: 100%;
        text-align: center;
    }
    
    .nav-mobile a:last-child {
        border-bottom: none;
    }
    
    /* Animation Classes */
    .animate-in {
        animation: slideInUp 0.6s ease-out forwards;
    }
    
    @keyframes slideInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    /* Success Message Styles */
    .success-message {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
    }
    
    .success-content {
        background: var(--white);
        padding: 3rem;
        border-radius: 20px;
        text-align: center;
        max-width: 500px;
        margin: 2rem;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        animation: scaleIn 0.3s ease;
    }
    
    .success-content i {
        font-size: 4rem;
        color: #10b981;
        margin-bottom: 1rem;
    }
    
    .success-content h3 {
        color: var(--exjam-dark);
        margin-bottom: 1rem;
    }
    
    .success-content p {
        color: var(--gray-600);
        margin-bottom: 2rem;
    }
    
    .success-content button {
        background: var(--exjam-blue);
        color: var(--white);
        border: none;
        padding: 0.75rem 2rem;
        border-radius: 50px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.3s ease;
    }
    
    .success-content button:hover {
        background: var(--exjam-light-blue);
        transform: translateY(-2px);
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes scaleIn {
        from { transform: scale(0.8); }
        to { transform: scale(1); }
    }
    
    /* Enhanced hover effects */
    .feature:hover,
    .expectation-card:hover,
    .step:hover {
        transform: translateY(-5px);
        box-shadow: 0 15px 30px rgba(0, 0, 0, 0.15);
    }
    
    /* Loading animation for iframe */
    .google-form-embed {
        position: relative;
    }
    
    .google-form-embed::before {
        content: 'Loading registration form...';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: var(--gray-600);
        font-style: italic;
        z-index: 1;
    }
    
    .google-form-embed iframe {
        position: relative;
        z-index: 2;
    }
`;

// Inject additional CSS
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalCSS;
document.head.appendChild(styleSheet);

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Performance optimization
const optimizedScrollHandler = debounce(function() {
    // Scroll-based animations and effects
}, 16); // ~60fps

window.addEventListener('scroll', optimizedScrollHandler);

// Analytics tracking (if needed)
function trackEvent(eventName, eventData = {}) {
    // Google Analytics or other tracking
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, eventData);
    }
    
    // Custom tracking
    console.log('Event tracked:', eventName, eventData);
}

// Track form interactions
document.addEventListener('click', function(e) {
    if (e.target.closest('.cta-button')) {
        trackEvent('registration_cta_clicked');
    }
    
    if (e.target.closest('.google-form-embed')) {
        trackEvent('form_interaction_started');
    }
});

// Accessibility improvements
document.addEventListener('keydown', function(e) {
    // Close mobile menu with Escape key
    if (e.key === 'Escape') {
        const nav = document.querySelector('.nav');
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        
        if (nav.classList.contains('nav-open')) {
            nav.classList.remove('nav-open');
            mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
        }
    }
});

// Service Worker registration for PWA capabilities
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registration successful');
            })
            .catch(function(err) {
                console.log('ServiceWorker registration failed');
            });
    });
}
