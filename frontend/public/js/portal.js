(() => {
  const root = document.getElementById('app');
  if (!root) return;
  const token = () => localStorage.getItem('pulse_token');
<<<<<<< HEAD
  const roleLabels = {
    paciente: 'Área do paciente',
    medico: 'Área profissional',
    administrador: 'Administração'
  };
  const destinations = {
    paciente: '/portal/paciente',
    medico: '/portal/profissional',
    administrador: '/portal/administracao'
  };
  const navs = {
    paciente: [
      ['⌂', 'Resumo', 'home'],
      ['＋', 'Aferições', 'metrics'],
      ['▣', 'Consultas', 'appointments'],
      ['♡', 'Atendimentos', 'history'],
      ['♙', 'Meu cadastro', 'profile']
    ],
    medico: [
      ['▤', 'Fila de atendimento', 'care'],
      ['♥', 'Aferições', 'metrics']
    ],
    administrador: [
      ['▦', 'Visão geral', 'admin'],
      ['♙', 'Usuários', 'users'],
      ['▣', 'Agendamentos', 'appointments'],
      ['☰', 'Feedbacks', 'feedbacks']
    ]
=======
  const roleLabels = { paciente: 'Área do paciente', medico: 'Área profissional', administrador: 'Administração' };
  const destinations = { paciente: '/portal/paciente', medico: '/portal/profissional', administrador: '/portal/administracao' };
  const navs = {
    paciente: [['⌂', 'Resumo', 'home'], ['＋', 'Aferições', 'metrics'], ['▣', 'Consultas', 'appointments'], ['♡', 'Atendimentos', 'history'], ['♙', 'Meu cadastro', 'profile']],
    medico: [['▤', 'Fila de atendimento', 'care'], ['♥', 'Aferições', 'metrics']],
    administrador: [['▦', 'Visão geral', 'admin'], ['♙', 'Usuários', 'users'], ['▣', 'Agendamentos', 'appointments'], ['☰', 'Feedbacks', 'feedbacks']]
>>>>>>> 0661d751b750162f7c6ce9b13ca08381ff0186a0
  };
  const units = [
    'Hospital Municipal Porphirio Nunes de Azeredo (Bacaxá)',
    'Hospital Municipal Nossa Senhora de Nazareth (Verde Vale)',
    'Hospital Estadual dos Lagos (Barreira)'
  ];
<<<<<<< HEAD
  const ufs = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
    'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
    'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];
=======
>>>>>>> 0661d751b750162f7c6ce9b13ca08381ff0186a0
  let user = null;
  let role = null;
  let currentView = 'home';

  async function api(path, options = {}) {
    const headers = {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
      ...(options.headers || {})
    };

    const request = { ...options, headers };

    if (request.body && typeof request.body !== 'string') {
      request.body = JSON.stringify(request.body);
    }

    const endpoint = `/api${path}`;
    const response = await fetch(endpoint, request);

    const data = await response.json().catch(() => ({}));

    if (response.status === 401) {
      localStorage.removeItem('pulse_token');
      location.replace('/login');
      throw new Error('Sua sessão expirou. Entre novamente.');
    }

    if (!response.ok) {
      throw new Error(
        `${endpoint} HTTP ${response.status}: ${
          data.mensagem || 'Erro na comunicação com o servidor.'
        }`
      );
    }

    return data;
  }

<<<<<<< HEAD
  const esc = value =>
    String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char]));

  const todayInSaquarema = () => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
  };

  function date(value, time = false) {
    if (!value) return '—';
    let parsed;
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
      parsed = new Date(`${value}T12:00:00`);
    } else {
      parsed = new Date(String(value).replace(' ', 'T'));
    }
    if (Number.isNaN(parsed.getTime())) return esc(value);
    return parsed.toLocaleString(
      'pt-BR',
      time ? { dateStyle: 'short', timeStyle: 'short' } : { dateStyle: 'medium' }
    );
  }

  function statusBadge(value) {
    const text = String(value || 'Registrado');
    const lower = text.toLowerCase();
    const cls = lower.includes('cancel') || lower.includes('mal-estar')
      ? 'critical'
      : lower.includes('solicit') || lower.includes('aten') || lower.includes('atendimento')
        ? 'warn'
        : lower.includes('confirm') || lower.includes('atendido') || lower.includes('estável')
          ? ''
          : 'neutral';
    return `<span class="badge ${cls}">${esc(text)}</span>`;
  }

  function flash(message, error = false) {
    let node = document.querySelector('.flash');
    if (!node) {
      node = document.createElement('div');
      node.className = 'flash';
      node.setAttribute('role', 'status');
      node.setAttribute('aria-live', 'polite');
      document.body.append(node);
    }
    node.textContent = message;
    node.classList.toggle('error', error);
    clearTimeout(node._timer);
    node._timer = setTimeout(() => node.remove(), 4200);
  }

  function heading(label, title, subtitle) {
    return `<div class="eyebrow-small">${esc(label)}</div><h1 class="page-title">${esc(title)}</h1><p class="subtitle">${esc(subtitle)}</p>`;
  }

  function statCard(icon, label, value, note) {
    return `<article class="card stat"><span class="stat-icon" aria-hidden="true">${icon}</span><div class="stat-label">${esc(label)}</div><div class="stat-value">${esc(value)}</div><div class="stat-note">${esc(note)}</div></article>`;
  }

=======
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const todayInSaquarema = () => {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
  };
  function date(value, time = false) {
    if (!value) return '—';
    let parsed;
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) parsed = new Date(`${value}T12:00:00`);
    else parsed = new Date(String(value).replace(' ', 'T'));
    if (Number.isNaN(parsed.getTime())) return esc(value);
    return parsed.toLocaleString('pt-BR', time ? { dateStyle: 'short', timeStyle: 'short' } : { dateStyle: 'medium' });
  }
  function statusBadge(value) {
    const text = String(value || 'Registrado');
    const lower = text.toLowerCase();
    const cls = lower.includes('cancel') || lower.includes('mal-estar') ? 'critical' : lower.includes('solicit') || lower.includes('aten') || lower.includes('atendimento') ? 'warn' : lower.includes('confirm') || lower.includes('atendido') || lower.includes('estável') ? '' : 'neutral';
    return `<span class="badge ${cls}">${esc(text)}</span>`;
  }
  function flash(message, error = false) {
    let node = document.querySelector('.flash');
    if (!node) { node = document.createElement('div'); node.className = 'flash'; node.setAttribute('role', 'status'); node.setAttribute('aria-live', 'polite'); document.body.append(node); }
    node.textContent = message; node.classList.toggle('error', error);
    clearTimeout(node._timer); node._timer = setTimeout(() => node.remove(), 4200);
  }
  function heading(label, title, subtitle) {
    return `<div class="eyebrow-small">${esc(label)}</div><h1 class="page-title">${esc(title)}</h1><p class="subtitle">${esc(subtitle)}</p>`;
  }
  function statCard(icon, label, value, note) {
    return `<article class="card stat"><span class="stat-icon" aria-hidden="true">${icon}</span><div class="stat-label">${esc(label)}</div><div class="stat-value">${esc(value)}</div><div class="stat-note">${esc(note)}</div></article>`;
  }
