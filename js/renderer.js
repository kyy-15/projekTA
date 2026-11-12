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

// Menangani aksi Submit Form
const loginForm = document.querySelector('#loginForm');
loginForm.addEventListener('submit', function (event) {
    event.preventDefault(); 

    const username = document.querySelector('#username').value;
    const password = passwordInput.value;

    console.log('Mencoba Login dengan:', { username, password });
    
    // Siap dihubungkan ke ipcRenderer Electron Anda di sini
});
document.addEventListener('DOMContentLoaded', () => {

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault(); 
            window.location.href = './html/beranda.html';
        });
    }

    // 2. DARI BERANDA (LOGOUT) -> KEMBALI KE LOGIN
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            // Kembali ke file index.html (Halaman Login Utama)
            window.location.href = 'index.html';
        });
    }
    
});