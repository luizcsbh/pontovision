# PROMPT MESTRE — PontoVision AI

## Sistema completo de gestão de espelhos de ponto com OCR local

## 1. Objetivo do projeto

Atue como uma equipe de engenharia de software especializada em Node.js, TypeScript, React, MongoDB, processamento de imagens, OCR local, Clean Architecture, segurança e testes automatizados.

Desenvolva uma aplicação web completa chamada **PontoVision AI**, destinada à digitalização, organização, consulta e análise de espelhos de ponto pessoais.

O sistema deverá permitir que o usuário fotografe seus espelhos de ponto pelo celular, envie imagens pelo computador, processe as fotografias, extraia informações por OCR, revise os dados reconhecidos e gere um espelho de ponto virtual estruturado, semelhante ao documento original.

A aplicação deverá permitir tanto marcações associadas a fotografias quanto marcações totalmente manuais.

### Requisitos principais

* Aplicação responsiva para celular, tablet e desktop.
* PWA instalável em dispositivos compatíveis.
* Captura de imagens pela câmera do dispositivo.
* Recorte, rotação e otimização das fotografias.
* OCR executado localmente, sem serviços externos de reconhecimento.
* Extração de nome, CPF, NSR, data e hora.
* Revisão e edição dos campos reconhecidos.
* Cadastro manual de marcações.
* Calendário interativo.
* Cadastro de jornadas semanais.
* Cálculo de horas diárias, semanais e mensais.
* Cadastro de feriados.
* Geração de espelho de ponto virtual.
* Relatórios e exportação.
* Usuários, autenticação e controle de acesso.
* Auditoria de alterações.
* Docker, documentação e testes automatizados.

Não desenvolva apenas telas demonstrativas. Implemente a aplicação funcional, incluindo API, banco de dados, persistência de arquivos e regras de negócio.

---

## 2. Stack tecnológica obrigatória

### Backend

* Node.js em versão LTS compatível com as dependências.
* TypeScript com modo estrito.
* NestJS para modularização da API.
* MongoDB como banco de dados.
* Mongoose para schemas e persistência.
* REST API versionada em `/api/v1`.
* Swagger/OpenAPI para documentação.
* JWT com refresh tokens seguros.
* Argon2id para hash de senhas.
* class-validator ou Zod para validação.
* Jest para testes.
* Pino para logging estruturado.

### Frontend

* React com TypeScript.
* Vite.
* React Router.
* TanStack Query.
* React Hook Form.
* Zod.
* Tailwind CSS.
* shadcn/ui ou componentes acessíveis equivalentes.
* Biblioteca de calendário compatível com React.
* Biblioteca de gráficos.
* PWA com service worker.
* APIs nativas do navegador para captura de imagens e interação com arquivos.

### Processamento de imagens

Utilizar bibliotecas JavaScript disponíveis para Node.js:

* **Sharp:** redimensionamento, conversão, compressão e otimização de imagens.
* **browser-image-compression:** compressão opcional no frontend antes do upload.
* **Cropper.js:** recorte interativo no navegador.
* **OpenCV.js:** processamento avançado opcional para correção de perspectiva, inclinação e detecção de bordas, se necessário.

Não utilizar Python, scripts Python ou serviços externos para processar imagens.

A versão inicial deverá priorizar Sharp e Cropper.js. Introduzir OpenCV.js somente se os requisitos de qualidade justificarem sua complexidade.

### OCR e reconhecimento de texto

Utilizar exclusivamente bibliotecas executadas em JavaScript ou WebAssembly:

* **Tesseract.js:** reconhecimento de texto em imagens.
* **Tesseract.js Worker:** execução do OCR em worker, evitando bloquear a interface.
* **Tesseract.js Language Data:** arquivos de idioma necessários para reconhecimento em português.
* **Sharp:** preparação das imagens antes do reconhecimento.

O idioma principal será `por`, com possibilidade de usar `eng` adicionalmente quando os testes demonstrarem benefício.

Não utilizar Google Cloud Vision, AWS Textract, Azure AI Vision, serviços pagos de OCR, APIs externas de reconhecimento ou qualquer serviço remoto de IA para extrair texto.

