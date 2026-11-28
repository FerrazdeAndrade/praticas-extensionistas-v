(() => {
  const token = () => localStorage.getItem('pulse_token');
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const form = document.getElementById('feedbackForm');
  const list = document.getElementById('feedbackList');
  const box = document.getElementById('alert');
  function message(text, success = false) {
    if (!box) return;
    box.textContent = text; box.classList.add('show');
    box.style.background = success ? '#e7f6f1' : '#fff0f0';
    box.style.color = success ? '#16866d' : '#a83d45';
  }
  async function api(path, options = {}) {
    const headers = { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(token() ? { Authorization: `Bearer ${token()}` } : {}), ...(options.headers || {}) };
    const response = await fetch(path, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) { localStorage.removeItem('pulse_token'); location.replace('/login'); throw new Error('Entre com uma conta administradora para ver os feedbacks.'); }
    if (!response.ok) throw new Error(data.mensagem || 'Não foi possível concluir.');
    return data;
  }
  if (form) form.addEventListener('submit', async event => {
    event.preventDefault();
    const button = document.getElementById('submit'); button.disabled = true; button.textContent = 'Enviando…';
    try {
      await api('/api/pesquisas', { method: 'POST', body: JSON.stringify({
        nome: document.getElementById('nome').value.trim() || 'Anônimo',
        positivo: document.getElementById('positivo').value.trim(),
        negativo: document.getElementById('negativo').value.trim(),
        sugestoes: document.getElementById('sugestoes').value.trim()
      }) });
      form.reset(); message('Obrigado. Sua avaliação foi registrada para a equipe do PulseVida.', true);
    } catch (error) { message(error.message === 'Failed to fetch' ? 'Não foi possível conectar ao servidor.' : error.message); }
    finally { button.disabled = false; button.textContent = 'Enviar avaliação'; }
  });
  if (list) api('/api/pesquisas').then(rows => {
    if (!rows.length) { list.innerHTML = '<section class="panel empty">Ainda não há feedbacks registrados.</section>'; return; }
    list.innerHTML = rows.map(item => `<article class="panel"><div class="panel-head"><h2>${esc(item.nome || 'Anônimo')}</h2><span class="record-meta">${esc(item.criado_em || '')}</span></div><h3>Pontos positivos</h3><p>${esc(item.positivo)}</p><h3>Dificuldades</h3><p>${esc(item.negativo)}</p>${item.sugestoes ? `<h3>Sugestões</h3><p>${esc(item.sugestoes)}</p>` : ''}</article>`).join('');
  }).catch(error => { if (list) list.innerHTML = `<section class="panel empty">${esc(error.message)}</section>`; });
})();
