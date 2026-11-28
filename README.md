# PulseVida — Saúde conectada

Site acadêmico responsivo para organizar o acompanhamento de pacientes e os fluxos de profissionais de saúde e administração. Esta versão reaproveita a identidade visual, parte dos assets e o domínio funcional do PulseVida enviado pelo grupo, com backend Node/Express e persistência em banco MySQL-compatible.

## O que está implementado

| Perfil | Telas e ações |
|---|---|
| Paciente | Cadastro público exclusivo de paciente; login; resumo; registro e histórico pessoal de aferições; solicitação/cancelamento de consultas; status atualizado pela equipe; histórico de atendimentos; manutenção do próprio nome, e-mail, CPF e Cartão SUS. |
| Profissional de saúde | Fila de solicitações; confirmação/cancelamento de consulta; visualização de aferições registradas pelos pacientes; registro de atendimento com observações e pressão opcional; atendimento vinculado ao paciente/agendamento. |
| Administração | Visão geral sem expor dados clínicos; consulta a usuários e agendamentos; criação controlada de acessos profissionais/administrativos; ativação e desativação de contas; gerenciamento de solicitações; leitura administrativa da pesquisa de satisfação. |
| Público | Página institucional, acesso/cadastro, informações das unidades mencionadas no material original, orientações gerais de cuidado e pesquisa de satisfação persistida. |

A interface se reorganiza para telas pequenas, com navegação compacta, formulários de toque e tabelas com rolagem horizontal. Trata-se de um site web responsivo, não de um aplicativo nativo de loja.

## Iniciar no Preview do projeto
<<<<<<< HEAD

=======
>>>>>>> 0661d751b750162f7c6ce9b13ca08381ff0186a0
O projeto já está configurado para Node.js na porta 3000, com servidor e banco gerenciado. A conexão `DATABASE_URL` é injetada pelo ambiente Webdev; o código nunca a envia ao navegador. Ao iniciar, o servidor aplica somente as migrações pendentes registradas em `schema_migrations`, cria o primeiro administrador se ainda não houver um e inicia o listener. O healthcheck sem autenticação é `GET /healthz`.

O login inicial do administrador é `admin`. A senha é a que foi informada na caixa protegida de configuração do projeto; ela não está escrita neste README nem no código. Após o primeiro boot bem-sucedido, remova a variável protegida `PULSE_BOOTSTRAP_ADMIN_PASSWORD` no painel de configuração. As contas profissionais seguintes devem ser criadas dentro da área administrativa.

Para apresentar ao grupo, entre como `admin`, crie uma conta profissional e saia. Cadastre um paciente pela página pública; solicite uma consulta com essa conta, entre como profissional para confirmar e registrar o atendimento, depois volte ao paciente e atualize o painel/histórico. Utilize apenas dados fictícios. Nenhuma conta de paciente/profissional nem registro clínico de demonstração foi criado no banco desta entrega.

## Executar fora do Preview

Requisitos: Node.js 22 ou superior, pnpm 11.25.0 (ou Corepack com a versão indicada em `package.json`) e uma base MySQL compatível.

```bash
cp .env.example .env
# Edite DATABASE_URL com as credenciais da sua base MySQL.
# Para criar o primeiro administrador, preencha temporariamente PULSE_BOOTSTRAP_ADMIN_PASSWORD.
pnpm install --frozen-lockfile
pnpm start
```http://localhost:3000

Abra ``. A aplicação executa as migrações versionadas automaticamente no início. O comando `pnpm migrate` executa apenas as migrações e fecha a conexão. Nunca coloque a senha de administrador ou credenciais de banco em `README.md`, `package.json`, imagens, comandos salvos, frontend ou no GitHub; `.env` está ignorado pelo Git.
==========
## Execução e Banco de Dados — MySQL Local (Porta 3306)

### 1. Instalar dependências e iniciar o servidor (porta `3000`)

Na raiz do projeto:

```powershell
pnpm install --frozen-lockfile
```

Em seguida, acesse a pasta `backend` e inicie a aplicação:

