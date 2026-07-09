document.addEventListener('DOMContentLoaded', () => {
    const form          = document.querySelector('form');
    const successMsg    = document.getElementById('success-message');
    const errorMsg      = document.getElementById('error-message');
    const passwordError = document.getElementById('password-error');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        successMsg.style.display    = 'none';
        errorMsg.style.display      = 'none';
        passwordError.style.display = 'none';

        const username   = document.getElementById('username').value.trim();
        const email      = document.getElementById('email').value.trim();
        const password   = document.getElementById('password').value;
        const confirm    = document.getElementById('confirm-password').value;

        if (password !== confirm) {
            passwordError.style.display = 'block';
            return;
        }

        try {
            const res  = await fetch('/api/register/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            const data = await res.json();

            if (res.ok) {
                successMsg.style.display = 'block';
                setTimeout(() => window.location.href = '/admin/login', 1500);
            } else {
                errorMsg.textContent   = data.error || 'Registration failed.';
                errorMsg.style.display = 'block';
            }
        } catch {
            errorMsg.textContent   = 'Network error. Please try again.';
            errorMsg.style.display = 'block';
        }
    });
});
