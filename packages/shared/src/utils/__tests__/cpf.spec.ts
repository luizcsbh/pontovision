import { isValidCPF, normalizeCPF, maskCPF, formatCPF } from '../cpf';

describe('CPF Utilities', () => {
  it('should validate valid CPF correctly', () => {
    // Standard test CPF algorithmically valid
    expect(isValidCPF('52998224725')).toBe(true);
    expect(isValidCPF('529.982.247-25')).toBe(true);
  });

  it('should reject invalid CPF', () => {
    expect(isValidCPF('11111111111')).toBe(false);
    expect(isValidCPF('12345678900')).toBe(false);
    expect(isValidCPF('123')).toBe(false);
    expect(isValidCPF('')).toBe(false);
  });

  it('should mask CPF protecting personal data', () => {
    expect(maskCPF('52998224725')).toBe('529.***.***-25');
  });

  it('should format CPF properly', () => {
    expect(formatCPF('52998224725')).toBe('529.982.247-25');
  });
});
