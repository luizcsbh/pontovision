import { isValidCNPJ, normalizeCNPJ, formatCNPJ, maskCNPJ } from '../cnpj';

describe('CNPJ Utilities', () => {
  it('should validate valid CNPJ correctly', () => {
    // Valid Brazilian CNPJs (including known companies)
    // 16.902.729/0002-74 (used in the receipt from the user's attachment)
    expect(isValidCNPJ('16902729000274')).toBe(true);
    expect(isValidCNPJ('16.902.729/0002-74')).toBe(true);
    // Banco do Brasil: 00.000.000/0001-91
    expect(isValidCNPJ('00000000000191')).toBe(true);
    expect(isValidCNPJ('00.000.000/0001-91')).toBe(true);
  });

  it('should reject invalid CNPJ', () => {
    expect(isValidCNPJ('11111111111111')).toBe(false);
    expect(isValidCNPJ('00000000000000')).toBe(false);
    expect(isValidCNPJ('12345678901234')).toBe(false);
    expect(isValidCNPJ('123')).toBe(false);
    expect(isValidCNPJ('')).toBe(false);
    expect(isValidCNPJ(null)).toBe(false);
  });

  it('should format CNPJ properly', () => {
    expect(formatCNPJ('16902729000274')).toBe('16.902.729/0002-74');
  });

  it('should mask CNPJ for privacy/display', () => {
    expect(maskCNPJ('16902729000274')).toBe('16.***.***/0002-74');
  });

  it('should normalize CNPJ', () => {
    expect(normalizeCNPJ('16.902.729/0002-74')).toBe('16902729000274');
  });
});
