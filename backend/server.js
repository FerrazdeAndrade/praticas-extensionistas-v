const express = require('express');
const mysql = require('mysql2/promise');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = Number(process.env.PORT || 3000);

const PUBLIC_DIR = path.resolve(__dirname, '../frontend/public');
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

const UNIDADES = [
  'Hospital Municipal Porphirio Nunes de Azeredo (Bacaxá)',
  'Hospital Municipal Nossa Senhora de Nazareth (Verde Vale)',
  'Hospital Estadual dos Lagos (Barreira)'
];
const PERFIS = new Set(['paciente', 'medico', 'administrador']);
const STATUS_AGENDAMENTO = new Set(['Solicitado', 'Confirmado', 'Em atendimento', 'Atendido', 'Cancelado']);
const scryptOptions = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

function poolOptionsFromUrl(raw) {
  if (!raw) throw new Error('DATABASE_URL não configurada.');
  let url;
  try { url = new URL(raw); } catch { throw new Error('DATABASE_URL inválida.'); }
  if (!['mysql:', 'mysqls:'].includes(url.protocol)) throw new Error('O banco configurado precisa aceitar conexão MySQL.');
  const params = url.searchParams;
  const sslParam = params.get('ssl-mode') || params.get('sslmode') || params.get('ssl') || params.get('tls');
  const sslOff = sslParam && /^(disable|disabled|false|0|none)$/i.test(sslParam);
  const sslOn = url.protocol === 'mysqls:' || (sslParam && !sslOff);
  let ssl;
  if (sslOn) {
    try {
      const parsedSsl = JSON.parse(sslParam || 'null');
      ssl = parsedSsl && typeof parsedSsl === 'object' ? parsedSsl : { rejectUnauthorized: true };
    } catch {
      ssl = { rejectUnauthorized: !/allow|insecure|skip-verify/i.test(sslParam || '') };
    }
  }
  return {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.replace(/^\//, '')),
    waitForConnections: true,
    connectionLimit: 8,
    queueLimit: 0,
    connectTimeout: 12000,
    timezone: 'Z',
    dateStrings: true,
    charset: 'utf8mb4',
    enableKeepAlive: true,
    ...(ssl ? { ssl } : {})
  };
}

const pool = mysql.createPool(poolOptionsFromUrl(process.env.DATABASE_URL || process.env.DRIZZLE_DATABASE_URL));

function scrypt(password, salt, length = 64) {
  return new Promise((resolve, reject) => crypto.scrypt(password, salt, length, scryptOptions, (error, key) => error ? reject(error) : resolve(key)));
}
async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(password, salt);
  return `scrypt$${scryptOptions.N}$${scryptOptions.r}$${scryptOptions.p}$${salt.toString('base64url')}$${key.toString('base64url')}`;
}
async function verifyPassword(password, stored) {
  const parts = String(stored || '').split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, n, r, p, saltText, keyText] = parts;
  if (Number(n) !== scryptOptions.N || Number(r) !== scryptOptions.r || Number(p) !== scryptOptions.p) return false;
  try {
    const salt = Buffer.from(saltText, 'base64url');
    const expected = Buffer.from(keyText, 'base64url');
    const actual = await scrypt(password, salt, expected.length);
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  } catch { return false; }
}

