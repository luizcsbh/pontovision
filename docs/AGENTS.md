# Agentes Especializados do Projeto — PontoVision AI

Conforme definido na especificação, o projeto é estruturado pelas atribuições dos 6 agentes de engenharia:

### Agente 1 — Tech Lead e Arquiteto
- **Atribuições:** Definição da Clean Architecture, monorepo com npm workspaces, contratos compartilhados no `@pontovision/shared`, SOLID e governança de código.
- **Entregáveis:** `packages/shared`, documentação de arquitetura, contratos e interfaces dos repositórios e provedores.

### Agente 2 — Backend Engineer
- **Atribuições:** Implementação da API NestJS em `/api/v1`, autenticação JWT + refresh tokens, Schemas MongoDB com Mongoose, módulos de marcação, jornadas, feriados, relatórios e auditoria.
- **Entregáveis:** `apps/api/src/modules/*`, DTOs de validação com class-validator, Swagger OpenAPI.

### Agente 3 — Frontend Engineer
- **Atribuições:** Interface SPA responsiva em React 18, Vite, Tailwind CSS, TanStack Query, captura de câmera nativa via `getUserMedia`, editor Cropper.js, calendário mensal/semanal, tela de revisão de OCR e espelho virtual.
- **Entregáveis:** `apps/web/src/*`.

### Agente 4 — OCR Engineer
- **Atribuições:** Implementação do `LocalOcrService` com `Tesseract.js` executando localmente em português (`por`), normalização de texto, extração de CPF, NSR, data e hora com regex e heurísticas de confiança, sem envio para provedores remotos.
- **Entregáveis:** `apps/api/src/modules/ocr/*`.

### Agente 5 — Database e DevOps Engineer
- **Atribuições:** Modelagem e índices do MongoDB, contêineres Docker, Docker Compose, scripts de inicialização, configuração de CI/CD e retenção de arquivos.
- **Entregáveis:** `docker-compose.yml`, `Dockerfile`, `.github/workflows/ci.yml`.

### Agente 6 — QA e Security Engineer
- **Atribuições:** Testes unitários para regras CLT de cálculo de horas, validação de CPF, testes de integração de endpoints, proteção de dados (LGPD - mascaramento de CPF), e garantia de não-vazamento de credenciais.
- **Entregáveis:** Suíte de testes Jest/Vitest, diretrizes de segurança em `docs/SECURITY.md`.