>>>>>>> 0661d751b750162f7c6ce9b13ca08381ff0186a0
  function metricTable(rows, staff = false) {
    if (!rows.length) return '<div class="empty">Nenhuma aferição encontrada.</div>';
    return `<div class="table-wrap"><table><thead><tr>${staff ? '<th>Paciente</th>' : ''}<th>Data e hora</th><th>Pressão</th><th>Frequência</th><th>Como se sentia</th></tr></thead><tbody>${rows.map(item => `<tr>${staff ? `<td><strong>${esc(item.nome_paciente || 'Paciente')}</strong></td>` : ''}<td>${date(item.registrado_em, true)}</td><td><strong>${esc(item.pressao || '—')}</strong></td><td>${esc(item.batimento || '—')} bpm</td><td>${statusBadge(item.status)}</td></tr>`).join('')}</tbody></table></div>`;
  }
<<<<<<< HEAD

=======
>>>>>>> 0661d751b750162f7c6ce9b13ca08381ff0186a0
  function appointmentTable(rows, mode = 'patient') {
    if (!rows.length) return '<div class="empty">Nenhuma consulta encontrada.</div>';
    const staff = mode !== 'patient';
    return `<div class="table-wrap"><table><thead><tr>${staff ? '<th>Paciente</th>' : ''}<th>Data / horário</th><th>Unidade</th><th>Especialidade</th>${mode === 'staff' ? '<th>Contato</th>' : ''}<th>Status</th>${mode !== 'readonly' ? '<th>Ações</th>' : ''}</tr></thead><tbody>${rows.map(item => {
      const active = !['Atendido', 'Cancelado'].includes(item.status);
      let actions = '<span class="record-meta">Encerrada</span>';
<<<<<<< HEAD
      if (mode === 'patient' && ['Solicitado', 'Confirmado'].includes(item.status)) {
        actions = `<button class="btn danger small" data-patient-cancel="${Number(item.id)}">Cancelar pedido</button>`;
      }
      if (mode === 'staff' || mode === 'admin') {
        if (item.status === 'Solicitado') {
          actions = `<div class="toolbar"><button class="btn small" data-appt-status="Confirmado" data-id="${Number(item.id)}">Confirmar</button><button class="btn danger small" data-appt-status="Cancelado" data-id="${Number(item.id)}">Cancelar</button></div>`;
        } else if (item.status === 'Confirmado' && mode === 'staff') {
          actions = `<div class="toolbar"><button class="btn small" data-care="${Number(item.id)}" data-name="${esc(item.paciente)}" data-date="${esc(item.data)}">Registrar atendimento</button><button class="btn danger small" data-appt-status="Cancelado" data-id="${Number(item.id)}">Cancelar</button></div>`;
        } else if (item.status === 'Confirmado' && mode === 'admin') {
          actions = `<button class="btn danger small" data-appt-status="Cancelado" data-id="${Number(item.id)}">Cancelar</button>`;
        } else if (item.status === 'Em atendimento' && mode === 'staff') {
          actions = `<button class="btn small" data-care="${Number(item.id)}" data-name="${esc(item.paciente)}" data-date="${esc(item.data)}">Registrar atendimento</button>`;
        } else if (active) {
          actions = '<span class="record-meta">Em andamento</span>';
        }
=======
      if (mode === 'patient' && ['Solicitado', 'Confirmado'].includes(item.status)) actions = `<button class="btn danger small" data-patient-cancel="${Number(item.id)}">Cancelar pedido</button>`;
      if (mode === 'staff' || mode === 'admin') {
        if (item.status === 'Solicitado') actions = `<div class="toolbar"><button class="btn small" data-appt-status="Confirmado" data-id="${Number(item.id)}">Confirmar</button><button class="btn danger small" data-appt-status="Cancelado" data-id="${Number(item.id)}">Cancelar</button></div>`;
        else if (item.status === 'Confirmado' && mode === 'staff') actions = `<div class="toolbar"><button class="btn small" data-care="${Number(item.id)}" data-name="${esc(item.paciente)}" data-date="${esc(item.data)}">Registrar atendimento</button><button class="btn danger small" data-appt-status="Cancelado" data-id="${Number(item.id)}">Cancelar</button></div>`;
        else if (item.status === 'Confirmado' && mode === 'admin') actions = `<button class="btn danger small" data-appt-status="Cancelado" data-id="${Number(item.id)}">Cancelar</button>`;
        else if (item.status === 'Em atendimento' && mode === 'staff') actions = `<button class="btn small" data-care="${Number(item.id)}" data-name="${esc(item.paciente)}" data-date="${esc(item.data)}">Registrar atendimento</button>`;
        else if (active) actions = '<span class="record-meta">Em andamento</span>';
>>>>>>> 0661d751b750162f7c6ce9b13ca08381ff0186a0
      }
      const searchable = `${item.paciente || ''} ${item.especialidade || ''} ${item.hospital || ''} ${item.status || ''}`.toLowerCase();
      return `<tr data-row-search="${esc(searchable)}">${staff ? `<td><strong>${esc(item.paciente || 'Paciente')}</strong><div class="record-meta">${esc(item.medico || '')}</div></td>` : ''}<td>${date(item.data)}<div class="record-meta">${esc(item.horario || '—')}</div></td><td>${esc(item.hospital || '—')}</td><td>${esc(item.especialidade || '—')}</td>${mode === 'staff' ? `<td>${esc(item.email_paciente || '—')}</td>` : ''}<td>${statusBadge(item.status)}</td>${mode !== 'readonly' ? `<td>${actions}</td>` : ''}</tr>`;
    }).join('')}</tbody></table></div>`;
  }