async function migrate() {
  await pool.execute(`CREATE TABLE IF NOT EXISTS schema_migrations (
    migration_id VARCHAR(190) NOT NULL PRIMARY KEY,
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  const files = fs.readdirSync(MIGRATIONS_DIR).filter(name => /^\d+_[a-z0-9_-]+\.sql$/i.test(name)).sort();
  for (const file of files) {
    const [seen] = await pool.execute('SELECT migration_id FROM schema_migrations WHERE migration_id = ?', [file]);
    if (seen.length) continue;
    const source = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    const statements = source.split(';').map(sql => sql.split('\n').filter(line => !line.trim().startsWith('--')).join('\n').trim()).filter(Boolean);
    for (const statement of statements) await pool.query(statement);
    await pool.execute('INSERT INTO schema_migrations (migration_id) VALUES (?)', [file]);
    console.info(`[PulseVida] Migração aplicada: ${file}`);
  }
}

async function bootstrapAdmin() {
  const password = process.env.PULSE_BOOTSTRAP_ADMIN_PASSWORD;
  const [admins] = await pool.execute("SELECT id FROM usuarios WHERE tipo = 'administrador' LIMIT 1");
  if (admins.length) { delete process.env.PULSE_BOOTSTRAP_ADMIN_PASSWORD; return; }
  if (!password || password.length < 12) {
    console.warn('[PulseVida] Nenhum administrador existe. Configure PULSE_BOOTSTRAP_ADMIN_PASSWORD (mínimo 12 caracteres) para criar a conta inicial.');
    return;
  }
  const senhaHash = await hashPassword(password);
  await pool.execute(
    "INSERT INTO usuarios (nome, usuario, email, senha_hash, tipo) VALUES (?, ?, ?, ?, 'administrador')",
    ['Administrador PulseVida', 'admin', 'admin@pulsevida.local', senhaHash]
  );
  delete process.env.PULSE_BOOTSTRAP_ADMIN_PASSWORD;
  console.info('[PulseVida] Conta administrativa inicial criada com login `admin`.');
}

function fail(res, status, mensagem) { return res.status(status).json({ mensagem }); }
function clean(value, max = 500) { return String(value ?? '').trim().slice(0, max); }
function validEmail(value) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254; }
function isCalendarDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [, year, month, day] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
function validUsername(value) { return /^[a-zA-Z0-9._-]{3,48}$/.test(value); }
function safeUser(row, { includeSensitive = false } = {}) {
  const user = {
    id: Number(row.id), nome: row.nome, usuario: row.usuario, email: row.email,
    tipo: row.tipo, especialidade: row.especialidade || '',
    crm: row.crm || '', ativo: Boolean(row.ativo), criado_em: row.criado_em
  };
  if (includeSensitive) { user.cpf = row.cpf || ''; user.sus = row.sus || ''; }
  return user;
}
function isDuplicate(error) { return error && error.code === 'ER_DUP_ENTRY'; }
function roles(...allowed) {
  return (req, res, next) => PERFIS.has(req.user?.tipo) && allowed.includes(req.user.tipo)
    ? next() : fail(res, 403, 'Seu perfil não tem permissão para esta ação.');
}

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy', "default-src 'self'; base-uri 'self'; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; form-action 'self'");
  res.setHeader('Cache-Control', 'no-store');
  next();
});
app.use(express.json({ limit: '32kb', strict: true }));

app.get(['/healthz', '/api/health'], async (_req, res) => {
  try {
    await pool.execute('SELECT 1');
    res.setHeader('Cache-Control', 'no-store');
    res.json({ status: 'ok', service: 'PulseVida', database: 'connected' });
  } catch {
    res.status(503).json({ status: 'unavailable', service: 'PulseVida' });
  }
});

const loginAttempts = new Map();
function loginRateLimit(req, res, next) {
  const now = Date.now();
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const entry = loginAttempts.get(ip) || { count: 0, until: now + 15 * 60 * 1000 };
  if (entry.until <= now) { entry.count = 0; entry.until = now + 15 * 60 * 1000; }
  entry.count += 1;
  loginAttempts.set(ip, entry);
  if (loginAttempts.size > 1000) {
    for (const [key, item] of loginAttempts) if (item.until <= now) loginAttempts.delete(key);
  }
  if (entry.count > 12) return fail(res, 429, 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.');
  next();
}

async function authenticate(req, res, next) {
  const authorization = req.get('authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!token || token.length < 32 || token.length > 160) return fail(res, 401, 'Sua sessão expirou. Entre novamente.');
  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const [rows] = await pool.execute(
      `SELECT u.* FROM sessoes s INNER JOIN usuarios u ON u.id = s.usuario_id
       WHERE s.token_hash = ? AND s.expira_em > UTC_TIMESTAMP() AND u.ativo = 1 LIMIT 1`, [tokenHash]
    );
    if (!rows.length) return fail(res, 401, 'Sua sessão expirou ou o acesso foi desativado. Entre novamente.');
    req.user = safeUser(rows[0], { includeSensitive: rows[0].tipo === 'paciente' });
    req.tokenHash = tokenHash;
    next();
  } catch (error) { next(error); }
}

app.post('/api/login', loginRateLimit, async (req, res, next) => {
  try {
    const usuario = clean(req.body?.usuario, 254).toLowerCase();
    const senha = String(req.body?.senha || '');
    if (!usuario || !senha || senha.length > 128) return fail(res, 400, 'Informe usuário/e-mail e senha.');
    const [rows] = await pool.execute('SELECT * FROM usuarios WHERE usuario = ? OR email = ? LIMIT 1', [usuario, usuario]);
    const row = rows[0];
    if (!row || !row.ativo || !(await verifyPassword(senha, row.senha_hash))) return fail(res, 401, 'Usuário/e-mail ou senha inválidos.');
    if (req.body?.tipo && req.body.tipo !== row.tipo) return fail(res, 403, 'O perfil informado não corresponde a esta conta.');
    const token = crypto.randomBytes(32).toString('base64url');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await pool.execute('INSERT INTO sessoes (usuario_id, token_hash, expira_em) VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 12 HOUR))', [row.id, tokenHash]);
    res.setHeader('Cache-Control', 'no-store');
    res.json({ token, usuario: safeUser(row, { includeSensitive: row.tipo === 'paciente' }), expiresIn: 43200 });
  } catch (error) { next(error); }
});

app.post('/api/logout', authenticate, async (req, res, next) => {
  try {
    await pool.execute('DELETE FROM sessoes WHERE token_hash = ?', [req.tokenHash]);
    res.json({ sucesso: true });
  } catch (error) { next(error); }
});

app.post('/api/usuarios', async (req, res, next) => {
  try {
    const nome = clean(req.body?.nome, 120);
    const usuario = clean(req.body?.usuario, 48).toLowerCase();
    const email = clean(req.body?.email, 254).toLowerCase();
    const senha = String(req.body?.senha || '');
    if (nome.length < 2) return fail(res, 400, 'Informe seu nome completo.');
    if (!validUsername(usuario)) return fail(res, 400, 'O usuário deve ter de 3 a 48 caracteres.');
    if (!validEmail(email)) return fail(res, 400, 'Informe um e-mail válido.');
    if (senha.length < 10 || senha.length > 128) return fail(res, 400, 'A senha deve ter no mínimo 10 caracteres.');
    const senhaHash = await hashPassword(senha);
    const [result] = await pool.execute(
      "INSERT INTO usuarios (nome, usuario, email, senha_hash, tipo) VALUES (?, ?, ?, ?, 'paciente')",
      [nome, usuario, email, senhaHash]
    );
    res.status(201).json({ sucesso: true, id: Number(result.insertId), mensagem: 'Conta criada com sucesso.' });
  } catch (error) {
    if (isDuplicate(error)) return fail(res, 409, 'Este usuário ou e-mail já está cadastrado.');
    next(error);
  }
});

app.get('/api/me', authenticate, (req, res) => res.json(req.user));
app.patch('/api/me', authenticate, roles('paciente'), async (req, res, next) => {
  try {
    const nome = clean(req.body?.nome, 120);
    const email = clean(req.body?.email, 254).toLowerCase();
    const cpf = clean(req.body?.cpf, 20).replace(/[^0-9.-]/g, '');
    const sus = clean(req.body?.sus, 30).replace(/[^0-9]/g, '');
    if (nome.length < 2) return fail(res, 400, 'Informe seu nome completo.');
    if (!validEmail(email)) return fail(res, 400, 'Informe um e-mail válido.');
    await pool.execute('UPDATE usuarios SET nome = ?, email = ?, cpf = NULLIF(?, \'\'), sus = NULLIF(?, \'\') WHERE id = ?', [nome, email, cpf, sus, req.user.id]);
    const [rows] = await pool.execute('SELECT * FROM usuarios WHERE id = ?', [req.user.id]);
    res.json(safeUser(rows[0], { includeSensitive: true }));
  } catch (error) {
    if (isDuplicate(error)) return fail(res, 409, 'Este e-mail já está associado a outra conta.');
    next(error);
  }
});

app.get('/api/metricas', authenticate, roles('paciente', 'medico'), async (req, res, next) => {
  try {
    const params = [];
    let where = '';
    if (req.user.tipo === 'paciente') { where = 'WHERE m.usuario_id = ?'; params.push(req.user.id); }
    const [rows] = await pool.execute(
      `SELECT m.id, m.usuario_id, m.status,
       CONCAT(m.sistolica, '/', m.diastolica) AS pressao,
       CAST(m.batimento AS CHAR) AS batimento,
       m.observacoes, m.registrado_em,
       CASE WHEN ? = 'medico' THEN u.nome ELSE NULL END AS nome_paciente
       FROM metricas_usuario m INNER JOIN usuarios u ON u.id = m.usuario_id
       ${where} ORDER BY m.registrado_em DESC LIMIT 250`, [req.user.tipo, ...params]
    );
    res.json(rows);
  } catch (error) { next(error); }
});

app.post('/api/metricas', authenticate, roles('paciente'), async (req, res, next) => {
  try {
    const rawPressure = clean(req.body?.pressao, 20);
    const match = rawPressure.match(/^(\d{2,3})\s*\/\s*(\d{2,3})$/);
    const systolic = Number(match?.[1]);
    const diastolic = Number(match?.[2]);
    const heartRate = Number(req.body?.batimento);
    const status = clean(req.body?.status || 'Estável', 40);
    const allowedStatus = new Set(['Estável', 'Atenção', 'Não estou me sentindo bem']);
    if (!match || systolic < 50 || systolic > 300 || diastolic < 30 || diastolic > 200) return fail(res, 400, 'Informe a pressão no formato 120/80.');
    if (!Number.isInteger(heartRate) || heartRate < 20 || heartRate > 260) return fail(res, 400, 'Informe uma frequência cardíaca válida.');
    if (!allowedStatus.has(status)) return fail(res, 400, 'Selecione como você está se sentindo.');
    const observacoes = clean(req.body?.observacoes, 500);
    const [result] = await pool.execute('INSERT INTO metricas_usuario (usuario_id, status, sistolica, diastolica, batimento, observacoes) VALUES (?, ?, ?, ?, ?, NULLIF(?, \'\'))', [req.user.id, status, systolic, diastolic, heartRate, observacoes]);
    res.status(201).json({ sucesso: true, id: Number(result.insertId) });
  } catch (error) { next(error); }
});

app.get('/api/agendamentos', authenticate, roles('paciente', 'medico', 'administrador'), async (req, res, next) => {
  try {
    const isPatient = req.user.tipo === 'paciente';
    const baseQuery = `SELECT a.id, a.paciente_id, a.especialidade, a.medico_solicitado,
      COALESCE(m.nome, a.medico_solicitado) AS medico, a.medico_id,
      DATE_FORMAT(a.data, '%Y-%m-%d') AS data, TIME_FORMAT(a.horario, '%H:%i') AS horario,
      a.hospital, a.status, a.criado_em,
      p.nome AS paciente, CASE WHEN ? = 'medico' THEN p.email ELSE NULL END AS email_paciente
      FROM agendamentos a INNER JOIN usuarios p ON p.id = a.paciente_id
      LEFT JOIN usuarios m ON m.id = a.medico_id`;
    const params = [req.user.tipo];
    let whereClause = '';
    if (isPatient) {
      whereClause = ' WHERE a.paciente_id = ?';
      params.push(req.user.id);
    }
    const [rows] = await pool.execute(`${baseQuery}${whereClause} ORDER BY a.data DESC, a.horario DESC LIMIT 300`, params);
    res.json(rows);
  } catch (error) { next(error); }
});

app.get('/api/medico/fila', authenticate, roles('medico', 'administrador'), async (req, res, next) => {
  try {
    const isMedico = req.user.tipo === 'medico';
    const whereClause = isMedico
      ? 'WHERE a.medico_id = ? OR a.medico_id IS NULL OR LOWER(COALESCE(a.medico_solicitado, \'\')) = LOWER(?)'
      : '';
    const params = isMedico ? [req.user.id, req.user.nome] : [];

    const [rows] = await pool.execute(
      `SELECT
        a.id AS agendamento_id,
        p.nome AS nome_paciente,
        COALESCE(
          (
            SELECT CONCAT(
              'PA: ', m.sistolica, '/', m.diastolica, ' mmHg | ',
              'FC: ', m.batimento, ' bpm (', m.status, ')'
            )
            FROM metricas_usuario m
            WHERE m.usuario_id = p.id
            ORDER BY m.registrado_em DESC
            LIMIT 1
          ),
          'Sem aferições registradas'
        ) AS metricas_paciente,
        COALESCE(med.nome, a.medico_solicitado, CASE WHEN ? = 'medico' THEN ? ELSE 'A definir' END) AS nome_medico,
        COALESCE(med.especialidade, a.especialidade) AS especialidade_do_medico,
        COALESCE(med.crm, 'Não informado') AS CRM,
        TIME_FORMAT(a.horario, '%H:%i') AS horario_consulta,
        DATE_FORMAT(a.data, '%d/%m/%Y') AS data_consulta,
        a.status
      FROM agendamentos a
      INNER JOIN usuarios p ON p.id = a.paciente_id
      LEFT JOIN usuarios med ON med.id = a.medico_id
      ${whereClause}
      ORDER BY a.data ASC, a.horario ASC
      LIMIT 300`,
      [req.user.tipo, req.user.nome, ...params]
    );

    res.json({ fila: rows });
  } catch (error) { next(error); }
});

app.post('/api/agendamentos', authenticate, roles('paciente'), async (req, res, next) => {
  try {
    const especialidade = clean(req.body?.especialidade, 100);
    const medicoSolicitado = clean(req.body?.medico, 120);
    const data = clean(req.body?.data, 10);
    const horario = clean(req.body?.horario, 5);
    const hospital = clean(req.body?.hospital, 180);
    if (!especialidade || !isCalendarDate(data) || !UNIDADES.includes(hospital)) return fail(res, 400, 'Dados inválidos para o agendamento.');
    const [result] = await pool.execute(
      "INSERT INTO agendamentos (paciente_id, especialidade, medico_solicitado, data, horario, hospital, status) VALUES (?, ?, NULLIF(?, ''), ?, ?, ?, 'Solicitado')",
      [req.user.id, especialidade, medicoSolicitado, data, horario, hospital]
    );
    res.status(201).json({ sucesso: true, id: Number(result.insertId), status: 'Solicitado' });
  } catch (error) { next(error); }
});

app.patch('/api/agendamentos/:id/cancelar', authenticate, roles('paciente'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [result] = await pool.execute(
      "UPDATE agendamentos SET status = 'Cancelado' WHERE id = ? AND paciente_id = ? AND status IN ('Solicitado', 'Confirmado')",
      [id, req.user.id]
    );
    if (!result.affectedRows) return fail(res, 404, 'Agendamento não encontrado ou não pode ser cancelado.');
    res.json({ sucesso: true, status: 'Cancelado' });
  } catch (error) { next(error); }
});

app.patch('/api/agendamentos/:id/status', authenticate, roles('medico', 'administrador'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const status = clean(req.body?.status, 24);
    if (!STATUS_AGENDAMENTO.has(status)) return fail(res, 400, 'Status inválido.');
    const medicoId = req.user.tipo === 'medico' ? req.user.id : null;
    await pool.execute(
      `UPDATE agendamentos SET status = ?, medico_id = CASE WHEN ? IS NOT NULL THEN ? ELSE medico_id END WHERE id = ?`,
      [status, medicoId, medicoId, id]
    );
    res.json({ sucesso: true, status });
  } catch (error) { next(error); }
});

app.get('/api/usuarios', authenticate, roles('administrador'), async (_req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT id, nome, usuario, email, tipo, especialidade, crm, ativo, criado_em FROM usuarios ORDER BY criado_em DESC LIMIT 500');
    res.json(rows.map(safeUser));
  } catch (error) { next(error); }
});

app.post('/api/usuarios/equipe', authenticate, roles('administrador'), async (req, res, next) => {
  try {
    const nome = clean(req.body?.nome, 120);
    const usuario = clean(req.body?.usuario, 48).toLowerCase();
    const email = clean(req.body?.email, 254).toLowerCase();
    const senha = String(req.body?.senha || '');
    const tipo = clean(req.body?.tipo, 20);
    const especialidade = clean(req.body?.especialidade, 100);
    const crm = clean(req.body?.crm, 30);

    if (nome.length < 2) return fail(res, 400, 'Informe o nome completo.');
    if (!validUsername(usuario)) return fail(res, 400, 'O usuário deve ter de 3 a 48 caracteres.');
    if (!validEmail(email)) return fail(res, 400, 'Informe um e-mail válido.');
    if (senha.length < 12 || senha.length > 128) return fail(res, 400, 'A senha inicial deve ter no mínimo 12 caracteres.');
    if (!['medico', 'administrador'].includes(tipo)) return fail(res, 400, 'Perfil de equipe inválido.');

    const senhaHash = await hashPassword(senha);
    const [result] = await pool.execute(
      `INSERT INTO usuarios (nome, usuario, email, senha_hash, tipo, especialidade, crm)
       VALUES (?, ?, ?, ?, ?, NULLIF(?, ''), NULLIF(?, ''))`,
      [nome, usuario, email, senhaHash, tipo, especialidade, crm]
    );
    res.status(201).json({ sucesso: true, id: Number(result.insertId), mensagem: 'Acesso de equipe criado com sucesso.' });
  } catch (error) {
    if (isDuplicate(error)) return fail(res, 409, 'Este usuário ou e-mail já está cadastrado.');
    next(error);
  }
});

// Listar todos os usuários (área administrativa)
app.get('/api/admin/usuarios', authenticate, roles('administrador'), async (_req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, nome, usuario, email, tipo, especialidade, crm, ativo,
             DATE_FORMAT(criado_em, '%d/%m/%Y %H:%i') AS criado_em
      FROM usuarios
      ORDER BY id ASC
    `);
    res.json({ usuarios: rows });
  } catch (error) { next(error); }
});

