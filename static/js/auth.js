document.addEventListener('DOMContentLoaded', function () {
    // Tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const target = this.dataset.tab;
            tabBtns.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            document.getElementById(target + '-tab').classList.add('active');
        });
    });

    // Login form
    document.getElementById('login-form').addEventListener('submit', async function (e) {
        e.preventDefault();
        const errorEl = document.getElementById('login-error');
        errorEl.classList.add('hidden');
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (res.ok) {
                window.location.href = '/app';
            } else {
                errorEl.textContent = data.error || 'Login failed';
                errorEl.classList.remove('hidden');
            }
        } catch (err) {
            errorEl.textContent = 'Network error. Please try again.';
            errorEl.classList.remove('hidden');
        }
    });

    // Register form
    document.getElementById('register-form').addEventListener('submit', async function (e) {
        e.preventDefault();
        const errorEl = document.getElementById('register-error');
        errorEl.classList.add('hidden');
        const username = document.getElementById('reg-username').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value;
        if (password.length < 6) {
            errorEl.textContent = 'Password must be at least 6 characters';
            errorEl.classList.remove('hidden');
            return;
        }
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            const data = await res.json();
            if (res.ok) {
                window.location.href = '/app';
            } else {
                errorEl.textContent = data.error || 'Registration failed';
                errorEl.classList.remove('hidden');
            }
        } catch (err) {
            errorEl.textContent = 'Network error. Please try again.';
            errorEl.classList.remove('hidden');
        }
    });
});
