export interface ProductSize {
  id: string;
  product_id: string;
  size_label: string;
  stock: number;
  measurements?: Record<string, number> | null;
}

export interface SizeMeasurementField {
  key: string;
  label: string;
  unit?: string | null;
  order?: number | null;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  category_id: string;
  brand: string;
  stock: number;
  images: string[];
  sizes: string[];
  colors: string[];
  product_sizes?: ProductSize[];
  categories?:
    | {
        name?: string;
        slug?: string;
        size_measure_schema?: SizeMeasurementField[] | null;
        size_guide_image_url?: string | null;
      }
    | Array<{
        name?: string;
        slug?: string;
        size_measure_schema?: SizeMeasurementField[] | null;
        size_guide_image_url?: string | null;
      }>
    | null;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  size_measure_schema?: SizeMeasurementField[] | null;
  size_guide_image_url?: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'user' | 'admin';
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state_province: string | null;
  postal_code: string | null;
  country: string | null;
  created_at: string;
}

export const ARGENTINA_PROVINCES = [
  "Buenos Aires",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Ciudad Autónoma de Buenos Aires",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán",
] as const;

export interface Order {
  id: string;
  user_id: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  shipping_address: string;
  payment_method: string | null;
  tracking_number: string | null;
  mercadopago_preference_id?: string | null;
  mercadopago_payment_id?: string | null;
  mercadopago_merchant_order_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  size: string;
  color: string;
  quantity: number;
  price_at_purchase: number;
  created_at: string;
}
