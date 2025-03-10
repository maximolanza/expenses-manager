export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Currency = "UYU" | "USD"
export type PaymentMethod = "Debito" | "Credito" | "Prepaga" | "Efectivo" | "Transferencia"
export type WorkspaceMemberRole = "owner" | "collaborator"
export type InvitationStatus = "pending" | "accepted" | "rejected"

export type PointsConversionType = "fixed" | "variable"

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: number
          created_at: string
          name: string
          workspace_id: number
        }
        Insert: {
          id?: number
          created_at?: string
          name: string
          workspace_id: number
        }
        Update: {
          id?: number
          created_at?: string
          name?: string
          workspace_id?: number
        }
      }
      workspaces: {
        Row: {
          id: number

          name: string
        }
        Insert: {
          id?: number

          name: string
        }
        Update: {
          id?: number

          name?: string
        }
      }
      workspace_members: {
        Row: {
          workspace_id: number
          user_id: string
          role: "owner" | "collaborator"
          created_at: string
        }
        Insert: {
          workspace_id: number
          user_id: string
          role: "owner" | "collaborator"
          created_at?: string
        }
        Update: {
          workspace_id?: number
          user_id?: string
          role?: "owner" | "collaborator"
          created_at?: string
        }
      }
      store_categories: {
        Row: {
          id: number
          workspace_id: number
          name: string
          metadata: Json
        }
        Insert: {
          id?: number
          workspace_id: number
          name: string
          metadata?: Json
        }
        Update: {
          id?: number
          workspace_id?: number
          name?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "store_categories_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          }
        ]
      }
      stores: {
        Row: {
          id: number
          workspace_id: number
          name: string
          location: string | null
          category_id: number
          metadata: Json
          is_main: boolean
          is_hidden: boolean
        }
        Insert: {
          id?: number
          workspace_id: number
          name: string
          location?: string | null
          category_id: number
          metadata?: Json
          is_main?: boolean
          is_hidden?: boolean
        }
        Update: {
          id?: number
          workspace_id?: number
          name?: string
          location?: string | null
          category_id?: number
          metadata?: Json
          is_main?: boolean
          is_hidden?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "stores_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stores_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "store_categories"
            referencedColumns: ["id"]
          }
        ]
      }
      tickets: {
        Row: {
          id: number
          workspace_id: number
          user_id: string
          store_id: number | null
          date: string
          total_amount: number
          payment_method: PaymentMethod
          installments: number
          current_installment: number
          metadata: Json
          product_count: number
          total: number
        }
        Insert: {
          id?: number
          workspace_id: number
          user_id: string
          store_id?: number
          date?: string
          total_amount?: number
          payment_method: PaymentMethod
          installments?: number
          current_installment?: number
          metadata?: Json
          product_count?: number
          total?: number
        }
        Update: {
          id?: number
          workspace_id?: number
          user_id?: string
          store_id?: number
          date?: string
          total_amount?: number
          payment_method?: PaymentMethod
          installments?: number
          current_installment?: number
          metadata?: Json
          product_count?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "tickets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          }
        ]
      }
      product_categories: {
        Row: {
          id: number
          workspace_id: number
          name: string
          metadata: Json
        }
        Insert: {
          id?: number
          workspace_id: number
          name: string
          metadata?: Json
        }
        Update: {
          id?: number
          workspace_id?: number
          name?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          }
        ]
      }
      brands: {
        Row: {
          id: number
          workspace_id: number
          name: string
          description: string | null
          website: string | null
          logo_url: string | null
          metadata: Json
        }
        Insert: {
          id?: number
          workspace_id: number
          name: string
          description?: string | null
          website?: string | null
          logo_url?: string | null
          metadata?: Json
        }
        Update: {
          id?: number
          workspace_id?: number
          name?: string
          description?: string | null
          website?: string | null
          logo_url?: string | null
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "brands_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          }
        ]
      }
      products: {
        Row: {
          id: number
          workspace_id: number
          category_id: number | null
          brand_id: number | null
          store_id: number | null
          name: string
          description: string | null
          barcode: string | null
          image_url: string | null
          created_by: string
          created_at: string
          metadata: Json
          enabled: boolean
        }
        Insert: {
          id?: number
          workspace_id: number
          category_id?: number | null
          brand_id?: number | null
          store_id?: number | null
          name: string
          description?: string | null
          barcode?: string | null
          image_url?: string | null
          created_by: string
          created_at?: string
          metadata?: Json
          enabled?: boolean
        }
        Update: {
          id?: number
          workspace_id?: number
          category_id?: number | null
          brand_id?: number | null
          store_id?: number | null
          name?: string
          description?: string | null
          barcode?: string | null
          image_url?: string | null
          created_by?: string
          created_at?: string
          metadata?: Json
          enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "products_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          }
        ]
      }
      ticket_items: {
        Row: {
          id: number
          ticket_id: number
          product_id: number | null
          quantity: number
          unit_price: number
          total_price: number
          description: string
          temporary_item: boolean
          metadata: Json
        }
        Insert: {
          id?: number
          ticket_id: number
          product_id?: number
          quantity?: number
          unit_price: number
          total_price: number
          description: string
          temporary_item?: boolean
          metadata?: Json
        }
        Update: {
          id?: number
          ticket_id?: number
          product_id?: number
          quantity?: number
          unit_price?: number
          total_price?: number
          description?: string
          temporary_item?: boolean
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "ticket_items_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
      }
      product_price_history: {
        Row: {
          id: number
          product_id: number
          store_id: number
          price: number
          date: string
          recorded_by: string
          metadata: Json
          created_at: string
          workspace_id: number
          is_discount: boolean
          discount_end_date: string | null
        }
        Insert: {
          id?: number
          product_id: number
          store_id: number
          price: number
          date?: string
          recorded_by: string
          metadata?: Json
          created_at?: string
          workspace_id: number
          is_discount?: boolean
          discount_end_date?: string | null
        }
        Update: {
          id?: number
          product_id?: number
          store_id?: number
          price?: number
          date?: string
          recorded_by?: string
          metadata?: Json
          created_at?: string
          workspace_id?: number
          is_discount?: boolean
          discount_end_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_price_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_price_history_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_price_history_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      ticket_images: {
        Row: {
          id: number
          ticket_id: number
          image_url: string
          uploaded_at: string
          uploaded_by: string
          metadata: Json
        }
        Insert: {
          id?: number
          ticket_id: number
          image_url: string
          uploaded_at?: string
          uploaded_by: string
          metadata?: Json
        }
        Update: {
          id?: number
          ticket_id?: number
          image_url?: string
          uploaded_at?: string
          uploaded_by?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "ticket_images_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_images_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      workspace_invitations: {
        Row: {
          id: number
          workspace_id: number
          email: string
          role: WorkspaceMemberRole
          invited_by: string
          status: InvitationStatus
          created_at: string
          expires_at: string
          metadata: Json
        }
        Insert: {
          id?: number
          workspace_id: number
          email: string
          role: WorkspaceMemberRole
          invited_by: string
          status?: InvitationStatus
          created_at?: string
          expires_at?: string
          metadata?: Json
        }
        Update: {
          id?: number
          workspace_id?: number
          email?: string
          role?: WorkspaceMemberRole
          invited_by?: string
          status?: InvitationStatus
          created_at?: string
          expires_at?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "workspace_invitations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      points_systems: {
        Row: {
          id: number
          workspace_id: number
          name: string
          point_name_singular: string
          point_name_plural: string
          conversion_type: PointsConversionType
          conversion_rate: number | null
          enabled: boolean
          available_for_purchases: boolean
          created_at: string
          metadata: Json
        }
        Insert: {
          id?: number
          workspace_id: number
          name: string
          point_name_singular: string
          point_name_plural: string
          conversion_type: PointsConversionType
          conversion_rate?: number | null
          enabled?: boolean
          available_for_purchases?: boolean
          created_at?: string
          metadata?: Json
        }
        Update: {
          id?: number
          workspace_id?: number
          name?: string
          point_name_singular?: string
          point_name_plural?: string
          conversion_type?: PointsConversionType
          conversion_rate?: number | null
          enabled?: boolean
          available_for_purchases?: boolean
          created_at?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "points_systems_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          }
        ]
      },
      
      payment_cards: {
        Row: {
          id: number
          workspace_id: number
          user_id: string
          card_type: PaymentMethod
          bank: string
          owner_name: string
          last_four_digits: string
          card_name: string
          is_default: boolean
          created_at: string
          metadata: Json
        }
        Insert: {
          id?: number
          workspace_id: number
          user_id: string
          card_type: PaymentMethod
          bank: string
          owner_name: string
          last_four_digits: string
          card_name: string
          is_default?: boolean
          created_at?: string
          metadata?: Json
        }
        Update: {
          id?: number
          workspace_id?: number
          user_id?: string
          card_type?: PaymentMethod
          bank?: string
          owner_name?: string
          last_four_digits?: string
          card_name?: string
          is_default?: boolean
          created_at?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "payment_cards_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_cards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      },
      
      user_points_balance: {
        Row: {
          id: number
          user_id: string
          points_system_id: number
          balance: number
          last_updated: string
          metadata: Json
        }
        Insert: {
          id?: number
          user_id: string
          points_system_id: number
          balance: number
          last_updated?: string
          metadata?: Json
        }
        Update: {
          id?: number
          user_id?: string
          points_system_id?: number
          balance?: number
          last_updated?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "user_points_balance_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_points_balance_points_system_id_fkey"
            columns: ["points_system_id"]
            isOneToOne: false
            referencedRelation: "points_systems"
            referencedColumns: ["id"]
          }
        ]
      },
      
      points_transactions: {
        Row: {
          id: number
          user_id: string
          points_system_id: number
          amount: number
          ticket_id: number | null
          transaction_date: string
          description: string | null
          metadata: Json
        }
        Insert: {
          id?: number
          user_id: string
          points_system_id: number
          amount: number
          ticket_id?: number | null
          transaction_date?: string
          description?: string | null
          metadata?: Json
        }
        Update: {
          id?: number
          user_id?: string
          points_system_id?: number
          amount?: number
          ticket_id?: number | null
          transaction_date?: string
          description?: string | null
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "points_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "points_transactions_points_system_id_fkey"
            columns: ["points_system_id"]
            isOneToOne: false
            referencedRelation: "points_systems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "points_transactions_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      payment_method: PaymentMethod
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Workspace = {
  id: number
  name: string
}

export type TicketPointsDiscount = {
  points_system_id: number
  system_name: string
  points_used: number
  discount_amount: number
  conversion_type: PointsConversionType
  conversion_rate: number | null
  package_description?: string
  original_total: number
}

export type TicketPaymentCard = {
  id: number
  card_type: PaymentMethod
  bank: string
  card_name: string
  owner_name: string
  last_four_digits: string
}

export type TicketPaymentSummary = {
  original_amount: number
  points_discount: number
  remaining_amount: number
  payment_method: string
  installments: number
  points_system?: string
  points_used?: number
  bank?: string
  card_type?: string
}

export type TicketMetadata = {
  points_discount?: TicketPointsDiscount
  payment_card?: TicketPaymentCard
  payment_summary: TicketPaymentSummary
  [key: string]: any
}

// Tipo para operaciones de puntos en la UI
export type PointsOperation = {
  pointsSystemId: number
  systemName: string
  pointsAmount: number
  monetaryValue: number
  conversionType: PointsConversionType
  conversionRate: number | null
}

// Tipo para el selector de tarjetas
export type CardSelection = {
  card: TicketPaymentCard | null
  isNewCard: boolean
  paymentMethod: PaymentMethod
}

export type PaymentCard = Database['public']['Tables']['payment_cards']['Row'];
export type InsertPaymentCard = Database['public']['Tables']['payment_cards']['Insert'];
export type UpdatePaymentCard = Database['public']['Tables']['payment_cards']['Update']; 