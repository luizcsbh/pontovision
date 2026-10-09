# Guia de OCR Local — PontoVision AI

## 1. Princípios e Restrições
- **100% Local:** O processamento e extração de caracteres utilizam a biblioteca `Tesseract.js` com motor WebAssembly/Node.js nativo.
- **Sem APIs Externas:** Não há dependência de Google Cloud Vision, AWS Textract, Azure AI Vision, OpenAI ou qualquer serviço pago na nuvem.
- **Privacidade Total:** Os dados de espelho de ponto e comprovantes nunca saem do servidor do usuário.

## 2. Idioma e Modelo
- Idioma principal: Português (`por`), com suporte a símbolos e números.
- O download dos dados de treinamento do idioma (`por.traineddata`) ocorre localmente na primeira execução e é armazenado em cache (`uploads/tesseract-cache`), operando offline nas execuções subsequentes.

## 3. Pipeline de Reconhecimento e Parsing
1. **Normalização Prévia (Sharp):**
   - Ajuste automático de orientação EXIF (`auto-orient`).
   - Redimensionamento mantendo legibilidade (largura ideal: 1800px).
   - Conversão para escala de cinza (`grayscale`) e aumento de contraste/limiar (`threshold`) para realçar texto sobre papel térmico.
2. **Execução do OCR:**
   - Worker pool do Tesseract.js para não travar o loop de eventos.
3. **Regex e Parser Determinístico:**
   - **CPF:** Extração por regex `\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b`, com validação dos dígitos verificadores.
   - **NSR (Número Sequencial de Registro):** Busca por padrões como `NSR\s*[:\s]?\s*(\d+)` ou sequências numéricas de 9 dígitos de relógios REP.
   - **Data:** Detecção de formatos `DD/MM/AAAA` ou `DD-MM-AAAA`.
   - **Hora:** Detecção de formato `HH:MM` ou `HH:MM:SS` (24h), rejeitando horários inválidos como `25:70`.
   - **Nome:** Heurística contextual próxima a rótulos como `NOME:`, `EMPREGADO:` ou linhas com nomes próprios em caixa alta.
4. **Cálculo de Confiança e Alertas:**
   - Cada campo recebe score de confiança.
   - Se algum campo essencial faltar ou a confiança for baixa, a flag `reviewRequired` é definida como `true`.
   - O usuário revisa e confirma na interface antes de salvar no banco de dados.