```powershell
cd backend
pnpm start
```

Após iniciar, a aplicação fica disponível em:

```text
http://localhost:3000
```

### 2. Conectar ao MySQL local (porta `3306`) e conferir os dados

Abra o MySQL local na porta `3306` (ou pelo terminal passando `-P 3306`), informe a senha configurada e execute:

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -h 127.0.0.1 -P 3306 -u root -D pulsevida --default-character-set=utf8mb4 -p
```

Dentro do MySQL:

```sql
USE pulsevida;
SHOW TABLES;
SELECT
  id,
  nome,
  usuario,
  email,
  tipo,
  especialidade,
  crm,
  ativo,
  DATE_FORMAT(criado_em, '%d/%m/%Y %H:%i') AS data_horario
FROM usuarios
ORDER BY id;
```

### 3. Padronizar perfis médicos, especialidade e CRM

Se os campos `tipo`, `especialidade` ou `crm` ainda não estiverem preenchidos nas contas médicas, execute:

```sql
UPDATE usuarios
SET tipo = 'medico',
    especialidade = COALESCE(NULLIF(especialidade, ''), 'Cardiologia'),
    crm = COALESCE(NULLIF(crm, ''), 'CRM-RJ 528491')
WHERE usuario = 'pedrosa';

UPDATE usuarios
SET tipo = 'medico',
    especialidade = COALESCE(NULLIF(especialidade, ''), 'Clínica Médica'),
    crm = COALESCE(NULLIF(crm, ''), 'CRM-RJ 529104')
WHERE usuario = 'severo';


UPDATE usuarios
SET tipo = 'medico',
    especialidade = COALESCE(NULLIF(especialidade, ''), 'Clínica Geral'),
    crm = COALESCE(NULLIF(crm, ''), 'CRM-RJ 530112')
