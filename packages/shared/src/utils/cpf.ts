/**
 * Validates a Brazilian CPF number (11 digits, with check digits calculation).
 */
export function isValidCPF(cpf: string | null | undefined): boolean {
  if (!cpf) return false;
  
  // Remove non-digit characters
  const cleanCPF = cpf.replace(/\D/g, '');

  if (cleanCPF.length !== 11) return false;

  // Reject known invalid all-same-digit CPFs (00000000000, 11111111111, etc.)
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

  // Validate 1st check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i), 10) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9), 10)) return false;

  // Validate 2nd check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i), 10) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(10), 10)) return false;

  return true;
}

/**
 * Normalizes CPF to pure 11 digits.
 */
export function normalizeCPF(cpf: string): string {
  return cpf.replace(/\D/g, '').padStart(11, '0').slice(0, 11);
}

/**
 * Masks CPF for security & LGPD compliance: 123.***.***-45
 */
export function maskCPF(cpf: string | null | undefined): string {
  if (!cpf) return '';
  const digits = normalizeCPF(cpf);
  if (digits.length !== 11) return cpf;
  return `${digits.slice(0, 3)}.***.***-${digits.slice(9, 11)}`;
}

/**
 * Formats CPF as 000.000.000-00
 */
export function formatCPF(cpf: string | null | undefined): string {
  if (!cpf) return '';
  const digits = normalizeCPF(cpf);
  if (digits.length !== 11) return cpf;
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}
