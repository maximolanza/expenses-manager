import type { Database, PaymentMethod } from "@/types/supabase";

export type Store = Database["public"]["Tables"]["stores"]["Row"] & {
  category: Database["public"]["Tables"]["store_categories"]["Row"]
}

export type Product = Database["public"]["Tables"]["products"]["Row"] & {
  category?: Database["public"]["Tables"]["product_categories"]["Row"]
  brand?: Database["public"]["Tables"]["brands"]["Row"]
  latest_price?: number
  prices_by_store?: Record<number, number>
}

export type TicketItem = {
  description: string
  quantity: number
  unitPrice: number
  temporaryItem: boolean
  productId?: number
}

export type TicketFormItem = {
  productId: string;
  quantity: number;
  price: number;
  description?: string;
  // Metadata UI
  productName?: string;
  brandName?: string;
  // Información de cambio de precio
  priceChanged?: boolean;
  previousPrice?: number | null;
  isDiscount?: boolean;
  discountEndDate?: string | null;
} 