WHERE usuario = 'pedro' OR id = 30001;
```

==========

## Banco e segurança

`migrations/001_initial.sql` cria `usuarios`, `sessoes`, `metricas_usuario`, `agendamentos`, `atendimentos` e `pesquisas`. Senhas são derivadas com scrypt e sal aleatório; a tabela de sessões guarda apenas o hash SHA-256 de tokens aleatórios com validade de 12 horas. A autorização acontece no backend, não apenas na interface. O perfil público só pode criar paciente; profissionais e administradores são provisionados por uma conta administrativa. As rotas do paciente filtram os dados pelo ID da sessão autenticada.

As tabelas, eventos e usuários são do banco gerenciado deste projeto. As escritas de desenvolvimento no Preview persistem no mesmo banco de publicação deste projeto. O bootstrap desta entrega criou apenas a primeira conta administrativa; este pacote não importa automaticamente dados que estejam em um banco PostgreSQL antigo do projeto original. Para trazer dados preexistentes, faça uma exportação revisada, mapeamento de campos e conversão de engine fora deste pacote antes de qualquer carga; não conecte diretamente um banco antigo sem cópia de segurança.

Por minimização de dados, CPF e Cartão SUS só são devolvidos ao próprio paciente; não entram nas listagens administrativas ou de consultas. O e-mail do paciente só aparece na fila profissional. A data mínima de consulta segue o fuso `America/Sao_Paulo`. O formulário público de feedback limita a cinco tentativas por endereço IP em 15 minutos (controle em memória do processo; protótipo acadêmico, não proteção antiabuso distribuída).

## Hospedagem e GitHub

O projeto contém `Dockerfile`, lockfile, `.env.example` sem credenciais e a declaração de contêiner com healthcheck `/healthz`. GitHub armazena o código, mas **GitHub Pages não executa Express nem hospeda o banco**. Para deixá-lo acessível online, conecte o repositório a uma hospedagem que execute Node em contêiner e configure a base MySQL e as variáveis protegidas. A publicação do site e o envio a qualquer repositório GitHub não foram feitos nesta etapa.

Para enviar uma cópia a um repositório próprio, crie o repositório no GitHub e, na cópia local do projeto, adicione um remote separado em vez de substituir o remote existente:

```bash
git remote -v
git remote add meu-github https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
git push -u meu-github main
```

Ajuste o nome do remote se já existir. Antes do push, confira `git status`, confirme que `.env` não está incluído e nunca envie credenciais. Instruções de deploy dependem do provedor que o grupo escolher.

## Limites importantes

Este é um protótipo acadêmico. Não foi submetido a validação clínica, certificação, avaliação de segurança independente ou processo de adequação regulatória/LGPD para operação real. Não armazene dados de saúde reais ou credenciais reais de pacientes. Os valores registrados não recebem diagnóstico nem recomendação médica automática. Para sintomas graves ou emergência, use os serviços oficiais de urgência, não aguarde retorno do site.

<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> 0661d751b750162f7c6ce9b13ca08381ff0186a0
# PulseVida — Saúde Conectada
Plataforma web acadêmica responsiva para monitoramento de pacientes e gestão de unidades de saúde em Saquarema.
<<<<<<< HEAD

* **Backend API (Vercel):** Hospedagem serverless dedicada para os serviços Express e rotas do (praticas-extensionistas-v.vercel.app)
* **Banco de Dados (MySQL Cloud):** Persistência relacional em nuvem gerenciando usuários, agendamentos e métricas.
=======
* **Frontend Estático (Netlify):** 
# (praticas-extensionistas-v.vercel.app) 
* **Backend API (Vercel):** Hospedagem serverless dedicada para os serviços Express e rotas do sistema.
* **Banco de Dados (MySQL TiDBSCloud):**
=========
## 1__Comando no PowerShell (entrar no TiDB Cloud).
# & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -h gateway01.sa-east-1.prod.aws.tidbcloud.com -P 4000 -u 2J1akc6etHw1hsG.root -pNqbYLzxvKszl8o9W -D pulsevida --ssl-mode=REQUIRED

--PASSWORD: NqbYLzxvKszl8o9W
============
## 2__Comando dentro do cliente MySQL (selecionar/garantir o banco pulsevida).
# CREATE DATABASE IF NOT EXISTS pulsevida CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
# USE pulsevida;
=================
## Listar todas as tabelas do banco pulsevid.
# SHOW TABLES;

## Conferir os dados salvos nas tabelas.
# SELECT * FROM usuarios;
# SELECT * FROM agendamentos;
# SELECT * FROM metricas_usuario;
# SELECT * FROM atendimentos;

##| SELECT id, nome, usuario, tipo, especialidade, crm, ativo, criado_em
    FROM usuarios
    ORDER BY id; |
# SELECT
    id,
    nome,
    usuario,
    tipo,
    especialidade,
    crm,
    ativo,
    DATE_FORMAT(criado_em, '%d/%m/%Y %H:%i') AS data_horario
  FROM usuarios
  ORDER BY id;

 SPersistência relacional em nuvem gerenciando usuários, agendamentos e métricas.

<<<<<<< HEAD
=======
=======
## #### PulseVida — Saúde Conectada
Plataforma web acadêmica responsiva para monitoramento de pacientes e gestão de unidades de saúde em Saquarema.
* **Frontend Estático (Netlify):** [praticas-extensionista-v.netlify.app](https://praticas-extensionista-v.netlify.app)
* **Backend API (Vercel):** Hospedagem serverless dedicada para os serviços Express e rotas do sistema.
* **Banco de Dados (MySQL Cloud):** Persistência relacional em nuvem gerenciando usuários, agendamentos e métricas.
>>>>>>> marsol/main
>>>>>>> 0661d751b750162f7c6ce9b13ca08381ff0186a0
* **Autenticação:** Sistema seguro com sessões baseadas em hash e senhas derivadas com scrypt.
* **Perfis de Acesso:** Fluxos segregados para Pacientes, Profissionais de Saúde e Administradores.
* **Repositório:** Código-fonte versionado e organizado sob padrões de desenvolvimento full-stack.
* **Repositório Oficial:** Disponível no GitHub para consulta e contribuições acadêmicas.

<<<<<<< HEAD
<<<<<<< HEAD
* praticas-extensionistas-v.vercel.app
=======
====================================

### 5. Refinamento (Semana 6) 
=======
<<<<<<< HEAD
* praticas-extensionistas-v.vercel.app
=======
====================================
>>>>>>> 0661d751b750162f7c6ce9b13ca08381ff0186a0
## Atualizações recentes: Portal Médico, Área Administrativa e Banco (TiDB Cloud)

### 1. Contas médicas e perfil administrativo
- **Profissionais de saúde (`tipo = 'medico'`):** contas configuradas com `especialidade` e `crm` (ex.: `pedro` / Dr. Pedro Paulo e `almeida` / Dra. Simone Almeida Couto, `CRM-RJ 530420`).
- **Conta administrativa (`tipo = 'administrador'`):** conta `admin` (`admin@admin.com`) promovida ao perfil `administrador` para gerenciamento de acessos e visualização de dados administrativos, separada do fluxo de `paciente`.

### 2. Fluxo entre Agendamentos, Área do Médico e Atendimentos do Paciente
- **Fila e confirmação de consultas:** agendamentos confirmados (`status = 'Confirmado'`) e solicitações pendentes são exibidos na Área Profissional (`/portal/profissional` e `/portal/medico`) via `GET /api/medico/fila`, trazendo os dados do paciente e a última aferição de `metricas_usuario`.
- **Registro de atendimentos (`atendimentos`):** ao registrar um atendimento clínico (`POST /api/atendimentos`), o backend grava o registro na tabela `atendimentos` (`agendamento_id`, `paciente_id`, `profissional_id`, `pressao`, `observacoes`) e atualiza o agendamento para `'Atendido'`, permitindo que os atendimentos apareçam na tela do médico e na área do paciente (`GET /api/atendimentos`).

### 3. Novas rotas administrativas no backend (`backend/server.js`)
- `GET /portal/administracao`: serve a interface administrativa (utilizando `portal_admin.html` quando presente, com fallback para `portal.html`).
- `GET /api/admin/usuarios`: lista usuários cadastrados para gestão administrativa (protegida por `authenticate` e `roles('administrador')`).
- `PATCH /api/admin/usuarios/:id`: atualiza `tipo`, `especialidade`, `crm` e `ativo` de um usuário (limpando `especialidade` e `crm` quando o perfil não for `medico`).
- `GET /api/admin/pesquisas`: consulta as respostas da tabela `pesquisas` para o perfil `administrador`.

### 4. Boas práticas de terminal e banco de dados (PowerShell + TiDB Cloud)
- **Ambientes distintos:** o **TiDB Cloud** roda na porta `4000` (`gateway01.sa-east-1.prod.aws.tidbcloud.com`) com `--ssl-mode=REQUIRED`, enquanto o **MySQL local** roda em `127.0.0.1:3306` com sua senha local do `root`.
- **Codificação no PowerShell:** execute `chcp 65001` e `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8` no PowerShell **antes** de abrir o `mysql.exe` (nunca dentro do prompt `mysql>`), e passe `--default-character-set=utf8mb4` na conexão.
- **Consultas legíveis e ASCII:** evite `SELECT *` em tabelas com hashes longos (`senha_hash`); para saída apenas em ASCII sem estourar o terminal, use `CAST(coluna AS CHAR CHARACTER SET ascii)` ou saída vertical `\G`.

<<<<<<< HEAD
### Relatório de Validação: Usuários e Pesquisa de Satisfação (PulseVida)

Este documento consolida os usuários ativos validados no banco de dados (**TiDB Cloud**) e os cenários de resposta da pesquisa de satisfação (`/feedback`), refletindo os ajustes recentes de segurança de ambiente (`.env` e `.env.example`), autenticação (`JWT_SECRET`), conexão em nuvem (`mysqls://` na porta `4000`) e sincronização do branch `main`.

