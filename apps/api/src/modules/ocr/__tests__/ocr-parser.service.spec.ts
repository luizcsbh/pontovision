import { OcrParserService } from '../ocr-parser.service';

describe('OcrParserService', () => {
  let service: OcrParserService;

  beforeEach(() => {
    service = new OcrParserService();
  });

  it('should extract CPF, Date, Time, NSR and Name from a typical receipt text', () => {
    const rawReceipt = `
      COMPROVANTE DE ENTRADA DO TRABALHADOR
      EMPRESA EXEMPLO S.A.
      CNPJ: 12.345.678/0001-90
      NOME: CARLOS DA SILVA
      CPF: 529.982.247-25
      DATA: 10/10/2026 HORA: 08:30
      NSR: 000145236
    `;

    const result = service.parseText(rawReceipt, 85);

    expect(result.extractedFields.cpf).toBe('52998224725');
    expect(result.extractedFields.date).toBe('2026-10-10');
    expect(result.extractedFields.time).toBe('08:30');
    expect(result.extractedFields.nsr).toBe('000145236');
    expect(result.extractedFields.name).toBe('CARLOS DA SILVA');
    expect(result.fieldConfidence.overall).toBe(85);
  });

  it('should flag reviewRequired when critical fields are missing', () => {
    const incompleteReceipt = `
      COMPROVANTE ILEGIVEL
      HORA: 14:15
    `;

    const result = service.parseText(incompleteReceipt, 50);

    expect(result.reviewRequired).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.extractedFields.time).toBe('14:15');
    expect(result.extractedFields.date).toBeUndefined();
  });
});