O OCR deverá funcionar sem depender de credenciais de terceiros ou conexão com serviços de reconhecimento externos.

O sistema poderá baixar dependências e arquivos de idioma durante a instalação ou preparação do ambiente. Após o download dos arquivos necessários, o reconhecimento deverá funcionar localmente.

### Exportação e relatórios

Utilizar bibliotecas JavaScript, como:

* `pdf-lib` ou `pdfmake` para PDF.
* `exceljs` para XLSX.
* `csv-stringify` para CSV.
* APIs nativas de Blob e download no frontend, quando apropriado.

### Infraestrutura

* Docker.
* Docker Compose.
* MongoDB.
* Redis e BullMQ, caso sejam necessários para filas de processamento.
* GitHub Actions ou GitLab CI.
* Variáveis de ambiente.
* Armazenamento local ou compatível com S3, por meio de uma interface abstrata.

Não adicionar serviços externos sem necessidade comprovada.

---

## 3. Agentes especializados

Crie os seguintes agentes de desenvolvimento.

### Agente 1 — Tech Lead e Arquiteto

Responsável por:

* Definir arquitetura e módulos.
* Criar contratos entre os agentes.
* Definir padrões de código.
* Garantir Clean Architecture e SOLID.
* Criar backlog e critérios de aceitação.
* Revisar as integrações.
* Aprovar decisões técnicas.
* Garantir que o projeto permaneça executável.

### Agente 2 — Backend Engineer

Responsável por:

* Implementar API NestJS.
* Desenvolver autenticação.
* Criar schemas MongoDB.
* Implementar marcações, jornadas, feriados e relatórios.
* Implementar cálculos de horas.
* Criar serviços de aplicação e repositórios.
* Criar testes unitários e de integração.
* Documentar endpoints.

### Agente 3 — Frontend Engineer

Responsável por:

* Criar interface React responsiva.
* Implementar dashboard e calendário.
* Implementar captura de fotografias.
* Criar editor de imagens.
* Desenvolver formulários de marcações.
* Implementar a revisão dos campos do OCR.
* Criar visualizador do espelho virtual.
* Desenvolver relatórios e exportações.

### Agente 4 — OCR Engineer

Responsável por:

* Implementar Tesseract.js.
* Configurar os arquivos de idioma.
* Desenvolver preparação de imagens.
* Criar pré-processamento com Sharp.
* Implementar reconhecimento de nome, CPF, NSR, data e hora.
* Criar validação e normalização dos campos.
* Desenvolver mecanismos de revisão humana.
* Criar testes com imagens reais de exemplo, devidamente autorizadas, e imagens sintéticas.
* Avaliar precisão e limitações do OCR.

### Agente 5 — Database e DevOps Engineer

Responsável por:

* Modelar o MongoDB.
* Criar índices.
* Configurar Docker.
* Implementar armazenamento de arquivos.
* Configurar CI/CD.
* Implementar backups.
* Configurar logging e monitoramento.
* Garantir isolamento dos dados por usuário.

### Agente 6 — QA e Security Engineer

Responsável por:

* Criar testes unitários, integração e E2E.
* Testar os cálculos de jornada.
* Verificar permissões e autenticação.
* Testar processamento de imagens.
* Testar a qualidade do OCR.
* Verificar vulnerabilidades de upload.
* Revisar privacidade e segurança.
* Validar responsividade e acessibilidade.

Os agentes deverão compartilhar contratos, interfaces e documentação. Se a ferramenta não suportar agentes paralelos, executar os papéis sequencialmente.

---

## 4. Arquitetura geral

Utilizar Clean Architecture, separando regras de negócio de bibliotecas e frameworks.

Organizar o backend em módulos:

* Auth.
* Users.
* TimeEntries.
* TimeDocuments.
* OCR.
* ImageProcessing.
* WorkSchedules.
* Calendar.
* Holidays.
* Reports.
* Audit.
* Storage.

Criar interfaces para:

* `TimeEntryRepository`
* `TimeDocumentRepository`
* `OcrProvider`
* `ImageProcessor`
* `FileStorageProvider`
* `ReportExporter`

A implementação inicial de `OcrProvider` deverá utilizar exclusivamente Tesseract.js.

A interface poderá permitir futuras implementações locais, sem introduzir serviços externos de OCR.

