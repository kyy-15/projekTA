const togglePassword = document.querySelector('#togglePassword');
const passwordInput = document.querySelector('#password');

togglePassword.addEventListener('click', function () {
    // Tukar tipe input antara password dan text
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
    // Tukar class ikon Font Awesome (Mata Terbuka / Mata Dicoret)
    this.classList.toggle('fa-eye');
    this.classList.toggle('fa-eye-slash');
});

// Menangani submit login melalui API aman dari preload.js.
const loginForm = document.querySelector('#loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const username = document.querySelector('#username').value.trim();
        const password = passwordInput.value;
        const submitButton = loginForm.querySelector('button[type="submit"]');
        let errorElement = document.querySelector('#loginError');

        if (!errorElement) {
            errorElement = document.createElement('p');
            errorElement.id = 'loginError';
            errorElement.setAttribute('role', 'alert');
            loginForm.insertBefore(errorElement, submitButton);
        }
        errorElement.textContent = '';
        submitButton.disabled = true;

        try {
            const result = await window.electronAPI.login({ username, password });
            if (!result?.success) {
                errorElement.textContent = result?.message || 'Login gagal.';
                return;
            }
            sessionStorage.setItem('currentUser', JSON.stringify({ user: username, role: result.role }));
            await window.electronAPI.logActivity(username, result.role, 'Login ke dalam sistem');
            window.location.href = result.redirect;
        } catch (error) {
            console.error('Login gagal:', error);
            errorElement.textContent = 'Terjadi kesalahan saat login. Silakan coba lagi.';
        } finally {
            submitButton.disabled = false;
        }
    });
}