/**
 * Payment methods configuration
 * Hardcoded for MVP
 */



export interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  type: 'bank_transfer' | 'cash' | 'mercadopago' | 'polar';
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'bank_transfer',
    name: 'Transferencia Bancaria',
    description: 'Transferencia o depósito bancario',
    enabled: true,
    type: 'bank_transfer',
  },
  {
    id: 'cash',
    name: 'Efectivo Presencial',
    description: 'Pago en efectivo al retirar en Rosario',
    enabled: true,
    type: 'cash',
  },
  {
    id: 'mercadopago',
    name: 'MercadoPago',
    description: 'Pago con tarjeta o QR',
    enabled: true,
    type: 'mercadopago',
  },
];

/**
 * Bank account information for transfers
 * TODO: Replace with actual bank account details
 */
export const BANK_INFO = {
  cbu: '0000003100010000000000',
  alias: 'SUPPLY.STORE',
  holder: 'Supply Store SRL',
  bank: 'Banco Galicia',
  accountType: 'Cuenta Corriente',
} as const;

/**
 * WhatsApp contact information
 * TODO: Replace with actual WhatsApp number
 */
export const WHATSAPP_NUMBER = '+543412101416';

/**
 * Generate WhatsApp link with pre-filled message
 */
export function generateWhatsAppLink(orderNumber: string, type: 'payment' | 'coordination'): string {
  const baseUrl = `https://wa.me/${WHATSAPP_NUMBER.replace(/[^0-9]/g, '')}`;
  
  let message = '';
  if (type === 'payment') {
    message = `Hola, realicé la transferencia para la orden #${orderNumber}. Adjunto comprobante.`;
  } else if (type === 'coordination') {
    message = `Hola, quiero coordinar el retiro de la orden #${orderNumber}.`;
  }
  
  return `${baseUrl}?text=${encodeURIComponent(message)}`;
}

/**
 * Get enabled payment methods
 */
export function getEnabledPaymentMethods(): PaymentMethod[] {
  return PAYMENT_METHODS.filter(method => method.enabled);
}

/**
 * Get payment method by ID
 */
export function getPaymentMethodById(id: string): PaymentMethod | undefined {
  return PAYMENT_METHODS.find(method => method.id === id);
}