// Atualizar perfil, especialidade, CRM ou status ativo de um usuário
app.patch('/api/admin/usuarios/:id', authenticate, roles('administrador'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { tipo, especialidade, crm, ativo } = req.body || {};
    const tiposValidos = ['paciente', 'medico', 'administrador'];

    if (!id || !tiposValidos.includes(tipo)) {
      return res.status(400).json({ mensagem: 'Dados inválidos para atualização do usuário.' });
    }

    await pool.query(
      `UPDATE usuarios
       SET tipo = ?,
           especialidade = ?,
           crm = ?,
           ativo = ?
       WHERE id = ?`,
      [
        tipo,
        tipo === 'medico' ? (clean(especialidade, 100) || null) : null,
        tipo === 'medico' ? (clean(crm, 30) || null) : null,
        ativo ? 1 : 0,
        id
      ]
    );

    res.json({ mensagem: 'Usuário atualizado com sucesso.' });
  } catch (error) { next(error); }
});

// Listar pesquisas de satisfação (área administrativa)
app.get('/api/admin/pesquisas', authenticate, roles('administrador'), async (_req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, nome, positivo, negativo, sugestoes,
             DATE_FORMAT(criado_em, '%d/%m/%Y %H:%i') AS criado_em
      FROM pesquisas
      ORDER BY id DESC
    `);
    res.json({ pesquisas: rows });
  } catch (error) { next(error); }
});

app.get('/api/atendimentos', authenticate, roles('paciente', 'medico', 'administrador'), async (req, res, next) => {
  try {
    const isPatient = req.user.tipo === 'paciente';
    const params = isPatient ? [req.user.id] : [];
    const [rows] = await pool.execute(
      `SELECT at.id, at.agendamento_id, at.paciente_id, at.profissional_id,
       at.pressao, at.observacoes, at.criado_em,
       p.nome AS nome_paciente, m.nome AS profissional
       FROM atendimentos at
       INNER JOIN usuarios p ON p.id = at.paciente_id
       LEFT JOIN usuarios m ON m.id = at.profissional_id
       ${isPatient ? 'WHERE at.paciente_id = ?' : ''}
       ORDER BY at.criado_em DESC LIMIT 250`,
      params
    );
    res.json(rows);
  } catch (error) { next(error); }
});

app.post('/api/atendimentos', authenticate, roles('medico'), async (req, res, next) => {
  try {
    const agendamentoId = Number(req.body?.agendamento_id);
    const pressao = clean(req.body?.pressao, 20);
    const observacoes = clean(req.body?.observacoes, 5000);
    if (!agendamentoId || observacoes.length < 3) return fail(res, 400, 'Informe as observações do atendimento.');
    const [agendamentos] = await pool.execute('SELECT paciente_id FROM agendamentos WHERE id = ? LIMIT 1', [agendamentoId]);
    if (!agendamentos.length) return fail(res, 404, 'Agendamento não encontrado.');
    const [result] = await pool.execute(
      'INSERT INTO atendimentos (agendamento_id, paciente_id, profissional_id, pressao, observacoes) VALUES (?, ?, ?, NULLIF(?, \'\'), ?)',
      [agendamentoId, agendamentos[0].paciente_id, req.user.id, pressao, observacoes]
    );
    await pool.execute("UPDATE agendamentos SET status = 'Atendido', medico_id = ? WHERE id = ?", [req.user.id, agendamentoId]);
    res.status(201).json({ sucesso: true, id: Number(result.insertId) });
  } catch (error) { next(error); }
});

const handleSavePesquisa = async (req, res, next) => {
  try {
    const nome = clean(req.body?.nome, 100);
    const positivo = clean(req.body?.positivo, 2000);
    const negativo = clean(req.body?.negativo, 2000);
    const sugestoes = clean(req.body?.sugestoes, 2000);
    if (!positivo || positivo.length < 3 || !negativo || negativo.length < 3) {
      return fail(res, 400, 'Preencha os campos obrigatórios da avaliação.');
    }
    const [result] = await pool.execute(
      'INSERT INTO pesquisas (nome, positivo, negativo, sugestoes) VALUES (NULLIF(?, ""), ?, ?, NULLIF(?, ""))',
      [nome, positivo, negativo, sugestoes]
    );
    res.status(201).json({ sucesso: true, id: Number(result.insertId), mensagem: 'Avaliação enviada com sucesso!' });
  } catch (error) { next(error); }
};

const handleListPesquisa = async (_req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT id, nome, positivo, negativo, sugestoes, criado_em FROM pesquisas ORDER BY criado_em DESC LIMIT 300');
    res.json(rows);
  } catch (error) { next(error); }
};

app.post('/api/pesquisas', handleSavePesquisa);
app.post('/api/feedback', handleSavePesquisa);
app.post('/api/feedbacks', handleSavePesquisa);

app.get('/api/pesquisas', authenticate, roles('administrador'), handleListPesquisa);
app.get('/api/feedback', authenticate, roles('administrador'), handleListPesquisa);
app.get('/api/feedbacks', authenticate, roles('administrador'), handleListPesquisa);

app.get('/portal/paciente', (_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'portal.html')));
app.get('/portal/medico', (_req, res) => {
  const medicoHtml = path.join(PUBLIC_DIR, 'portal_medico.html');
  const fallbackHtml = path.join(PUBLIC_DIR, 'portal.html');
  const target = fs.existsSync(medicoHtml) ? medicoHtml : fallbackHtml;

  res.sendFile(target, (error) => {
    if (error && !res.headersSent) {
      res.status(404).type('text').send('Página do portal do médico não encontrada.');
    }
  });
});
app.get('/portal/profissional', (_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'portal_medico.html')));
// Servir a página HTML da área administrativa (com fallback para portal.html se portal_admin.html ainda não existir)
app.get('/portal/administracao', (_req, res) => {
  const adminHtml = path.join(PUBLIC_DIR, 'portal_admin.html');
  const fallbackHtml = path.join(PUBLIC_DIR, 'portal.html');
  res.sendFile(fs.existsSync(adminHtml) ? adminHtml : fallbackHtml);
});
app.get('/portal.html', (_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'portal.html')));
app.get(['/login', '/login.html'], (_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'login.html')));
app.get(['/cadastro', '/cadastro.html'], (_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'cadastro.html')));
app.get(['/feedback', '/feedback.html'], (_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'feedback.html')));
app.get(['/dados_feedback.html'], (_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'dados_feedback.html')));
app.get(['/unidades', '/unidades.html'], (_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'unidades.html')));
app.get('/orientacoes', (_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'orientacoes.html')));

app.use(express.static(PUBLIC_DIR, { dotfiles: 'ignore', index: 'index.html', maxAge: 0, etag: true }));

app.use('/api', (_req, res) => fail(res, 404, 'Rota da API não encontrada.'));
app.use((_req, res) => res.status(404).sendFile(path.join(PUBLIC_DIR, '404.html'), error => { if (error) res.status(404).type('text').send('Página não encontrada.'); }));

app.use((error, _req, res, _next) => {
  const status = error?.type === 'entity.too.large' ? 413 : 500;
  console.error('[PulseVida] Falha na requisição:', error?.code || 'erro');
  if (res.headersSent) return;
  res.status(status).json({ mensagem: status === 413 ? 'Conteúdo muito grande.' : 'Erro interno no servidor.' });
});

async function start() {
  await migrate();
  await pool.execute('DELETE FROM sessoes WHERE expira_em <= UTC_TIMESTAMP()');
  await bootstrapAdmin();
  const server = app.listen(PORT, '0.0.0.0', () => console.info(`[PulseVida Backend] Rodando na porta ${PORT}.`));
  const shutdown = async () => {
    server.close(async () => { await pool.end(); process.exit(0); });
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

if (require.main === module) start().catch(async error => {
  console.error('[PulseVida] Erro ao iniciar:', error?.message || error);
  try { await pool.end(); } catch {}
  process.exit(1);
});

module.exports = app;