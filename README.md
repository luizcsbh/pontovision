# PontoVision AI 🕒📸

> Sistema completo de digitalização, gestão e espelhos de ponto com OCR local e análise de jornadas de trabalho.

![Node.js](https://img.shields.io/badge/Node.js-v22-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![NestJS](https://img.shields.io/badge/NestJS-10.x-red)
![React](https://img.shields.io/badge/React-18.x-cyan)
![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green)
![Local OCR](https://img.shields.io/badge/OCR-Tesseract.js%20(Local)-orange)

---

## 🎯 Objetivo

O **PontoVision AI** permite que trabalhadores e profissionais digitalizem seus comprovantes de ponto impresso (tiquetes de relógio REP ou folhas de espelho) utilizando a câmera do celular ou upload de arquivos, realizem recorte e rotação da imagem, extraiam os dados via **OCR 100% local (sem dependência de nuvem paga)**, revisem os dados e mantenham seu espelho de ponto virtual organizado com cálculo de horas e exportação em PDF, Excel e CSV.

---

## 🏗️ Arquitetura do Projeto

O projeto é estruturado em monorepo com Clean Architecture e isolamento entre camadas:

```
pontovision/
├── apps/
│   ├── api/            # Backend NestJS (REST API /api/v1, Swagger, Mongoose, Tesseract, Sharp)
│   └── web/            # Frontend React + Vite + Tailwind CSS + Cropper.js + PWA
├── packages/
│   └── shared/         # Contratos, tipos TypeScript e motor de cálculo de horas puro
├── docs/               # Documentação técnica detalhada
│   ├── ARCHITECTURE.md
│   ├── AGENTS.md
│   ├── OCR.md
│   ├── IMAGE-PROCESSING.md
│   ├── BUSINESS-RULES.md
│   ├── SECURITY.md
│   ├── DEPLOYMENT.md
│   └── TESTING.md
├── docker-compose.yml  # Orquestração de containers (MongoDB, API e Web)
└── .env.example        # Modelo de variáveis de ambiente
```

---

## 🔒 Segurança e Privacidade

- **Zero vazamento de dados para terceiros:** O OCR é executado integralmente no ambiente local utilizando Tesseract.js e Sharp. Nenhuma imagem ou dado biométrico/pessoal é enviado para APIs de IA externas ou serviços remotos de reconhecimento.
- **Proteção de Dados (LGPD):** CPF mascarado na interface e logs (`123.***.***-45`).
- **Autenticação:** JWT com refresh tokens, senhas criptografadas com `bcryptjs` (custo de hashing seguro).
- **Isolamento de Tenant:** Usuários têm acesso restrito estritamente aos seus próprios registros e imagens.

---

## 🚀 Como Executar

### Pré-requisitos
- Node.js >= 20.x
- Docker e Docker Compose (opcional para rodar bancos e serviços)

### 1. Clonar e Instalar Dependências
```bash
git clone <url-do-repositorio>
cd pontovision
npm install
```

### 2. Configurar Variáveis de Ambiente
Copie o arquivo de exemplo:
```bash
cp .env.example .env
```
Ajuste as variáveis caso deseje apontar para o MongoDB local (`mongodb://localhost:27017/pontovision`) ou cluster Atlas.

### 3. Execução em Desenvolvimento
```bash
# Compilar pacotes compartilhados
npm run build --workspace=@pontovision/shared

# Iniciar backend e frontend simultaneamente
npm run dev
```
- API disponível em: `http://localhost:3000/api/v1`
- Swagger Docs em: `http://localhost:3000/api/docs`
- Aplicação Web em: `http://localhost:5173`

### 4. Execução via Docker Compose
```bash
docker-compose up -d --build
```

---

## 🧪 Testes Automatizados
```bash
# Rodar todos os testes do monorepo
npm test
```

---

## 📄 Licença
Distribuído sob licença MIT.