> **Nota de privacidade:** Conforme diretriz da tela `/feedback`, nenhum registro abaixo contém informações clínicas ou dados pessoais sensíveis.

---

## 1. Usuários Validados no Banco (`usuarios`)

Consulta realizada na instância **TiDB Cloud** (`pulsevida`):

| ID | Nome | Usuário | E-mail | Perfil (`tipo`) | Ativo | Criado em |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| `1` | Dado Dollabela | `dado` | `dado@gmail.com` | `paciente` | 1 | 2026-11-20 16:56:31 |
| `2` | Admin | `admin` | `admin@admin.com` | `administrador` | 1 | 2026-11-20 16:58:39 |
| `30001` | Dr. Pedro Paulo | `pedro` | `pedro@gmail.com` | `medico` | 1 | 2026-11-20 17:09:24 |
| `2030001` | Neto Caneco | `caneco` | `caneco@gmail.com` | `paciente` | 1 | 2026-11-21 01:41:18 |
| `2060001` | Neco Boneco Doido | `neco` | `neco@gmail.com` | `paciente` | 1 | 2026-11-21 14:44:54 |
| `2090001` | admin | `zeca` | `zeca@gmail.com` | `paciente` | 1 | 2026-11-21 15:21:52 |
| `2090004` | Carlos Magno | `carlos` | `carlos@gmail.com` | `paciente` | 1 | 2026-11-21 15:29:21 |
| `2120001` | Mara Maravilha | `mara` | `mara@gmail.com` | `paciente` | 1 | 2026-11-21 19:08:12 |
| `2120002` | Mané Garrincha | `garrincha` | `garrincha@gmail.com` | `paciente` | 1 | 2026-11-21 19:12:54 |
| `2150001` | Dra. Simone Almeida Couto | `almeida` | `almeida@gmail.com` | `medico` | 1 | 2026-11-22 14:34:05 |
| `2180002` | Dr. Mario Sergio | `mario` | `mario@gmail.com` | `medico` | 1 | 2026-11-22 15:48:12 |
| `2180004` | Jose Carlos | `jose` | `jose@gmail.com` | `paciente` | 1 | 2026-11-22 15:51:00 |

