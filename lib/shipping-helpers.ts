import { Profile } from "@/types";

export interface ShippingData {
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state_province: string;
  postal_code: string;
  country: string;
}

/**
 * Extracts and validates shipping data from user profile
 * Returns null if required fields are missing
 * 
 * Required fields for checkout:
 * - phone
 * - address_line1
 * - city
 * - state_province
 * - postal_code
 */
export function prefillShippingFromProfile(profile: Profile | null): ShippingData | null {
  if (!profile) return null;

  // Check if all required fields are present
  const hasRequiredFields = 
    profile.phone &&
    profile.address_line1 &&
    profile.city &&
    profile.state_province &&
    profile.postal_code;

  if (!hasRequiredFields) {
    return null;
  }

  return {
    full_name: profile.full_name || "",
    phone: profile.phone!,
    address_line1: profile.address_line1!,
    address_line2: profile.address_line2 || "",
    city: profile.city!,
    state_province: profile.state_province!,
    postal_code: profile.postal_code!,
    country: profile.country || "Argentina",
  };
}

/**
 * Checks if user has complete shipping information
 * Useful for showing prompts to complete profile
 */
export function hasCompleteShippingInfo(profile: Profile | null): boolean {
  if (!profile) return false;

  return !!(
    profile.phone &&
    profile.address_line1 &&
    profile.city &&
    profile.state_province &&
    profile.postal_code
  );
}

/**
 * Formats shipping address for display
 * Example: "Av. Belgrano 1234, Piso 2 Depto A, Rosario, Santa Fe, 2000, Argentina"
 */
export function formatShippingAddress(data: ShippingData | Profile): string {
  const parts: string[] = [];

  if ('address_line1' in data && data.address_line1) {
    parts.push(data.address_line1);
  }

  if ('address_line2' in data && data.address_line2) {
    parts.push(data.address_line2);
  }

  if ('city' in data && data.city) {
    parts.push(data.city);
  }

  if ('state_province' in data && data.state_province) {
    parts.push(data.state_province);
  }

  if ('postal_code' in data && data.postal_code) {
    parts.push(data.postal_code);
  }

  if ('country' in data && data.country) {
    parts.push(data.country);
  }

  return parts.join(", ");
}
