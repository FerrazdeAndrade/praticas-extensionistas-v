(() => {
  const alertBox = document.getElementById('alert');
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const token = () => localStorage.getItem('pulse_token');
  const destinations = { paciente: '/portal/paciente', medico: '/portal/profissional', administrador: '/portal/administracao' };
  function show(message) {
    if (!alertBox) return;
    alertBox.textContent = message;
    alertBox.classList.add('show');
  }
  function clear() { if (alertBox) { alertBox.textContent = ''; alertBox.classList.remove('show'); } }
  async function jsonRequest(path, data) {
    const response = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.mensagem || 'Não foi possível concluir a solicitação.');
    return result;
  }
  if (loginForm) {
    if (token()) {
      fetch('/api/me', { headers: { Authorization: `Bearer ${token()}` } })
        .then(response => response.ok ? response.json() : Promise.reject())
        .then(user => { location.replace(destinations[user.tipo] || '/'); })
        .catch(() => localStorage.removeItem('pulse_token'));
    }
    loginForm.addEventListener('submit', async event => {
      event.preventDefault(); clear();
      const button = document.getElementById('submit');
      button.disabled = true; button.textContent = 'Validando…';
      try {
        const result = await jsonRequest('/api/login', {
          usuario: document.getElementById('usuario').value.trim(),
          senha: document.getElementById('senha').value
        });
        localStorage.setItem('pulse_token', result.token);
        location.replace(destinations[result.usuario.tipo] || '/');
      } catch (error) { show(error.message === 'Failed to fetch' ? 'Não foi possível conectar ao servidor. Tente novamente em instantes.' : error.message); }
      finally { button.disabled = false; button.textContent = 'Entrar com segurança'; }
    });
  }
  if (signupForm) signupForm.addEventListener('submit', async event => {
    event.preventDefault(); clear();
    const button = document.getElementById('submit');
    button.disabled = true; button.textContent = 'Criando conta…';
    try {
      const result = await jsonRequest('/api/usuarios', {
        nome: document.getElementById('nome').value.trim(),
        usuario: document.getElementById('usuario').value.trim(),
        email: document.getElementById('email').value.trim(),
        senha: document.getElementById('senha').value
      });
      show(result.mensagem || 'Conta criada. Redirecionando para o login…');
      alertBox.style.background = '#e7f6f1'; alertBox.style.color = '#16866d';
      signupForm.reset();
      setTimeout(() => location.replace('/login'), 1300);
    } catch (error) { show(error.message === 'Failed to fetch' ? 'Não foi possível conectar ao servidor. Tente novamente em instantes.' : error.message); }
    finally { button.disabled = false; button.textContent = 'Criar conta de paciente'; }
  });
})();