---

## 2. Respostas da Pesquisa de Satisfação (`/feedback`)

Respostas estruturadas conforme os campos do formulário em produção (`praticas-extensionistas-v.vercel.app/feedback`), avaliando as modificações técnicas realizadas na etapa atual:

### 2.1. Perfil: Paciente (Ref. usuários `dado`, `carlos`, `mara`, `jose`)
* **Como prefere se identificar? (opcional):** Paciente
* **O que funcionou bem?:** O sistema ficou estável e respondeu rápido durante os testes do fluxo de acesso após a conexão com o banco na nuvem.
* **Que dificuldade encontrou?:** No começo, quando uma pasta antiga não tinha o arquivo de configuração pronto, o teste chegou a falhar antes de apontar para o ambiente certo.
* **Sugestões de melhoria (opcional):** Manter a configuração do ambiente bem organizada para que a tela de acesso abra sempre sem falhas de conexão.

### 2.2. Perfil: Profissional de Saúde — Médico (Ref. `pedro`, `almeida`, `mario`)
* **Como prefere se identificar? (opcional):** Profissional de saúde (médico)
* **O que funcionou bem?:** Com a definição do `JWT_SECRET` e a base conectada ao TiDB Cloud, a sessão e os dados do portal médico ficaram mais consistentes durante os testes.
* **Que dificuldade encontrou?:** Durante os ajustes de ambiente e reinicializações do servidor, foi preciso refazer o login em alguns momentos para validar os tokens.
* **Sugestões de melhoria (opcional):** Manter a chave secreta fixa no ambiente para evitar quedas de sessão inesperadas durante o uso contínuo.

### 2.3. Perfil: Administrador do Sistema (Ref. `admin`)
* **Como prefere se identificar? (opcional):** Administrador
* **O que funcionou bem?:** A separação entre o `.env` local (com as credenciais e o `JWT_SECRET`) e o `.env.example` limpo (sem senhas reais) deixou a configuração muito mais segura antes de subir para o GitHub.
* **Que dificuldade encontrou?:** Havia senhas antigas e variáveis soltas no `.env.example` e mais de uma pasta do projeto no computador, o que exigiu conferência no `git diff` e no push para a `main`.
* **Sugestões de melhoria (opcional):** Usar sempre o `.env.example` sanitizado como base para novos ambientes e conferir o `git status` antes de cada envio.

