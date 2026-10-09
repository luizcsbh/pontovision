# Políticas de Segurança e Privacidade — PontoVision AI

## 1. Princípios de Proteção de Dados (LGPD)
- **Não-vazamento de credenciais:**
  - Nenhuma senha, token ou string de conexão de banco de dados é mantida em código-fonte ou versionada no Git.
  - Arquivos `.env` e arquivos contendo credenciais são estritamente listados no `.gitignore`.
- **Mascaramento de CPF:**
  - O CPF é exibido como `123.***.***-45` na interface e logs estruturados.
- **Processamento de OCR 100% On-Premise:**
  - Nenhuma imagem ou metadado é encaminhado para serviços externos ou terceiros na nuvem.

## 2. Autenticação e Autorização
- **Hash de Senhas:** `bcryptjs` com salt rounds seguro.
- **Tokens de Acesso:** JSON Web Tokens (JWT) com tempo de vida curto (1 hora) e refresh tokens rotacionados.
- **RBAC:** Controle de acesso baseado em papéis (`ADMIN`, `USER`, `AUDITOR`).
- **Isolamento de Recursos:** Cada consulta ao banco verifica se o documento pertence ao `userId` do token da requisição.

## 3. Segurança de Uploads
- Validação de MIME Type real (`image/jpeg`, `image/png`, `image/webp`).
- Limite máximo de arquivo: 10MB.
- Nomes de arquivo sanitizados com UUIDs criptográficos para prevenir ataques de Path Traversal.
