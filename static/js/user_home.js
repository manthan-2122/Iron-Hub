document.addEventListener('DOMContentLoaded', function() {
    // Mobile nav toggle
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            navMenu.classList.toggle('open');
            navToggle.classList.toggle('active');
            document.body.style.overflow = navMenu.classList.contains('open') ? 'hidden' : '';
        });
        
        // Close menu when clicking on links
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('open');
                navToggle.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (navMenu.classList.contains('open') && 
                !navMenu.contains(e.target) && 
                !navToggle.contains(e.target)) {
                navMenu.classList.remove('open');
                navToggle.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
        
        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navMenu.classList.contains('open')) {
                navMenu.classList.remove('open');
                navToggle.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    // Smooth scrolling for anchor links
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
    
    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            navbar.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.15)';
        } else {
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        }
        
        lastScroll = currentScroll;
    });

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
                element.textContent = Math.floor(current) + (target.includes('+') ? '+' : '') + (target.includes('/') ? '/7' : '');
            }
        }, 16);
    }
}
