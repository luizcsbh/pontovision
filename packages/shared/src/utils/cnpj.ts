/**
 * Validates a Brazilian CNPJ number (14 digits, with check digits calculation).
 */
export function isValidCNPJ(cnpj: string | null | undefined): boolean {
  if (!cnpj) return false;

  // Remove non-digit characters
  const cleanCNPJ = cnpj.replace(/\D/g, '');

  if (cleanCNPJ.length !== 14) return false;

  // Reject known invalid all-same-digit CNPJs (00000000000000, 11111111111111, etc.)
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;

  // Weights for first check digit
  const weightsFirst = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCNPJ.charAt(i), 10) * weightsFirst[i];
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (digit1 !== parseInt(cleanCNPJ.charAt(12), 10)) return false;

  // Weights for second check digit
  const weightsSecond = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCNPJ.charAt(i), 10) * weightsSecond[i];
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  if (digit2 !== parseInt(cleanCNPJ.charAt(13), 10)) return false;

  return true;
}

/**
 * Normalizes CNPJ to pure digits (up to 14 chars).
 */
export function normalizeCNPJ(cnpj: string | null | undefined): string {
  if (!cnpj) return '';
  return cnpj.replace(/\D/g, '').slice(0, 14);
}

/**
 * Formats CNPJ as 00.000.000/0000-00
 */
export function formatCNPJ(cnpj: string | null | undefined): string {
  if (!cnpj) return '';
  const digits = normalizeCNPJ(cnpj);
  if (digits.length !== 14) return cnpj;
  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5',
  );
}

/**
 * Masks CNPJ for display: 00.***.*** / 0001-00
 */
export function maskCNPJ(cnpj: string | null | undefined): string {
  if (!cnpj) return '';
  const digits = normalizeCNPJ(cnpj);
  if (digits.length !== 14) return cnpj;
  return `${digits.slice(0, 2)}.***.***/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
}
