# Documento de Arquitetura — PontoVision AI

## 1. Visão Geral
O **PontoVision AI** adota os princípios de **Clean Architecture** e **Domain-Driven Design (DDD)** para manter as regras de negócio desacopladas de frameworks, provedores de OCR e mecanismos de persistência.

```
+-------------------------------------------------------------+
|                     Apps / Apresentação                     |
|         apps/web (React/Vite)      apps/api (NestJS HTTP)   |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|                     Camada de Aplicação                     |
|           Casos de Uso / Serviços de Aplicação              |
|        (AuthService, TimeEntryService, OcrService)          |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|                      Domínio Puro                           |
|        Entidades, Enums, Regras de Jornada CLT e            |
|       Cálculos Matemáticos (packages/shared)               |
+-------------------------------------------------------------+
                              ^
                              |
+-------------------------------------------------------------+
|                     Infraestrutura                          |
|    Mongoose/MongoDB, Tesseract.js (Local), Sharp, Storage   |
+-------------------------------------------------------------+
```

## 2. Princípios de Separação de Responsabilidade
1. **Domínio Independente:** O pacote `@pontovision/shared` detém as regras puras de cálculo de saldo diário, tolerância legal (Art. 58 CLT), validação de CPF e tipos fundamentais, sem qualquer dependência de NestJS, React ou MongoDB.
2. **Provedores Abstratos (DIP - Dependency Inversion Principle):**
   - `OcrProvider`: Interface abstrata implementada por `LocalOcrService` (Tesseract.js).
   - `FileStorageProvider`: Interface abstrata para persistência de imagens (implementada por `LocalStorageProvider`, pronta para extensão para S3 sem alterar a regra de negócio).
   - `ImageProcessor`: Interface para transformações de imagem com `Sharp`.
3. **Isolamento Multi-Tenant por Usuário:** Todas as consultas no banco de dados e arquivos de imagem exigem obrigatoriamente a vinculação ao `userId` do token autenticado.

## 3. Módulos do Backend (NestJS)
- `AuthModule`: Autenticação JWT, Refresh Tokens, RBAC com Roles Guard.
- `UsersModule`: Gestão de perfil, preferências de jornada.
- `TimeEntriesModule`: Registro manual e gestão de marcações.
- `TimeDocumentsModule`: Upload de fotos e comprovantes.
- `OcrModule`: Reconhecimento de caracteres via Tesseract.js local e extração inteligente de campos.
- `ImageProcessingModule`: Tratamento e otimização de imagens com Sharp.
- `WorkSchedulesModule`: Gestão de jornadas semanais de trabalho.
- `CalendarModule`: Agrupamento de registros por dia, mês e semana para visualização interativa.
- `HolidaysModule`: Gestão de feriados e folgas corporativas.
- `ReportsModule`: Exportação em PDF, XLSX, CSV e JSON.
- `AuditModule`: Rastreabilidade completa de alterações em marcações.
- `StorageModule`: Armazenamento de comprovantes com hash SHA-256 e nomes protegidos.
