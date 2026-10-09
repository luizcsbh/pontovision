import { Injectable } from '@nestjs/common';
import { isValidCPF, normalizeCPF, IOcrExtractedFields, IOcrFieldConfidence } from '@pontovision/shared';

export interface ParseResult {
  extractedFields: IOcrExtractedFields;
  fieldConfidence: IOcrFieldConfidence;
  warnings: string[];
  reviewRequired: boolean;
}

@Injectable()
export class OcrParserService {
  parseText(rawText: string, tesseractConfidence = 70): ParseResult {
    const lines = rawText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const warnings: string[] = [];
    const confidence: IOcrFieldConfidence = {
      overall: Math.min(Math.max(tesseractConfidence, 0), 100),
    };

    const extracted: IOcrExtractedFields = {
      rawLines: lines,
    };

    // 1. CPF
    const cpfMatch = this.extractCpf(rawText);
    if (cpfMatch) { extracted.cpf = cpfMatch; confidence.cpf = 95; }
    else { warnings.push('CPF não identificado no comprovante.'); confidence.cpf = 0; }

    // 2. Data
    const dateMatch = this.extractDate(rawText);
    if (dateMatch) { extracted.date = dateMatch; confidence.date = 90; }
    else { warnings.push('Data não identificada com clareza.'); confidence.date = 0; }

    // 3. Hora
    const timeMatch = this.extractTime(rawText);
    if (timeMatch) { extracted.time = timeMatch; confidence.time = 90; }
    else { warnings.push('Hora não identificada com clareza.'); confidence.time = 0; }

    // 4. NSR (somente números)
    const nsrMatch = this.extractNsr(lines, rawText);
    if (nsrMatch) {
      extracted.nsr = nsrMatch.replace(/\D/g, '');
      confidence.nsr = 85;
    } else {
      warnings.push('NSR não identificado.');
      confidence.nsr = 0;
    }

    // 5. Nome
    const nameMatch = this.extractName(lines);
    if (nameMatch) { extracted.name = nameMatch; confidence.name = 80; }
    else { warnings.push('Nome do trabalhador não identificado.'); confidence.name = 0; }

    // 6. Razão Social
    extracted.razaoSocial = this.extractLabelValue(rawText, ['RSOCIAL', 'RAZAO SOCIAL', 'RAZÃO SOCIAL', 'EMPRESA']);

    // 7. CNPJ
    extracted.cnpj = this.extractCnpj(rawText);

    // 8. CEI
    extracted.cei = this.extractLabelValue(rawText, ['CEI']);

    // 9. Local / Endereço
    extracted.local = this.extractLabelValue(rawText, ['LOCAL', 'ENDERECO', 'ENDEREÇO']);

    // 10. NREP (número do REP - somente números)
    const rawNrep = this.extractLabelValue(rawText, ['NREP', 'N\\.REP', 'NUM\\.REP', 'NUMERO REP']);
    extracted.nrep = rawNrep ? rawNrep.replace(/\D/g, '') : undefined;

    // 11. Modelo do REP (fixo IDCLASS BIO PROX)
    extracted.modeloRep = 'IDCLASS BIO PROX';

    // 12. Assinatura Digital (AD) - pode ser multiline após "AD:"
    extracted.assinaturaDigital = this.extractAssinaturaDigital(rawText);

    const reviewRequired =
      !extracted.date ||
      !extracted.time ||
      !extracted.cpf ||
      warnings.length > 0 ||
      tesseractConfidence < 60;

    return { extractedFields: extracted, fieldConfidence: confidence, warnings, reviewRequired };
  }

  private extractLabelValue(text: string, labels: string[]): string | undefined {
    for (const label of labels) {
      const regex = new RegExp(`(?:${label})[:\\s]+(.+)`, 'i');
      const match = text.match(regex);
      if (match && match[1]) {
        return match[1].trim().replace(/\s{2,}/g, ' ');
      }
    }
    return undefined;
  }

  private extractCnpj(text: string): string | undefined {
    const match = text.match(/\b\d{2}[.\s]?\d{3}[.\s]?\d{3}\/\d{4}[-]\d{2}\b/);
    return match ? match[0].trim() : undefined;
  }

