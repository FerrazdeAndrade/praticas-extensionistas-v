(() => {
  const token = localStorage.getItem('pulse_token');
  if (!token) return;
  fetch('/api/me', { headers: { Authorization: `Bearer ${token}` } })
    .then(response => response.ok ? response.json() : Promise.reject())
    .then(user => {
      const target = user.tipo === 'medico' ? '/portal/profissional' : user.tipo === 'administrador' ? '/portal/administracao' : '/portal/paciente';
      document.querySelectorAll('.nav-actions').forEach(nav => {
        nav.innerHTML = `<a class="btn secondary" href="${target}">Minha área</a><a class="btn" href="/portal/paciente" data-login-action="logout">Sair</a>`;
        nav.querySelector('[data-login-action="logout"]').addEventListener('click', async event => {
          event.preventDefault();
          try { await fetch('/api/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }); } catch {}
          localStorage.removeItem('pulse_token');
          location.href = '/';
        });
      });
    })
    .catch(() => localStorage.removeItem('pulse_token'));
})();
