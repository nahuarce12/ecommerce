import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
import { ARGENTINA_PROVINCES } from '@/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TRACKING_REGEX = /^[A-Za-z0-9\-_/\s]{1,120}$/;
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
const UPPERCASE_SIZE_REGEX = /^[A-Z0-9]+(?:[-_/][A-Z0-9]+)*$/;

const ORDER_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const;
const PAYMENT_STATUSES = ['pending_payment', 'paid', 'failed'] as const;

const PROVINCE_LOOKUP = new Map<string, (typeof ARGENTINA_PROVINCES)[number]>(
  ARGENTINA_PROVINCES.map((province) => [normalizeProvinceKey(province), province]),
);

export type FieldErrors = Record<string, string>;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export type ValidatedOrderItemInput = {
  product: { id: string };
  size: string;
  color: string;
  quantity: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function sanitizeOptionalText(value: unknown, maxLength: number): string | null {
  const text = asTrimmedString(value);
  if (!text) {
    return null;
  }
  return text.slice(0, maxLength);
}

function normalizeProvinceKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function normalizeArgentineProvince(value: unknown): (typeof ARGENTINA_PROVINCES)[number] | null {
  const input = asTrimmedString(value);
  if (!input) {
    return null;
  }
  return PROVINCE_LOOKUP.get(normalizeProvinceKey(input)) ?? null;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function toInteger(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const numeric = Number(trimmed);
    if (Number.isInteger(numeric)) {
      return numeric;
    }
  }

  return null;
}

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

export function validateArgentinePhone(phone: string): { valid: boolean; error?: string } {
  if (!phone || phone.trim() === '') {
    return { valid: false, error: 'El teléfono es requerido' };
  }

  try {
    let phoneToValidate = phone.trim();
    if (!phoneToValidate.startsWith('+')) {
      phoneToValidate = '+54' + phoneToValidate.replace(/^0/, '');
    }

    const valid = isValidPhoneNumber(phoneToValidate, 'AR');
    if (!valid) {
      return { valid: false, error: 'Formato de teléfono inválido' };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Formato de teléfono inválido' };
  }
}

export function formatArgentinePhone(phone: string): string {
  if (!phone) return '';

  try {
    let cleaned = phone.replace(/[^\d+]/g, '');
    if (!cleaned.startsWith('+54')) {
      cleaned = '+54' + cleaned.replace(/^0/, '');
    }

    const parsed = parsePhoneNumber(cleaned, 'AR');
    if (parsed) {
      return parsed.formatInternational();
    }
  } catch {
    return phone;
  }

  return phone;
}

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

export function formatArgentinePostalCode(postalCode: string): string {
  const cleaned = postalCode.replace(/\D/g, '');
  return cleaned.slice(0, 4);
}

export function safeRedirectPath(path: string | null | undefined): string {
  const value = typeof path === 'string' ? path.trim() : '';
  if (!value) return '/';
  if (!value.startsWith('/')) return '/';
  if (value.startsWith('//')) return '/';
  if (value.includes('\\')) return '/';
  if (/[\r\n\u0000]/.test(value)) return '/';
  return value;
}

export function validateSignupInput(
  input: unknown,
):
  | { success: true; data: { email: string; password: string; fullName: string } }
  | { success: false; error: string; fields: FieldErrors } {
  const fields: FieldErrors = {};

  if (!isRecord(input)) {
    return { success: false, error: 'Entrada inválida', fields: { form: 'Datos inválidos' } };
  }

  const email = asTrimmedString(input.email).toLowerCase();
  const password = typeof input.password === 'string' ? input.password : '';
  const fullName = asTrimmedString(input.fullName);

  if (!email || !isValidEmail(email)) {
    fields.email = 'Email inválido';
  }

  if (fullName.length < 2 || fullName.length > 120) {
    fields.fullName = 'El nombre debe tener entre 2 y 120 caracteres';
  }

  if (!PASSWORD_REGEX.test(password)) {
    fields.password = 'La contraseña debe tener al menos 8 caracteres, una letra y un número';
  }

  if (Object.keys(fields).length > 0) {
    return { success: false, error: 'Revisá los campos del formulario', fields };
  }

  return {
    success: true,
    data: {
      email,
      password,
      fullName,
    },
  };
}

export function validateProfileInput(
  input: unknown,
  requireShipping: boolean,
):
  | {
      success: true;
      data: {
        full_name: string | null;
        phone: string | null;
        address_line1: string | null;
        address_line2: string | null;
        city: string | null;
        state_province: string | null;
        postal_code: string | null;
        country: 'Argentina';
      };
    }
  | { success: false; error: string; fields: FieldErrors } {
  const fields: FieldErrors = {};

  if (!isRecord(input)) {
    return { success: false, error: 'Entrada inválida', fields: { form: 'Datos inválidos' } };
  }

  const fullName = sanitizeOptionalText(input.full_name, 120);
  const phoneRaw = sanitizeOptionalText(input.phone, 40);
  const addressLine1 = sanitizeOptionalText(input.address_line1, 180);
  const addressLine2 = sanitizeOptionalText(input.address_line2, 180);
  const city = sanitizeOptionalText(input.city, 120);
  const province = normalizeArgentineProvince(input.state_province);
  const postalCodeRaw = sanitizeOptionalText(input.postal_code, 10);
  const postalCode = postalCodeRaw ? formatArgentinePostalCode(postalCodeRaw) : null;

  if (fullName && (fullName.length < 2 || fullName.length > 120)) {
    fields.full_name = 'El nombre debe tener entre 2 y 120 caracteres';
  }

  if (phoneRaw) {
    const phoneValidation = validateArgentinePhone(phoneRaw);
    if (!phoneValidation.valid) {
      fields.phone = phoneValidation.error ?? 'Teléfono inválido';
    }
  }

  if (postalCodeRaw) {
    const postalValidation = validateArgentinePostalCode(postalCode ?? '');
    if (!postalValidation.valid) {
      fields.postal_code = postalValidation.error ?? 'Código postal inválido';
    }
  }

  if (requireShipping) {
    if (!addressLine1) fields.address_line1 = 'La dirección es requerida';
    if (!city) fields.city = 'La ciudad es requerida';
    if (!province) fields.state_province = 'La provincia es requerida';
    if (!postalCode) fields.postal_code = 'El código postal es requerido';
  }

  if (!fields.state_province && input.state_province !== undefined && input.state_province !== null && !province) {
    fields.state_province = 'Provincia inválida';
  }

  if (Object.keys(fields).length > 0) {
    return { success: false, error: 'Revisá los datos del perfil', fields };
  }

  return {
    success: true,
    data: {
      full_name: fullName,
      phone: phoneRaw ? formatArgentinePhone(phoneRaw) : null,
      address_line1: addressLine1,
      address_line2: addressLine2,
      city,
      state_province: province,
      postal_code: postalCode,
      country: 'Argentina',
    },
  };
}

export function validateCategoryInput(
  input: unknown,
):
  | {
      success: true;
      data: {
        id?: string;
        name: string;
        slug: string;
        description: string | null;
        size_measure_schema: Array<{ key: string; label: string; unit: string; order: number }> | null;
        size_guide_image_url: string | null;
      };
    }
  | { success: false; error: string; fields: FieldErrors } {
  const fields: FieldErrors = {};

  if (!isRecord(input)) {
    return { success: false, error: 'Entrada inválida', fields: { form: 'Datos inválidos' } };
  }

  const id = asTrimmedString(input.id);
  const name = sanitizeText(asTrimmedString(input.name), 160);
  const slug = asTrimmedString(input.slug).toLowerCase();
  const description = sanitizeOptionalText(input.description, 2000);
  const sizeGuideImageUrl = sanitizeOptionalText(input.size_guide_image_url, 1000);
  const rawSchema = Array.isArray(input.size_measure_schema) ? input.size_measure_schema : [];
  const sizeMeasureSchema: Array<{ key: string; label: string; unit: string; order: number }> = [];
  const seenMeasurementKeys = new Set<string>();

  if (id && !isUuid(id)) {
    fields.id = 'ID inválido';
  }

  if (name.length < 2 || name.length > 160) {
    fields.name = 'El nombre debe tener entre 2 y 160 caracteres';
  }

  if (!slug || !SLUG_REGEX.test(slug)) {
    fields.slug = 'El slug debe estar en kebab-case minúscula';
  }

  if (sizeGuideImageUrl && !isValidHttpUrl(sizeGuideImageUrl)) {
    fields.size_guide_image_url = 'La imagen guía debe ser una URL http/https válida';
  }

  for (const [index, rawField] of rawSchema.entries()) {
    if (!isRecord(rawField)) {
      fields.size_measure_schema = 'El esquema de medidas tiene un formato inválido';
      break;
    }

    const key = sanitizeText(asTrimmedString(rawField.key), 40).toLowerCase();
    const label = sanitizeText(asTrimmedString(rawField.label), 60);
    const unit = sanitizeText(asTrimmedString(rawField.unit), 12).toLowerCase() || 'cm';
    const order = toInteger(rawField.order);

    if (!key || !/^[a-z0-9_]+$/.test(key)) {
      fields.size_measure_schema = 'Cada campo de medida debe tener una clave válida (a-z, 0-9, _)';
      break;
    }

    if (!label || label.length > 60) {
      fields.size_measure_schema = 'Cada campo de medida debe tener una etiqueta de hasta 60 caracteres';
      break;
    }

    if (!unit || unit.length > 12) {
      fields.size_measure_schema = 'La unidad de medida es inválida';
      break;
    }

    if (seenMeasurementKeys.has(key)) {
      fields.size_measure_schema = 'Las claves de medidas no pueden repetirse';
      break;
    }

    seenMeasurementKeys.add(key);
    sizeMeasureSchema.push({ key, label, unit, order: order !== null && order >= 0 ? order : index });
  }

  if (Object.keys(fields).length > 0) {
    return { success: false, error: 'Revisá los datos de la categoría', fields };
  }

  return {
    success: true,
    data: {
      ...(id ? { id } : {}),
      name,
      slug,
      description,
      size_measure_schema: sizeMeasureSchema.length > 0 ? sizeMeasureSchema : null,
      size_guide_image_url: sizeGuideImageUrl,
    },
  };
}

export function validateProductInput(
  input: unknown,
  options?: { allowedMeasurementKeys?: string[] },
):
  | {
      success: true;
      data: {
        id?: string;
        name: string;
        slug: string;
        description: string | null;
        price: number;
        brand: string;
        stock: number;
        category_id: string | null;
        images: string[];
        sizes: string[];
        colors: string[];
        sizeStocks: Array<{ label: string; stock: number; measurements: Record<string, number> | null }>;
      };
    }
  | { success: false; error: string; fields: FieldErrors } {
  const fields: FieldErrors = {};

  const parseLocalizedPrice = (value: unknown): number => {
    if (typeof value === 'number') {
      return value;
    }

    const raw = asTrimmedString(value).replace(/\s+/g, '');
    if (!raw) {
      return Number.NaN;
    }

    let normalized = raw;

    if (raw.includes('.') && raw.includes(',')) {
      normalized = raw.replace(/\./g, '').replace(',', '.');
    } else if (raw.includes(',')) {
      normalized = raw.replace(',', '.');
    } else if (/^\d{1,3}(\.\d{3})+$/.test(raw)) {
      normalized = raw.replace(/\./g, '');
    }

    return Number(normalized);
  };

  if (!isRecord(input)) {
    return { success: false, error: 'Entrada inválida', fields: { form: 'Datos inválidos' } };
  }

  const id = asTrimmedString(input.id);
  const name = sanitizeText(asTrimmedString(input.name), 160);
  const slug = asTrimmedString(input.slug).toLowerCase();
  const description = sanitizeOptionalText(input.description, 2000);
  const brand = sanitizeText(asTrimmedString(input.brand), 80);
  const rawPrice = parseLocalizedPrice(input.price);
  const categoryId = asTrimmedString(input.category_id);

  if (id && !isUuid(id)) {
    fields.id = 'ID inválido';
  }

  if (name.length < 2 || name.length > 160) {
    fields.name = 'El nombre debe tener entre 2 y 160 caracteres';
  }

  if (!slug || !SLUG_REGEX.test(slug)) {
    fields.slug = 'El slug debe estar en kebab-case minúscula';
  }

  if (brand.length < 2 || brand.length > 80) {
    fields.brand = 'La marca debe tener entre 2 y 80 caracteres';
  }

  if (!Number.isFinite(rawPrice) || rawPrice < 0) {
    fields.price = 'El precio debe ser un número válido mayor o igual a 0';
  }

  if (categoryId && !isUuid(categoryId)) {
    fields.category_id = 'Categoría inválida';
  }

  const imagesInput = Array.isArray(input.images) ? input.images : [];
  const images = imagesInput
    .map((item) => asTrimmedString(item))
    .filter((item) => item.length > 0);

  if (images.length > 10) {
    fields.images = 'Se permiten hasta 10 imágenes';
  } else if (images.some((url) => !isValidHttpUrl(url))) {
    fields.images = 'Todas las imágenes deben ser URLs http/https válidas';
  }

  const colorsInput = Array.isArray(input.colors) ? input.colors : [];
  const colors: string[] = [];
  const seenColors = new Set<string>();

  for (const rawColor of colorsInput) {
    const color = sanitizeText(asTrimmedString(rawColor), 40);
    if (!color) {
      fields.colors = 'Los colores no pueden estar vacíos';
      break;
    }
    if (color.length < 1 || color.length > 40) {
      fields.colors = 'Cada color debe tener entre 1 y 40 caracteres';
      break;
    }

    const colorKey = color.toLowerCase();
    if (seenColors.has(colorKey)) {
      fields.colors = 'Los colores deben ser únicos';
      break;
    }

    seenColors.add(colorKey);
    colors.push(color);
  }

  const rawSizeStocks = Array.isArray(input.sizeStocks) ? input.sizeStocks : [];
  const sizeStocks: Array<{ label: string; stock: number; measurements: Record<string, number> | null }> = [];
  const allowedMeasurementKeys = new Set(
    (options?.allowedMeasurementKeys ?? [])
      .map((key) => sanitizeText(asTrimmedString(key), 40).toLowerCase())
      .filter(Boolean),
  );
  const seenLabels = new Set<string>();

  for (const sizeStock of rawSizeStocks) {
    if (!isRecord(sizeStock)) {
      fields.sizeStocks = 'Formato de talles inválido';
      break;
    }

    const label = sanitizeText(asTrimmedString(sizeStock.label), 20).toUpperCase();
    const stock = toInteger(sizeStock.stock);

    if (!label || label.length < 1 || label.length > 20 || !UPPERCASE_SIZE_REGEX.test(label)) {
      fields.sizeStocks = 'Cada talle debe estar en mayúsculas y tener entre 1 y 20 caracteres';
      break;
    }

    if (stock === null || stock < 0) {
      fields.sizeStocks = 'El stock por talle debe ser un entero mayor o igual a 0';
      break;
    }

    if (seenLabels.has(label)) {
      fields.sizeStocks = 'Los talles no pueden repetirse';
      break;
    }

    const rawMeasurements = isRecord(sizeStock.measurements) ? sizeStock.measurements : null;
    let normalizedMeasurements: Record<string, number> | null = null;

    if (rawMeasurements) {
      normalizedMeasurements = {};

      for (const [rawKey, rawValue] of Object.entries(rawMeasurements)) {
        const measurementKey = sanitizeText(asTrimmedString(rawKey), 40).toLowerCase();
        if (!measurementKey) {
          fields.sizeStocks = 'Las medidas por talle tienen un formato inválido';
          break;
        }

        if (allowedMeasurementKeys.size > 0 && !allowedMeasurementKeys.has(measurementKey)) {
          fields.sizeStocks = 'Las medidas incluyen campos no permitidos para la categoría seleccionada';
          break;
        }

        const measurementValue =
          typeof rawValue === 'number' ? rawValue : Number(asTrimmedString(rawValue));

        if (!Number.isFinite(measurementValue) || measurementValue < 0) {
          fields.sizeStocks = 'Cada medida debe ser un número mayor o igual a 0';
          break;
        }

        normalizedMeasurements[measurementKey] = Number(measurementValue.toFixed(2));
      }

      if (Object.keys(fields).length > 0) {
        break;
      }

      if (normalizedMeasurements && Object.keys(normalizedMeasurements).length === 0) {
        normalizedMeasurements = null;
      }
    }

    seenLabels.add(label);
    sizeStocks.push({ label, stock, measurements: normalizedMeasurements });
  }

  const hasSizes = sizeStocks.length > 0;
  let stock = 0;
  let sizes: string[] = [];

  if (hasSizes) {
    stock = sizeStocks.reduce((acc, item) => acc + item.stock, 0);
    sizes = sizeStocks.map((item) => item.label);
  } else {
    const rawStock = toInteger(input.stock);
    if (rawStock === null || rawStock < 0) {
      fields.stock = 'El stock debe ser un entero mayor o igual a 0';
    } else {
      stock = rawStock;
    }

    const inputSizes = Array.isArray(input.sizes) ? input.sizes : [];
    const seenSizes = new Set<string>();
    sizes = [];
    for (const rawSize of inputSizes) {
      const size = sanitizeText(asTrimmedString(rawSize), 20).toUpperCase();
      if (!size) continue;
      if (!UPPERCASE_SIZE_REGEX.test(size)) {
        fields.sizes = 'Los talles deben estar en mayúsculas';
        break;
      }
      if (seenSizes.has(size)) continue;
      seenSizes.add(size);
      sizes.push(size);
    }
  }

  if (Object.keys(fields).length > 0) {
    return { success: false, error: 'Revisá los datos del producto', fields };
  }

  return {
    success: true,
    data: {
      ...(id ? { id } : {}),
      name,
      slug,
      description,
      price: rawPrice,
      brand,
      stock,
      category_id: categoryId || null,
      images,
      sizes,
      colors,
      sizeStocks,
    },
  };
}

export function validateCreateOrderInput(
  input: unknown,
):
  | {
      success: true;
      data: {
        paymentMethod: string;
        shippingCity: string;
        shippingProvince: string;
        items: ValidatedOrderItemInput[];
      };
    }
  | { success: false; error: string; fields: FieldErrors } {
  const fields: FieldErrors = {};

  if (!isRecord(input)) {
    return { success: false, error: 'Entrada inválida', fields: { form: 'Datos inválidos' } };
  }

  const paymentMethod = sanitizeText(asTrimmedString(input.paymentMethod), 120);
  const shippingCity = sanitizeText(asTrimmedString(input.shippingCity), 120);
  const normalizedProvince = normalizeArgentineProvince(input.shippingProvince);
  const shippingProvince = normalizedProvince ?? sanitizeText(asTrimmedString(input.shippingProvince), 120);

  if (!paymentMethod) {
    fields.paymentMethod = 'El método de pago es requerido';
  }

  if (asTrimmedString(input.shippingProvince) && !normalizedProvince) {
    fields.shippingProvince = 'Provincia inválida';
  }

  if (!Array.isArray(input.items) || input.items.length === 0) {
    fields.items = 'Debés incluir al menos un producto';
  }

  const items: ValidatedOrderItemInput[] = [];

  if (Array.isArray(input.items)) {
    input.items.forEach((rawItem, index) => {
      if (!isRecord(rawItem)) {
        fields[`items.${index}`] = 'Ítem inválido';
        return;
      }

      const productValue = rawItem.product;
      const productId = isRecord(productValue) ? asTrimmedString(productValue.id) : '';
      const size = sanitizeText(asTrimmedString(rawItem.size), 50);
      const color = sanitizeText(asTrimmedString(rawItem.color), 50);
      const quantity = toInteger(rawItem.quantity);

      if (!productId || !isUuid(productId)) {
        fields[`items.${index}.product.id`] = 'Producto inválido';
      }

      if (!size || size.length > 50) {
        fields[`items.${index}.size`] = 'El talle es requerido y debe tener hasta 50 caracteres';
      }

      if (!color || color.length > 50) {
        fields[`items.${index}.color`] = 'El color es requerido y debe tener hasta 50 caracteres';
      }

      if (quantity === null || quantity < 1 || quantity > 50) {
        fields[`items.${index}.quantity`] = 'La cantidad debe ser un entero entre 1 y 50';
      }

      if (
        productId &&
        isUuid(productId) &&
        size &&
        size.length <= 50 &&
        color &&
        color.length <= 50 &&
        quantity !== null &&
        quantity >= 1 &&
        quantity <= 50
      ) {
        items.push({
          product: { id: productId },
          size,
          color,
          quantity,
        });
      }
    });
  }

  if (Object.keys(fields).length > 0) {
    return { success: false, error: 'Revisá los datos de la orden', fields };
  }

  return {
    success: true,
    data: {
      paymentMethod,
      shippingCity,
      shippingProvince,
      items,
    },
  };
}
