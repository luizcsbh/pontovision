# Estratégia de Testes — PontoVision AI

## 1. Níveis de Teste
- **Testes Unitários:**
  - Validação de CPF e dígitos verificadores.
  - Motor de cálculo de horas diárias, intervalos, tolerâncias e horas extras.
  - Parser de OCR e normalização de regex.
- **Testes de Integração:**
  - Fluxos de autenticação (cadastro, login, emissão de tokens).
  - CRUD de marcações com cálculo de jornada.
  - Endpoints de relatórios (PDF, CSV, XLSX, JSON).

## 2. Comandos de Execução
```bash
# Executar todos os testes
npm test

# Executar testes unitários do pacote compartilhado
npm run test --workspace=@pontovision/shared

# Executar testes da API
npm run test --workspace=@pontovision/api

# Executar testes do frontend
npm run test --workspace=@pontovision/web
```
