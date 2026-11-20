require('dotenv').config();
const { migrate, pool } = require('../server');

migrate()
  .then(async () => {
    console.info('[PulseVida] Migrações concluídas.');
    await pool.end();
  })
  .catch(async error => {
    console.error('[PulseVida] Falha nas migrações:', error?.code || error?.message || 'erro');
    try { await pool.end(); } catch {}
    process.exitCode = 1;
  });
