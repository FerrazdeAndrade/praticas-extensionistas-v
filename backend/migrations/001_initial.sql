-- PulseVida: esquema inicial MySQL, idempotente e compatível com o domínio do projeto original.
-- O banco gerenciado do projeto é compartilhado entre Preview e produção: não apagar tabelas existentes.

CREATE TABLE IF NOT EXISTS usuarios (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  usuario VARCHAR(48) NOT NULL,
  email VARCHAR(254) NOT NULL,
  senha_hash VARCHAR(220) NOT NULL,
  tipo ENUM('paciente', 'medico', 'administrador') NOT NULL DEFAULT 'paciente',
  cpf VARCHAR(20) NULL,
  sus VARCHAR(30) NULL,
  especialidade VARCHAR(100) NULL,
  crm VARCHAR(30) NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_usuarios_usuario (usuario),
  UNIQUE KEY uq_usuarios_email (email),
  KEY idx_usuarios_tipo_ativo (tipo, ativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sessoes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  usuario_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expira_em DATETIME NOT NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_sessoes_token_hash (token_hash),
  KEY idx_sessoes_expira_em (expira_em),
  CONSTRAINT fk_sessoes_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS metricas_usuario (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  usuario_id BIGINT UNSIGNED NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'Estável',
  sistolica SMALLINT UNSIGNED NOT NULL,
  diastolica SMALLINT UNSIGNED NOT NULL,
  batimento SMALLINT UNSIGNED NOT NULL,
  observacoes VARCHAR(500) NULL,
  registrado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_metricas_usuario_data (usuario_id, registrado_em),
  CONSTRAINT fk_metricas_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS agendamentos (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  paciente_id BIGINT UNSIGNED NOT NULL,
  especialidade VARCHAR(100) NOT NULL,
  medico_solicitado VARCHAR(120) NULL,
  medico_id BIGINT UNSIGNED NULL,
  data DATE NOT NULL,
  horario TIME NOT NULL,
  hospital VARCHAR(180) NOT NULL,
  status ENUM('Solicitado', 'Confirmado', 'Em atendimento', 'Atendido', 'Cancelado') NOT NULL DEFAULT 'Solicitado',
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_agendamentos_paciente_data (paciente_id, data, horario),
  KEY idx_agendamentos_status_data (status, data, horario),
  CONSTRAINT fk_agendamentos_paciente FOREIGN KEY (paciente_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_agendamentos_profissional FOREIGN KEY (medico_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS atendimentos (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  agendamento_id BIGINT UNSIGNED NULL,
  paciente_id BIGINT UNSIGNED NOT NULL,
  profissional_id BIGINT UNSIGNED NOT NULL,
  pressao VARCHAR(30) NULL,
  observacoes TEXT NOT NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_atendimentos_paciente_data (paciente_id, criado_em),
  KEY idx_atendimentos_profissional_data (profissional_id, criado_em),
  CONSTRAINT fk_atendimentos_agendamento FOREIGN KEY (agendamento_id) REFERENCES agendamentos(id) ON DELETE SET NULL,
  CONSTRAINT fk_atendimentos_paciente FOREIGN KEY (paciente_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_atendimentos_profissional FOREIGN KEY (profissional_id) REFERENCES usuarios(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pesquisas (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL DEFAULT 'Anônimo',
  positivo TEXT NOT NULL,
  negativo TEXT NOT NULL,
  sugestoes TEXT NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_pesquisas_data (criado_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