### Fluxo técnico

1. O usuário captura ou seleciona uma imagem.
2. O frontend permite recortar e ajustar a imagem.
3. A imagem é otimizada para reduzir o tamanho.
4. O backend valida o arquivo recebido.
5. O backend processa a imagem com Sharp.
6. O serviço OCR prepara a imagem para reconhecimento.
7. Tesseract.js extrai o texto.
8. O parser identifica os campos candidatos.
9. O serviço de validação normaliza e verifica os dados.
10. O frontend apresenta os resultados para revisão.
11. O usuário corrige os campos, quando necessário.
12. O sistema salva a imagem e os dados estruturados.
13. O calendário e o espelho virtual são atualizados.

A arquitetura deverá permitir executar o OCR no backend ou no navegador. Para a primeira versão, priorizar o processamento no backend para centralizar regras e evitar duplicação de lógica.

---

## 5. Autenticação e gerenciamento de usuários

Implementar:

* Cadastro.
* Login.
* Logout.
* Recuperação de senha.
* Alteração de senha.
* Perfil do usuário.
* Gerenciamento de sessões.
* Renovação e revogação de tokens.
* Exclusão de conta.
* Controle de permissões.

Papéis:

* `ADMIN`
* `USER`
* `AUDITOR`

O usuário comum somente poderá acessar seus próprios registros.

Utilizar senhas com hash seguro, validação de entradas, rate limiting, proteção contra tentativas excessivas e tokens com expiração adequada.

---

## 6. Captura e gerenciamento de imagens

Implementar três opções:

1. Captura pela câmera do celular.
2. Seleção da galeria.
3. Upload pelo computador.

Utilizar `navigator.mediaDevices.getUserMedia()` quando suportado e autorizado pelo usuário.

Criar fallback para upload de arquivo quando a câmera não estiver disponível.

### Editor de imagens

Permitir:

* Recortar.
* Girar.
* Ajustar orientação.
* Visualizar.
* Refazer captura.
* Comprimir.
* Comparar tamanho antes e depois.
* Confirmar a imagem antes de salvar.

### Otimização

Utilizar browser-image-compression no frontend, quando apropriado, e Sharp no backend.

Configurações iniciais sugeridas:

* Lado maior entre 1.600 e 2.000 pixels.
* Qualidade JPEG configurável.
* Remoção de metadados desnecessários.
* Preservação da proporção.
* Conversão para formato compatível com o OCR.

Os valores deverão ser ajustados por testes de legibilidade.

O sistema deverá armazenar a imagem processada e permitir configurar a retenção da imagem original.

Não reduzir a imagem de maneira que torne os horários ilegíveis.

Caso o OCR apresente baixa confiança, oferecer a opção de reprocessar a imagem com resolução superior.

---

## 7. OCR totalmente local

Implementar um serviço chamado `LocalOcrService`, usando Tesseract.js.

Exemplo de responsabilidade:

* Receber uma imagem preparada.
* Executar reconhecimento com idioma português.
* Obter o texto reconhecido.
* Identificar palavras, linhas e coordenadas disponíveis.
* Interpretar os campos esperados.
* Retornar resultado estruturado.
* Informar erros e campos que precisam de revisão.

O serviço deverá utilizar workers e controlar corretamente seu ciclo de vida, evitando criar workers desnecessariamente a cada requisição.

### Campos extraídos

* Nome completo.
* CPF.
* NSR.
* Data.
* Hora.
* Texto original reconhecido.

O parser deverá funcionar independentemente do provedor de OCR, permitindo testar a interpretação de texto sem precisar executar o reconhecimento em cada teste.

### Estratégia de extração

Implementar etapas distintas:

1. Pré-processamento.
2. Reconhecimento de texto.
3. Normalização de caracteres.
4. Identificação de candidatos.
5. Validação.
6. Revisão humana.

Utilizar expressões regulares e funções JavaScript para reconhecer formatos de data, hora e CPF.

Para identificar o nome, utilizar a posição das linhas e o contexto dos rótulos, sem assumir que o nome sempre estará na primeira linha.

Para o NSR, identificar possíveis rótulos e sequências numéricas. Não confundir automaticamente qualquer número longo com o NSR.