<<<<<<< HEAD

=======
>>>>>>> 0661d751b750162f7c6ce9b13ca08381ff0186a0
  function staffRowActions(item) {
    const active = Boolean(item.ativo);
    return `<button class="btn ${active ? 'danger' : 'secondary'} small" data-user-active="${Number(item.id)}" data-next-active="${!active}">${active ? 'Desativar' : 'Reativar'}</button>`;
  }
<<<<<<< HEAD

=======
>>>>>>> 0661d751b750162f7c6ce9b13ca08381ff0186a0
  function shell() {
    const items = navs[role] || [];
    root.innerHTML = `<div class="overlay" id="overlay"></div><div class="layout"><aside class="sidebar" id="sidebar"><a class="brand" href="/"><img src="/assets/logo_pulsevida.webp" alt=""><span><strong>PulseVida</strong><small>Cuidado conectado</small></span></a><div class="nav-label">Sua área</div><nav aria-label="Menu do portal">${items.map(([icon, label, view], index) => `<a class="nav-link ${index === 0 ? 'active' : ''}" href="#${view}" data-view="${view}"><span class="ico" aria-hidden="true">${icon}</span>${label}</a>`).join('')}</nav><div class="side-bottom">Plataforma de acompanhamento em saúde<br>Saquarema · Ambiente acadêmico</div></aside><section class="main"><header class="topbar"><div style="display:flex;align-items:center;gap:11px"><button class="menu-toggle" id="menuToggle" aria-label="Abrir menu" aria-expanded="false">☰</button><span class="crumb">PulseVida / ${esc(roleLabels[role])}</span></div><div class="user-chip"><div class="avatar" id="avatar">${esc((user.nome || 'U').trim().slice(0, 1).toUpperCase())}</div><div><div class="user-name" id="userName">${esc(user.nome || user.usuario)}</div><div class="user-role">${esc(roleLabels[role])}</div></div><button class="logout" id="logout">Sair</button></div></header><main class="content" id="content" tabindex="-1"></main></section></div>`;
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const menu = document.getElementById('menuToggle');
<<<<<<< HEAD
    const closeMenu = () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
      menu.setAttribute('aria-expanded', 'false');
    };
    menu.addEventListener('click', () => {
      const open = !sidebar.classList.contains('open');
      sidebar.classList.toggle('open', open);
      overlay.classList.toggle('show', open);
      menu.setAttribute('aria-expanded', String(open));
    });
=======
    const closeMenu = () => { sidebar.classList.remove('open'); overlay.classList.remove('show'); menu.setAttribute('aria-expanded', 'false'); };
    menu.addEventListener('click', () => { const open = !sidebar.classList.contains('open'); sidebar.classList.toggle('open', open); overlay.classList.toggle('show', open); menu.setAttribute('aria-expanded', String(open)); });
