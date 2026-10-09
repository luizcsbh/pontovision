# CLAUDE.md — PontoVision AI Reference Guide

## Visão Geral
PontoVision AI é um sistema completo de gestão de espelhos de ponto com digitalização por câmera, editor de imagem, OCR estritamente local (Tesseract.js sem APIs externas), apuração de horas, calendário e emissão de relatórios.

## Estrutura do Monorepo
- `packages/shared`: Modelos, enums, contratos DTO e utilitários de domínio puros (validador CPF, motor de cálculo CLT).
- `apps/api`: Backend NestJS com MongoDB/Mongoose, JWT, Sharp, Tesseract.js local, Swagger.
- `apps/web`: Frontend React 18, Vite, Tailwind CSS, TanStack Query, React Hook Form, Cropper.js.
- `docs/`: Documentação de arquitetura, OCR, agentes, segurança e implantação.

## Comandos Principais
```bash
# Instalação
npm install

# Build
npm run build

# Testes
npm run test

# Execução em desenvolvimento
npm run dev          # API e Web em paralelo
npm run dev:api      # Apenas API (porta 3000)
npm run dev:web      # Apenas Web (porta 5173)

# Docker
docker-compose up -d # Sobe MongoDB, API e Web
```

## Regras Críticas e Restrições
1. **NUNCA usar APIs externas de OCR ou Visão Computacional** (proibido Google Cloud Vision, AWS Textract, Azure AI Vision ou LLMs de visão remotos).
2. **NUNCA comitar credenciais ou arquivos `.env`**.
3. **OCR é 100% local** com Tesseract.js e pré-processamento via Sharp.
4. **Isolamento de dados:** cada usuário só acessa seus próprios registros.
5. **Revisão humana:** extrações de OCR exigem confirmação do usuário antes de serem consolidadas.