### 2.4. Perfil: Visitante / Avaliador da Mostra Acadêmica
* **Como prefere se identificar? (opcional):** Visitante da mostra acadêmica
* **O que funcionou bem?:** A página `/feedback` é direta, fácil de preencher e traz o aviso claro para não inserir informações clínicas ou dados pessoais sensíveis.
* **Que dificuldade encontrou?:** Quem avalia rápido na apresentação pode não perceber os bastidores técnicos (como conexão SSL no TiDB Cloud e separação de variáveis de ambiente) que deixam a aplicação no ar.
* **Sugestões de melhoria (opcional):** Manter o formulário simples como está, pois ele funciona bem para coletar impressões rápidas de quem visita o projeto.

### 2.5. Perfil: Testador Técnico / Integrante da Equipe
* **Como prefere se identificar? (opcional):** Testador / membro da equipe
* **O que funcionou bem?:** O backend subiu na porta `3000` conectado ao TiDB Cloud (`mysqls://` na porta `4000`), os usuários apareceram corretamente nas consultas SQL e o `.env.example` limpo foi enviado para a `main`.
* **Que dificuldade encontrou?:** Executar comandos no diretório errado ou dentro do prompt `mysql>` em vez do PowerShell, além de lidar com quebra de linha (`LF`/`CRLF`) e `git diff` no `backend/.env.example`, atrasou um pouco o fechamento.
* **Sugestões de melhoria (opcional):** Padronizar o diretório principal do projeto e rodar um checklist rápido (`git status`, conexão no banco e teste na porta `3000`) após cada alteração de ambiente.

### 2.6. Perfil: Enfermeira
* **Como prefere se identificar? (opcional):** Enfermeira
* **O que funcionou bem?:** Os registros e a comunicação com o banco ficaram bem estruturados após os ajustes de conexão, facilitando acompanhar o fluxo sem misturar informações administrativas.
* **Que dificuldade encontrou?:** Durante os testes de atualização de ambiente e banco, faltou um aviso visual imediato quando um dado mudava em outra aba ou sessão.
* **Sugestões de melhoria (opcional):** Acrescentar um indicativo visual discreto de atualização recente para facilitar o acompanhamento diário do fluxo.

### # Documentação de Validação, Tour e Ajustes — PulseVida (MVP v2)

Este documento consolida o tour funcional da aplicação **PulseVida**, os usuários ativos validados no banco de dados (**TiDB Cloud**), os registros reais coletados na tabela `pesquisas` via pesquisa de satisfação (`/feedback`) e os ajustes entregues na **Versão 2 do MVP** (Semana 7).

> **Diretriz de privacidade:** Conforme orientação exibida na página `/feedback`, os registros visam avaliar a experiência de uso e navegação sem expor informações clínicas ou dados pessoais sensíveis.

---

## 1. Tour pelo Aplicativo (Fluxo Ponta a Ponta)

### 1.1. Porta de Entrada e Identidade Visual
Ao acessar o **PulseVida**, o usuário encontra a interface principal da plataforma (com comportamento PWA e telas voltadas ao apoio à saúde e organização de atendimentos). O desenho prioriza navegação direta e separação clara entre quem apenas consulta/avalia e quem opera rotinas internas.

### 1.2. Autenticação e Estabilidade de Sessão (`JWT_SECRET`)
No login (contas administrativas, médicas ou de pacientes/testadores):
* O backend valida as credenciais e emite um token assinado com a chave **`JWT_SECRET`**.
* O token acompanha as requisições protegidas (`Authorization: Bearer <token>`), mantendo a sessão estável e impedindo alterações indevidas de perfil no cliente.

