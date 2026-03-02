import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TRACKING_REGEX = /^[A-Za-z0-9\-_/\s]{1,120}$/;

const ORDER_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const;
const PAYMENT_STATUSES = ['pending_payment', 'paid', 'failed'] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export function isUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim());
}

export function isValidOrderStatus(value: string): value is OrderStatus {
  return ORDER_STATUSES.includes(value as OrderStatus);
}

export function isValidPaymentStatus(value: string): value is PaymentStatus {
  return PAYMENT_STATUSES.includes(value as PaymentStatus);
}

export function sanitizeText(value: string, maxLength = 120): string {
  return value.trim().slice(0, maxLength);
}

export function isValidTrackingNumber(value: string): boolean {
  return TRACKING_REGEX.test(value.trim());
}

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
  } catch {
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
  } catch {
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
