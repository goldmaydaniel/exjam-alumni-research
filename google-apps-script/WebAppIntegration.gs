/**
 * Web App Integration for ExJAM Registration System
 * 
 * This module handles serving the HTML registration page and web app functionality
 */

/**
 * Main web app function - serves the HTML registration page
 */
function doGet(e) {
  try {
    // Get the HTML content
    const htmlContent = getRegistrationPageHTML();
    
    // Return the HTML page
    return HtmlService.createHtmlOutput(htmlContent)
      .setTitle('ExJAM PG Conference - Registration')
      .setFaviconUrl('https://www.google.com/images/favicon.ico')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
      .addMetaTag('description', 'Register for the ExJAM President General\'s Conference - Maiden Flight')
      .addMetaTag('keywords', 'ExJAM, Conference, Registration, Alumni, Nigeria')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      
  } catch (error) {
    console.error('Error serving registration page: ' + error);
    return HtmlService.createHtmlOutput(`
      <html>
        <head>
          <title>Error - ExJAM Registration</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .error { color: #d32f2f; background: #ffebee; padding: 20px; border-radius: 10px; }
          </style>
        </head>
        <body>
          <div class="error">
            <h1>⚠️ Service Temporarily Unavailable</h1>
            <p>We're experiencing technical difficulties. Please try again later.</p>
            <p>Error: ${error.toString()}</p>
          </div>
        </body>
      </html>
    `);
  }
}

/**
 * Get the complete HTML registration page content
 */
