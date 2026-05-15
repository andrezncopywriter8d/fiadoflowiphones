export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      app_state: {
        Row: {
          created_at: string;
          data: Json;
          scope: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          data?: Json;
          scope: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          data?: Json;
          scope?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      charge_logs: {
        Row: {
          client_id: string | null;
          created_at: string;
          data_cobranca: string;
          id: string;
          mensagem_usada: string | null;
          sale_id: string | null;
          status: string;
          user_id: string;
        };
        Insert: {
          client_id?: string | null;
          created_at?: string;
          data_cobranca?: string;
          id?: string;
          mensagem_usada?: string | null;
          sale_id?: string | null;
          status?: string;
          user_id: string;
        };
        Update: {
          client_id?: string | null;
          created_at?: string;
          data_cobranca?: string;
          id?: string;
          mensagem_usada?: string | null;
          sale_id?: string | null;
          status?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "charge_logs_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "charge_logs_sale_id_fkey";
            columns: ["sale_id"];
            isOneToOne: false;
            referencedRelation: "sales";
            referencedColumns: ["id"];
          },
        ];
      };
      clients: {
        Row: {
          cpf: string | null;
          created_at: string;
          endereco: string | null;
          id: string;
          nome: string;
          observacoes: string | null;
          status: string;
          telefone: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          cpf?: string | null;
          created_at?: string;
          endereco?: string | null;
          id?: string;
          nome: string;
          observacoes?: string | null;
          status?: string;
          telefone?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          cpf?: string | null;
          created_at?: string;
          endereco?: string | null;
          id?: string;
          nome?: string;
          observacoes?: string | null;
          status?: string;
          telefone?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          client_id: string;
          created_at: string;
          data_pagamento: string;
          forma_pagamento: string | null;
          id: string;
          observacoes: string | null;
          sale_id: string;
          user_id: string;
          valor_pago: number;
        };
        Insert: {
          client_id: string;
          created_at?: string;
          data_pagamento?: string;
          forma_pagamento?: string | null;
          id?: string;
          observacoes?: string | null;
          sale_id: string;
          user_id: string;
          valor_pago: number;
        };
        Update: {
          client_id?: string;
          created_at?: string;
          data_pagamento?: string;
          forma_pagamento?: string | null;
          id?: string;
          observacoes?: string | null;
          sale_id?: string;
          user_id?: string;
          valor_pago?: number;
        };
        Relationships: [
          {
            foreignKeyName: "payments_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_sale_id_fkey";
            columns: ["sale_id"];
            isOneToOne: false;
            referencedRelation: "sales";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          created_at: string;
          estoque_minimo: number;
          id: string;
          nome: string;
          observacoes: string | null;
          preco_venda: number;
          quantidade: number;
          sku: string | null;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          estoque_minimo?: number;
          id?: string;
          nome: string;
          observacoes?: string | null;
          preco_venda?: number;
          quantidade?: number;
          sku?: string | null;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          estoque_minimo?: number;
          id?: string;
          nome?: string;
          observacoes?: string | null;
          preco_venda?: number;
          quantidade?: number;
          sku?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string | null;
          id: string;
          loja_nome: string | null;
          nome: string | null;
          pix_chave: string | null;
          telefone: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          id: string;
          loja_nome?: string | null;
          nome?: string | null;
          pix_chave?: string | null;
          telefone?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          id?: string;
          loja_nome?: string | null;
          nome?: string | null;
          pix_chave?: string | null;
          telefone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      reminders: {
        Row: {
          client_id: string | null;
          created_at: string;
          data_lembrete: string;
          descricao: string | null;
          horario_lembrete: string | null;
          id: string;
          sale_id: string | null;
          status: string;
          titulo: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          client_id?: string | null;
          created_at?: string;
          data_lembrete: string;
          descricao?: string | null;
          horario_lembrete?: string | null;
          id?: string;
          sale_id?: string | null;
          status?: string;
          titulo: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          client_id?: string | null;
          created_at?: string;
          data_lembrete?: string;
          descricao?: string | null;
          horario_lembrete?: string | null;
          id?: string;
          sale_id?: string | null;
          status?: string;
          titulo?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reminders_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reminders_sale_id_fkey";
            columns: ["sale_id"];
            isOneToOne: false;
            referencedRelation: "sales";
            referencedColumns: ["id"];
          },
        ];
      };
      sale_items: {
        Row: {
          created_at: string;
          id: string;
          preco_unitario: number;
          product_id: string | null;
          product_name: string;
          quantidade: number;
          sale_id: string;
          subtotal: number;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          preco_unitario?: number;
          product_id?: string | null;
          product_name: string;
          quantidade: number;
          sale_id: string;
          subtotal?: number;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          preco_unitario?: number;
          product_id?: string | null;
          product_name?: string;
          quantidade?: number;
          sale_id?: string;
          subtotal?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey";
            columns: ["sale_id"];
            isOneToOne: false;
            referencedRelation: "sales";
            referencedColumns: ["id"];
          },
        ];
      };
      sales: {
        Row: {
          client_id: string;
          created_at: string;
          data_vencimento: string | null;
          data_venda: string;
          descricao: string;
          dia_cobranca: number | null;
          forma_pagamento: string | null;
          id: string;
          observacoes: string | null;
          parcelas_total: number;
          saldo_restante: number;
          status: string;
          updated_at: string;
          user_id: string;
          valor_pago: number;
          valor_parcela: number | null;
          valor_total: number;
        };
        Insert: {
          client_id: string;
          created_at?: string;
          data_vencimento?: string | null;
          data_venda?: string;
          descricao: string;
          dia_cobranca?: number | null;
          forma_pagamento?: string | null;
          id?: string;
          observacoes?: string | null;
          parcelas_total?: number;
          saldo_restante?: number;
          status?: string;
          updated_at?: string;
          user_id: string;
          valor_pago?: number;
          valor_parcela?: number | null;
          valor_total?: number;
        };
        Update: {
          client_id?: string;
          created_at?: string;
          data_vencimento?: string | null;
          data_venda?: string;
          descricao?: string;
          dia_cobranca?: number | null;
          forma_pagamento?: string | null;
          id?: string;
          observacoes?: string | null;
          parcelas_total?: number;
          saldo_restante?: number;
          status?: string;
          updated_at?: string;
          user_id?: string;
          valor_pago?: number;
          valor_parcela?: number | null;
          valor_total?: number;
        };
        Relationships: [
          {
            foreignKeyName: "sales_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