### 1.3. Portais por Perfil
* **Fluxo do Paciente:** acompanhamento simples do acesso e do andamento da fila/atendimento, sem complexidade técnica.
* **Portal Médico (`portal_medico`):** visualização da fila e registro de atendimentos integrados à base de dados.
* **Painel Administrativo (`portal_admin`):** gestão operacional de usuários, organização do sistema e acompanhamento das respostas da pesquisa.

### 1.4. Camada de Dados na Nuvem (`TiDB Cloud`) e Segurança de Ambiente
* O backend (porta `3000` local ou ambiente publicado) conecta-se ao **TiDB Cloud** via `mysqls://` na porta `4000` (base `pulsevida`), centralizando usuários, fluxos e avaliações.
* As credenciais reais e o `JWT_SECRET` ficam isolados no arquivo `.env` local e nas variáveis de ambiente da nuvem, enquanto o `.env.example` público no branch `main` mantém apenas placeholders sanitizados.

### 1.5. Pesquisa de Satisfação (`/feedback`)
Canal de coleta rápida de percepções de uso composto por quatro campos gravados na tabela `pesquisas`:
1. **Como prefere se identificar? (`nome`):** papel ou identificação opcional do respondente.
2. **O que funcionou bem? (`positivo`):** pontos positivos observados na experiência.
3. **Que dificuldade encontrou? (`negativo`):** gargalos de navegação, sessão ou configuração.
4. **Sugestões de melhoria (`sugestoes`):** propostas práticas para as próximas iterações.

---

## 2. Usuários Validados no Banco (`usuarios`)

Registros conferidos na instância **TiDB Cloud** (`pulsevida`):

| ID | Nome | Usuário | E-mail | Perfil (`tipo`) | Ativo | Criado em |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| `1` | Dado Dollabela | `dado` | `dado@gmail.com` | `paciente` | 1 | 2026-11-20 16:56:31 |
| `2` | Admin | `admin` | `admin@admin.com` | `administrador` | 1 | 2026-11-20 16:58:39 |
| `30001` | Dr. Pedro Paulo | `pedro` | `pedro@gmail.com` | `medico` | 1 | 2026-11-20 17:09:24 |
| `2030001` | Neto Caneco | `caneco` | `caneco@gmail.com` | `paciente` | 1 | 2026-11-21 01:41:18 |
| `2060001` | Neco Boneco Doido | `neco` | `neco@gmail.com` | `paciente` | 1 | 2026-11-21 14:44:54 |
| `2090001` | admin | `zeca` | `zeca@gmail.com` | `paciente` | 1 | 2026-11-21 15:21:52 |
| `2090004` | Carlos Magno | `carlos` | `carlos@gmail.com` | `paciente` | 1 | 2026-11-21 15:29:21 |
| `2120001` | Mara Maravilha | `mara` | `mara@gmail.com` | `paciente` | 1 | 2026-11-21 19:08:12 |
| `2120002` | Mané Garrincha | `garrincha` | `garrincha@gmail.com` | `paciente` | 1 | 2026-11-21 19:12:54 |
| `2150001` | Dra. Simone Almeida Couto | `almeida` | `almeida@gmail.com` | `medico` | 1 | 2026-11-22 14:34:05 |
| `2180002` | Dr. Mario Sergio | `mario` | `mario@gmail.com` | `medico` | 1 | 2026-11-22 15:48:12 |
| `2180004` | Jose Carlos | `jose` | `jose@gmail.com` | `paciente` | 1 | 2026-11-22 15:51:00 |

---

## 3. Feedbacks Reais Registrados no Banco (`pesquisas`)

Consulta executada via `SELECT * FROM pesquisas;` na base `pulsevida` (**TiDB Cloud**):

