document.addEventListener('DOMContentLoaded', function() {
    // Mobile nav toggle
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('open');
            navToggle.classList.toggle('active');
        });
        navMenu.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', () => {
                navMenu.classList.remove('open');
                navToggle.classList.remove('active');
            });
        });
    }

    // Smooth scrolling for anchor links (if any)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#' && href.length > 1) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });

    // Navbar scroll effect
    let lastScroll = 0;
    const navbar = document.querySelector('.home-nav');
    
    if (navbar) {
        window.addEventListener('scroll', function() {
            const currentScroll = window.pageYOffset;
            
            if (currentScroll > 100) {
                navbar.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.15)';
                navbar.style.background = 'rgba(15, 23, 42, 0.95)';
            } else {
                navbar.style.boxShadow = 'none';
                navbar.style.background = 'rgba(15, 23, 42, 0.8)';
            }
            
            lastScroll = currentScroll;
        });
    }

    // Animate stats on scroll
    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateNumbers(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.stat-number').forEach(stat => {
        observer.observe(stat);
    });
});

function animateNumbers(element) {
    const target = element.textContent;
    const isNumber = /^\d+/.test(target);
    
    if (isNumber) {
        const finalNumber = parseInt(target.replace(/\D/g, ''));
        const duration = 2000;
        const increment = finalNumber / (duration / 16);
        let current = 0;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= finalNumber) {
                element.textContent = target;
                clearInterval(timer);
            } else {
                const suffix = target.replace(/[0-9]/g, '');
                // Simple logic to keep suffixes like k+ or +
                element.textContent = Math.floor(current) + suffix; 
            }
        }, 16);
    }
}
