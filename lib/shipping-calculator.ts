/**
 * Shipping zones and costs for Argentina
 * Hardcoded values for MVP
 */

export const SHIPPING_ZONES = {
  ROSARIO: {
    cost: 0,
    zone: 'rosario',
    description: 'ENVÍO GRATIS',
  },
  SANTA_FE: {
    cost: 1500,
    zone: 'santa_fe',
    description: 'PROVINCIA SANTA FE',
  },
  NACIONAL: {
    cost: 3000,
    zone: 'nacional',
    description: 'RESTO DEL PAÍS',
  },
} as const;

export interface ShippingResult {
  cost: number;
  zone: string;
  description: string;
  isFree: boolean;
}

/**
 * Calculate shipping cost based on city and province
 * @param city - City name
 * @param state_province - Province name
 * @returns Shipping information object
 */
export function calculateShipping(
  city: string,
  state_province: string
): ShippingResult {
  // Normalize strings for comparison
  const normalizedCity = city.toLowerCase().trim();
  const normalizedProvince = state_province.toLowerCase().trim();

  // Check if city is Rosario (free shipping)
  if (normalizedCity.includes('rosario')) {
    return {
      ...SHIPPING_ZONES.ROSARIO,
      isFree: true,
    };
  }

  // Check if province is Santa Fe (but not Rosario)
  if (normalizedProvince.includes('santa fe')) {
    return {
      ...SHIPPING_ZONES.SANTA_FE,
      isFree: false,
    };
  }

  // Default to national shipping
  return {
    ...SHIPPING_ZONES.NACIONAL,
    isFree: false,
  };
}

/**
 * Check if shipping is free for the given location
 */
export function isFreeShipping(city: string): boolean {
  return city.toLowerCase().trim().includes('rosario');
}

/**
 * Format shipping info for display
 */
export function formatShippingInfo(shippingResult: ShippingResult): string {
  if (shippingResult.isFree) {
    return shippingResult.description;
  }
  return `${shippingResult.description} - $${shippingResult.cost.toLocaleString('es-AR')}`;
}
