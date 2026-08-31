export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      catalog: {
        Row: {
          brand: string | null
          category: string
          category_id: string | null
          created_at: string | null
          description: string | null
          id: string
          images: string[] | null
          is_active: boolean | null
          name: string
          specifications: Json | null
          subcategory: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          brand?: string | null
          category: string
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          name: string
          specifications?: Json | null
          subcategory?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          brand?: string | null
          category?: string
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          name?: string
          specifications?: Json | null
          subcategory?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_major_category: boolean | null
          name: string
          parent_id: string | null
          show_on_homepage: boolean | null
          slug: string
          sort_order: number | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_major_category?: boolean | null
          name: string
          parent_id?: string | null
          show_on_homepage?: boolean | null
          slug: string
          sort_order?: number | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_major_category?: boolean | null
          name?: string
          parent_id?: string | null
          show_on_homepage?: boolean | null
          slug?: string
          sort_order?: number | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      category_attributes: {
        Row: {
          attribute_key: string
          attribute_name: string
          attribute_type: string | null
          category_id: string | null
          created_at: string | null
          id: string
          is_filterable: boolean | null
          is_required: boolean | null
          options: Json | null
          sort_order: number | null
          validation_rules: Json | null
        }
        Insert: {
          attribute_key: string
          attribute_name: string
          attribute_type?: string | null
          category_id?: string | null
          created_at?: string | null
          id?: string
          is_filterable?: boolean | null
          is_required?: boolean | null
          options?: Json | null
          sort_order?: number | null
          validation_rules?: Json | null
        }
        Update: {
          attribute_key?: string
          attribute_name?: string
          attribute_type?: string | null
          category_id?: string | null
          created_at?: string | null
          id?: string
          is_filterable?: boolean | null
          is_required?: boolean | null
          options?: Json | null
          sort_order?: number | null
          validation_rules?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "category_attributes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      hero_slides: {
        Row: {
          bg_color: string | null
          created_at: string | null
          created_by: string | null
          cta_link: string | null
          cta_text: string | null
          id: string
          image_url: string
          is_active: boolean | null
          sort_order: number | null
          subtitle: string | null
          text_color: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          bg_color?: string | null
          created_at?: string | null
          created_by?: string | null
          cta_link?: string | null
          cta_text?: string | null
          id?: string
          image_url: string
          is_active?: boolean | null
          sort_order?: number | null
          subtitle?: string | null
          text_color?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          bg_color?: string | null
          created_at?: string | null
          created_by?: string | null
          cta_link?: string | null
          cta_text?: string | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          sort_order?: number | null
          subtitle?: string | null
          text_color?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hero_slides_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      
      individual_providers: {
        Row: {
          address: string | null
          bank_account_name: string | null
          bank_account_number: string | null
          bank_name: string | null
          bio: string | null
          business_name: string | null
          business_registration_number: string | null
          business_type: string | null
          certifications: string[] | null
          city: string | null
          country: string | null
          cover_image: string | null
          created_at: string | null
          created_by: string | null
          display_name: string | null
          email: string
          experience_years: number | null
          first_name: string
          full_name: string | null
          id: string
          is_active: boolean | null
          is_available_for_hire: boolean | null
          is_featured: boolean | null
          is_verified: boolean | null
          last_login: string | null
          last_name: string
          linkedin_url: string | null
          metadata: Json | null
          mobile_money_number: string | null
          payment_methods: string[] | null
          phone: string | null
          profession: string | null
          profile_image: string | null
          qualifications: string[] | null
          rating: number | null
          review_count: number | null
          service_radius_km: number | null
          specialty: string | null
          tags: string[] | null
          total_reviews: number | null
          twitter_handle: string | null
          updated_at: string | null
          website: string | null
          working_hours: Json | null
        }
        Insert: {
          address?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          bio?: string | null
          business_name?: string | null
          business_registration_number?: string | null
          business_type?: string | null
          certifications?: string[] | null
          city?: string | null
          country?: string | null
          cover_image?: string | null
          created_at?: string | null
          created_by?: string | null
          display_name?: string | null
          email: string
          experience_years?: number | null
          first_name: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          is_available_for_hire?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          last_login?: string | null
          last_name: string
          linkedin_url?: string | null
          metadata?: Json | null
          mobile_money_number?: string | null
          payment_methods?: string[] | null
          phone?: string | null
          profession?: string | null
          profile_image?: string | null
          qualifications?: string[] | null
          rating?: number | null
          review_count?: number | null
          service_radius_km?: number | null
          specialty?: string | null
          tags?: string[] | null
          total_reviews?: number | null
          twitter_handle?: string | null
          updated_at?: string | null
          website?: string | null
          working_hours?: Json | null
        }
        Update: {
          address?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          bio?: string | null
          business_name?: string | null
          business_registration_number?: string | null
          business_type?: string | null
          certifications?: string[] | null
          city?: string | null
          country?: string | null
          cover_image?: string | null
          created_at?: string | null
          created_by?: string | null
          display_name?: string | null
          email?: string
          experience_years?: number | null
          first_name?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          is_available_for_hire?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          last_login?: string | null
          last_name?: string
          linkedin_url?: string | null
          metadata?: Json | null
          mobile_money_number?: string | null
          payment_methods?: string[] | null
          phone?: string | null
          profession?: string | null
          profile_image?: string | null
          qualifications?: string[] | null
          rating?: number | null
          review_count?: number | null
          service_radius_km?: number | null
          specialty?: string | null
          tags?: string[] | null
          total_reviews?: number | null
          twitter_handle?: string | null
          updated_at?: string | null
          website?: string | null
          working_hours?: Json | null
        }
        Relationships: []
      }
      institutions: {
        Row: {
          address: string | null
          area: string | null
          city: string | null
          cover_image: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          email: string | null
          id: string
          is_open: boolean | null
          is_verified: boolean | null
          latitude: number | null
          logo: string | null
          longitude: number | null
          name: string
          phone: string | null
          rating: number | null
          review_count: number | null
          slug: string | null
          type: string | null
          website: string | null
          working_hours: Json | null
        }
        Insert: {
          address?: string | null
          area?: string | null
          city?: string | null
          cover_image?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          email?: string | null
          id?: string
          is_open?: boolean | null
          is_verified?: boolean | null
          latitude?: number | null
          logo?: string | null
          longitude?: number | null
          name: string
          phone?: string | null
          rating?: number | null
          review_count?: number | null
          slug?: string | null
          type?: string | null
          website?: string | null
          working_hours?: Json | null
        }
        Update: {
          address?: string | null
          area?: string | null
          city?: string | null
          cover_image?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          email?: string | null
          id?: string
          is_open?: boolean | null
          is_verified?: boolean | null
          latitude?: number | null
          logo?: string | null
          longitude?: number | null
          name?: string
          phone?: string | null
          rating?: number | null
          review_count?: number | null
          slug?: string | null
          type?: string | null
          website?: string | null
          working_hours?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "institutions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          attributes: Json | null
          category_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          images: string[] | null
          is_available: boolean | null
          is_verified: boolean | null
          price: number | null
          price_type: string | null
          provider_id: string | null
          provider_type: string | null
          rating: number | null
          review_count: number | null
          slug: string | null
          title: string
          type: string | null
        }
        Insert: {
          attributes?: Json | null
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          is_available?: boolean | null
          is_verified?: boolean | null
          price?: number | null
          price_type?: string | null
          provider_id?: string | null
          provider_type?: string | null
          rating?: number | null
          review_count?: number | null
          slug?: string | null
          title: string
          type?: string | null
        }
        Update: {
          attributes?: Json | null
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          is_available?: boolean | null
          is_verified?: boolean | null
          price?: number | null
          price_type?: string | null
          provider_id?: string | null
          provider_type?: string | null
          rating?: number | null
          review_count?: number | null
          slug?: string | null
          title?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          created_at: string | null
          id: string
          image_url: string | null
          is_read: boolean | null
          receiver_id: string
          sender_id: string
          text: string | null
          voice_note_url: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_read?: boolean | null
          receiver_id: string
          sender_id: string
          text?: string | null
          voice_note_url?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_read?: boolean | null
          receiver_id?: string
          sender_id?: string
          text?: string | null
          voice_note_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      otp_verifications: {
        Row: {
          attempts: number | null
          created_at: string | null
          expires_at: string
          id: string
          otp: string
          phone: string
          verified: boolean | null
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          expires_at: string
          id?: string
          otp: string
          phone: string
          verified?: boolean | null
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          expires_at?: string
          id?: string
          otp?: string
          phone?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      product_attribute_values: {
        Row: {
          attribute_id: string | null
          created_at: string | null
          id: string
          product_id: string | null
          value: string
        }
        Insert: {
          attribute_id?: string | null
          created_at?: string | null
          id?: string
          product_id?: string | null
          value: string
        }
        Update: {
          attribute_id?: string | null
          created_at?: string | null
          id?: string
          product_id?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_attribute_values_attribute_id_fkey"
            columns: ["attribute_id"]
            isOneToOne: false
            referencedRelation: "category_attributes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_attribute_values_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "shop_products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_attributes: {
        Row: {
          attribute_name: string
          attribute_type: string | null
          attribute_value: string | null
          catalog_id: string | null
          id: string
          sort_order: number | null
        }
        Insert: {
          attribute_name: string
          attribute_type?: string | null
          attribute_value?: string | null
          catalog_id?: string | null
          id?: string
          sort_order?: number | null
        }
        Update: {
          attribute_name?: string
          attribute_type?: string | null
          attribute_value?: string | null
          catalog_id?: string | null
          id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_attributes_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          in_stock: boolean | null
          name: string
          regular_price: number
          shop_id: string | null
          specifications: Json | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean | null
          name: string
          regular_price: number
          shop_id?: string | null
          specifications?: Json | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean | null
          name?: string
          regular_price?: number
          shop_id?: string | null
          specifications?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "products_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_services: {
        Row: {
          created_at: string | null
          id: string
          institution_id: string | null
          is_active: boolean | null
          price: number
          service_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          institution_id?: string | null
          is_active?: boolean | null
          price: number
          service_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          institution_id?: string | null
          is_active?: boolean | null
          price?: number
          service_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_services_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_services_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      push_tokens: {
        Row: {
          created_at: string | null
          device_type: string | null
          id: string
          is_active: boolean | null
          token: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          device_type?: string | null
          id?: string
          is_active?: boolean | null
          token: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          device_type?: string | null
          id?: string
          is_active?: boolean | null
          token?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          business_id: string | null
          comment: string | null
          created_at: string | null
          customer_id: string | null
          id: string
          order_id: string | null
          product_id: string | null
          rating: number
          reported_reason: string | null
          service_id: string | null
          status: string
          title: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          business_id?: string | null
          comment?: string | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          order_id?: string | null
          product_id?: string | null
          rating: number
          reported_reason?: string | null
          service_id?: string | null
          status?: string
          title?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          business_id?: string | null
          comment?: string | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          order_id?: string | null
          product_id?: string | null
          rating?: number
          reported_reason?: string | null
          service_id?: string | null
          status?: string
          title?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      service_catalog: {
        Row: {
          availability: string | null
          category: string
          category_id: string | null
          created_at: string | null
          description: string | null
          duration: string | null
          duration_minutes: number | null
          id: string
          images: string[] | null
          is_active: boolean | null
          name: string
          price_type: string | null
          specifications: Json | null
          subcategory: string | null
          tags: string[] | null
          updated_at: string | null
          brand: null;
        }
        Insert: {
          availability?: string | null
          category: string
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          duration?: string | null
          duration_minutes?: number | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          name: string
          price_type?: string | null
          specifications?: Json | null
          subcategory?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          availability?: string | null
          category?: string
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          duration?: string | null
          duration_minutes?: number | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          name?: string
          price_type?: string | null
          specifications?: Json | null
          subcategory?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      search_history: {
        Row: {
          id: string;
          user_id: string;
          query: string;
          results_count: number | null;
          intent: Json | null;
          filters_applied: Json | null;
          clicked_item_id: string | null;
          clicked_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          query: string;
          results_count?: number | null;
          intent?: Json | null;
          filters_applied?: Json | null;
          clicked_item_id?: string | null;
          clicked_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          query?: string;
          results_count?: number | null;
          intent?: Json | null;
          filters_applied?: Json | null;
          clicked_item_id?: string | null;
          clicked_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "search_history_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    
      shop_products: {
        Row: {
          catalog_id: string
          created_at: string | null
          id: string
          in_stock: boolean | null
          regular_price: number
          seller_specifications: Json | null
          shop_id: string
        }
        Insert: {
          catalog_id: string
          created_at?: string | null
          id?: string
          in_stock?: boolean | null
          regular_price: number
          seller_specifications?: Json | null
          shop_id: string
        }
        Update: {
          catalog_id?: string
          created_at?: string | null
          id?: string
          in_stock?: boolean | null
          regular_price?: number
          seller_specifications?: Json | null
          shop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_products_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shops: {
        Row: {
          address: string | null
          area: string | null
          business_settings: Json
          business_type: string | null
          category: string | null
          category_id: string | null
          city: string | null
          created_at: string | null
          description: string | null
          discount_budget: number | null
          discount_percentage: number | null
          discount_used: number | null
          distance: string | null
          district: string | null
          id: string
          is_active: boolean
          is_anchor_partner: boolean | null
          is_open: boolean | null
          is_verified: boolean | null
          landmark: string | null
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          name: string
          banner_url: string | null
          opening_hours: string | null
          owner_id: string | null
          phone: string | null
          rating: number | null
          review_count: number | null
          wallet_balance: number | null
        }
        Insert: {
          address?: string | null
          area?: string | null
          business_settings?: Json
          business_type?: string | null
          category?: string | null
          category_id?: string | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          discount_budget?: number | null
          discount_percentage?: number | null
          discount_used?: number | null
          distance?: string | null
          district?: string | null
          id?: string
          is_active?: boolean
          is_anchor_partner?: boolean | null
          is_open?: boolean | null
          is_verified?: boolean | null
          landmark?: string | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          opening_hours?: string | null
          owner_id?: string | null
          phone?: string | null
          rating?: number | null
          review_count?: number | null
          wallet_balance?: number | null
        }
        Update: {
          address?: string | null
          area?: string | null
          business_settings?: Json
          business_type?: string | null
          category?: string | null
          category_id?: string | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          discount_budget?: number | null
          discount_percentage?: number | null
          discount_used?: number | null
          distance?: string | null
          district?: string | null
          id?: string
          is_active?: boolean
          is_anchor_partner?: boolean | null
          is_open?: boolean | null
          is_verified?: boolean | null
          landmark?: string | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          opening_hours?: string | null
          owner_id?: string | null
          phone?: string | null
          rating?: number | null
          review_count?: number | null
          wallet_balance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shops_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          discount_applied: number | null
          fee_amount: number | null
          id: string
          payment_code: string | null
          reference: string | null
          seller_received: number | null
          shop_id: string | null
          status: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          discount_applied?: number | null
          fee_amount?: number | null
          id?: string
          payment_code?: string | null
          reference?: string | null
          seller_received?: number | null
          shop_id?: string | null
          status?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          discount_applied?: number | null
          fee_amount?: number | null
          id?: string
          payment_code?: string | null
          reference?: string | null
          seller_received?: number | null
          shop_id?: string | null
          status?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          kyc_verified: boolean | null
          lifetime_savings: number | null
          phone_number: string
          pin_hash: string | null
          role: string | null
          wallet_balance: number | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          kyc_verified?: boolean | null
          lifetime_savings?: number | null
          phone_number: string
          pin_hash?: string | null
          role?: string | null
          wallet_balance?: number | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          kyc_verified?: boolean | null
          lifetime_savings?: number | null
          phone_number?: string
          pin_hash?: string | null
          role?: string | null
          wallet_balance?: number | null
        }
        Relationships: []
      }
      verification_requests: {
        Row: {
          business_id: string
          id: string
          notes: string | null
          requested_by: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string
          verification_type: string
        }
        Insert: {
          business_id: string
          id?: string
          notes?: string | null
          requested_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          verification_type?: string
        }
        Update: {
          business_id?: string
          id?: string
          notes?: string | null
          requested_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          verification_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_requests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      // --- ADD THE BUSINESS DOCUMENTS TABLE HERE ---
      business_documents: {
        Row: {
          id: string
          business_id: string | null
          document_type: string
          file_name: string
          file_url: string
          file_size: number | null
          mime_type: string | null
          uploaded_by: string
          uploaded_at: string
          is_verified: boolean
          verified_at: string | null
          verified_by: string | null
          status: string
          rejection_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id?: string | null
          document_type: string
          file_name: string
          file_url: string
          file_size?: number | null
          mime_type?: string | null
          uploaded_by: string
          uploaded_at?: string
          is_verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
          status?: string
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string | null
          document_type?: string
          file_name?: string
          file_url?: string
          file_size?: number | null
          mime_type?: string | null
          uploaded_by?: string
          uploaded_at?: string
          is_verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
          status?: string
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_documents_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_documents_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      // In your database.types.ts, add this under Tables:

opportunity_scenes: {
  Row: {
    id: string;
    opportunity_id: string;
    opportunity_type: 'product' | 'service';
    scene_index: number;
    scene_type: 'hero' | 'details' | 'trust' | 'gallery' | 'extra';
    image_url: string;
    image_caption: string | null;
    order_index: number;
    is_primary: boolean;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    opportunity_id: string;
    opportunity_type: 'product' | 'service';
    scene_index: number;
    scene_type: 'hero' | 'details' | 'trust' | 'gallery' | 'extra';
    image_url: string;
    image_caption?: string | null;
    order_index?: number;
    is_primary?: boolean;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    opportunity_id?: string;
    opportunity_type?: 'product' | 'service';
    scene_index?: number;
    scene_type?: 'hero' | 'details' | 'trust' | 'gallery' | 'extra';
    image_url?: string;
    image_caption?: string | null;
    order_index?: number;
    is_primary?: boolean;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [
    {
      foreignKeyName: "opportunity_scenes_opportunity_id_fkey";
      columns: ["opportunity_id"];
      referencedRelation: "shop_products";
      referencedColumns: ["id"];
    },
  ];
}
      // --- END OF BUSINESS DOCUMENTS TABLE ---
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_conversations: {
        Args: { user_id: string }
        Returns: {
          last_message: string
          last_message_time: string
          partner_id: string
          partner_name: string
          partner_phone: string
          unread_count: number
        }[]
      }
      get_flash_deals: {
        Args: { limit_count?: number }
        Returns: {
          category: string
          created_at: string
          deal_price: number
          deal_type: string
          discount_percentage: number
          expires_at: string
          image_url: string
          item_id: string
          item_link: string
          location: string
          original_price: number
          provider_id: string
          provider_link: string
          provider_name: string
          provider_type: string
          rating: number
          review_count: number
          title: string
        }[]
      }
      process_payment: {
        Args: {
          p_amount: number
          p_pin: string
          p_shop_id: string
          p_user_id: string
        }
        Returns: Json
      }
      search_catalog: {
        Args: { limit_count?: number; search_query: string }
        Returns: {
          category: string
          description: string
          id: string
          name: string
          similarity: number
        }[]
      }
      search_services: {
        Args: { limit_count?: number; search_query: string }
        Returns: {
          category: string
          description: string
          id: string
          name: string
          similarity: number
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      verify_pin: {
        Args: { input_pin: string; user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

// Keep your BusinessDocument type definition
export type BusinessDocument = {
  id: string;
  business_id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_by: string;
  uploaded_at: string;
  is_verified: boolean;
  verified_at: string | null;
  verified_by: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
};