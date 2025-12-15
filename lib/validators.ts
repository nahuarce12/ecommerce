import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

/**
 * Validates an Argentine phone number
 * Accepts formats: +54 9 11 1234-5678, +5491112345678, 11 1234 5678, etc.
 */
export function validateArgentinePhone(phone: string): { valid: boolean; error?: string } {
  if (!phone || phone.trim() === '') {
    return { valid: false, error: 'El teléfono es requerido' };
  }

  try {
    // Ensure it starts with +54 if it doesn't have a country code
    let phoneToValidate = phone.trim();
    if (!phoneToValidate.startsWith('+')) {
      phoneToValidate = '+54' + phoneToValidate.replace(/^0/, '');
    }

    const isValid = isValidPhoneNumber(phoneToValidate, 'AR');
    
    if (!isValid) {
      return { valid: false, error: 'Formato de teléfono inválido' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Formato de teléfono inválido' };
  }
}

/**
 * Formats an Argentine phone number to +54 9 11 1234-5678 format
 */
export function formatArgentinePhone(phone: string): string {
  if (!phone) return '';

  try {
    // Remove all non-numeric characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');
    
    // Ensure it starts with +54
    if (!cleaned.startsWith('+54')) {
      cleaned = '+54' + cleaned.replace(/^0/, '');
    }

    const parsed = parsePhoneNumber(cleaned, 'AR');
    if (parsed) {
      // Format as +54 9 11 1234-5678
      return parsed.formatInternational();
    }
  } catch (error) {
    // Return cleaned input if parsing fails
    return phone;
  }

  return phone;
}

/**
 * Validates Argentine postal code (4 digits)
 */
export function validateArgentinePostalCode(postalCode: string): { valid: boolean; error?: string } {
  if (!postalCode || postalCode.trim() === '') {
    return { valid: false, error: 'El código postal es requerido' };
  }

  const cleaned = postalCode.trim();
  const postalCodeRegex = /^\d{4}$/;

  if (!postalCodeRegex.test(cleaned)) {
    return { valid: false, error: 'El código postal debe tener 4 dígitos' };
  }

  return { valid: true };
}

/**
 * Formats postal code to ensure 4 digits
 */
export function formatArgentinePostalCode(postalCode: string): string {
  // Remove all non-numeric characters
  const cleaned = postalCode.replace(/\D/g, '');
  
  // Limit to 4 digits
  return cleaned.slice(0, 4);
}