  private extractAssinaturaDigital(text: string): string | undefined {
    const adMatch = text.match(/AD[:\s]+([A-Z0-9+/=\s]{10,})/is);
    if (adMatch) {
      return adMatch[1].replace(/\s+/g, '').trim();
    }
    return undefined;
  }


  private extractCpf(text: string): string | undefined {
    // Regex para 11 dígitos com pontuação ou sem
    const matches = text.match(/\b\d{3}[.\s]?\d{3}[.\s]?\d{3}[-\s]?\d{2}\b/g);
    if (matches) {
      for (const m of matches) {
        const clean = m.replace(/\D/g, '');
        if (clean.length === 11 && isValidCPF(clean)) {
          return normalizeCPF(clean);
        }
      }
    }

    // Busca alternativa após rótulo CPF
    const labelMatch = text.match(/CPF[:\s]+([\d.\s-]+)/i);
    if (labelMatch) {
      const clean = labelMatch[1].replace(/\D/g, '');
      if (clean.length === 11 && isValidCPF(clean)) {
        return normalizeCPF(clean);
      }
    }

    return undefined;
  }

  private extractDate(text: string): string | undefined {
    // DD/MM/AAAA ou DD-MM-AAAA
    const match = text.match(/\b([0-3]?\d)[\/.-]([0-1]?\d)[\/.-](20\d{2})\b/);
    if (match) {
      const day = match[1].padStart(2, '0');
      const month = match[2].padStart(2, '0');
      const year = match[3];

      const dNum = parseInt(day, 10);
      const mNum = parseInt(month, 10);
      if (dNum >= 1 && dNum <= 31 && mNum >= 1 && mNum <= 12) {
        return `${year}-${month}-${day}`;
      }
    }
    return undefined;
  }

  private extractTime(text: string): string | undefined {
    // HH:MM ou HH:MM:SS
    const matches = text.matchAll(/\b([0-2]?\d)[:h]([0-5]\d)(?::([0-5]\d))?\b/gi);
    for (const match of matches) {
      const hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      }
    }
    return undefined;
  }

  private extractNsr(lines: string[], text: string): string | undefined {
    // NSR: 000123456 ou SEQ: 12345
    const regexLabel = /(?:NSR|N\.S\.R|SEQ|REGISTRO|NUM)[:\s]*([0-9]{1,10})/i;
    const match = text.match(regexLabel);
    if (match && match[1]) {
      return match[1].trim();
    }

    // Procura por linha com exatamente 9 ou 10 dígitos numéricos típicos de REP
    for (const line of lines) {
      const clean = line.replace(/\s+/g, '');
      if (/^\d{9,10}$/.test(clean)) {
        return clean;
      }
    }
    return undefined;
  }

  private extractName(lines: string[]): string | undefined {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const labelMatch = line.match(/(?:NOME|EMPREGADO|TRABALHADOR|FUNCIONARIO)[:\s]+(.+)/i);
      if (labelMatch && labelMatch[1]) {
        const candidate = labelMatch[1].trim();
        if (candidate.length > 2 && !/\d{4}/.test(candidate)) {
          return candidate;
        }
      }

      // Se a linha for apenas "NOME:" e o valor estiver na próxima linha
      if (/^(?:NOME|EMPREGADO|TRABALHADOR)[:]?$/i.test(line) && i + 1 < lines.length) {
        const next = lines[i + 1].trim();
        if (next.length > 2 && !/\d{4}/.test(next)) {
          return next;
        }
      }
    }

    // Procura linha em letras maiúsculas que se pareça com nome próprio (mínimo 2 palavras)
    for (const line of lines) {
      if (
        /^[A-ZÀ-Ú\s]{6,40}$/.test(line) &&
        line.split(' ').length >= 2 &&
        !line.includes('COMPROVANTE') &&
        !line.includes('REGISTRO') &&
        !line.includes('MINISTERIO') &&
        !line.includes('TRABALHO')
      ) {
        return line.trim();
      }
    }

    return undefined;
  }
}
