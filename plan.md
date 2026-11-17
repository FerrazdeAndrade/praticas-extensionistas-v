# Plano — PulseVida: site integrado e responsivo

## Objetivo aprovado
Transformar o projeto PulseVida enviado pelo usuário em um site acadêmico funcional, preservando a identidade, os assets e a lógica útil do projeto. Paciente, profissional e administrador terão permissões próprias e compartilharão registros persistidos no banco gerenciado; a interface funcionará em desktop e smartphone. Entregar o código e instruções para o usuário publicar no próprio GitHub. Não publicar o site nem enviar código ao GitHub nesta etapa.

## Arquitetura e implementação
- **Aplicação:** preservar a abordagem leve já existente: páginas HTML/CSS/JavaScript, servidas pelo Express e adaptadas do frontend PulseVida entregue. Usar caminhos relativos na aplicação e API same-origin `/api` para funcionar no Preview e em implantação sem URLs internas fixas.
- **Servidor:** Express em Node.js, servindo frontend e endpoints JSON, com o listener no host e porta declarados pelo projeto (`0.0.0.0:3000`). Healthcheck simples para confirmar servidor e banco.
- **Banco:** usar o banco gerenciado MySQL-compatible provisionado para este projeto e conectar via `DATABASE_URL`; o backend PostgreSQL do arquivo original será adaptado para o driver MySQL. Migrações SQL idempotentes e versionadas criam/atualizam contas, aferições, agendamentos, atendimentos e pesquisas preservadas do projeto. Dados persistentes, sem depender de `localStorage` como fonte oficial.
- **Autenticação e autorização:** preservar login por usuário/e-mail e senha já esperado no projeto, derivar senhas com scrypt, emitir token aleatório de 256 bits e armazenar apenas seu hash SHA-256 na tabela de sessões por 12 horas. Cadastro aberto apenas para paciente; criação profissional/administrador apenas por administrador; checagem do papel no servidor e consultas clínicas sempre vinculadas ao paciente autenticado. Retornar CPF/Cartão SUS apenas ao próprio paciente e limitar o acesso ao e-mail de contato do paciente ao fluxo profissional.
- **Regras operacionais:** validar calendário e data mínima de consulta no fuso `America/Sao_Paulo`, igual ao seletor de data da interface. Aplicar limitação em memória ao formulário público de feedback (até cinco tentativas por IP em 15 minutos), com `Retry-After` em excesso; essa proteção é básica e não substitui um rate limit distribuído em produção.
- **Áreas:** paciente (resumo, aferições, consultas, histórico); profissional (fila, consulta às aferições e registro de atendimento); administrador (contas, criação de acessos de equipe e administração de agendamentos). Ações gravadas no backend aparecem para os outros perfis após atualização.
- **Smartphone:** manter um único site responsivo, com navegação compacta, formulários tocáveis e tabelas adaptadas a telas pequenas. Não será aplicativo nativo Android/iOS.
- **Visual:** continuar a marca enviada e a direção das telas existentes: azul-marinho clínico para navegação, teal PulseVida como cor de saúde/ação, fundo claro, cartões legíveis, hierarquia tipográfica clara e mensagens que não prometem diagnóstico. Manter assets otimizados e símbolos/identidade existentes sem inventar imagens clínicas.

## Design
- **Movimento:** painel editorial de saúde digital contemporâneo, com aparência institucional e calma.
- **Princípios:** confiança e legibilidade; ações evidentes; informação por perfil; mobile-first sem esconder dados essenciais.
- **Cores:** navy para estrutura e segurança; teal como assinatura PulseVida e orientação; branco/cinza azulado para espaços limpos; status verde/âmbar com texto explícito.
- **Layout:** navegação lateral no desktop que vira navegação compacta em mobile, cabeçalho consistente e conteúdo em blocos/cards; tabelas com scroll ou apresentação em cartões em telas estreitas.
- **Elementos assinatura:** símbolo/wordmark PulseVida existente, faixa de estado/último registro e badges de status.
- **Interação/animação:** respostas imediatas, confirmação para ações destrutivas, feedback de sucesso/erro e transições discretas; sem movimentos que prejudiquem legibilidade.
- **Tipografia:** system stack/Manrope quando disponível, escala consistente entre título, label e dados, no mínimo 14–16 px nos controles móveis.
- **Essência e voz:** acompanhamento em saúde municipal conectado, claro, responsável; personalidade acolhedora, organizada e profissional. Ex.: “Acompanhe seus registros em um só lugar.” e “A solicitação foi enviada; a unidade precisa confirmá-la.”
- **Marca:** reutilizar logomarca PulseVida fornecida, preservando proporção e sem redesenho.
- **Cor proprietária:** teal PulseVida, combinada ao navy institucional.

## Estrutura prevista
```text
/home/ubuntu/pulsevida/
  server.js                 Express: API, autenticação e arquivos estáticos
  package.json / pnpm-lock.yaml
  .env.example / .gitignore
  migrations/                SQL MySQL idempotente e alterações versionadas
  scripts/                   migração e utilitários necessários
  public/                    páginas, assets, estilos e JavaScript PulseVida
  README.md                   setup local, configuração do banco, deploy/GitHub
  plan.md / TODO.md
```

## Restrições da entrega
O Preview é executável e usa o banco gerenciado deste projeto. Para execução fora do Preview, o usuário precisará configurar seu próprio banco MySQL-compatible e as variáveis indicadas no `.env.example`. Não enviar segredos no ZIP nem publicar conteúdo de saúde real. O usuário pediu preparação para GitHub, mas não autorizou conectar/enviar ao seu repositório nem publicar site: serão entregues os arquivos organizados e os passos; o envio/publicação fica para uma autorização posterior. Não criar contas clínicas de apresentação no banco compartilhado sem solicitação; o roteiro de demonstração explica como criá-las manualmente com dados fictícios.