### Validações

CPF:

* Normalizar pontuação.
* Validar dígitos verificadores.
* Preservar o valor original para auditoria.

Data:

* Validar a data real.
* Aceitar formatos brasileiros reconhecidos.
* Normalizar internamente.

Hora:

* Utilizar formato de 24 horas.
* Rejeitar horários impossíveis.
* Preservar o valor original reconhecido.

Nome:

* Preservar acentos.
* Permitir correção manual.

NSR:

* Preservar zeros à esquerda.
* Permitir ausência quando não identificado.
* Sinalizar possíveis duplicidades.

### Resultado estruturado

O serviço deverá retornar um objeto tipado com:

* `rawText`
* `name`
* `cpf`
* `nsr`
* `date`
* `time`
* `fieldConfidence`
* `warnings`
* `reviewRequired`

Não inventar valores ausentes.

Quando o Tesseract.js não fornecer uma confiança específica por campo, não fabricar esse indicador. Calcular uma estimativa somente se houver uma metodologia documentada, deixando explícito que ela não equivale à confiança real do mecanismo OCR.

### Revisão

A interface deverá exibir os campos extraídos, os valores candidatos e os avisos.

Campos ausentes, inválidos ou ambíguos deverão ser destacados.

Nenhuma extração incerta deverá ser tratada como comprovadamente correta.

O usuário deverá confirmar os dados antes da gravação definitiva da marcação.

---

## 8. Cadastro manual

Permitir criar marcações sem fotografia e sem OCR.

Campos:

* Data.
* Hora.
* Tipo.
* Observação.
* Origem.
* Fotografia opcional.

Tipos:

* Entrada.
* Saída para intervalo.
* Retorno do intervalo.
* Saída final.
* Outra marcação.

Permitir editar, corrigir e excluir de acordo com as permissões.

Registrar a origem de cada marcação:

* `MANUAL`
* `OCR_CONFIRMED`
* `IMAGE_IMPORTED`
* `CORRECTED`

O histórico deverá indicar quem realizou a alteração e quais valores foram modificados.

---

## 9. Calendário

Implementar calendário mensal, semanal e diário.

Cada dia deverá exibir:

* Quantidade de marcações.
* Total de horas.
* Status.
* Feriados.
* Registros incompletos.
* Existência de fotografias.

Ao selecionar um dia, permitir:

* Listar marcações.
* Adicionar marcações manuais.
* Fotografar um novo registro.
* Consultar imagens.
* Editar horários.
* Conferir os totais.
* Visualizar o espelho diário.

Atualizar os dados após operações confirmadas pelo backend.

Não considerar automaticamente os dias sem marcação como faltas.

---

## 10. Jornadas de trabalho

Permitir cadastrar:

* Nome da jornada.
* Dias da semana.
* Entrada prevista.
* Saída para intervalo.
* Retorno do intervalo.
* Saída prevista.
* Intervalos adicionais.
* Horas previstas por dia.
* Tolerâncias configuráveis.
* Vigência.
* Folgas e exceções.

Permitir múltiplas jornadas com vigências diferentes.

Não modificar retroativamente os cálculos históricos sem registrar a alteração da regra aplicável.

---

## 11. Cálculo de horas

Criar um serviço de domínio independente de NestJS e MongoDB.

Calcular:

* Horas trabalhadas por dia.
* Horas semanais.
* Horas mensais.
* Horas previstas.
* Diferenças.
* Intervalos.
* Registros incompletos.
* Horas extras estimadas, quando as regras estiverem configuradas.

Fórmula para uma jornada com quatro marcações:

`Total trabalhado = (saída para intervalo - entrada) + (saída final - retorno do intervalo)`

Tratar:

* Jornadas noturnas.
* Mais de um intervalo.
* Marcações duplicadas.
* Marcações fora de ordem.
* Intervalos ausentes.
* Mudança de jornada.
* Feriados e folgas.
* Fuso horário.

Não presumir horários que não foram registrados.

Não declarar resultados como apuração trabalhista oficial sem a configuração das regras pertinentes.

---

## 12. Espelho virtual

Gerar um documento estruturado semelhante a um espelho de ponto tradicional.

Exibir:

