# Processamento de Imagens — PontoVision AI

## 1. Tecnologias Utilizadas
- **Frontend:**
  - `Cropper.js`: Recorte manual, rotação e enquadramento direto na tela do navegador.
  - `browser-image-compression`: Redução de tráfego de rede mantendo proporção e qualidade antes do envio.
- **Backend:**
  - `Sharp`: Processamento de alta velocidade em C++/Node.js.

## 2. Pipeline de Otimização Backend
1. **Inspeção de Metadados:** Verificação de resolução original, dimensões e tipo MIME real.
2. **Normalização:**
   - Correção de rotação via EXIF (`rotate()`).
   - Redimensionamento suave para limitar dimensão máxima a 2000px mantendo aspect ratio (`fit: 'inside'`).
3. **Pré-processamento para OCR:**
   - Geração de versão binarizada/alto contraste (`normalize()`, `sharpen()`, `grayscale()`).
4. **Armazenamento:**
   - A versão original segura e a versão otimizada são armazenadas de forma isolada, associadas ao `userId`.
