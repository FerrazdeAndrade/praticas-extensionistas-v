(() => {
  const getToken = () => localStorage.getItem('pulse_token');

  function clearSession() {
    localStorage.removeItem('pulse_token');
    localStorage.removeItem('pulse_usuario');
  }

  function esc(v) {
    return String(v ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function showAlert(msg, ok = true) {
    const box = document.getElementById('alertAdmin');
    if (!box) return;
    box.textContent = msg;
    box.style.background = ok ? '#e7f6f1' : '#fdecec';
    box.style.color = ok ? '#16866d' : '#b42318';
    box.classList.add('show');
  }

  async function carregarAdmin() {
    const token = getToken();
    if (!token) {
      location.replace('/login');
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };
    const [resMe, resUsers, resPesq] = await Promise.all([
      fetch('/api/me', { headers }),
      fetch('/api/admin/usuarios', { headers }),
      fetch('/api/admin/pesquisas', { headers })
    ]);

    if ([resMe.status, resUsers.status].some(s => s === 401 || s === 403)) {
      clearSession();
      location.replace('/login');
      return;
    }

    const me = resMe.ok ? await resMe.json() : null;
    const { usuarios = [] } = resUsers.ok ? await resUsers.json() : {};
    const { pesquisas = [] } = resPesq.ok ? await resPesq.json() : {};

    if (me) {
      document.getElementById('infoAdmin').textContent = `${me.nome} (${me.usuario})`;
    }

    const tbodyU = document.getElementById('tabelaUsuariosAdmin');
    tbodyU.innerHTML = usuarios.map(u => `
      <tr data-id="${u.id}" style="border-bottom:1px solid #e6edf5;">
        <td style="padding:10px;">#${u.id}</td>
        <td style="padding:10px;"><strong>${esc(u.nome)}</strong><br><small>${esc(u.usuario)} · ${esc(u.email)}</small></td>
        <td style="padding:10px;">
          <select class="adm-tipo">
            <option value="paciente" ${u.tipo === 'paciente' ? 'selected' : ''}>paciente</option>
            <option value="medico" ${u.tipo === 'medico' ? 'selected' : ''}>medico</option>
            <option value="administrador" ${u.tipo === 'administrador' ? 'selected' : ''}>administrador</option>
          </select>
        </td>
        <td style="padding:10px;"><input class="adm-esp" value="${esc(u.especialidade || '')}" placeholder="Ex.: Cardiologia"></td>
        <td style="padding:10px;"><input class="adm-crm" value="${esc(u.crm || '')}" placeholder="CRM-RJ 000000"></td>
        <td style="padding:10px;"><input class="adm-ativo" type="checkbox" ${u.ativo ? 'checked' : ''}></td>
        <td style="padding:10px;"><button class="btn secondary btn-salvar-user" type="button">Salvar</button></td>
      </tr>
    `).join('');

    const tbodyP = document.getElementById('tabelaPesquisasAdmin');
    tbodyP.innerHTML = pesquisas.length
      ? pesquisas.map(p => `
          <tr style="border-bottom:1px solid #e6edf5;">
            <td style="padding:10px;"><strong>${esc(p.nome)}</strong></td>
            <td style="padding:10px;">${esc(p.positivo)}</td>
            <td style="padding:10px;">${esc(p.negativo)}</td>
            <td style="padding:10px;">${esc(p.sugestoes)}</td>
            <td style="padding:10px;">${esc(p.criado_em)}</td>
          </tr>
        `).join('')
      : '<tr><td colspan="5" style="padding:12px;">Nenhuma pesquisa enviada ainda.</td></tr>';
  }

  document.getElementById('tabelaUsuariosAdmin')?.addEventListener('click', async e => {
    const btn = e.target.closest('.btn-salvar-user');
    if (!btn) return;
    const tr = btn.closest('tr');
    const id = tr.dataset.id;
    const body = {
      tipo: tr.querySelector('.adm-tipo').value,
      especialidade: tr.querySelector('.adm-esp').value,
      crm: tr.querySelector('.adm-crm').value,
      ativo: tr.querySelector('.adm-ativo').checked
    };

    const res = await fetch(`/api/admin/usuarios/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    showAlert(data.mensagem || (res.ok ? 'Salvo.' : 'Erro ao salvar.'), res.ok);
    if (res.ok) carregarAdmin();
  });

  document.getElementById('btnAtualizarAdmin')?.addEventListener('click', carregarAdmin);
  document.getElementById('btnSair')?.addEventListener('click', async () => {
    await fetch('/api/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` }
    }).catch(() => {});
    clearSession();
    location.replace('/login');
  });

  carregarAdmin();
})();