>>>>>>> 0661d751b750162f7c6ce9b13ca08381ff0186a0
    overlay.addEventListener('click', closeMenu);
    root.addEventListener('click', async event => {
      const navLink = event.target.closest('[data-view]');
      if (navLink) {
<<<<<<< HEAD
        event.preventDefault();
        closeMenu();
        root.querySelectorAll('.nav-link').forEach(link => link.classList.toggle('active', link === navLink));
        currentView = navLink.dataset.view;
        await renderView(currentView);
        return;
      }
      const go = event.target.closest('[data-go]');
      if (go) {
        currentView = go.dataset.go;
        root.querySelectorAll('.nav-link').forEach(link => link.classList.toggle('active', link.dataset.view === currentView));
        await renderView(currentView);
        return;
      }
      const confirmButton = event.target.closest('[data-appt-status]');
      if (confirmButton) {
        confirmButton.disabled = true;
        try {
          await api(`/agendamentos/${confirmButton.dataset.id}/status`, {
            method: 'PATCH',
            body: { status: confirmButton.dataset.apptStatus }
          });
          flash(confirmButton.dataset.apptStatus === 'Confirmado' ? 'Solicitação confirmada.' : 'Solicitação cancelada.');
          await renderView(currentView);
        } catch (error) {
          flash(error.message, true);
          confirmButton.disabled = false;
        }
=======
        event.preventDefault(); closeMenu();
        root.querySelectorAll('.nav-link').forEach(link => link.classList.toggle('active', link === navLink));
        currentView = navLink.dataset.view; await renderView(currentView);
        return;
      }
      const go = event.target.closest('[data-go]');
      if (go) { currentView = go.dataset.go; root.querySelectorAll('.nav-link').forEach(link => link.classList.toggle('active', link.dataset.view === currentView)); await renderView(currentView); return; }
      const confirmButton = event.target.closest('[data-appt-status]');
      if (confirmButton) {
        confirmButton.disabled = true;
        try { await api(`/agendamentos/${confirmButton.dataset.id}/status`, { method: 'PATCH', body: { status: confirmButton.dataset.apptStatus } }); flash(confirmButton.dataset.apptStatus === 'Confirmado' ? 'Solicitação confirmada.' : 'Solicitação cancelada.'); await renderView(currentView); }
        catch (error) { flash(error.message, true); confirmButton.disabled = false; }
>>>>>>> 0661d751b750162f7c6ce9b13ca08381ff0186a0
        return;
      }
      const cancelButton = event.target.closest('[data-patient-cancel]');
      if (cancelButton) {
        if (!window.confirm('Cancelar esta solicitação de consulta?')) return;
        cancelButton.disabled = true;
<<<<<<< HEAD
        try {
          await api(`/agendamentos/${cancelButton.dataset.patientCancel}/cancelar`, {
            method: 'PATCH',
            body: {}
          });
          flash('Solicitação cancelada.');
          await renderView(currentView);
        } catch (error) {
          flash(error.message, true);
          cancelButton.disabled = false;
        }
=======
        try { await api(`/agendamentos/${cancelButton.dataset.patientCancel}/cancelar`, { method: 'PATCH', body: {} }); flash('Solicitação cancelada.'); await renderView(currentView); }
        catch (error) { flash(error.message, true); cancelButton.disabled = false; }
>>>>>>> 0661d751b750162f7c6ce9b13ca08381ff0186a0
        return;
      }
      const careButton = event.target.closest('[data-care]');
      if (careButton) {
        const dialog = document.getElementById('encounterDialog');
        document.getElementById('encounterAppointment').value = careButton.dataset.care;
        document.getElementById('encounterSubtitle').textContent = `Paciente: ${careButton.dataset.name} · Consulta em ${date(careButton.dataset.date)}. Registre somente informações necessárias.`;
        document.getElementById('encounterPressure').value = '';
        document.getElementById('encounterNotes').value = '';
        dialog.showModal();
        return;
      }
      const toggleUser = event.target.closest('[data-user-active]');
      if (toggleUser) {
        toggleUser.disabled = true;
<<<<<<< HEAD
        try {
          await api(`/usuarios/${toggleUser.dataset.userActive}/ativo`, {
            method: 'PATCH',
            body: { ativo: toggleUser.dataset.nextActive === 'true' }
          });
          flash(toggleUser.dataset.nextActive === 'true' ? 'Acesso reativado.' : 'Acesso desativado e sessões encerradas.');
          await renderView(currentView);
        } catch (error) {
          flash(error.message, true);
          toggleUser.disabled = false;
        }
=======
        try { await api(`/usuarios/${toggleUser.dataset.userActive}/ativo`, { method: 'PATCH', body: { ativo: toggleUser.dataset.nextActive === 'true' } }); flash(toggleUser.dataset.nextActive === 'true' ? 'Acesso reativado.' : 'Acesso desativado e sessões encerradas.'); await renderView(currentView); }
        catch (error) { flash(error.message, true); toggleUser.disabled = false; }
>>>>>>> 0661d751b750162f7c6ce9b13ca08381ff0186a0
        return;
      }
      const reload = event.target.closest('[data-reload]');
      if (reload) await renderView(currentView);
    });
    root.addEventListener('input', event => {
      if (!event.target.matches('[data-filter]')) return;
      const query = event.target.value.trim().toLowerCase();
<<<<<<< HEAD
      root.querySelectorAll('[data-row-search]').forEach(row => {
        row.hidden = !row.dataset.rowSearch.includes(query);
      });
    });
    document.getElementById('logout').addEventListener('click', async () => {
      try { await api('/logout', { method: 'POST' }); } catch {}
      localStorage.removeItem('pulse_token');
      location.replace('/');
    });
    const encounterCancel = document.getElementById('encounterCancel');
    if (encounterCancel) {
      encounterCancel.addEventListener('click', () => document.getElementById('encounterDialog').close());
    }
    const encounterForm = document.getElementById('encounterForm');
    if (encounterForm) {
      encounterForm.addEventListener('submit', async event => {
        event.preventDefault();
        const button = document.getElementById('encounterSubmit');
        button.disabled = true;
        button.textContent = 'Salvando…';
        try {
          await api('/atendimentos', {
            method: 'POST',
            body: {
              agendamento_id: Number(document.getElementById('encounterAppointment').value),
              pressao: document.getElementById('encounterPressure').value.trim(),
              observacoes: document.getElementById('encounterNotes').value.trim()
            }
          });
          document.getElementById('encounterDialog').close();
          flash('Atendimento registrado; a informação já está vinculada ao paciente.');
          await renderView(currentView);
        } catch (error) {
          flash(error.message, true);
        } finally {
          button.disabled = false;
          button.textContent = 'Salvar atendimento';
        }
      });
    }
  }

  async function patientHome() {
    const [metrics, appointments, encounters] = await Promise.all([
      api('/metricas'),
      api('/agendamentos'),
      api('/atendimentos')
    ]);
=======
      root.querySelectorAll('[data-row-search]').forEach(row => { row.hidden = !row.dataset.rowSearch.includes(query); });
    });
    document.getElementById('logout').addEventListener('click', async () => {
      try { await api('/logout', { method: 'POST' }); } catch {}
      localStorage.removeItem('pulse_token'); location.replace('/');
    });
    const encounterCancel = document.getElementById('encounterCancel');
    if (encounterCancel) encounterCancel.addEventListener('click', () => document.getElementById('encounterDialog').close());
    const encounterForm = document.getElementById('encounterForm');
    if (encounterForm) encounterForm.addEventListener('submit', async event => {
      event.preventDefault();
      const button = document.getElementById('encounterSubmit'); button.disabled = true; button.textContent = 'Salvando…';
      try {
        await api('/atendimentos', { method: 'POST', body: {
          agendamento_id: Number(document.getElementById('encounterAppointment').value),
          pressao: document.getElementById('encounterPressure').value.trim(),
          observacoes: document.getElementById('encounterNotes').value.trim()
        } });
        document.getElementById('encounterDialog').close(); flash('Atendimento registrado; a informação já está vinculada ao paciente.'); await renderView(currentView);
      } catch (error) { flash(error.message, true); }
      finally { button.disabled = false; button.textContent = 'Salvar atendimento'; }
    });
  }

  async function patientHome() {
    const [metrics, appointments, encounters] = await Promise.all([api('/metricas'), api('/agendamentos'), api('/atendimentos')]);
>>>>>>> 0661d751b750162f7c6ce9b13ca08381ff0186a0
    const last = metrics[0];
    const pending = appointments.filter(item => ['Solicitado', 'Confirmado', 'Em atendimento'].includes(item.status)).length;
    const intro = heading('SEU PAINEL DE SAÚDE', `Olá, ${user.nome.split(' ')[0]}.`, 'Acompanhe seus registros e mantenha suas informações de saúde organizadas.');
    const highlight = last
      ? `<div class="risk"><h2>Última aferição registrada: ${esc(last.pressao || '—')}</h2><p>${date(last.registrado_em, true)} · ${esc(last.batimento || '—')} bpm · Você informou: ${esc(last.status || '—')}. O sistema não interpreta nem diagnostica seus resultados.</p><button class="btn" data-go="metrics">Ver aferições</button></div>`
      : `<div class="risk"><h2>Comece seu acompanhamento</h2><p>Registre uma aferição para organizar seu histórico. Em caso de sintomas graves, procure atendimento de urgência.</p><button class="btn" data-go="metrics">Registrar aferição</button></div>`;
    return `${intro}${highlight}<div class="grid stat-grid">${statCard('♥', 'Última pressão', last?.pressao || '—', last ? date(last.registrado_em) : 'Registre sua primeira aferição')}${statCard('↗', 'Frequência cardíaca', last?.batimento ? `${last.batimento} bpm` : '—', 'Informada na última aferição')}${statCard('▣', 'Consultas em andamento', pending, 'Solicitações ligadas à sua conta')}${statCard('＋', 'Aferições registradas', metrics.length, 'Histórico pessoal')}</div><div class="grid content-grid"><section><div class="panel"><div class="panel-head"><h2>Aferições recentes</h2><button class="btn secondary small" data-go="metrics">Ver histórico</button></div>${metricTable(metrics.slice(0, 5))}</div><div class="panel"><div class="panel-head"><h2>Minhas consultas</h2><button class="btn secondary small" data-go="appointments">Solicitar horário</button></div>${appointmentTable(appointments.slice(0, 4), 'patient')}</div></section><aside><div class="panel"><h2>Informação importante</h2><div class="notice-list">Os registros servem para acompanhamento e devem ser discutidos com a equipe de saúde. O PulseVida não realiza diagnóstico nem substitui atendimento médico.</div><p class="help">Se tiver dor no peito, falta de ar intensa, desmaio ou sintomas graves, procure um serviço de emergência.</p></div><div class="panel"><h2>Atendimentos recentes</h2>${encounters.length ? `<div class="stack">${encounters.slice(0, 3).map(item => `<article class="record-card"><h3>${date(item.criado_em)} · ${esc(item.profissional || 'Equipe de saúde')}</h3><div class="record-meta">${item.pressao ? `Pressão registrada: ${esc(item.pressao)}` : 'Acompanhamento'}</div><p>${esc(item.observacoes || 'Sem observações adicionais.')}</p></article>`).join('')}</div>` : '<div class="empty">Seus atendimentos aparecerão aqui.</div>'}</div></aside></div>`;
  }

  async function metricsView(staff = false) {
    const rows = await api('/metricas');
    const form = staff ? '' : `<section class="panel"><div class="panel-head"><h2>Nova aferição</h2></div><form id="metricForm" class="form-grid"><div class="field"><label for="pressao">Pressão arterial (mmHg)</label><input id="pressao" placeholder="120/80" inputmode="numeric" pattern="[0-9]{2,3}\\s*/\\s*[0-9]{2,3}" required></div><div class="field"><label for="batimento">Frequência cardíaca (bpm)</label><input id="batimento" type="number" min="20" max="260" inputmode="numeric" required></div><div class="field"><label for="status">Como você está se sentindo?</label><select id="status"><option>Estável</option><option>Atenção</option><option>Não estou me sentindo bem</option></select></div><div class="field"><label for="observacoes">Observação (opcional)</label><input id="observacoes" maxlength="500" placeholder="Ex.: medição feita em repouso"></div><div class="form-actions"><button class="btn" type="submit">Salvar aferição</button></div></form><div class="notice">Registre o valor do aparelho. A plataforma não classifica valores nem substitui a avaliação profissional.</div></section>`;
    return `${heading(staff ? 'ACOMPANHAMENTO CLÍNICO' : 'ACOMPANHAMENTO', staff ? 'Aferições registradas' : 'Seu histórico de aferições', staff ? 'Consulte registros informados por pacientes para apoiar o atendimento autorizado.' : 'Veja os registros que você informou ao longo do tempo.')}${form}<section class="panel"><div class="panel-head"><h2>${staff ? 'Registros de pacientes' : 'Histórico pessoal'}</h2><span class="badge">${rows.length} registros</span></div>${metricTable(rows, staff)}</section>`;
  }

  async function appointmentsView() {
    const rows = await api('/agendamentos');
    return `${heading('CUIDADO PLANEJADO', 'Consultas e agendamentos', 'Solicite um horário e acompanhe o status atualizado pela equipe de saúde.')}<section class="panel"><div class="panel-head"><h2>Solicitar consulta</h2></div><form id="appointmentForm" class="form-grid"><div class="field"><label for="especialidade">Especialidade ou motivo</label><input id="especialidade" maxlength="100" placeholder="Ex.: clínica geral" required></div><div class="field"><label for="medico">Profissional desejado (opcional)</label><input id="medico" maxlength="120" placeholder="Nome, se houver preferência"></div><div class="field"><label for="data">Data desejada</label><input type="date" id="data" min="${todayInSaquarema()}" required></div><div class="field"><label for="horario">Horário desejado</label><input type="time" id="horario" required></div><div class="field full"><label for="hospital">Unidade de saúde</label><select id="hospital" required><option value="">Selecione uma unidade</option>${units.map(unit => `<option value="${esc(unit)}">${esc(unit)}</option>`).join('')}</select></div><div class="form-actions"><button class="btn" type="submit">Enviar solicitação</button></div></form><div class="notice">O pedido não confirma uma consulta. Aguarde a confirmação da unidade pelo próprio PulseVida.</div></section><section class="panel"><div class="panel-head"><h2>Minhas solicitações</h2><span class="badge">${rows.length}</span></div>${appointmentTable(rows, 'patient')}</section>`;
  }

  async function historyView() {
    const rows = await api('/atendimentos');
    return `${heading('SEU CUIDADO', 'Histórico de atendimentos', 'Consulte observações de acompanhamento registradas pela equipe de saúde.')}${rows.length ? `<div class="stack">${rows.map(item => `<article class="panel"><div class="panel-head"><h2>Atendimento · ${date(item.criado_em)}</h2>${item.pressao ? statusBadge(`Pressão ${item.pressao}`) : statusBadge('Registrado')}</div><p class="record-meta">Profissional: ${esc(item.profissional || 'Equipe de saúde')}</p><p>${esc(item.observacoes || 'Nenhuma observação adicional.')}</p></article>`).join('')}</div>` : '<section class="panel empty">Ainda não há atendimentos vinculados à sua conta.</section>'}`;
  }

  async function profileView() {
    user = await api('/me');
<<<<<<< HEAD
    const currentUf = (user.crm_uf || 'RJ').toUpperCase();
    const rawCrm = String(user.crm_numero || user.crm || '').replace(/^CRM-[A-Z]{2}\s*/i, '');
    const showCrm = true;
    const crmFields = showCrm
      ? `<div class="field"><label for="profileCrmUf">UF do CRM (opcional)</label><select id="profileCrmUf">${ufs.map(uf => `<option value="${uf}" ${uf === currentUf ? 'selected' : ''}>${uf}</option>`).join('')}</select></div><div class="field"><label for="profileCrm">CRM (opcional)</label><input id="profileCrm" value="${esc(rawCrm)}" inputmode="numeric" maxlength="12" placeholder="Ex.: 5212345"></div>`
      : '';

    return `${heading('SEU CADASTRO', 'Meus dados', 'Atualize as informações básicas da sua conta. Só você pode editar estes dados.')}<section class="panel"><form id="profileForm" class="form-grid"><div class="field full"><label for="profileName">Nome completo</label><input id="profileName" value="${esc(user.nome)}" maxlength="120" required></div><div class="field"><label for="profileEmail">E-mail</label><input id="profileEmail" type="email" value="${esc(user.email)}" maxlength="254" required></div><div class="field"><label for="profileUsername">Usuário (não editável)</label><input id="profileUsername" value="${esc(user.usuario)}" disabled></div><div class="field"><label for="profileCpf">CPF (opcional)</label><input id="profileCpf" value="${esc(user.cpf)}" inputmode="numeric" maxlength="14" placeholder="000.000.000-00"></div><div class="field"><label for="profileSus">Cartão SUS (opcional)</label><input id="profileSus" value="${esc(user.sus)}" inputmode="numeric" maxlength="15"></div>${crmFields}<div class="form-actions"><button class="btn" type="submit">Salvar meus dados</button></div></form><div class="notice">Informe CPF, Cartão SUS ou CRM apenas se forem necessários para o fluxo acadêmico de demonstração. Evite inserir dados reais.</div></section>`;
  }

  async function careView() {
    const [appointments, encounters] = await Promise.all([
      api('/agendamentos'),
      api('/atendimentos')
    ]);
=======
    return `${heading('SEU CADASTRO', 'Meus dados', 'Atualize as informações básicas da sua conta. Só você pode editar estes dados.')}<section class="panel"><form id="profileForm" class="form-grid"><div class="field full"><label for="profileName">Nome completo</label><input id="profileName" value="${esc(user.nome)}" maxlength="120" required></div><div class="field"><label for="profileEmail">E-mail</label><input id="profileEmail" type="email" value="${esc(user.email)}" maxlength="254" required></div><div class="field"><label for="profileUsername">Usuário (não editável)</label><input id="profileUsername" value="${esc(user.usuario)}" disabled></div><div class="field"><label for="profileCpf">CPF (opcional)</label><input id="profileCpf" value="${esc(user.cpf)}" inputmode="numeric" maxlength="14" placeholder="000.000.000-00"></div><div class="field"><label for="profileSus">Cartão SUS (opcional)</label><input id="profileSus" value="${esc(user.sus)}" inputmode="numeric" maxlength="15"></div><div class="form-actions"><button class="btn" type="submit">Salvar meus dados</button></div></form><div class="notice">Informe CPF e Cartão SUS apenas se forem necessários para o fluxo acadêmico de demonstração. Evite inserir dados reais.</div></section>`;
  }

  async function careView() {
    const [appointments, encounters] = await Promise.all([api('/agendamentos'), api('/atendimentos')]);
>>>>>>> 0661d751b750162f7c6ce9b13ca08381ff0186a0
    const active = appointments.filter(item => !['Atendido', 'Cancelado'].includes(item.status));
    return `${heading('EQUIPE DE SAÚDE', 'Fila de atendimento', 'Revise os pedidos, confirme os horários e registre atendimentos vinculados ao agendamento.')}<section class="panel"><div class="panel-head"><h2>Solicitações e consultas</h2><button class="btn secondary small" data-reload>Atualizar</button></div><div class="toolbar"><input data-filter placeholder="Buscar por paciente, unidade ou especialidade" aria-label="Filtrar a fila"></div>${active.length ? appointmentTable(active, 'staff') : '<div class="empty">Não há solicitações em andamento.</div>'}</section><section class="panel"><div class="panel-head"><h2>Atendimentos registrados</h2><span class="badge">${encounters.length}</span></div>${encounters.length ? `<div class="table-wrap"><table><thead><tr><th>Paciente</th><th>Data</th><th>Pressão informada</th><th>Observações</th></tr></thead><tbody>${encounters.map(item => `<tr><td>${esc(item.nome_paciente || 'Paciente')}</td><td>${date(item.criado_em)}</td><td>${esc(item.pressao || '—')}</td><td>${esc(item.observacoes || '—')}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">Nenhum atendimento registrado.</div>'}</section>`;
  }

  async function adminHome() {
<<<<<<< HEAD
    const [users, appointments] = await Promise.all([
      api('/usuarios'),
      api('/agendamentos')
    ]);
=======
    const [users, appointments] = await Promise.all([api('/usuarios'), api('/agendamentos')]);
>>>>>>> 0661d751b750162f7c6ce9b13ca08381ff0186a0
    const patients = users.filter(item => item.tipo === 'paciente');
    const professionals = users.filter(item => item.tipo === 'medico');
    const pending = appointments.filter(item => item.status === 'Solicitado');
    return `${heading('GESTÃO DA PLATAFORMA', 'Visão geral', 'Gerencie acessos e acompanhe solicitações de consulta. Os registros clínicos são acessados apenas nos fluxos assistenciais autorizados.')}<div class="grid stat-grid admin-grid">${statCard('♙', 'Contas ativas', users.filter(item => item.ativo).length, `${users.length} no total`)}${statCard('♥', 'Pacientes', patients.length, 'Contas cadastradas')}${statCard('✚', 'Profissionais de saúde', professionals.length, 'Acessos de equipe')}${statCard('▣', 'Solicitações pendentes', pending.length, `${appointments.length} agendamentos no total`)}</div><section class="panel"><div class="panel-head"><h2>Solicitações recentes</h2><button class="btn secondary small" data-go="appointments">Gerenciar agenda</button></div>${appointmentTable(appointments.slice(0, 6), 'admin')}</section><section class="panel"><div class="panel-head"><h2>Usuários recentes</h2><button class="btn secondary small" data-go="users">Gerenciar acessos</button></div>${users.length ? `<div class="table-wrap"><table><thead><tr><th>Nome</th><th>Usuário</th><th>Perfil</th><th>Acesso</th></tr></thead><tbody>${users.slice(0, 8).map(item => `<tr><td>${esc(item.nome)}</td><td>${esc(item.usuario)}</td><td>${statusBadge(roleLabels[item.tipo] || item.tipo)}</td><td>${item.ativo ? statusBadge('Ativo') : statusBadge('Desativado')}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">Nenhuma conta encontrada.</div>'}</section>`;
  }

  async function usersView() {
    const users = await api('/usuarios');
    return `${heading('GESTÃO DE ACESSOS', 'Usuários cadastrados', 'Consulte os perfis e controle o acesso. O cadastro público não cria contas profissionais.')}<section class="panel"><div class="panel-head"><h2>Contas</h2><span class="badge">${users.length}</span></div>${users.length ? `<div class="table-wrap"><table><thead><tr><th>Nome</th><th>Usuário / e-mail</th><th>Perfil</th><th>Especialidade</th><th>Estado</th><th>Ação</th></tr></thead><tbody>${users.map(item => `<tr><td>${esc(item.nome)}</td><td>${esc(item.usuario)}<div class="record-meta">${esc(item.email)}</div></td><td>${statusBadge(roleLabels[item.tipo] || item.tipo)}</td><td>${esc(item.especialidade || '—')}</td><td>${item.ativo ? statusBadge('Ativo') : statusBadge('Desativado')}</td><td>${staffRowActions(item)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">Nenhuma conta encontrada.</div>'}</section><section class="panel"><div class="panel-head"><h2>Criar acesso de equipe</h2></div><p class="help">Crie um acesso profissional somente após validar a identidade e a autorização institucional. A senha inicial não é exibida após salvar.</p><form id="staffForm" class="form-grid"><div class="field"><label for="staffName">Nome completo</label><input id="staffName" required maxlength="120"></div><div class="field"><label for="staffUser">Nome de usuário</label><input id="staffUser" required minlength="3" maxlength="48" pattern="[A-Za-z0-9._-]{3,48}"></div><div class="field"><label for="staffEmail">E-mail</label><input id="staffEmail" type="email" required maxlength="254"></div><div class="field"><label for="staffPass">Senha inicial (mínimo 12 caracteres)</label><input id="staffPass" type="password" minlength="12" maxlength="128" autocomplete="new-password" required></div><div class="field"><label for="staffRole">Perfil</label><select id="staffRole"><option value="medico">Profissional de saúde</option><option value="administrador">Administrador</option></select></div><div class="field"><label for="staffSpecialty">Especialidade ou equipe</label><input id="staffSpecialty" maxlength="100" placeholder="Ex.: Clínica geral"></div><div class="field"><label for="staffCrm">Registro profissional (opcional)</label><input id="staffCrm" maxlength="30" placeholder="Conforme validação institucional"></div><div class="form-actions"><button class="btn" type="submit">Criar acesso</button></div></form></section>`;
  }

  async function appointmentsAdminView() {
    const rows = await api('/agendamentos');
    return `${heading('GESTÃO DA AGENDA', 'Agendamentos', 'Consulte e atualize o status das solicitações compartilhadas com pacientes e equipe.')}<section class="panel"><div class="panel-head"><h2>Todas as solicitações</h2><button class="btn secondary small" data-reload>Atualizar</button></div><div class="toolbar"><input data-filter placeholder="Buscar por paciente, unidade ou especialidade" aria-label="Filtrar agendamentos"></div>${appointmentTable(rows, 'admin')}</section>`;
  }

  async function feedbacksView() {
    const rows = await api('/pesquisas');
    return `${heading('MELHORIA CONTÍNUA', 'Feedbacks do projeto', 'Opiniões registradas na pesquisa de satisfação.')}${rows.length ? `<div class="stack">${rows.map(item => `<article class="panel"><div class="panel-head"><h2>${esc(item.nome || 'Anônimo')}</h2><span class="record-meta">${date(item.criado_em, true)}</span></div><h3>Pontos positivos</h3><p>${esc(item.positivo)}</p><h3>Dificuldades</h3><p>${esc(item.negativo)}</p>${item.sugestoes ? `<h3>Sugestões</h3><p>${esc(item.sugestoes)}</p>` : ''}</article>`).join('')}</div>` : '<section class="panel empty">Ainda não há feedbacks registrados. <a href="/feedback">Abrir a pesquisa pública</a></section>'}`;
  }

  function bindForms() {
    const content = document.getElementById('content');
<<<<<<< HEAD

    const metricForm = content.querySelector('#metricForm');
    if (metricForm) {
      metricForm.addEventListener('submit', async event => {
        event.preventDefault();
        const button = metricForm.querySelector('button[type="submit"]');
        button.disabled = true;
        try {
          await api('/metricas', {
            method: 'POST',
            body: {
              pressao: content.querySelector('#pressao').value,
              batimento: Number(content.querySelector('#batimento').value),
              status: content.querySelector('#status').value,
              observacoes: content.querySelector('#observacoes').value
            }
          });
          flash('Aferição registrada no seu histórico.');
          await renderView('metrics');
        } catch (error) {
          flash(error.message, true);
          button.disabled = false;
        }
      });
    }

    const appointmentForm = content.querySelector('#appointmentForm');
    if (appointmentForm) {
      appointmentForm.addEventListener('submit', async event => {
        event.preventDefault();
        const button = appointmentForm.querySelector('button[type="submit"]');
        button.disabled = true;
        button.textContent = 'Enviando…';
        try {
          await api('/agendamentos', {
            method: 'POST',
            body: {
              especialidade: content.querySelector('#especialidade').value.trim(),
              medico: content.querySelector('#medico').value.trim(),
              data: content.querySelector('#data').value,
              horario: content.querySelector('#horario').value,
              hospital: content.querySelector('#hospital').value
            }
          });
          flash('Solicitação enviada. Aguarde a confirmação da unidade.');
          await renderView('appointments');
        } catch (error) {
          flash(error.message, true);
          button.disabled = false;
          button.textContent = 'Enviar solicitação';
        }
      });
    }

    const profileForm = content.querySelector('#profileForm');
    if (profileForm) {
      profileForm.addEventListener('submit', async event => {
        event.preventDefault();
        const button = profileForm.querySelector('button[type="submit"]');
        button.disabled = true;
        button.textContent = 'Salvando…';

        const ufSelect = content.querySelector('#profileCrmUf');
        const crmInput = content.querySelector('#profileCrm');
        const crmUf = ufSelect ? ufSelect.value : '';
        const crmNumero = crmInput ? crmInput.value.replace(/\D/g, '').trim() : '';
        const crmFormatado = crmNumero ? `CRM-${crmUf || 'RJ'} ${crmNumero}` : '';

        try {
          const payload = {
            nome: content.querySelector('#profileName').value.trim(),
            email: content.querySelector('#profileEmail').value.trim(),
            cpf: content.querySelector('#profileCpf').value.trim(),
            sus: content.querySelector('#profileSus').value.trim()
          };
          if (ufSelect || crmInput) {
            payload.crm_uf = crmNumero ? (crmUf || 'RJ') : '';
            payload.crm_numero = crmNumero;
            payload.crm = crmFormatado;
          }

          await api('/me', {
            method: 'PATCH',
            body: payload
          });
          flash('Dados atualizados com sucesso.');
          await renderView('profile');
        } catch (error) {
          flash(error.message, true);
          button.disabled = false;
          button.textContent = 'Salvar meus dados';
        }
      });
    }
  }
=======
    const metricForm = content.querySelector('#metricForm');
    if (metricForm) metricForm.addEventListener('submit', async event => {
      event.preventDefault();
      const button = metricForm.querySelector('button[type="submit"]'); button.disabled = true;
      try {
        await api('/metricas', { method: 'POST', body: {
          pressao: content.querySelector('#pressao').value,
          batimento: Number(content.querySelector('#batimento').value),
          status: content.querySelector('#status').value,
          observacoes: content.querySelector('#observacoes').value
        } });
        flash('Aferição registrada no seu histórico.'); await renderView('metrics');
      } catch (error) { flash(error.message, true); button.disabled = false; }
    });
    const appointmentForm = content.querySelector('#appointmentForm');
    if (appointmentForm) appointmentForm.addEventListener('submit', async event => {
      event.preventDefault();
      const button = appointmentForm.querySelector('button[type="submit"]'); button.disabled = true; button.textContent = 'Enviando…';
      try {
        await api('/agendamentos', { method: 'POST', body: {
          especialidade: content.querySelector('#especialidade').value.trim(),
          medico: content.querySelector('#medico').value.trim(),
          data: content.querySelector('#data').value,
          horario: content.querySelector('#horario').value,
          hospital: content.querySelector('#hospital').value
        } });
        flash('Solicitação enviada. Aguarde a confirmação da unidade.'); await renderView('appointments');
      } catch (error) { flash(error.message, true); button.disabled = false; button.textContent = 'Enviar solicitação'; }
    });
    const profileForm = content.querySelector('#profileForm');
    if (profileForm) profileForm.addEventListener('submit', async event => {
      event.preventDefault();
      const button = profileForm.querySelector('button[type="submit"]'); button.disabled = true;
      try {
        user = await api('/me', { method: 'PATCH', body: {
          nome: content.querySelector('#profileName').value.trim(),
          email: content.querySelector('#profileEmail').value.trim(),
          cpf: content.querySelector('#profileCpf').value.trim(),
          sus: content.querySelector('#profileSus').value.trim()
        } });
        flash('Dados atualizados com sucesso.');
        const nameEl = document.getElementById('userName');
        if (nameEl) nameEl.textContent = user.nome || user.usuario;
        const avatarEl = document.getElementById('avatar');
        if (avatarEl) avatarEl.textContent = (user.nome || 'U').trim().slice(0, 1).toUpperCase();
      } catch (error) { flash(error.message, true); }
      finally { button.disabled = false; }
    });
    const staffForm = content.querySelector('#staffForm');
    if (staffForm) staffForm.addEventListener('submit', async event => {
      event.preventDefault();
      const button = staffForm.querySelector('button[type="submit"]'); button.disabled = true; button.textContent = 'Criando…';
      try {
        await api('/usuarios/equipe', { method: 'POST', body: {
          nome: content.querySelector('#staffName').value.trim(),
          usuario: content.querySelector('#staffUser').value.trim(),
          email: content.querySelector('#staffEmail').value.trim(),
          senha: content.querySelector('#staffPass').value,
          tipo: content.querySelector('#staffRole').value,
          especialidade: content.querySelector('#staffSpecialty').value.trim(),
          crm: content.querySelector('#staffCrm').value.trim()
        } });
        flash('Acesso de equipe criado com sucesso.'); await renderView('users');
      } catch (error) { flash(error.message, true); button.disabled = false; button.textContent = 'Criar acesso'; }
    });
  }

  async function renderView(view) {
    currentView = view;
    const content = document.getElementById('content');
    content.innerHTML = '<div class="empty">Carregando…</div>';
    try {
      if (role === 'paciente') {
        if (view === 'home') content.innerHTML = await patientHome();
        else if (view === 'metrics') content.innerHTML = await metricsView();
        else if (view === 'appointments') content.innerHTML = await appointmentsView();
        else if (view === 'history') content.innerHTML = await historyView();
        else if (view === 'profile') content.innerHTML = await profileView();
      } else if (role === 'medico') {
        if (view === 'care') content.innerHTML = await careView();
        else if (view === 'metrics') content.innerHTML = await metricsView(true);
      } else if (role === 'administrador') {
        if (view === 'admin') content.innerHTML = await adminHome();
        else if (view === 'users') content.innerHTML = await usersView();
        else if (view === 'appointments') content.innerHTML = await appointmentsAdminView();
        else if (view === 'feedbacks') content.innerHTML = await feedbacksView();
      }
      bindForms();
    } catch (error) {
      content.innerHTML = `<div class="panel empty"><h2>Não foi possível carregar esta seção.</h2><p class="record-meta">${esc(error.message)}</p><button class="btn secondary" data-reload>Tentar novamente</button></div>`;
    }
  }

  async function init() {
    if (!token()) { location.replace('/login'); return; }
    try {
      user = await api('/me');
      role = user.tipo;
      if (!roleLabels[role]) { location.replace('/login'); return; }
      const path = location.pathname;
      if (path === '/portal/paciente' && role !== 'paciente') { location.replace(destinations[role]); return; }
      if (path === '/portal/profissional' && role !== 'medico') { location.replace(destinations[role]); return; }
      if (path === '/portal/administracao' && role !== 'administrador') { location.replace(destinations[role]); return; }
      shell();
      let initialView = 'home';
      if (role === 'medico') initialView = 'care';
      if (role === 'administrador') initialView = 'admin';
      await renderView(initialView);
    } catch {
      localStorage.removeItem('pulse_token');
      location.replace('/login');
    }
  }

  init();
>>>>>>> 0661d751b750162f7c6ce9b13ca08381ff0186a0
})();