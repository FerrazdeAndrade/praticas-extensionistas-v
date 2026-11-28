(() => {
  const getToken = () => localStorage.getItem('pulse_token');

  function clearSession() {
    localStorage.removeItem('pulse_token');
    localStorage.removeItem('pulse_usuario');
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  async function carregarPerfil(token) {
    const res = await fetch('/api/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return null;
    return res.json();
  }

  async function carregarFilaMedico() {
    const tbody = document.getElementById('tabelaPacientes');
    const infoMedico = document.getElementById('infoMedico');
    const token = getToken();

    if (!token) {
      location.replace('/login');
      return;
    }

    try {
      const [perfil, resFila] = await Promise.all([
        carregarPerfil(token),
        fetch('/api/medico/fila', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (resFila.status === 401 || resFila.status === 403) {
        clearSession();
        location.replace('/login');
        return;
      }

      const dados = await resFila.json();
      const lista = Array.isArray(dados.fila) ? dados.fila : [];

      if (perfil && infoMedico) {
        infoMedico.textContent =
          `${perfil.nome} · ${perfil.especialidade || 'Especialidade não informada'} · CRM: ${perfil.crm || 'Não informado'}`;
      } else if (lista.length > 0 && infoMedico) {
        const primeiro = lista[0];
        infoMedico.textContent =
          `${primeiro.nome_medico} · ${primeiro.especialidade_do_medico || 'Especialidade não informada'} · CRM: ${primeiro.CRM}`;
      }

      if (!lista.length) {
        tbody.innerHTML = '<tr><td colspan="7">Nenhum paciente aguardando atendimento no momento.</td></tr>';
        return;
      }

      tbody.innerHTML = lista.map(item => `
        <tr>
          <td><strong>${escapeHtml(item.nome_paciente)}</strong></td>
          <td><span class="badge-metrica">${escapeHtml(item.metricas_paciente)}</span></td>
          <td>${escapeHtml(item.nome_medico)}</td>
          <td>${escapeHtml(item.especialidade_do_medico || 'Não informada')}</td>
          <td>${escapeHtml(item.CRM)}</td>
          <td>${escapeHtml(item.data_consulta)}</td>
          <td><strong>${escapeHtml(item.horario_consulta)}</strong></td>
        </tr>
      `).join('');
    } catch (_erro) {
      tbody.innerHTML = '<tr><td colspan="7">Erro ao carregar dados. Tente novamente.</td></tr>';
    }
  }

  document.getElementById('btnAtualizar')?.addEventListener('click', carregarFilaMedico);

  document.getElementById('btnSair')?.addEventListener('click', async () => {
    const token = getToken();
    if (token) {
      await fetch('/api/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => {});
    }
    clearSession();
    location.replace('/login');
  });

  carregarFilaMedico();
})();