document.addEventListener('DOMContentLoaded', () => {
    const form     = document.getElementById('trainer-login-form');
    const errorMsg = document.getElementById('login-error');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMsg.style.display = 'none';

        const email    = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        try {
            const res  = await fetch('/api/login/trainer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();

            if (res.ok) {
                window.location.href = data.redirect;
            } else {
                errorMsg.textContent   = data.error || 'Login failed.';
                errorMsg.style.display = 'block';
            }
        } catch {
            errorMsg.textContent   = 'Network error. Please try again.';
            errorMsg.style.display = 'block';
        }
    });
});