* Nome.
* CPF mascarado.
* Período.
* NSR.
* Datas.
* Horários.
* Tipos de marcação.
* Totais diários.
* Totais semanais e mensais.
* Horas previstas.
* Diferenças.
* Observações.
* Origem dos registros.
* Referências às fotografias.

Criar uma tabela organizada por dia.

Permitir visualizar o documento virtual e a fotografia processada separadamente.

O documento virtual deverá refletir os dados efetivamente salvos.

Não apresentar o documento como original oficial ou como substituto legal de registros exigidos por terceiros.

---

## 13. Feriados

Implementar cadastro de feriados nacionais, estaduais, municipais e personalizados.

Campos:

* Nome.
* Data.
* Abrangência.
* Região.
* Descrição.
* Status.

Permitir cadastrar, editar, excluir e importar listas locais fornecidas pelo usuário.

Não depender de uma API externa de feriados para o funcionamento principal.

O cálculo de horas em feriados deverá seguir regras configuráveis.

---

## 14. Relatórios e exportação

Criar:

* Espelho mensal.
* Resumo diário.
* Resumo semanal.
* Resumo mensal.
* Horas previstas versus realizadas.
* Diferenças de jornada.
* Marcações incompletas.
* Histórico de correções.
* Registros manuais e registros com OCR.
* Relatório de imagens.
* Relatório de feriados.

Filtros:

* Período.
* Mês e ano.
* Semana.
* Jornada.
* Origem.
* Situação.
* Existência de inconsistências.

Exportar utilizando bibliotecas JavaScript:

* PDF com pdf-lib ou pdfmake.
* XLSX com exceljs.
* CSV com csv-stringify.
* JSON para interoperabilidade e backup.

Implementar paginação, layout de impressão e controle de acesso.

---

## 15. Modelagem MongoDB

Criar schemas para:

### User

* `_id`
* `name`
* `email`
* `passwordHash`
* `cpf`
* `role`
* `timezone`
* `preferences`
* `createdAt`
* `updatedAt`

### TimeEntry

* `_id`
* `userId`
* `workDate`
* `time`
* `type`
* `source`
* `status`
* `documentId`
* `notes`
* `createdBy`
* `createdAt`
* `updatedAt`

### TimeDocument

* `_id`
* `userId`
* `fileStorageKey`
* `processedStorageKey`
* `mimeType`
* `width`
* `height`
* `fileSize`
* `processedFileSize`
* `status`
* `createdAt`

### OcrResult

* `_id`
* `documentId`
* `engine`
* `engineVersion`
* `language`
* `rawText`
* `extractedFields`
* `fieldConfidence`
* `reviewStatus`
* `processedAt`

### WorkSchedule

* `_id`
* `userId`
* `name`
* `weeklyRules`
* `effectiveFrom`
* `effectiveUntil`
* `tolerances`

### Holiday

* `_id`
* `name`
* `date`
* `scope`
* `region`
* `isActive`

### AuditLog

* `_id`
* `userId`
* `actorId`
* `entityType`
* `entityId`
* `action`
* `changedFields`
* `createdAt`

Criar índices adequados e validar os dados no domínio e na persistência.

Armazenar fotografias fora dos documentos principais do MongoDB e guardar referências aos arquivos.

---

## 16. Segurança e privacidade

Implementar:

* Autenticação segura.
* Autorização por recurso.
* Isolamento dos dados por usuário.
* Validação dos arquivos.
* Limites de upload.
* Rate limiting.
* Proteção contra tentativas de acesso indevido.
* Logs sem dados pessoais desnecessários.
* Proteção de CPF.
* URLs temporárias para arquivos privados.
* Auditoria.
* Backup.
* Retenção e exclusão de dados.
* Gestão segura de variáveis de ambiente.

O OCR deverá executar localmente no servidor ou navegador, sem transmitir as imagens a serviços externos de reconhecimento.

Não enviar imagens ou texto extraído para APIs de IA externas.

Documentar todas as dependências necessárias para instalar e executar o OCR localmente.

---

## 17. Testes

Utilizar Jest para backend e testes de integração.

Utilizar Vitest e React Testing Library para frontend.

Utilizar Playwright para testes ponta a ponta.

Criar testes para:

