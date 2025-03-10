import type { Database } from "@/types/supabase";

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