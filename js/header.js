(() => {
  const rawUser = sessionStorage.getItem('currentUser');
  let user = null;

  try {
    user = rawUser ? JSON.parse(rawUser) : null;
  } catch {
    sessionStorage.removeItem('currentUser');
  }

  const name = user?.user || user?.username || sessionStorage.getItem('namaUser');
  const role = user?.role || sessionStorage.getItem('roleUser');

  if (!name || !role) {
    const loginPage = window.location.pathname.includes('html') ? '../index.html' : 'index.html';
    window.location.replace(loginPage);
    return;
  }

  sessionStorage.setItem('namaUser', name);
  sessionStorage.setItem('roleUser', role);

  document.querySelectorAll('.user-name').forEach(element => {
    element.textContent = name;
  });
  document.querySelectorAll('.user-role').forEach(element => {
    element.textContent = role;
  });
})();
