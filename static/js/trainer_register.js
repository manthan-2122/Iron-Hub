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

        const fname          = document.getElementById('fname').value.trim();
        const lname          = document.getElementById('lname').value.trim();
        const email          = document.getElementById('email').value.trim();
        const experience     = document.getElementById('experience').value;
        const specialization = document.getElementById('specialization').value;
        const password       = document.getElementById('password').value;
        const confirm        = document.getElementById('confirm-password').value;

        if (password !== confirm) {
            passwordError.style.display = 'block';
            return;
        }

        try {
            const res  = await fetch('/api/register/trainer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fname, lname, email, experience, specialization, password })
            });
            const data = await res.json();

            if (res.ok) {
                successMsg.style.display = 'block';
                setTimeout(() => window.location.href = '/trainer/login', 1500);
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