* Validação de CPF.
* Datas e horários.
* Marcações manuais.
* Extração de texto.
* Normalização dos campos.
* Jornadas.
* Intervalos.
* Cálculos.
* Feriados.
* Exportações.
* Permissões.
* Processamento de imagens.
* Falhas de persistência.
* OCR com imagens legíveis e difíceis.

Criar um conjunto de imagens de teste sintéticas e anonimizadas.

Avaliar o OCR com métricas documentadas, como taxa de campos corretos, taxa de campos não reconhecidos e erros de data e hora.

Separar testes de parser dos testes de reconhecimento real.

---

## 18. Estrutura de diretórios

Organizar o projeto em um monorepo:

`apps/api/`

* Backend NestJS.

`apps/web/`

* Frontend React.

`packages/shared/`

* Tipos e contratos compartilhados.

`docs/`

* Arquitetura, API, OCR, regras de negócio e implantação.

Criar:

* `README.md`
* `CLAUDE.md`
* `docs/ARCHITECTURE.md`
* `docs/AGENTS.md`
* `docs/OCR.md`
* `docs/IMAGE-PROCESSING.md`
* `docs/BUSINESS-RULES.md`
* `docs/SECURITY.md`
* `docs/DEPLOYMENT.md`
* `docs/TESTING.md`
* `.env.example`
* `Dockerfile`
* `docker-compose.yml`
* Configuração CI/CD.

---

## 19. Plano de implementação

### Fase 1 — Arquitetura

* Criar estrutura.
* Definir contratos.
* Definir agentes.
* Modelar banco.
* Documentar requisitos.

### Fase 2 — Fundação

* Configurar NestJS.
* Configurar React.
* Configurar MongoDB.
* Implementar autenticação.
* Criar layout.

### Fase 3 — Marcações

* Cadastro manual.
* Jornadas.
* Cálculos.
* Calendário.

### Fase 4 — Imagens e OCR

* Câmera.
* Upload.
* Recorte.
* Compressão.
* Tesseract.js.
* Extração.
* Revisão.
* Persistência.

### Fase 5 — Espelho virtual

* Visualização por período.
* Associação das imagens.
* Histórico.
* Resumo de horas.

### Fase 6 — Feriados e relatórios

* Cadastro de feriados.
* PDF.
* XLSX.
* CSV.
* JSON.

### Fase 7 — Qualidade

* Testes.
* Segurança.
* Desempenho.
* Acessibilidade.
* Auditoria.

### Fase 8 — Implantação

* Docker.
* CI/CD.
* HTTPS.
* Backup.
* Documentação de produção.

---

## 20. Regras de desenvolvimento

1. Não utilizar Google Cloud Vision API.
2. Não utilizar serviços externos de OCR.
3. Não utilizar Python.
4. Não transmitir imagens para serviços externos de IA.
5. Não criar funcionalidades apenas visuais.
6. Não ignorar erros de persistência.
7. Não inventar campos que não foram reconhecidos.
8. Não substituir silenciosamente os resultados originais do OCR.
9. Não considerar o OCR infalível.
10. Não permitir acesso aos dados de outros usuários.
11. Não concluir uma fase sem executar os testes correspondentes.
12. Não afirmar que os testes passaram sem executá-los.
13. Não avançar sem atualizar a documentação.
14. Manter baixo acoplamento e alta coesão.
15. Manter os cálculos de jornada independentes da interface.
16. Registrar as decisões arquiteturais.
17. Documentar todas as dependências e configurações locais.

---

## 21. Primeira tarefa

Antes de gerar a aplicação completa:

1. Apresente a arquitetura.
2. Defina os agentes.
3. Crie o backlog.
4. Defina os schemas MongoDB.
5. Especifique os contratos da API.
6. Implemente a estrutura inicial do monorepo.
7. Configure Docker e ambiente local.
8. Implemente uma primeira funcionalidade executável.
9. Execute os testes.
10. Documente os resultados.

Entregue o projeto em etapas verificáveis, com arquivos reais, comandos de execução, testes automatizados e documentação.

O resultado deverá ser uma aplicação funcional, segura, responsiva e extensível, com OCR executado localmente por bibliotecas JavaScript, sem dependência de serviços externos de reconhecimento de imagens.