| ID | Identificação (`nome`) | O que funcionou bem (`positivo`) | Dificuldade encontrada (`negativo`) | Sugestões (`sugestoes`) | Criado em |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `1` | Sandro Carvalho de Souza | Melho agilidade para Agendamentos, bem pratico. | Achar disponibilidade de atendimento , em situação que exigira rapidez no atendimento do Paciente Hipertenso. | Mais rapidez no atendimento em caso de prioridade, risco de vida. | 2026-11-22 14:06:49 |
| `2000001` | Sandra Barbosa (Paciente) | O acesso à plataforma ficou mais rápido e direto, e o fluxo de login até o acompanhamento da fila de atendimento funcionou sem travar. | No começo, tive dúvida sobre qual rota abrir depois de entrar, porque vi referências a áreas separadas para atendimento e gestão. | Deixar um aviso curto na tela inicial explicando o que cada área faz para quem usa pelo celular. | 2026-11-23 21:50:28 |
| `2000002` | Carlos Roberto (médico) | O portal médico (`portal_medico`) deixou a visualização da fila e o registro de atendimentos bem mais organizados e fáceis de consultar no dia a dia. | Em alguns momentos, ao atualizar a tela durante os testes, precisei conferir se a sessão continuava ativa antes de enviar uma nova alteração. | Exibir um indicador discreto de conexão/sincronização no topo do portal médico para dar mais segurança durante o atendimento. | 2026-11-23 21:52:12 |
| `2000003` | Ronaldo Pietro(estudante) | A estrutura da pesquisa é limpa, objetiva e deixa claro logo no início para não colocar dados sensíveis, o que passa confiança logo no primeiro | Como o formulário tem campos de texto livre, quem testa rápido na apresentação pode preencher respostas curtas demais se não houver exemplos. | Manter os placeholders atuais e adicionar um exemplo rápido em "Que dificuldade encontrou?" para orientar quem responde em | 2026-11-23 21:55:14 |
| `2000004` | Celia Machado(Enfermeira) | A separação entre a área médica e o acompanhamento do fluxo facilitou enxergar como os atendimentos avançam sem misturar telas administrativas. | Na rotina de triagem e encaminhamento, faltou perceber rapidamente quando um registro já tinha sido atualizado por outro perfil durante os testes. | Incluir um aviso visual discreto de atualização recente e destacar os atalhos principais para quem acompanha a fila no dia a dia. | 2026-11-23 21:57:17 |

---

## 4. Ajustes Realizados (Semana 7) — Entregável: MVP v2

### Mudanças Aplicadas
* **Variáveis de ambiente:** `.env.example` sanitizado com placeholders (removendo senhas reais) e `.env` configurado localmente com `JWT_SECRET` para estabilidade das sessões.
* **Banco de dados:** conexão validada no **TiDB Cloud** via `mysqls://` na porta `4000` na base `pulsevida` com codificação `utf8mb4` ativa.
* **Versionamento:** diretório do projeto alinhado, alterações conferidas via `git diff` e enviadas para o branch `main` no GitHub.
* **Fluxo e validação:** reforço na orientação da tela `/feedback` (sem dados clínicos ou pessoais sensíveis) e validação ponta a ponta da gravação e consulta na tabela `pesquisas`.

### Quadro Comparativo (MVP v1 → MVP v2)

| Área / Módulo | Diagnóstico nos Feedbacks e Testes | Melhoria Entregue no MVP v2 |
| :--- | :--- | :--- |
| **Segurança e Ambiente** | Credenciais reais no `.env.example` e necessidade de chave fixa de autenticação | `.env.example` sanitizado e `JWT_SECRET` configurado no ambiente |
| **Banco na Nuvem** | Necessidade de conexão SSL estável e suporte correto a acentuação (`utf8mb4`) | Conexão validada no TiDB Cloud (`mysqls://`, porta `4000`, `utf8mb4`) |
| **Versionamento Git** | Pastas locais divergentes e risco de commit com segredos | Diretório único padronizado, `git diff` validado e `main` sincronizada |
| **Operação e Feedback** | Necessidade de validar ponta a ponta o envio e persistência das avaliações | Fluxo `/feedback` testado em produção com 5 avaliações gravadas em `pesquisas` |
=======
=======
>>>>>>> marsol/main
>>>>>>> 0661d751b750162f7c6ce9b13ca08381ff0186a0
