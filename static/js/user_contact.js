document.addEventListener('DOMContentLoaded', function () {
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

    // Navbar scroll effect
    const navbar = document.querySelector('.home-nav');

    if (navbar) {
        window.addEventListener('scroll', function () {
            const currentScroll = window.pageYOffset;

            if (currentScroll > 50) {
                navbar.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.15)';
                navbar.style.background = 'rgba(15, 23, 42, 0.95)';
            } else {
                navbar.style.boxShadow = 'none';
                navbar.style.background = 'rgba(15, 23, 42, 0.8)';
            }
        });
    }

    // Form submission handler
    const form = document.getElementById('contact-form');
    if (form) {
        form.addEventListener('submit', async function (e) {
            e.preventDefault();
            const btn = form.querySelector('button[type="submit"]');
            const statusDiv = document.getElementById('form-status');
            const originalText = btn.textContent;

            btn.textContent = 'Sending...';
            btn.disabled = true;
            statusDiv.style.display = 'none';

            const payload = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                message: document.getElementById('message').value
            };

            try {
                const response = await fetch('/api/v1/enquiries/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    statusDiv.textContent = 'Thank you for your message! We will get back to you shortly.';
                    statusDiv.style.backgroundColor = '#dcfce7';
                    statusDiv.style.color = '#16a34a';
                    statusDiv.style.display = 'block';
                    form.reset();
                } else {
                    const data = await response.json();
                    let errors = [];
                    for (let key in data) {
                        if (Array.isArray(data[key])) {
                            errors.push(`${key}: ${data[key].join(', ')}`);
                        } else {
                            errors.push(`${key}: ${data[key]}`);
                        }
                    }
                    statusDiv.textContent = errors.join(' | ') || 'Failed to send message. Please try again.';
                    statusDiv.style.backgroundColor = '#fee2e2';
                    statusDiv.style.color = '#ef4444';
                    statusDiv.style.display = 'block';
                }
            } catch (error) {
                console.error('Error submitting form:', error);
                statusDiv.textContent = 'A network error occurred. Please try again later.';
                statusDiv.style.backgroundColor = '#fee2e2';
                statusDiv.style.color = '#ef4444';
                statusDiv.style.display = 'block';
            } finally {
                btn.textContent = originalText;
                btn.disabled = false;
            }
        });
    }
});