function getRegistrationPageHTML() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ExJAM PG Conference - Maiden Flight | Registration</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        /* Reset and Base Styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8fafc;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
        }

        /* ExJAM Brand Colors */
        :root {
            --exjam-blue: #1e3c72;
            --exjam-light-blue: #2a5298;
            --exjam-gold: #ffd700;
            --exjam-dark: #0f1f3d;
            --exjam-light: #e8f2ff;
            --white: #ffffff;
            --gray-100: #f8fafc;
            --gray-200: #e2e8f0;
            --gray-300: #cbd5e1;
            --gray-600: #475569;
            --gray-800: #1e293b;
        }

        /* Header */
        .header {
            background: var(--white);
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 1000;
        }

        .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem 0;
        }

        .logo {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--exjam-blue);
        }

        .logo i {
            font-size: 2rem;
            color: var(--exjam-gold);
        }

        .nav {
            display: flex;
            gap: 2rem;
        }

        .nav a {
            text-decoration: none;
            color: var(--gray-600);
            font-weight: 500;
            transition: color 0.3s ease;
        }

        .nav a:hover {
            color: var(--exjam-blue);
        }

        /* Hero Section */
        .hero {
            background: linear-gradient(135deg, var(--exjam-blue) 0%, var(--exjam-light-blue) 100%);
            color: var(--white);
            padding: 120px 0 80px;
            position: relative;
            overflow: hidden;
        }

        .hero-content {
            position: relative;
            z-index: 2;
            text-align: center;
            max-width: 800px;
            margin: 0 auto;
        }

        .hero-title {
            font-size: 3.5rem;
            font-weight: 700;
            margin-bottom: 1.5rem;
            line-height: 1.2;
        }

        .highlight {
            color: var(--exjam-gold);
            display: block;
            font-size: 2.5rem;
            margin-top: 0.5rem;
        }

        .hero-subtitle {
            font-size: 1.25rem;
            margin-bottom: 2rem;
            opacity: 0.9;
            line-height: 1.6;
        }

        .hero-details {
            display: flex;
            justify-content: center;
            gap: 2rem;
            margin-bottom: 3rem;
            flex-wrap: wrap;
        }

        .detail-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: rgba(255, 255, 255, 0.1);
            padding: 0.75rem 1.5rem;
            border-radius: 50px;
            backdrop-filter: blur(10px);
        }

        .detail-item i {
            color: var(--exjam-gold);
            font-size: 1.2rem;
        }

        .cta-button {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            background: var(--exjam-gold);
            color: var(--exjam-dark);
            padding: 1rem 2rem;
            border-radius: 50px;
            text-decoration: none;
            font-weight: 600;
            font-size: 1.1rem;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
        }

        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(255, 215, 0, 0.4);
        }

        /* Section Styles */
        .section-title {
            font-size: 2.5rem;
            font-weight: 700;
            text-align: center;
            margin-bottom: 3rem;
            color: var(--exjam-dark);
        }

        /* About Section */
        .about {
            padding: 80px 0;
            background: var(--white);
        }

        .about-text {
            max-width: 800px;
            margin: 0 auto;
            text-align: center;
        }

        .about-text p {
            font-size: 1.1rem;
            margin-bottom: 3rem;
            color: var(--gray-600);
            line-height: 1.8;
        }

        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 2rem;
            margin-top: 3rem;
        }

        .feature {
            text-align: center;
            padding: 2rem;
            background: var(--gray-100);
            border-radius: 15px;
            transition: transform 0.3s ease;
        }

        .feature:hover {
            transform: translateY(-5px);
        }

        .feature i {
            font-size: 2.5rem;
            color: var(--exjam-blue);
            margin-bottom: 1rem;
        }

        .feature h3 {
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
            color: var(--exjam-dark);
        }

        .feature p {
            color: var(--gray-600);
        }

        /* Registration Section */
        .registration {
            padding: 80px 0;
            background: var(--gray-100);
        }

        .registration-content {
            display: grid;
            grid-template-columns: 1fr 2fr;
            gap: 3rem;
            align-items: start;
        }

        .registration-info h3 {
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 2rem;
            color: var(--exjam-dark);
        }

        .process-steps {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
        }

        .step {
            display: flex;
            align-items: flex-start;
            gap: 1rem;
            padding: 1.5rem;
            background: var(--white);
            border-radius: 15px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .step-number {
            background: var(--exjam-blue);
            color: var(--white);
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            flex-shrink: 0;
        }

        .step-content h4 {
            font-size: 1.1rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
            color: var(--exjam-dark);
        }

        .step-content p {
            color: var(--gray-600);
            font-size: 0.95rem;
        }

        .registration-form-container {
            background: var(--white);
            border-radius: 20px;
            padding: 2rem;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }

        .form-header {
            text-align: center;
            margin-bottom: 2rem;
        }

        .form-header h3 {
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
            color: var(--exjam-dark);
        }

        .form-header p {
            color: var(--gray-600);
        }

        .google-form-embed {
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .form-footer {
            margin-top: 2rem;
            padding-top: 2rem;
            border-top: 1px solid var(--gray-200);
        }

        .form-footer p {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: var(--gray-600);
            margin-bottom: 0.5rem;
            font-size: 0.9rem;
        }

        .form-footer i {
            color: var(--exjam-blue);
        }

        /* Expectations Section */
        .expectations {
            padding: 80px 0;
            background: var(--white);
        }

        .expectations-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
        }

        .expectation-card {
            background: var(--gray-100);
            padding: 2rem;
            border-radius: 15px;
            text-align: center;
            transition: all 0.3s ease;
            border: 2px solid transparent;
        }

        .expectation-card:hover {
            border-color: var(--exjam-blue);
            transform: translateY(-5px);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }

        .expectation-card i {
            font-size: 2.5rem;
            color: var(--exjam-blue);
            margin-bottom: 1rem;
        }

        .expectation-card h3 {
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 1rem;
            color: var(--exjam-dark);
        }

        .expectation-card p {
            color: var(--gray-600);
            line-height: 1.6;
        }

        /* Contact Section */
        .contact {
            padding: 80px 0;
            background: var(--gray-100);
        }

        .contact-content {
            max-width: 600px;
            margin: 0 auto;
        }

        .contact-info {
            display: grid;
            gap: 2rem;
        }

        .contact-item {
            display: flex;
            align-items: center;
            gap: 1rem;
            background: var(--white);
            padding: 2rem;
            border-radius: 15px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .contact-item i {
            font-size: 1.5rem;
            color: var(--exjam-blue);
            width: 40px;
            text-align: center;
        }

        .contact-item h4 {
            font-size: 1.1rem;
            font-weight: 600;
            margin-bottom: 0.25rem;
            color: var(--exjam-dark);
        }

        .contact-item p {
            color: var(--gray-600);
        }

        /* Footer */
        .footer {
            background: var(--exjam-dark);
            color: var(--white);
            padding: 3rem 0 1rem;
        }

        .footer-content {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 2rem;
            margin-bottom: 2rem;
        }

        .footer-section h4 {
            font-size: 1.1rem;
            font-weight: 600;
            margin-bottom: 1rem;
            color: var(--exjam-gold);
        }

        .footer-section a {
            color: var(--gray-300);
            text-decoration: none;
            display: block;
            margin-bottom: 0.5rem;
            transition: color 0.3s ease;
        }

        .footer-section a:hover {
            color: var(--exjam-gold);
        }

        .footer-section p {
            color: var(--gray-300);
            margin-bottom: 0.5rem;
        }

        .footer-bottom {
            text-align: center;
            padding-top: 2rem;
            border-top: 1px solid var(--gray-600);
            color: var(--gray-300);
        }

        /* Responsive Design */
        @media (max-width: 768px) {
            .hero-title {
                font-size: 2.5rem;
            }
            
            .highlight {
                font-size: 2rem;
            }
            
            .hero-details {
                flex-direction: column;
                align-items: center;
            }
            
            .registration-content {
                grid-template-columns: 1fr;
            }
            
            .nav {
                display: none;
            }
            
            .section-title {
                font-size: 2rem;
            }
            
            .features {
                grid-template-columns: 1fr;
            }
            
            .expectations-grid {
                grid-template-columns: 1fr;
            }
        }

        @media (max-width: 480px) {
            .hero-title {
                font-size: 2rem;
            }
            
            .highlight {
                font-size: 1.5rem;
            }
            
            .hero-subtitle {
                font-size: 1rem;
            }
            
            .container {
                padding: 0 15px;
            }
            
            .registration-form-container {
                padding: 1rem;
            }
        }

        /* Smooth Scrolling */
        html {
            scroll-behavior: smooth;
        }

        /* Loading Animation */
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .hero-content,
        .about-text,
        .registration-content,
        .expectations-grid,
        .contact-info {
            animation: fadeIn 1s ease-out;
        }

        /* Button Hover Effects */
        .cta-button,
        .step,
        .expectation-card,
        .contact-item {
            transition: all 0.3s ease;
        }

        /* Custom Scrollbar */
        ::-webkit-scrollbar {
            width: 8px;
        }

        ::-webkit-scrollbar-track {
            background: var(--gray-100);
        }

        ::-webkit-scrollbar-thumb {
            background: var(--exjam-blue);
            border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
            background: var(--exjam-light-blue);
        }
    </style>
</head>
<body>
    <!-- Header -->
    <header class="header">
        <div class="container">
            <div class="header-content">
                <div class="logo">
                    <i class="fas fa-plane-departure"></i>
                    <span>ExJAM</span>
                </div>
                <nav class="nav">
                    <a href="#about">About</a>
                    <a href="#registration">Register</a>
                    <a href="#contact">Contact</a>
                </nav>
            </div>
        </div>
    </header>

    <!-- Hero Section -->
    <section class="hero">
        <div class="container">
            <div class="hero-content">
                <h1 class="hero-title">
                    ExJAM President General's Conference
                    <span class="highlight">Maiden Flight</span>
                </h1>
                <p class="hero-subtitle">
                    A historic gathering of ExJAM alumni, leaders, and stakeholders to shape the future of our association
                </p>
                <div class="hero-details">
                    <div class="detail-item">
                        <i class="fas fa-calendar-alt"></i>
                        <span>November 28-30, 2025</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>NAF Conference Centre, FCT, ABUJA</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-bullseye"></i>
                        <span>Theme: "Strive to Excel"</span>
                    </div>
                </div>
                <a href="#registration" class="cta-button">
                    <i class="fas fa-user-plus"></i>
                    Register Now
                </a>
            </div>
        </div>
    </section>

    <!-- About Section -->
    <section id="about" class="about">
        <div class="container">
            <h2 class="section-title">About the Conference</h2>
            <div class="about-content">
                <div class="about-text">
                    <p>
                        This groundbreaking event marks a new milestone in the history of the ExJAM Association. 
                        For the first time ever, we are bringing together our members, leaders, and stakeholders 
                        to share ideas, build relationships, and shape the future of our association.
                    </p>
                    <div class="features">
                        <div class="feature">
                            <i class="fas fa-handshake"></i>
                            <h3>Networking</h3>
                            <p>Connect with fellow alumni and industry leaders</p>
                        </div>
                        <div class="feature">
                            <i class="fas fa-graduation-cap"></i>
                            <h3>Leadership</h3>
                            <p>Develop leadership skills and strategic thinking</p>
                        </div>
                        <div class="feature">
                            <i class="fas fa-users"></i>
                            <h3>Community</h3>
                            <p>Strengthen the ExJAM alumni community</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Registration Section -->
    <section id="registration" class="registration">
        <div class="container">
            <h2 class="section-title">Conference Registration</h2>
            <div class="registration-content">
                <div class="registration-info">
                    <h3>Registration Process</h3>
                    <div class="process-steps">
                        <div class="step">
                            <div class="step-number">1</div>
                            <div class="step-content">
                                <h4>Complete Form</h4>
                                <p>Fill out the registration form with your details</p>
                            </div>
                        </div>
                        <div class="step">
                            <div class="step-number">2</div>
                            <div class="step-content">
                                <h4>Upload Photo</h4>
                                <p>Add your photo for the conference badge</p>
                            </div>
                        </div>
                        <div class="step">
                            <div class="step-number">3</div>
                            <div class="step-content">
                                <h4>Get Confirmation</h4>
                                <p>Receive email with registration ID and details</p>
                            </div>
                        </div>
                        <div class="step">
                            <div class="step-number">4</div>
                            <div class="step-content">
                                <h4>Badge Generated</h4>
                                <p>Your professional badge will be created automatically</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="registration-form-container">
                    <div class="form-header">
                        <h3>Registration Form</h3>
                        <p>Please fill out all required fields accurately</p>
                    </div>
                    
                    <!-- Google Form Embed -->
                    <div class="google-form-embed">
                        <iframe 
                            src="https://docs.google.com/forms/d/e/1FAIpQLSdMD3fWgkNmujE9gkJTAVdLl9K2Ir9lW7DPmzSJMkGRqGzq0g/viewform?embedded=true" 
                            width="100%" 
                            height="800" 
                            frameborder="0" 
                            marginheight="0" 
                            marginwidth="0">
                            Loading…
                        </iframe>
                    </div>
                    
                    <div class="form-footer">
                        <p><i class="fas fa-shield-alt"></i> Your information is secure and will only be used for conference purposes</p>
                        <p><i class="fas fa-envelope"></i> You will receive a confirmation email after registration</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- What to Expect Section -->
    <section class="expectations">
        <div class="container">
            <h2 class="section-title">What to Expect</h2>
            <div class="expectations-grid">
                <div class="expectation-card">
                    <i class="fas fa-network-wired"></i>
                    <h3>Professional Networking</h3>
                    <p>Connect with alumni from different sets and chapters across the globe</p>
                </div>
                <div class="expectation-card">
                    <i class="fas fa-chart-line"></i>
                    <h3>Leadership Development</h3>
                    <p>Participate in workshops and sessions focused on leadership growth</p>
                </div>
                <div class="expectation-card">
                    <i class="fas fa-lightbulb"></i>
                    <h3>Strategic Planning</h3>
                    <p>Contribute to the future direction of the ExJAM Association</p>
                </div>
                <div class="expectation-card">
                    <i class="fas fa-calendar-check"></i>
                    <h3>Cultural Events</h3>
                    <p>Enjoy social activities and cultural celebrations</p>
                </div>
                <div class="expectation-card">
                    <i class="fas fa-certificate"></i>
                    <h3>Professional Badge</h3>
                    <p>Receive a personalized badge with QR code for easy access</p>
                </div>
                <div class="expectation-card">
                    <i class="fas fa-camera"></i>
                    <h3>Photo Opportunities</h3>
                    <p>Capture memories with fellow alumni and special guests</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Contact Section -->
    <section id="contact" class="contact">
        <div class="container">
            <h2 class="section-title">Contact Information</h2>
            <div class="contact-content">
                <div class="contact-info">
                    <div class="contact-item">
                        <i class="fas fa-envelope"></i>
                        <div>
                            <h4>Email</h4>
                            <p>registration@exjam.org</p>
                        </div>
                    </div>
                    <div class="contact-item">
                        <i class="fas fa-phone"></i>
                        <div>
                            <h4>Phone</h4>
                            <p>+234 XXX XXX XXXX</p>
                        </div>
                    </div>
                    <div class="contact-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <div>
                            <h4>Venue</h4>
                            <p>NAF Conference Centre<br>FCT, ABUJA, Nigeria</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
        <div class="container">
            <div class="footer-content">
                <div class="footer-section">
                    <div class="logo">
                        <i class="fas fa-plane-departure"></i>
                        <span>ExJAM</span>
                    </div>
                    <p>ExJAM President General's Conference - Maiden Flight</p>
                </div>
                <div class="footer-section">
                    <h4>Quick Links</h4>
                    <a href="#about">About</a>
                    <a href="#registration">Register</a>
                    <a href="#contact">Contact</a>
                </div>
                <div class="footer-section">
                    <h4>Event Details</h4>
                    <p>November 28-30, 2025</p>
                    <p>NAF Conference Centre, ABUJA</p>
                    <p>Theme: "Strive to Excel"</p>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2025 ExJAM Association. All rights reserved.</p>
            </div>
        </div>
    </footer>

    <script>
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
        const additionalCSS = \`
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
            
            /* Enhanced hover effects */
            .feature:hover,
            .expectation-card:hover,
            .step:hover {
                transform: translateY(-5px);
                box-shadow: 0 15px 30px rgba(0, 0, 0, 0.15);
            }
        \`;

        // Inject additional CSS
        const styleSheet = document.createElement('style');
        styleSheet.textContent = additionalCSS;
        document.head.appendChild(styleSheet);
    </script>
</body>
</html>
  `;
}

/**
 * Deploy the web app
 */
function deployWebApp() {
  try {
    console.log("🚀 Deploying ExJAM Registration Web App...");
    
    // Create a new deployment
    const deployment = Apps.newDeployment();
    deployment.setDeploymentConfig(Apps.newDeploymentConfig()
      .setScriptId(ScriptApp.getScriptId())
      .setVersion('1')
      .setManifestFileName('appsscript.json')
      .setDescription('ExJAM Registration System Web App'));
    
    // Deploy the web app
    const deployedVersion = Apps.createDeployment(deployment);
    
    console.log("✅ Web app deployed successfully!");
    console.log("📋 Deployment ID: " + deployedVersion.getDeploymentId());
    console.log("🌐 Web app URL: " + ScriptApp.getService().getUrl());
    
    return {
      success: true,
      deploymentId: deployedVersion.getDeploymentId(),
      webAppUrl: ScriptApp.getService().getUrl(),
      message: "ExJAM Registration Web App deployed successfully!"
    };
    
  } catch (error) {
    console.error("❌ Error deploying web app: " + error);
    return {
      success: false,
      error: error.toString(),
      message: "Failed to deploy web app. Check logs for details."
    };
  }
}

/**
 * Get web app URL
 */
function getWebAppUrl() {
  try {
    const url = ScriptApp.getService().getUrl();
    console.log("🌐 Web App URL: " + url);
    return url;
  } catch (error) {
    console.error("❌ Error getting web app URL: " + error);
    return null;
  }
}

/**
 * Test web app functionality
 */
function testWebApp() {
  try {
    console.log("🧪 Testing ExJAM Registration Web App...");
    
    // Test HTML generation
    const html = getRegistrationPageHTML();
    console.log("✅ HTML generation successful");
    
    // Test web app URL
    const url = getWebAppUrl();
    if (url) {
      console.log("✅ Web app URL: " + url);
    } else {
      console.log("⚠️ Web app not deployed yet");
    }
    
    console.log("🎉 Web app testing complete!");
    
    return {
      success: true,
      htmlGenerated: true,
      webAppUrl: url,
      message: "Web app testing completed successfully!"
    };
    
  } catch (error) {
    console.error("❌ Error testing web app: " + error);
    return {
      success: false,
      error: error.toString(),
      message: "Web app testing failed. Check logs for details."
    };
  }
}
