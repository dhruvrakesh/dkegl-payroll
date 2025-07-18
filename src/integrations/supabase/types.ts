export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      _artworks_revised_staging: {
        Row: {
          circum: number | null
          coil_size: string | null
          customer_name: string | null
          cut_length: string | null
          cyl_qty: string | null
          dimensions: string | null
          file_hyperlink: string | null
          file_id: string | null
          item_code: string
          item_name: string | null
          last_run: string | null
          length: string | null
          location: string | null
          mielage_m: string | null
          no_of_colours: string | null
          qr_code: string | null
          remarks: string | null
          total_runs: string | null
          ups: number | null
        }
        Insert: {
          circum?: number | null
          coil_size?: string | null
          customer_name?: string | null
          cut_length?: string | null
          cyl_qty?: string | null
          dimensions?: string | null
          file_hyperlink?: string | null
          file_id?: string | null
          item_code: string
          item_name?: string | null
          last_run?: string | null
          length?: string | null
          location?: string | null
          mielage_m?: string | null
          no_of_colours?: string | null
          qr_code?: string | null
          remarks?: string | null
          total_runs?: string | null
          ups?: number | null
        }
        Update: {
          circum?: number | null
          coil_size?: string | null
          customer_name?: string | null
          cut_length?: string | null
          cyl_qty?: string | null
          dimensions?: string | null
          file_hyperlink?: string | null
          file_id?: string | null
          item_code?: string
          item_name?: string | null
          last_run?: string | null
          length?: string | null
          location?: string | null
          mielage_m?: string | null
          no_of_colours?: string | null
          qr_code?: string | null
          remarks?: string | null
          total_runs?: string | null
          ups?: number | null
        }
        Relationships: []
      }
      _artworks_se_backup: {
        Row: {
          customer_name: string | null
          dimensions: string | null
          file_hyperlink: string | null
          file_id: string | null
          item_code: string | null
          item_name: string | null
          no_of_colours: string | null
          snapshot_ts: string | null
        }
        Insert: {
          customer_name?: string | null
          dimensions?: string | null
          file_hyperlink?: string | null
          file_id?: string | null
          item_code?: string | null
          item_name?: string | null
          no_of_colours?: string | null
          snapshot_ts?: string | null
        }
        Update: {
          customer_name?: string | null
          dimensions?: string | null
          file_hyperlink?: string | null
          file_id?: string | null
          item_code?: string | null
          item_name?: string | null
          no_of_colours?: string | null
          snapshot_ts?: string | null
        }
        Relationships: []
      }
      _old_artworks_se: {
        Row: {
          customer_name: string | null
          dimensions: string | null
          file_hyperlink: string | null
          file_id: string | null
          item_code: string
          item_name: string | null
          no_of_colours: string | null
        }
        Insert: {
          customer_name?: string | null
          dimensions?: string | null
          file_hyperlink?: string | null
          file_id?: string | null
          item_code: string
          item_name?: string | null
          no_of_colours?: string | null
        }
        Update: {
          customer_name?: string | null
          dimensions?: string | null
          file_hyperlink?: string | null
          file_id?: string | null
          item_code?: string
          item_name?: string | null
          no_of_colours?: string | null
        }
        Relationships: []
      }
      adhesive_coating: {
        Row: {
          adhesion_strength: number | null
          adhesive_specification: string | null
          coat_weight_variance: number | null
          coating_speed: number | null
          coating_type: string
          coating_weight: number | null
          coating_width: number | null
          completed_at: string | null
          created_at: string | null
          curing_parameters: Json | null
          drying_temperature: number | null
          id: string
          operator_id: string | null
          qc_approved_by: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["process_status"] | null
          uiorn: string
          updated_at: string | null
          viscosity_readings: Json | null
        }
        Insert: {
          adhesion_strength?: number | null
          adhesive_specification?: string | null
          coat_weight_variance?: number | null
          coating_speed?: number | null
          coating_type: string
          coating_weight?: number | null
          coating_width?: number | null
          completed_at?: string | null
          created_at?: string | null
          curing_parameters?: Json | null
          drying_temperature?: number | null
          id?: string
          operator_id?: string | null
          qc_approved_by?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["process_status"] | null
          uiorn: string
          updated_at?: string | null
          viscosity_readings?: Json | null
        }
        Update: {
          adhesion_strength?: number | null
          adhesive_specification?: string | null
          coat_weight_variance?: number | null
          coating_speed?: number | null
          coating_type?: string
          coating_weight?: number | null
          coating_width?: number | null
          completed_at?: string | null
          created_at?: string | null
          curing_parameters?: Json | null
          drying_temperature?: number | null
          id?: string
          operator_id?: string | null
          qc_approved_by?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["process_status"] | null
          uiorn?: string
          updated_at?: string | null
          viscosity_readings?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "adhesive_coating_uiorn_fkey"
            columns: ["uiorn"]
            isOneToOne: false
            referencedRelation: "order_punching"
            referencedColumns: ["uiorn"]
          },
        ]
      }
      admin_audit_log: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string | null
          id: string
          ip_address: unknown | null
          new_data: Json | null
          old_data: Json | null
          target_id: string | null
          target_table: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_data?: Json | null
          old_data?: Json | null
          target_id?: string | null
          target_table?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_data?: Json | null
          old_data?: Json | null
          target_id?: string | null
          target_table?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      advances: {
        Row: {
          advance_amount: number
          advance_date: string
          advance_id: string
          created_at: string | null
          employee_id: string | null
          remarks: string | null
          unit_id: string | null
          updated_at: string | null
        }
        Insert: {
          advance_amount: number
          advance_date: string
          advance_id?: string
          created_at?: string | null
          employee_id?: string | null
          remarks?: string | null
          unit_id?: string | null
          updated_at?: string | null
        }
        Update: {
          advance_amount?: number
          advance_date?: string
          advance_id?: string
          created_at?: string | null
          employee_id?: string | null
          remarks?: string | null
          unit_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "advances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_details_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "panchkula_payroll_calculation"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "advances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "payroll_calculation_enhanced"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "advances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "payroll_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advances_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["unit_id"]
          },
        ]
      }
      albums: {
        Row: {
          artist_id: string | null
          cover_url: string | null
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
          year: number | null
        }
        Insert: {
          artist_id?: string | null
          cover_url?: string | null
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          artist_id?: string | null
          cover_url?: string | null
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "albums_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          notes: string | null
          phone: string
          pref_date: string
          pref_slot: string
          service: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          notes?: string | null
          phone: string
          pref_date: string
          pref_slot: string
          service: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string
          pref_date?: string
          pref_slot?: string
          service?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      approval_history: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string
          id: string
          notes: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "approval_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      approvals: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          decision: string | null
          id: string
          job_id: string | null
          signed_pdf_url: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          decision?: string | null
          id?: string
          job_id?: string | null
          signed_pdf_url?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          decision?: string | null
          id?: string
          job_id?: string | null
          signed_pdf_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "approvals_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approvals_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          article_id: string
          author: string
          category: string | null
          content: string
          created_at: string
          excerpt: string | null
          published: boolean
          reading_time: number | null
          slug: string
          title: string
        }
        Insert: {
          article_id?: string
          author?: string
          category?: string | null
          content: string
          created_at?: string
          excerpt?: string | null
          published?: boolean
          reading_time?: number | null
          slug: string
          title: string
        }
        Update: {
          article_id?: string
          author?: string
          category?: string | null
          content?: string
          created_at?: string
          excerpt?: string | null
          published?: boolean
          reading_time?: number | null
          slug?: string
          title?: string
        }
        Relationships: []
      }
      artists: {
        Row: {
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      artwork_upload: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          artwork_name: string
          artwork_specifications: Json | null
          barcode_specifications: Json | null
          bleed_specifications: Json | null
          color_separation_done: boolean | null
          color_specifications: Json | null
          created_at: string | null
          customer_approval_status: string | null
          file_path: string
          file_size_mb: number | null
          file_type: string
          id: string
          print_dimensions: Json | null
          print_ready: boolean | null
          proofing_status: string | null
          registration_marks: boolean | null
          revision_notes: string | null
          status: Database["public"]["Enums"]["process_status"] | null
          uiorn: string
          updated_at: string | null
          uploaded_at: string | null
          uploaded_by: string | null
          version_number: number | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          artwork_name: string
          artwork_specifications?: Json | null
          barcode_specifications?: Json | null
          bleed_specifications?: Json | null
          color_separation_done?: boolean | null
          color_specifications?: Json | null
          created_at?: string | null
          customer_approval_status?: string | null
          file_path: string
          file_size_mb?: number | null
          file_type: string
          id?: string
          print_dimensions?: Json | null
          print_ready?: boolean | null
          proofing_status?: string | null
          registration_marks?: boolean | null
          revision_notes?: string | null
          status?: Database["public"]["Enums"]["process_status"] | null
          uiorn: string
          updated_at?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
          version_number?: number | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          artwork_name?: string
          artwork_specifications?: Json | null
          barcode_specifications?: Json | null
          bleed_specifications?: Json | null
          color_separation_done?: boolean | null
          color_specifications?: Json | null
          created_at?: string | null
          customer_approval_status?: string | null
          file_path?: string
          file_size_mb?: number | null
          file_type?: string
          id?: string
          print_dimensions?: Json | null
          print_ready?: boolean | null
          proofing_status?: string | null
          registration_marks?: boolean | null
          revision_notes?: string | null
          status?: Database["public"]["Enums"]["process_status"] | null
          uiorn?: string
          updated_at?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
          version_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "artwork_upload_uiorn_fkey"
            columns: ["uiorn"]
            isOneToOne: false
            referencedRelation: "order_punching"
            referencedColumns: ["uiorn"]
          },
        ]
      }
      asset_assignments: {
        Row: {
          asset_id: string | null
          assigned_by: string | null
          assigned_date: string | null
          assigned_to: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          return_date: string | null
        }
        Insert: {
          asset_id?: string | null
          assigned_by?: string | null
          assigned_date?: string | null
          assigned_to?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          return_date?: string | null
        }
        Update: {
          asset_id?: string | null
          assigned_by?: string | null
          assigned_date?: string | null
          assigned_to?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          return_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_assignments_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_categories: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          parent_category_id: string | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_category_id?: string | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_category_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "asset_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_history: {
        Row: {
          action: string
          asset_id: string | null
          changed_by: string | null
          created_at: string | null
          field_name: string | null
          id: string
          new_value: string | null
          notes: string | null
          old_value: string | null
        }
        Insert: {
          action: string
          asset_id?: string | null
          changed_by?: string | null
          created_at?: string | null
          field_name?: string | null
          id?: string
          new_value?: string | null
          notes?: string | null
          old_value?: string | null
        }
        Update: {
          action?: string
          asset_id?: string | null
          changed_by?: string | null
          created_at?: string | null
          field_name?: string | null
          id?: string
          new_value?: string | null
          notes?: string | null
          old_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_history_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_transfers: {
        Row: {
          approved_by: string | null
          asset_id: string | null
          created_at: string | null
          from_location_id: string | null
          id: string
          notes: string | null
          requested_by: string | null
          status: Database["public"]["Enums"]["transfer_status"] | null
          to_location_id: string | null
          transfer_date: string | null
          updated_at: string | null
        }
        Insert: {
          approved_by?: string | null
          asset_id?: string | null
          created_at?: string | null
          from_location_id?: string | null
          id?: string
          notes?: string | null
          requested_by?: string | null
          status?: Database["public"]["Enums"]["transfer_status"] | null
          to_location_id?: string | null
          transfer_date?: string | null
          updated_at?: string | null
        }
        Update: {
          approved_by?: string | null
          asset_id?: string | null
          created_at?: string | null
          from_location_id?: string | null
          id?: string
          notes?: string | null
          requested_by?: string | null
          status?: Database["public"]["Enums"]["transfer_status"] | null
          to_location_id?: string | null
          transfer_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_transfers_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_transfers_from_location_id_fkey"
            columns: ["from_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_transfers_to_location_id_fkey"
            columns: ["to_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          asset_code: string
          category_id: string | null
          condition: Database["public"]["Enums"]["asset_condition"] | null
          created_at: string | null
          created_by: string
          current_value: number | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          location_id: string | null
          manufacturer: string | null
          model: string | null
          name: string
          notes: string | null
          purchase_cost: number | null
          purchase_date: string | null
          serial_number: string | null
          status: Database["public"]["Enums"]["asset_status"] | null
          updated_at: string | null
          updated_by: string | null
          warranty_expiry: string | null
        }
        Insert: {
          asset_code: string
          category_id?: string | null
          condition?: Database["public"]["Enums"]["asset_condition"] | null
          created_at?: string | null
          created_by: string
          current_value?: number | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          location_id?: string | null
          manufacturer?: string | null
          model?: string | null
          name: string
          notes?: string | null
          purchase_cost?: number | null
          purchase_date?: string | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["asset_status"] | null
          updated_at?: string | null
          updated_by?: string | null
          warranty_expiry?: string | null
        }
        Update: {
          asset_code?: string
          category_id?: string | null
          condition?: Database["public"]["Enums"]["asset_condition"] | null
          created_at?: string | null
          created_by?: string
          current_value?: number | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          location_id?: string | null
          manufacturer?: string | null
          model?: string | null
          name?: string
          notes?: string | null
          purchase_cost?: number | null
          purchase_date?: string | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["asset_status"] | null
          updated_at?: string | null
          updated_by?: string | null
          warranty_expiry?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "asset_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          attendance_date: string
          attendance_id: string
          created_at: string | null
          employee_id: string
          hours_worked: number
          overtime_hours: number | null
          status: Database["public"]["Enums"]["attendance_status"]
          unit_id: string | null
          updated_at: string | null
        }
        Insert: {
          attendance_date: string
          attendance_id?: string
          created_at?: string | null
          employee_id: string
          hours_worked: number
          overtime_hours?: number | null
          status?: Database["public"]["Enums"]["attendance_status"]
          unit_id?: string | null
          updated_at?: string | null
        }
        Update: {
          attendance_date?: string
          attendance_id?: string
          created_at?: string | null
          employee_id?: string
          hours_worked?: number
          overtime_hours?: number | null
          status?: Database["public"]["Enums"]["attendance_status"]
          unit_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_details_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "panchkula_payroll_calculation"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "payroll_calculation_enhanced"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "payroll_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["unit_id"]
          },
        ]
      }
      attendance_bad_backup: {
        Row: {
          attendance_date: string | null
          attendance_id: string | null
          created_at: string | null
          employee_id: string | null
          hours_worked: number | null
          overtime_hours: number | null
          unit_id: string | null
          updated_at: string | null
        }
        Insert: {
          attendance_date?: string | null
          attendance_id?: string | null
          created_at?: string | null
          employee_id?: string | null
          hours_worked?: number | null
          overtime_hours?: number | null
          unit_id?: string | null
          updated_at?: string | null
        }
        Update: {
          attendance_date?: string | null
          attendance_id?: string | null
          created_at?: string | null
          employee_id?: string | null
          hours_worked?: number | null
          overtime_hours?: number | null
          unit_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      attendance_bulk_updates: {
        Row: {
          affected_records: number
          batch_id: string
          created_at: string | null
          id: string
          reason: string
          user_id: string | null
        }
        Insert: {
          affected_records?: number
          batch_id?: string
          created_at?: string | null
          id?: string
          reason: string
          user_id?: string | null
        }
        Update: {
          affected_records?: number
          batch_id?: string
          created_at?: string | null
          id?: string
          reason?: string
          user_id?: string | null
        }
        Relationships: []
      }
      audit_gaps: {
        Row: {
          audit_requirement_id: number | null
          created_at: string | null
          gap_status: string | null
          id: string
          notes: string | null
          organisation_id: string | null
        }
        Insert: {
          audit_requirement_id?: number | null
          created_at?: string | null
          gap_status?: string | null
          id?: string
          notes?: string | null
          organisation_id?: string | null
        }
        Update: {
          audit_requirement_id?: number | null
          created_at?: string | null
          gap_status?: string | null
          id?: string
          notes?: string | null
          organisation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_gaps_audit_requirement_id_fkey"
            columns: ["audit_requirement_id"]
            isOneToOne: false
            referencedRelation: "audit_requirements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_gaps_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_requirements: {
        Row: {
          confidence: number | null
          covered: string | null
          framework_id: number | null
          id: number
          mandatory: boolean | null
          method: string | null
          point_num: string | null
          title: string
        }
        Insert: {
          confidence?: number | null
          covered?: string | null
          framework_id?: number | null
          id?: number
          mandatory?: boolean | null
          method?: string | null
          point_num?: string | null
          title: string
        }
        Update: {
          confidence?: number | null
          covered?: string | null
          framework_id?: number | null
          id?: number
          mandatory?: boolean | null
          method?: string | null
          point_num?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_requirements_framework_id_fkey"
            columns: ["framework_id"]
            isOneToOne: false
            referencedRelation: "frameworks"
            referencedColumns: ["id"]
          },
        ]
      }
      bill_of_materials: {
        Row: {
          created_at: string | null
          fg_item_code: string
          id: string
          quantity_required: number
          rm_item_code: string
          specifications: Json | null
          unit_of_measure: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          fg_item_code: string
          id?: string
          quantity_required?: number
          rm_item_code: string
          specifications?: Json | null
          unit_of_measure?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          fg_item_code?: string
          id?: string
          quantity_required?: number
          rm_item_code?: string
          specifications?: Json | null
          unit_of_measure?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author: string
          category: string
          content: string
          created_at: string
          excerpt: string | null
          featured_image_url: string | null
          id: string
          published: boolean
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author?: string
          category: string
          content: string
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          published?: boolean
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author?: string
          category?: string
          content?: string
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          published?: boolean
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      bulk_payroll_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          error_details: Json | null
          failed_employees: number | null
          id: string
          month: string
          processed_employees: number | null
          started_at: string | null
          status: string | null
          total_employees: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          error_details?: Json | null
          failed_employees?: number | null
          id?: string
          month: string
          processed_employees?: number | null
          started_at?: string | null
          status?: string | null
          total_employees?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          error_details?: Json | null
          failed_employees?: number | null
          id?: string
          month?: string
          processed_employees?: number | null
          started_at?: string | null
          status?: string | null
          total_employees?: number | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          category_name: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          updated_at: string | null
        }
        Insert: {
          category_name: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Update: {
          category_name?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      colour_targets: {
        Row: {
          created_at: string | null
          customer: string | null
          delta_e_threshold: number | null
          id: string
          job_code: string | null
          lab_a: number | null
          lab_b: number | null
          lab_l: number | null
          organisation_id: string | null
        }
        Insert: {
          created_at?: string | null
          customer?: string | null
          delta_e_threshold?: number | null
          id?: string
          job_code?: string | null
          lab_a?: number | null
          lab_b?: number | null
          lab_l?: number | null
          organisation_id?: string | null
        }
        Update: {
          created_at?: string | null
          customer?: string | null
          delta_e_threshold?: number | null
          id?: string
          job_code?: string | null
          lab_a?: number | null
          lab_b?: number | null
          lab_l?: number | null
          organisation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "colour_targets_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
        }
        Relationships: []
      }
      cost_mockup_estimate: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          coating_cost: number | null
          competitive_analysis: Json | null
          cost_breakdown: Json | null
          created_at: string | null
          currency: string | null
          customer_budget: number | null
          estimate_type: string
          estimated_at: string | null
          estimated_by: string | null
          id: string
          labor_cost: number | null
          lamination_cost: number | null
          material_cost: number | null
          mockup_cost: number | null
          mockup_delivery_days: number | null
          mockup_required: boolean | null
          mockup_status: string | null
          negotiation_notes: string | null
          overhead_cost: number | null
          packaging_cost: number | null
          printing_cost: number | null
          profit_margin_percentage: number | null
          selling_price: number | null
          setup_cost: number | null
          slitting_cost: number | null
          status: Database["public"]["Enums"]["process_status"] | null
          tooling_cost: number | null
          total_cost: number | null
          uiorn: string
          updated_at: string | null
          validity_days: number | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          coating_cost?: number | null
          competitive_analysis?: Json | null
          cost_breakdown?: Json | null
          created_at?: string | null
          currency?: string | null
          customer_budget?: number | null
          estimate_type?: string
          estimated_at?: string | null
          estimated_by?: string | null
          id?: string
          labor_cost?: number | null
          lamination_cost?: number | null
          material_cost?: number | null
          mockup_cost?: number | null
          mockup_delivery_days?: number | null
          mockup_required?: boolean | null
          mockup_status?: string | null
          negotiation_notes?: string | null
          overhead_cost?: number | null
          packaging_cost?: number | null
          printing_cost?: number | null
          profit_margin_percentage?: number | null
          selling_price?: number | null
          setup_cost?: number | null
          slitting_cost?: number | null
          status?: Database["public"]["Enums"]["process_status"] | null
          tooling_cost?: number | null
          total_cost?: number | null
          uiorn: string
          updated_at?: string | null
          validity_days?: number | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          coating_cost?: number | null
          competitive_analysis?: Json | null
          cost_breakdown?: Json | null
          created_at?: string | null
          currency?: string | null
          customer_budget?: number | null
          estimate_type?: string
          estimated_at?: string | null
          estimated_by?: string | null
          id?: string
          labor_cost?: number | null
          lamination_cost?: number | null
          material_cost?: number | null
          mockup_cost?: number | null
          mockup_delivery_days?: number | null
          mockup_required?: boolean | null
          mockup_status?: string | null
          negotiation_notes?: string | null
          overhead_cost?: number | null
          packaging_cost?: number | null
          printing_cost?: number | null
          profit_margin_percentage?: number | null
          selling_price?: number | null
          setup_cost?: number | null
          slitting_cost?: number | null
          status?: Database["public"]["Enums"]["process_status"] | null
          tooling_cost?: number | null
          total_cost?: number | null
          uiorn?: string
          updated_at?: string | null
          validity_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cost_mockup_estimate_uiorn_fkey"
            columns: ["uiorn"]
            isOneToOne: false
            referencedRelation: "order_punching"
            referencedColumns: ["uiorn"]
          },
        ]
      }
      csv_upload_log: {
        Row: {
          created_at: string
          error_details: Json | null
          failed_rows: number
          file_name: string
          id: string
          successful_rows: number
          total_rows: number
          updated_at: string
          upload_date: string
          upload_type: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          error_details?: Json | null
          failed_rows?: number
          file_name: string
          id?: string
          successful_rows?: number
          total_rows?: number
          updated_at?: string
          upload_date?: string
          upload_type: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          error_details?: Json | null
          failed_rows?: number
          file_name?: string
          id?: string
          successful_rows?: number
          total_rows?: number
          updated_at?: string
          upload_date?: string
          upload_type?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      daily_stock_snapshots: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          record_count: number
          snapshot_data: Json
          snapshot_date: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          record_count?: number
          snapshot_data: Json
          snapshot_date?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          record_count?: number
          snapshot_data?: Json
          snapshot_date?: string
        }
        Relationships: []
      }
      daily_stock_summary: {
        Row: {
          closing_qty: number | null
          created_at: string | null
          id: string
          issued_qty: number | null
          item_code: string
          opening_qty: number | null
          received_qty: number | null
          summary_date: string | null
        }
        Insert: {
          closing_qty?: number | null
          created_at?: string | null
          id?: string
          issued_qty?: number | null
          item_code: string
          opening_qty?: number | null
          received_qty?: number | null
          summary_date?: string | null
        }
        Update: {
          closing_qty?: number | null
          created_at?: string | null
          id?: string
          issued_qty?: number | null
          item_code?: string
          opening_qty?: number | null
          received_qty?: number | null
          summary_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_stock_summary_item_code_fkey"
            columns: ["item_code"]
            isOneToOne: false
            referencedRelation: "item_master"
            referencedColumns: ["item_code"]
          },
          {
            foreignKeyName: "daily_stock_summary_item_code_fkey"
            columns: ["item_code"]
            isOneToOne: false
            referencedRelation: "stock_summary"
            referencedColumns: ["item_code"]
          },
        ]
      }
      deck_viscosity_readings: {
        Row: {
          captured_at: string
          captured_by: string | null
          deck_id: string
          id: string
          job_id: string | null
          viscosity_cps: number
        }
        Insert: {
          captured_at?: string
          captured_by?: string | null
          deck_id: string
          id?: string
          job_id?: string | null
          viscosity_cps: number
        }
        Update: {
          captured_at?: string
          captured_by?: string | null
          deck_id?: string
          id?: string
          job_id?: string | null
          viscosity_cps?: number
        }
        Relationships: [
          {
            foreignKeyName: "deck_viscosity_readings_captured_by_fkey"
            columns: ["captured_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deck_viscosity_readings_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "press_decks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deck_viscosity_readings_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      document_requirements: {
        Row: {
          document_id: string
          mapped_on: string | null
          requirement_id: number
        }
        Insert: {
          document_id: string
          mapped_on?: string | null
          requirement_id: number
        }
        Update: {
          document_id?: string
          mapped_on?: string | null
          requirement_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_requirements_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_requirements_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "audit_requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      document_smeta_map: {
        Row: {
          document_id: string
          smeta_point_id: number
        }
        Insert: {
          document_id: string
          smeta_point_id: number
        }
        Update: {
          document_id?: string
          smeta_point_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_smeta_map_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_smeta_map_smeta_point_id_fkey"
            columns: ["smeta_point_id"]
            isOneToOne: false
            referencedRelation: "smeta_points"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string | null
          doc_number: string | null
          drive_id: string | null
          file_url: string | null
          framework_id: number | null
          id: string
          issue_date: string | null
          next_review: string | null
          organisation_id: string | null
          parsed_on: string | null
          raw_meta: Json | null
          status: string | null
          title: string
          uploaded_by: string | null
          version: string | null
        }
        Insert: {
          created_at?: string | null
          doc_number?: string | null
          drive_id?: string | null
          file_url?: string | null
          framework_id?: number | null
          id?: string
          issue_date?: string | null
          next_review?: string | null
          organisation_id?: string | null
          parsed_on?: string | null
          raw_meta?: Json | null
          status?: string | null
          title: string
          uploaded_by?: string | null
          version?: string | null
        }
        Update: {
          created_at?: string | null
          doc_number?: string | null
          drive_id?: string | null
          file_url?: string | null
          framework_id?: number | null
          id?: string
          issue_date?: string | null
          next_review?: string | null
          organisation_id?: string | null
          parsed_on?: string | null
          raw_meta?: Json | null
          status?: string | null
          title?: string
          uploaded_by?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_framework_id_fkey"
            columns: ["framework_id"]
            isOneToOne: false
            referencedRelation: "frameworks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      email_queue: {
        Row: {
          attachment_name: string | null
          attempts: number | null
          created_at: string | null
          error_message: string | null
          html_content: string
          id: string
          max_attempts: number | null
          pdf_attachment: string | null
          scheduled_for: string | null
          sent_at: string | null
          status: string | null
          subject: string
          to_email: string
        }
        Insert: {
          attachment_name?: string | null
          attempts?: number | null
          created_at?: string | null
          error_message?: string | null
          html_content: string
          id?: string
          max_attempts?: number | null
          pdf_attachment?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string | null
          subject: string
          to_email: string
        }
        Update: {
          attachment_name?: string | null
          attempts?: number | null
          created_at?: string | null
          error_message?: string | null
          html_content?: string
          id?: string
          max_attempts?: number | null
          pdf_attachment?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string
          to_email?: string
        }
        Relationships: []
      }
      employee_code_sequences: {
        Row: {
          created_at: string | null
          id: string
          last_sequence: number
          unit_code: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_sequence?: number
          unit_code: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_sequence?: number
          unit_code?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      employee_leave_balances: {
        Row: {
          casual_leave_balance: number
          earned_leave_balance: number
          employee_id: string
          id: string
          year: number
        }
        Insert: {
          casual_leave_balance?: number
          earned_leave_balance?: number
          employee_id: string
          id?: string
          year?: number
        }
        Update: {
          casual_leave_balance?: number
          earned_leave_balance?: number
          employee_id?: string
          id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "employee_leave_balances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_details_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_leave_balances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "panchkula_payroll_calculation"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "employee_leave_balances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "payroll_calculation_enhanced"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "employee_leave_balances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "payroll_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_variable_overrides: {
        Row: {
          created_at: string | null
          effective_from: string
          effective_to: string | null
          employee_id: string | null
          id: string
          override_value: number
          variable_id: string | null
        }
        Insert: {
          created_at?: string | null
          effective_from?: string
          effective_to?: string | null
          employee_id?: string | null
          id?: string
          override_value: number
          variable_id?: string | null
        }
        Update: {
          created_at?: string | null
          effective_from?: string
          effective_to?: string | null
          employee_id?: string | null
          id?: string
          override_value?: number
          variable_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_variable_overrides_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_details_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_variable_overrides_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "panchkula_payroll_calculation"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "employee_variable_overrides_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "payroll_calculation_enhanced"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "employee_variable_overrides_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "payroll_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_variable_overrides_variable_id_fkey"
            columns: ["variable_id"]
            isOneToOne: false
            referencedRelation: "formula_variables"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          aadhaar_number: string | null
          basic_salary: number | null
          created_at: string | null
          ctc: number | null
          date_of_birth: string | null
          date_of_joining: string | null
          email: string | null
          employee_id: string
          employee_name: string | null
          leaves_left: number | null
          leaves_used: number | null
          others: number | null
          pan_number: string | null
          updated_at: string | null
        }
        Insert: {
          aadhaar_number?: string | null
          basic_salary?: number | null
          created_at?: string | null
          ctc?: number | null
          date_of_birth?: string | null
          date_of_joining?: string | null
          email?: string | null
          employee_id: string
          employee_name?: string | null
          leaves_left?: number | null
          leaves_used?: number | null
          others?: number | null
          pan_number?: string | null
          updated_at?: string | null
        }
        Update: {
          aadhaar_number?: string | null
          basic_salary?: number | null
          created_at?: string | null
          ctc?: number | null
          date_of_birth?: string | null
          date_of_joining?: string | null
          email?: string | null
          employee_id?: string
          employee_name?: string | null
          leaves_left?: number | null
          leaves_used?: number | null
          others?: number | null
          pan_number?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          age: number
          course_selected: string
          created_at: string
          email: string
          id: string
          parent_name: string
          phone: string | null
          student_name: string
        }
        Insert: {
          age: number
          course_selected: string
          created_at?: string
          email: string
          id?: string
          parent_name: string
          phone?: string | null
          student_name: string
        }
        Update: {
          age?: number
          course_selected?: string
          created_at?: string
          email?: string
          id?: string
          parent_name?: string
          phone?: string | null
          student_name?: string
        }
        Relationships: []
      }
      experiences: {
        Row: {
          created_at: string
          details: string | null
          from_year: number
          id: string
          institution: string
          role: string
          to_year: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          from_year: number
          id?: string
          institution: string
          role: string
          to_year?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          from_year?: number
          id?: string
          institution?: string
          role?: string
          to_year?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      financial_document_links: {
        Row: {
          created_at: string
          date_added: string
          display_order: number
          document_type: string
          dropbox_url: string
          fiscal_year: string
          id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_added?: string
          display_order?: number
          document_type: string
          dropbox_url: string
          fiscal_year: string
          id?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_added?: string
          display_order?: number
          document_type?: string
          dropbox_url?: string
          fiscal_year?: string
          id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      financial_kpis: {
        Row: {
          created_at: string
          id: string
          last_updated: string
          metric_name: string
          percentage: number | null
          period: string
          ticker: string
          value: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          last_updated?: string
          metric_name: string
          percentage?: number | null
          period: string
          ticker?: string
          value?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          last_updated?: string
          metric_name?: string
          percentage?: number | null
          period?: string
          ticker?: string
          value?: number | null
        }
        Relationships: []
      }
      financial_page_config: {
        Row: {
          config_key: string
          config_value: Json
          created_at: string
          id: string
          is_active: boolean
          section_type: string
          updated_at: string
        }
        Insert: {
          config_key: string
          config_value: Json
          created_at?: string
          id?: string
          is_active?: boolean
          section_type: string
          updated_at?: string
        }
        Update: {
          config_key?: string
          config_value?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          section_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      formula_variables: {
        Row: {
          active: boolean | null
          calculation_expression: string | null
          created_at: string | null
          default_value: number | null
          description: string | null
          display_name: string
          id: string
          name: string
          updated_at: string | null
          variable_type: Database["public"]["Enums"]["variable_type"]
        }
        Insert: {
          active?: boolean | null
          calculation_expression?: string | null
          created_at?: string | null
          default_value?: number | null
          description?: string | null
          display_name: string
          id?: string
          name: string
          updated_at?: string | null
          variable_type: Database["public"]["Enums"]["variable_type"]
        }
        Update: {
          active?: boolean | null
          calculation_expression?: string | null
          created_at?: string | null
          default_value?: number | null
          description?: string | null
          display_name?: string
          id?: string
          name?: string
          updated_at?: string | null
          variable_type?: Database["public"]["Enums"]["variable_type"]
        }
        Relationships: []
      }
      frameworks: {
        Row: {
          code: string
          id: number
          name: string
        }
        Insert: {
          code: string
          id?: number
          name: string
        }
        Update: {
          code?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      gravure_printing: {
        Row: {
          actual_quantity: number | null
          color_count: number | null
          completed_at: string | null
          created_at: string | null
          cylinder_number: string | null
          id: string
          ink_colors: Json | null
          ink_consumption: number | null
          operator_id: string | null
          print_length: number | null
          printing_parameters: Json | null
          printing_speed: number | null
          quality_checks: Json | null
          started_at: string | null
          status: Database["public"]["Enums"]["process_status"] | null
          substrate_width: number | null
          supervisor_id: string | null
          uiorn: string
          updated_at: string | null
          waste_percentage: number | null
        }
        Insert: {
          actual_quantity?: number | null
          color_count?: number | null
          completed_at?: string | null
          created_at?: string | null
          cylinder_number?: string | null
          id?: string
          ink_colors?: Json | null
          ink_consumption?: number | null
          operator_id?: string | null
          print_length?: number | null
          printing_parameters?: Json | null
          printing_speed?: number | null
          quality_checks?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["process_status"] | null
          substrate_width?: number | null
          supervisor_id?: string | null
          uiorn: string
          updated_at?: string | null
          waste_percentage?: number | null
        }
        Update: {
          actual_quantity?: number | null
          color_count?: number | null
          completed_at?: string | null
          created_at?: string | null
          cylinder_number?: string | null
          id?: string
          ink_colors?: Json | null
          ink_consumption?: number | null
          operator_id?: string | null
          print_length?: number | null
          printing_parameters?: Json | null
          printing_speed?: number | null
          quality_checks?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["process_status"] | null
          substrate_width?: number | null
          supervisor_id?: string | null
          uiorn?: string
          updated_at?: string | null
          waste_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gravure_printing_uiorn_fkey"
            columns: ["uiorn"]
            isOneToOne: false
            referencedRelation: "order_punching"
            referencedColumns: ["uiorn"]
          },
        ]
      }
      grn_log: {
        Row: {
          created_at: string | null
          grn_date: string | null
          grn_number: string
          id: string
          item_code: string
          qty_received: number
          remarks: string | null
          supplier: string | null
          total_value: number | null
          unit_price: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          grn_date?: string | null
          grn_number: string
          id?: string
          item_code: string
          qty_received: number
          remarks?: string | null
          supplier?: string | null
          total_value?: number | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          grn_date?: string | null
          grn_number?: string
          id?: string
          item_code?: string
          qty_received?: number
          remarks?: string | null
          supplier?: string | null
          total_value?: number | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grn_log_item_code_fkey"
            columns: ["item_code"]
            isOneToOne: false
            referencedRelation: "item_master"
            referencedColumns: ["item_code"]
          },
          {
            foreignKeyName: "grn_log_item_code_fkey"
            columns: ["item_code"]
            isOneToOne: false
            referencedRelation: "stock_summary"
            referencedColumns: ["item_code"]
          },
        ]
      }
      investor_document_links: {
        Row: {
          created_at: string
          date_added: string
          display_order: number
          document_category: string
          dropbox_url: string
          fiscal_year: string
          id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_added?: string
          display_order?: number
          document_category: string
          dropbox_url: string
          fiscal_year: string
          id?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_added?: string
          display_order?: number
          document_category?: string
          dropbox_url?: string
          fiscal_year?: string
          id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      investor_page_config: {
        Row: {
          config_key: string
          config_value: Json
          created_at: string
          id: string
          is_active: boolean
          page_type: string
          section_type: string
          updated_at: string
        }
        Insert: {
          config_key: string
          config_value: Json
          created_at?: string
          id?: string
          is_active?: boolean
          page_type: string
          section_type: string
          updated_at?: string
        }
        Update: {
          config_key?: string
          config_value?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          page_type?: string
          section_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      issue_log: {
        Row: {
          created_at: string | null
          id: string
          issue_date: string | null
          issue_number: string
          issued_to: string | null
          item_code: string
          purpose: string | null
          qty_issued: number
          remarks: string | null
          total_cost: number | null
          unit_cost: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          issue_date?: string | null
          issue_number: string
          issued_to?: string | null
          item_code: string
          purpose?: string | null
          qty_issued: number
          remarks?: string | null
          total_cost?: number | null
          unit_cost?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          issue_date?: string | null
          issue_number?: string
          issued_to?: string | null
          item_code?: string
          purpose?: string | null
          qty_issued?: number
          remarks?: string | null
          total_cost?: number | null
          unit_cost?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "issue_log_item_code_fkey"
            columns: ["item_code"]
            isOneToOne: false
            referencedRelation: "item_master"
            referencedColumns: ["item_code"]
          },
          {
            foreignKeyName: "issue_log_item_code_fkey"
            columns: ["item_code"]
            isOneToOne: false
            referencedRelation: "stock_summary"
            referencedColumns: ["item_code"]
          },
        ]
      }
      item_code_history: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          id: string
          item_master_id: string
          new_item_code: string
          old_item_code: string
          reason: string | null
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          item_master_id: string
          new_item_code: string
          old_item_code: string
          reason?: string | null
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          item_master_id?: string
          new_item_code?: string
          old_item_code?: string
          reason?: string | null
        }
        Relationships: []
      }
      item_master: {
        Row: {
          category_id: string | null
          created_at: string | null
          customer_name: string | null
          dimensions: string | null
          file_hyperlink: string | null
          file_id: string | null
          gsm: number | null
          id: string
          is_active: boolean | null
          item_code: string
          item_name: string
          no_of_colours: string | null
          qualifier: string | null
          size_mm: string | null
          specifications: Json | null
          status: string | null
          uom: string | null
          updated_at: string | null
          usage_type: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          customer_name?: string | null
          dimensions?: string | null
          file_hyperlink?: string | null
          file_id?: string | null
          gsm?: number | null
          id?: string
          is_active?: boolean | null
          item_code: string
          item_name: string
          no_of_colours?: string | null
          qualifier?: string | null
          size_mm?: string | null
          specifications?: Json | null
          status?: string | null
          uom?: string | null
          updated_at?: string | null
          usage_type?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          customer_name?: string | null
          dimensions?: string | null
          file_hyperlink?: string | null
          file_id?: string | null
          gsm?: number | null
          id?: string
          is_active?: boolean | null
          item_code?: string
          item_name?: string
          no_of_colours?: string | null
          qualifier?: string | null
          size_mm?: string | null
          specifications?: Json | null
          status?: string | null
          uom?: string | null
          updated_at?: string | null
          usage_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "item_master_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_master_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "stock_summary"
            referencedColumns: ["category_id"]
          },
        ]
      }
      jobs: {
        Row: {
          colour_target_id: string | null
          id: string
          job_ref: string | null
          organisation_id: string | null
          press_id: string | null
          scheduled_at: string | null
          status: string | null
        }
        Insert: {
          colour_target_id?: string | null
          id?: string
          job_ref?: string | null
          organisation_id?: string | null
          press_id?: string | null
          scheduled_at?: string | null
          status?: string | null
        }
        Update: {
          colour_target_id?: string | null
          id?: string
          job_ref?: string | null
          organisation_id?: string | null
          press_id?: string | null
          scheduled_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_colour_target_id_fkey"
            columns: ["colour_target_id"]
            isOneToOne: false
            referencedRelation: "colour_targets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_press_id_fkey"
            columns: ["press_id"]
            isOneToOne: false
            referencedRelation: "presses"
            referencedColumns: ["id"]
          },
        ]
      }
      lamination: {
        Row: {
          adhesive_coating_weight: number | null
          adhesive_type: string | null
          bond_strength: number | null
          completed_at: string | null
          created_at: string | null
          gsm_substrate_1: number | null
          gsm_substrate_2: number | null
          id: string
          lamination_speed: number | null
          lamination_type: string
          operator_id: string | null
          peel_strength: number | null
          pressure: number | null
          quality_approved_by: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["process_status"] | null
          substrate_1: string
          substrate_2: string | null
          temperature: number | null
          uiorn: string
          updated_at: string | null
        }
        Insert: {
          adhesive_coating_weight?: number | null
          adhesive_type?: string | null
          bond_strength?: number | null
          completed_at?: string | null
          created_at?: string | null
          gsm_substrate_1?: number | null
          gsm_substrate_2?: number | null
          id?: string
          lamination_speed?: number | null
          lamination_type: string
          operator_id?: string | null
          peel_strength?: number | null
          pressure?: number | null
          quality_approved_by?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["process_status"] | null
          substrate_1: string
          substrate_2?: string | null
          temperature?: number | null
          uiorn: string
          updated_at?: string | null
        }
        Update: {
          adhesive_coating_weight?: number | null
          adhesive_type?: string | null
          bond_strength?: number | null
          completed_at?: string | null
          created_at?: string | null
          gsm_substrate_1?: number | null
          gsm_substrate_2?: number | null
          id?: string
          lamination_speed?: number | null
          lamination_type?: string
          operator_id?: string | null
          peel_strength?: number | null
          pressure?: number | null
          quality_approved_by?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["process_status"] | null
          substrate_1?: string
          substrate_2?: string | null
          temperature?: number | null
          uiorn?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lamination_uiorn_fkey"
            columns: ["uiorn"]
            isOneToOne: false
            referencedRelation: "order_punching"
            referencedColumns: ["uiorn"]
          },
        ]
      }
      leave_applications: {
        Row: {
          applied_by: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          employee_id: string
          end_date: string
          id: string
          leave_type: string
          reason: string | null
          remarks: string | null
          start_date: string
          status: string
          total_days: number
          unit_id: string | null
          updated_at: string | null
        }
        Insert: {
          applied_by?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          employee_id: string
          end_date: string
          id?: string
          leave_type: string
          reason?: string | null
          remarks?: string | null
          start_date: string
          status?: string
          total_days: number
          unit_id?: string | null
          updated_at?: string | null
        }
        Update: {
          applied_by?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          employee_id?: string
          end_date?: string
          id?: string
          leave_type?: string
          reason?: string | null
          remarks?: string | null
          start_date?: string
          status?: string
          total_days?: number
          unit_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leave_applications_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_details_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_applications_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "panchkula_payroll_calculation"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "leave_applications_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "payroll_calculation_enhanced"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "leave_applications_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "payroll_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_applications_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["unit_id"]
          },
        ]
      }
      leave_balance_history: {
        Row: {
          attendance_date: string
          balance_after: number
          balance_before: number
          created_at: string | null
          created_by: string | null
          days_used: number
          employee_id: string
          id: string
          leave_type: string
        }
        Insert: {
          attendance_date: string
          balance_after?: number
          balance_before?: number
          created_at?: string | null
          created_by?: string | null
          days_used?: number
          employee_id: string
          id?: string
          leave_type: string
        }
        Update: {
          attendance_date?: string
          balance_after?: number
          balance_before?: number
          created_at?: string | null
          created_by?: string | null
          days_used?: number
          employee_id?: string
          id?: string
          leave_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_balance_history_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_details_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_balance_history_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "panchkula_payroll_calculation"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "leave_balance_history_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "payroll_calculation_enhanced"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "leave_balance_history_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "payroll_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          employee_id: string | null
          end_date: string | null
          id: string
          num_days: number | null
          reason: string | null
          requested_at: string | null
          start_date: string | null
          status: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          employee_id?: string | null
          end_date?: string | null
          id?: string
          num_days?: number | null
          reason?: string | null
          requested_at?: string | null
          start_date?: string | null
          status?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          employee_id?: string | null
          end_date?: string | null
          id?: string
          num_days?: number | null
          reason?: string | null
          requested_at?: string | null
          start_date?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["employee_id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string | null
          city: string | null
          code: string
          country: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          postal_code: string | null
          state: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          code: string
          country?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          postal_code?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string
          country?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          postal_code?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      machines: {
        Row: {
          capacity_per_hour: number | null
          created_at: string | null
          current_order_uiorn: string | null
          id: string
          last_maintenance: string | null
          location: string | null
          machine_id: string
          machine_name: string
          machine_type: string
          next_maintenance: string | null
          operator_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          capacity_per_hour?: number | null
          created_at?: string | null
          current_order_uiorn?: string | null
          id?: string
          last_maintenance?: string | null
          location?: string | null
          machine_id: string
          machine_name: string
          machine_type: string
          next_maintenance?: string | null
          operator_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          capacity_per_hour?: number | null
          created_at?: string | null
          current_order_uiorn?: string | null
          id?: string
          last_maintenance?: string | null
          location?: string | null
          machine_id?: string
          machine_name?: string
          machine_type?: string
          next_maintenance?: string | null
          operator_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      master_data_artworks_dkpkl: {
        Row: {
          customer_name: string | null
          dimensions: string | null
          file_hyperlink: string | null
          file_id: string | null
          item_code: string
          item_name: string | null
          no_of_colours: string | null
        }
        Insert: {
          customer_name?: string | null
          dimensions?: string | null
          file_hyperlink?: string | null
          file_id?: string | null
          item_code: string
          item_name?: string | null
          no_of_colours?: string | null
        }
        Update: {
          customer_name?: string | null
          dimensions?: string | null
          file_hyperlink?: string | null
          file_id?: string | null
          item_code?: string
          item_name?: string | null
          no_of_colours?: string | null
        }
        Relationships: []
      }
      master_data_artworks_dkpkl_bak: {
        Row: {
          Customer_Name: string | null
          Dimensions: string | null
          file_hyperlink: string | null
          file_id: string | null
          Item_Code: string | null
          Item_Name: string | null
          No_of_Colours: string | null
        }
        Insert: {
          Customer_Name?: string | null
          Dimensions?: string | null
          file_hyperlink?: string | null
          file_id?: string | null
          Item_Code?: string | null
          Item_Name?: string | null
          No_of_Colours?: string | null
        }
        Update: {
          Customer_Name?: string | null
          Dimensions?: string | null
          file_hyperlink?: string | null
          file_id?: string | null
          Item_Code?: string | null
          Item_Name?: string | null
          No_of_Colours?: string | null
        }
        Relationships: []
      }
      master_data_artworks_dkpkl_cylinder_name: {
        Row: {
          colour: string | null
          created_at: string
          customer_name: string | null
          cylinder_code: string
          item_code: string
          last_run: string | null
          location: string | null
          manufacturer: string | null
          mileage_m: number | null
          remarks: string | null
          type: string | null
        }
        Insert: {
          colour?: string | null
          created_at?: string
          customer_name?: string | null
          cylinder_code: string
          item_code: string
          last_run?: string | null
          location?: string | null
          manufacturer?: string | null
          mileage_m?: number | null
          remarks?: string | null
          type?: string | null
        }
        Update: {
          colour?: string | null
          created_at?: string
          customer_name?: string | null
          cylinder_code?: string
          item_code?: string
          last_run?: string | null
          location?: string | null
          manufacturer?: string | null
          mileage_m?: number | null
          remarks?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_cylinder_item_code"
            columns: ["item_code"]
            isOneToOne: false
            referencedRelation: "master_data_artworks_dkpkl"
            referencedColumns: ["item_code"]
          },
        ]
      }
      master_data_artworks_se: {
        Row: {
          circum: number | null
          coil_size: string | null
          customer_name: string | null
          cut_length: string | null
          cyl_qty: string | null
          dimensions: string | null
          file_hyperlink: string | null
          file_id: string | null
          item_code: string
          item_name: string | null
          last_run: string | null
          length: string | null
          location: string | null
          mielage_m: string | null
          no_of_colours: string | null
          qr_code: string | null
          remarks: string | null
          total_runs: string | null
          ups: number | null
        }
        Insert: {
          circum?: number | null
          coil_size?: string | null
          customer_name?: string | null
          cut_length?: string | null
          cyl_qty?: string | null
          dimensions?: string | null
          file_hyperlink?: string | null
          file_id?: string | null
          item_code: string
          item_name?: string | null
          last_run?: string | null
          length?: string | null
          location?: string | null
          mielage_m?: string | null
          no_of_colours?: string | null
          qr_code?: string | null
          remarks?: string | null
          total_runs?: string | null
          ups?: number | null
        }
        Update: {
          circum?: number | null
          coil_size?: string | null
          customer_name?: string | null
          cut_length?: string | null
          cyl_qty?: string | null
          dimensions?: string | null
          file_hyperlink?: string | null
          file_id?: string | null
          item_code?: string
          item_name?: string | null
          last_run?: string | null
          length?: string | null
          location?: string | null
          mielage_m?: string | null
          no_of_colours?: string | null
          qr_code?: string | null
          remarks?: string | null
          total_runs?: string | null
          ups?: number | null
        }
        Relationships: []
      }
      master_data_artworks_se_bak: {
        Row: {
          Customer_Name: string | null
          Dimensions: string | null
          file_hyperlink: string | null
          file_id: string | null
          Item_Code: string | null
          Item_Name: string | null
          No_of_Colours: string | null
        }
        Insert: {
          Customer_Name?: string | null
          Dimensions?: string | null
          file_hyperlink?: string | null
          file_id?: string | null
          Item_Code?: string | null
          Item_Name?: string | null
          No_of_Colours?: string | null
        }
        Update: {
          Customer_Name?: string | null
          Dimensions?: string | null
          file_hyperlink?: string | null
          file_id?: string | null
          Item_Code?: string | null
          Item_Name?: string | null
          No_of_Colours?: string | null
        }
        Relationships: []
      }
      material_consumption: {
        Row: {
          consumption_date: string | null
          cost_per_unit: number | null
          id: string
          material_type: string
          operator_id: string | null
          quantity_consumed: number | null
          stage: string
          total_cost: number | null
          uiorn: string
          unit: string | null
          waste_quantity: number | null
        }
        Insert: {
          consumption_date?: string | null
          cost_per_unit?: number | null
          id?: string
          material_type: string
          operator_id?: string | null
          quantity_consumed?: number | null
          stage: string
          total_cost?: number | null
          uiorn: string
          unit?: string | null
          waste_quantity?: number | null
        }
        Update: {
          consumption_date?: string | null
          cost_per_unit?: number | null
          id?: string
          material_type?: string
          operator_id?: string | null
          quantity_consumed?: number | null
          stage?: string
          total_cost?: number | null
          uiorn?: string
          unit?: string | null
          waste_quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "material_consumption_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_consumption_uiorn_fkey"
            columns: ["uiorn"]
            isOneToOne: false
            referencedRelation: "order_punching"
            referencedColumns: ["uiorn"]
          },
        ]
      }
      material_selection: {
        Row: {
          alternative_materials: Json | null
          approved_at: string | null
          approved_by: string | null
          barrier_properties: Json | null
          cost_per_kg: number | null
          created_at: string | null
          elongation_percentage: number | null
          food_grade_certified: boolean | null
          gsm: number | null
          id: string
          lead_time_days: number | null
          length_meters: number | null
          material_code: string | null
          material_grade: string
          material_type: Database["public"]["Enums"]["material_type"]
          minimum_order_quantity: number | null
          selected_at: string | null
          selected_by: string | null
          selection_criteria: string | null
          status: Database["public"]["Enums"]["process_status"] | null
          supplier_name: string | null
          sustainability_rating: string | null
          tensile_strength: number | null
          thickness_microns: number | null
          uiorn: string
          updated_at: string | null
          width_mm: number | null
        }
        Insert: {
          alternative_materials?: Json | null
          approved_at?: string | null
          approved_by?: string | null
          barrier_properties?: Json | null
          cost_per_kg?: number | null
          created_at?: string | null
          elongation_percentage?: number | null
          food_grade_certified?: boolean | null
          gsm?: number | null
          id?: string
          lead_time_days?: number | null
          length_meters?: number | null
          material_code?: string | null
          material_grade: string
          material_type: Database["public"]["Enums"]["material_type"]
          minimum_order_quantity?: number | null
          selected_at?: string | null
          selected_by?: string | null
          selection_criteria?: string | null
          status?: Database["public"]["Enums"]["process_status"] | null
          supplier_name?: string | null
          sustainability_rating?: string | null
          tensile_strength?: number | null
          thickness_microns?: number | null
          uiorn: string
          updated_at?: string | null
          width_mm?: number | null
        }
        Update: {
          alternative_materials?: Json | null
          approved_at?: string | null
          approved_by?: string | null
          barrier_properties?: Json | null
          cost_per_kg?: number | null
          created_at?: string | null
          elongation_percentage?: number | null
          food_grade_certified?: boolean | null
          gsm?: number | null
          id?: string
          lead_time_days?: number | null
          length_meters?: number | null
          material_code?: string | null
          material_grade?: string
          material_type?: Database["public"]["Enums"]["material_type"]
          minimum_order_quantity?: number | null
          selected_at?: string | null
          selected_by?: string | null
          selection_criteria?: string | null
          status?: Database["public"]["Enums"]["process_status"] | null
          supplier_name?: string | null
          sustainability_rating?: string | null
          tensile_strength?: number | null
          thickness_microns?: number | null
          uiorn?: string
          updated_at?: string | null
          width_mm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "material_selection_uiorn_fkey"
            columns: ["uiorn"]
            isOneToOne: false
            referencedRelation: "order_punching"
            referencedColumns: ["uiorn"]
          },
        ]
      }
      media: {
        Row: {
          album_id: string | null
          artist_id: string | null
          created_at: string | null
          duration: number | null
          file_size: number | null
          height: number | null
          id: string
          media_type: Database["public"]["Enums"]["media_type"]
          path: string
          title: string | null
          track_no: number | null
          updated_at: string | null
          width: number | null
        }
        Insert: {
          album_id?: string | null
          artist_id?: string | null
          created_at?: string | null
          duration?: number | null
          file_size?: number | null
          height?: number | null
          id?: string
          media_type?: Database["public"]["Enums"]["media_type"]
          path: string
          title?: string | null
          track_no?: number | null
          updated_at?: string | null
          width?: number | null
        }
        Update: {
          album_id?: string | null
          artist_id?: string | null
          created_at?: string | null
          duration?: number | null
          file_size?: number | null
          height?: number | null
          id?: string
          media_type?: Database["public"]["Enums"]["media_type"]
          path?: string
          title?: string | null
          track_no?: number | null
          updated_at?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          event: string
          id: string
          organisation_id: string | null
          payload: Json | null
          sent_at: string | null
        }
        Insert: {
          event: string
          id?: string
          organisation_id?: string | null
          payload?: Json | null
          sent_at?: string | null
        }
        Update: {
          event?: string
          id?: string
          organisation_id?: string | null
          payload?: Json | null
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      operators: {
        Row: {
          created_at: string | null
          current_machine_id: string | null
          current_order_uiorn: string | null
          id: string
          is_active: boolean | null
          operator_code: string
          operator_name: string
          shift: string | null
          skills: string[] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_machine_id?: string | null
          current_order_uiorn?: string | null
          id?: string
          is_active?: boolean | null
          operator_code: string
          operator_name: string
          shift?: string | null
          skills?: string[] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_machine_id?: string | null
          current_order_uiorn?: string | null
          id?: string
          is_active?: boolean | null
          operator_code?: string
          operator_name?: string
          shift?: string | null
          skills?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      order_progress: {
        Row: {
          actual_completion: string | null
          current_stage: string
          estimated_completion: string | null
          id: string
          progress_percentage: number | null
          stage_notes: string | null
          stage_status: string | null
          started_at: string | null
          uiorn: string
          updated_at: string | null
        }
        Insert: {
          actual_completion?: string | null
          current_stage: string
          estimated_completion?: string | null
          id?: string
          progress_percentage?: number | null
          stage_notes?: string | null
          stage_status?: string | null
          started_at?: string | null
          uiorn: string
          updated_at?: string | null
        }
        Update: {
          actual_completion?: string | null
          current_stage?: string
          estimated_completion?: string | null
          id?: string
          progress_percentage?: number | null
          stage_notes?: string | null
          stage_status?: string | null
          started_at?: string | null
          uiorn?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_progress_uiorn_fkey"
            columns: ["uiorn"]
            isOneToOne: false
            referencedRelation: "order_punching"
            referencedColumns: ["uiorn"]
          },
        ]
      }
      order_punching: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          created_by: string | null
          customer_code: string | null
          customer_name: string
          delivery_date: string | null
          id: string
          order_date: string
          order_quantity: number
          priority_level: string | null
          product_description: string
          special_instructions: string | null
          status: Database["public"]["Enums"]["process_status"] | null
          uiorn: string
          unit_of_measure: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_code?: string | null
          customer_name: string
          delivery_date?: string | null
          id?: string
          order_date?: string
          order_quantity: number
          priority_level?: string | null
          product_description: string
          special_instructions?: string | null
          status?: Database["public"]["Enums"]["process_status"] | null
          uiorn: string
          unit_of_measure?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_code?: string | null
          customer_name?: string
          delivery_date?: string | null
          id?: string
          order_date?: string
          order_quantity?: number
          priority_level?: string | null
          product_description?: string
          special_instructions?: string | null
          status?: Database["public"]["Enums"]["process_status"] | null
          uiorn?: string
          unit_of_measure?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      orders_dashboard_dkpkl: {
        Row: {
          created_at: string | null
          created_by: string | null
          date: string | null
          id: string
          item_code: string | null
          item_name: string | null
          job_setup_min: number | null
          last_activity: string | null
          length_m: number | null
          po_number: string | null
          reel_weight_final_kg: number | null
          reel_weight_initial_kg: number | null
          reel_width_mm: number | null
          substrate: string
          substrate_id: string | null
          uiorn: string | null
          updated_at: string | null
          wastage_kg: number | null
          xrite_a: number | null
          xrite_b: number | null
          xrite_de: number | null
          xrite_l: number | null
          xrite_status: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          id?: string
          item_code?: string | null
          item_name?: string | null
          job_setup_min?: number | null
          last_activity?: string | null
          length_m?: number | null
          po_number?: string | null
          reel_weight_final_kg?: number | null
          reel_weight_initial_kg?: number | null
          reel_width_mm?: number | null
          substrate: string
          substrate_id?: string | null
          uiorn?: string | null
          updated_at?: string | null
          wastage_kg?: number | null
          xrite_a?: number | null
          xrite_b?: number | null
          xrite_de?: number | null
          xrite_l?: number | null
          xrite_status?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          id?: string
          item_code?: string | null
          item_name?: string | null
          job_setup_min?: number | null
          last_activity?: string | null
          length_m?: number | null
          po_number?: string | null
          reel_weight_final_kg?: number | null
          reel_weight_initial_kg?: number | null
          reel_width_mm?: number | null
          substrate?: string
          substrate_id?: string | null
          uiorn?: string | null
          updated_at?: string | null
          wastage_kg?: number | null
          xrite_a?: number | null
          xrite_b?: number | null
          xrite_de?: number | null
          xrite_l?: number | null
          xrite_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_item"
            columns: ["item_code"]
            isOneToOne: false
            referencedRelation: "master_data_artworks_dkpkl"
            referencedColumns: ["item_code"]
          },
          {
            foreignKeyName: "fk_orders_item"
            columns: ["item_code"]
            isOneToOne: false
            referencedRelation: "master_data_artworks_dkpkl"
            referencedColumns: ["item_code"]
          },
          {
            foreignKeyName: "fk_sub"
            columns: ["substrate"]
            isOneToOne: false
            referencedRelation: "substrate_master_dkpkl"
            referencedColumns: ["substrate_name"]
          },
          {
            foreignKeyName: "fk_substrate"
            columns: ["substrate"]
            isOneToOne: false
            referencedRelation: "substrate_master_dkpkl"
            referencedColumns: ["substrate_name"]
          },
        ]
      }
      orders_dashboard_dkpkl_history: {
        Row: {
          created_at: string | null
          created_by: string | null
          date: string | null
          id: string | null
          item_code: string | null
          item_name: string | null
          job_setup_min: number | null
          last_activity: string | null
          length_m: number | null
          logged_at: string | null
          po_number: string | null
          reel_weight_final_kg: number | null
          reel_weight_initial_kg: number | null
          reel_width_mm: number | null
          substrate: string | null
          uiorn: string | null
          updated_at: string | null
          wastage_kg: number | null
          xrite_a: number | null
          xrite_b: number | null
          xrite_de: number | null
          xrite_l: number | null
          xrite_status: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          id?: string | null
          item_code?: string | null
          item_name?: string | null
          job_setup_min?: number | null
          last_activity?: string | null
          length_m?: number | null
          logged_at?: string | null
          po_number?: string | null
          reel_weight_final_kg?: number | null
          reel_weight_initial_kg?: number | null
          reel_width_mm?: number | null
          substrate?: string | null
          uiorn?: string | null
          updated_at?: string | null
          wastage_kg?: number | null
          xrite_a?: number | null
          xrite_b?: number | null
          xrite_de?: number | null
          xrite_l?: number | null
          xrite_status?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          id?: string | null
          item_code?: string | null
          item_name?: string | null
          job_setup_min?: number | null
          last_activity?: string | null
          length_m?: number | null
          logged_at?: string | null
          po_number?: string | null
          reel_weight_final_kg?: number | null
          reel_weight_initial_kg?: number | null
          reel_width_mm?: number | null
          substrate?: string | null
          uiorn?: string | null
          updated_at?: string | null
          wastage_kg?: number | null
          xrite_a?: number | null
          xrite_b?: number | null
          xrite_de?: number | null
          xrite_l?: number | null
          xrite_status?: string | null
        }
        Relationships: []
      }
      orders_dashboard_se: {
        Row: {
          adhesive_coating_done_at: string | null
          created_at: string | null
          created_by: string | null
          date: string | null
          dispatch_done_at: string | null
          id: string
          item_code: string | null
          item_name: string | null
          job_setup_min: number | null
          lamination_done_at: string | null
          last_activity: string | null
          length_m: number | null
          po_number: string | null
          printing_done_at: string | null
          reel_weight_final_kg: number | null
          reel_weight_initial_kg: number | null
          reel_width_mm: number | null
          slitting_done_at: string | null
          substrate: string
          uiorn: string | null
          updated_at: string | null
          wastage_kg: number | null
          xrite_a: number | null
          xrite_b: number | null
          xrite_de: number | null
          xrite_l: number | null
          xrite_status: string | null
        }
        Insert: {
          adhesive_coating_done_at?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          dispatch_done_at?: string | null
          id?: string
          item_code?: string | null
          item_name?: string | null
          job_setup_min?: number | null
          lamination_done_at?: string | null
          last_activity?: string | null
          length_m?: number | null
          po_number?: string | null
          printing_done_at?: string | null
          reel_weight_final_kg?: number | null
          reel_weight_initial_kg?: number | null
          reel_width_mm?: number | null
          slitting_done_at?: string | null
          substrate: string
          uiorn?: string | null
          updated_at?: string | null
          wastage_kg?: number | null
          xrite_a?: number | null
          xrite_b?: number | null
          xrite_de?: number | null
          xrite_l?: number | null
          xrite_status?: string | null
        }
        Update: {
          adhesive_coating_done_at?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          dispatch_done_at?: string | null
          id?: string
          item_code?: string | null
          item_name?: string | null
          job_setup_min?: number | null
          lamination_done_at?: string | null
          last_activity?: string | null
          length_m?: number | null
          po_number?: string | null
          printing_done_at?: string | null
          reel_weight_final_kg?: number | null
          reel_weight_initial_kg?: number | null
          reel_width_mm?: number | null
          slitting_done_at?: string | null
          substrate?: string
          uiorn?: string | null
          updated_at?: string | null
          wastage_kg?: number | null
          xrite_a?: number | null
          xrite_b?: number | null
          xrite_de?: number | null
          xrite_l?: number | null
          xrite_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_dashboard_se_item_code_fkey"
            columns: ["item_code"]
            isOneToOne: false
            referencedRelation: "master_data_artworks_se"
            referencedColumns: ["item_code"]
          },
          {
            foreignKeyName: "orders_dashboard_se_substrate_fkey"
            columns: ["substrate"]
            isOneToOne: false
            referencedRelation: "substrate_master_se"
            referencedColumns: ["substrate_name"]
          },
        ]
      }
      orders_dashboard_se_history: {
        Row: {
          created_at: string | null
          created_by: string | null
          date: string | null
          id: string | null
          item_code: string | null
          item_name: string | null
          job_setup_min: number | null
          last_activity: string | null
          length_m: number | null
          logged_at: string | null
          po_number: string | null
          reel_weight_final_kg: number | null
          reel_weight_initial_kg: number | null
          reel_width_mm: number | null
          substrate: string | null
          uiorn: string | null
          updated_at: string | null
          wastage_kg: number | null
          xrite_a: number | null
          xrite_b: number | null
          xrite_de: number | null
          xrite_l: number | null
          xrite_status: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          id?: string | null
          item_code?: string | null
          item_name?: string | null
          job_setup_min?: number | null
          last_activity?: string | null
          length_m?: number | null
          logged_at?: string | null
          po_number?: string | null
          reel_weight_final_kg?: number | null
          reel_weight_initial_kg?: number | null
          reel_width_mm?: number | null
          substrate?: string | null
          uiorn?: string | null
          updated_at?: string | null
          wastage_kg?: number | null
          xrite_a?: number | null
          xrite_b?: number | null
          xrite_de?: number | null
          xrite_l?: number | null
          xrite_status?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          id?: string | null
          item_code?: string | null
          item_name?: string | null
          job_setup_min?: number | null
          last_activity?: string | null
          length_m?: number | null
          logged_at?: string | null
          po_number?: string | null
          reel_weight_final_kg?: number | null
          reel_weight_initial_kg?: number | null
          reel_width_mm?: number | null
          substrate?: string | null
          uiorn?: string | null
          updated_at?: string | null
          wastage_kg?: number | null
          xrite_a?: number | null
          xrite_b?: number | null
          xrite_de?: number | null
          xrite_l?: number | null
          xrite_status?: string | null
        }
        Relationships: []
      }
      org_tokens: {
        Row: {
          last_reset: string | null
          organisation_id: string
          remaining: number | null
        }
        Insert: {
          last_reset?: string | null
          organisation_id: string
          remaining?: number | null
        }
        Update: {
          last_reset?: string | null
          organisation_id?: string
          remaining?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "org_tokens_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: true
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      organisations: {
        Row: {
          created_at: string | null
          id: string
          name: string
          plan: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          plan?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          plan?: string | null
        }
        Relationships: []
      }
      organizations: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      packaging_operations: {
        Row: {
          batch_numbers: string[] | null
          created_at: string | null
          id: string
          labeling_complete: boolean | null
          operator_id: string | null
          packaging_date: string | null
          packaging_specifications: Json | null
          packaging_type: string
          quality_check_passed: boolean | null
          quantity_packaged: number | null
          shipping_ready: boolean | null
          uiorn: string
          updated_at: string | null
        }
        Insert: {
          batch_numbers?: string[] | null
          created_at?: string | null
          id?: string
          labeling_complete?: boolean | null
          operator_id?: string | null
          packaging_date?: string | null
          packaging_specifications?: Json | null
          packaging_type: string
          quality_check_passed?: boolean | null
          quantity_packaged?: number | null
          shipping_ready?: boolean | null
          uiorn: string
          updated_at?: string | null
        }
        Update: {
          batch_numbers?: string[] | null
          created_at?: string | null
          id?: string
          labeling_complete?: boolean | null
          operator_id?: string | null
          packaging_date?: string | null
          packaging_specifications?: Json | null
          packaging_type?: string
          quality_check_passed?: boolean | null
          quantity_packaged?: number | null
          shipping_ready?: boolean | null
          uiorn?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "packaging_operations_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "packaging_operations_uiorn_fkey"
            columns: ["uiorn"]
            isOneToOne: false
            referencedRelation: "order_punching"
            referencedColumns: ["uiorn"]
          },
        ]
      }
      packaging_projects: {
        Row: {
          approved_by: string | null
          barrier_properties: Json | null
          created_at: string | null
          customer_feedback: string | null
          design_approval_status: string | null
          design_completed_at: string | null
          design_requirements: string | null
          design_started_at: string | null
          designer_id: string | null
          id: string
          packaging_type: Database["public"]["Enums"]["packaging_type"]
          project_manager_id: string | null
          project_name: string
          prototype_status: string | null
          regulatory_compliance: Json | null
          revision_count: number | null
          shelf_life_requirements: number | null
          status: Database["public"]["Enums"]["process_status"] | null
          structural_specifications: Json | null
          sustainability_requirements: string | null
          uiorn: string
          updated_at: string | null
        }
        Insert: {
          approved_by?: string | null
          barrier_properties?: Json | null
          created_at?: string | null
          customer_feedback?: string | null
          design_approval_status?: string | null
          design_completed_at?: string | null
          design_requirements?: string | null
          design_started_at?: string | null
          designer_id?: string | null
          id?: string
          packaging_type: Database["public"]["Enums"]["packaging_type"]
          project_manager_id?: string | null
          project_name: string
          prototype_status?: string | null
          regulatory_compliance?: Json | null
          revision_count?: number | null
          shelf_life_requirements?: number | null
          status?: Database["public"]["Enums"]["process_status"] | null
          structural_specifications?: Json | null
          sustainability_requirements?: string | null
          uiorn: string
          updated_at?: string | null
        }
        Update: {
          approved_by?: string | null
          barrier_properties?: Json | null
          created_at?: string | null
          customer_feedback?: string | null
          design_approval_status?: string | null
          design_completed_at?: string | null
          design_requirements?: string | null
          design_started_at?: string | null
          designer_id?: string | null
          id?: string
          packaging_type?: Database["public"]["Enums"]["packaging_type"]
          project_manager_id?: string | null
          project_name?: string
          prototype_status?: string | null
          regulatory_compliance?: Json | null
          revision_count?: number | null
          shelf_life_requirements?: number | null
          status?: Database["public"]["Enums"]["process_status"] | null
          structural_specifications?: Json | null
          sustainability_requirements?: string | null
          uiorn?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "packaging_projects_uiorn_fkey"
            columns: ["uiorn"]
            isOneToOne: false
            referencedRelation: "order_punching"
            referencedColumns: ["uiorn"]
          },
        ]
      }
      packaging_selection: {
        Row: {
          approved_by: string | null
          child_resistant_features: boolean | null
          closure_type: string | null
          cost_impact_analysis: string | null
          created_at: string | null
          die_cutting_requirements: string | null
          finalized_at: string | null
          finishing_options: Json | null
          gusset_specifications: Json | null
          handle_type: string | null
          id: string
          packaging_category: string
          packaging_style: string
          perforation_requirements: string | null
          printing_areas: Json | null
          regulatory_markings: Json | null
          resealable_features: boolean | null
          seal_type: string | null
          selected_at: string | null
          selected_by: string | null
          status: Database["public"]["Enums"]["process_status"] | null
          tamper_evident_features: boolean | null
          tooling_requirements: string | null
          uiorn: string
          updated_at: string | null
          window_specifications: Json | null
        }
        Insert: {
          approved_by?: string | null
          child_resistant_features?: boolean | null
          closure_type?: string | null
          cost_impact_analysis?: string | null
          created_at?: string | null
          die_cutting_requirements?: string | null
          finalized_at?: string | null
          finishing_options?: Json | null
          gusset_specifications?: Json | null
          handle_type?: string | null
          id?: string
          packaging_category: string
          packaging_style: string
          perforation_requirements?: string | null
          printing_areas?: Json | null
          regulatory_markings?: Json | null
          resealable_features?: boolean | null
          seal_type?: string | null
          selected_at?: string | null
          selected_by?: string | null
          status?: Database["public"]["Enums"]["process_status"] | null
          tamper_evident_features?: boolean | null
          tooling_requirements?: string | null
          uiorn: string
          updated_at?: string | null
          window_specifications?: Json | null
        }
        Update: {
          approved_by?: string | null
          child_resistant_features?: boolean | null
          closure_type?: string | null
          cost_impact_analysis?: string | null
          created_at?: string | null
          die_cutting_requirements?: string | null
          finalized_at?: string | null
          finishing_options?: Json | null
          gusset_specifications?: Json | null
          handle_type?: string | null
          id?: string
          packaging_category?: string
          packaging_style?: string
          perforation_requirements?: string | null
          printing_areas?: Json | null
          regulatory_markings?: Json | null
          resealable_features?: boolean | null
          seal_type?: string | null
          selected_at?: string | null
          selected_by?: string | null
          status?: Database["public"]["Enums"]["process_status"] | null
          tamper_evident_features?: boolean | null
          tooling_requirements?: string | null
          uiorn?: string
          updated_at?: string | null
          window_specifications?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "packaging_selection_uiorn_fkey"
            columns: ["uiorn"]
            isOneToOne: false
            referencedRelation: "order_punching"
            referencedColumns: ["uiorn"]
          },
        ]
      }
      payroll_audit_log: {
        Row: {
          id: string
          new_data: Json | null
          old_data: Json | null
          operation: string
          table_name: string
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          operation: string
          table_name: string
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          operation?: string
          table_name?: string
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      payroll_calculation_audit: {
        Row: {
          calculated_at: string | null
          calculated_by: string | null
          calculation_details: Json
          employee_id: string | null
          formula_snapshot: Json
          id: string
          month: string
        }
        Insert: {
          calculated_at?: string | null
          calculated_by?: string | null
          calculation_details: Json
          employee_id?: string | null
          formula_snapshot: Json
          id?: string
          month: string
        }
        Update: {
          calculated_at?: string | null
          calculated_by?: string | null
          calculation_details?: Json
          employee_id?: string | null
          formula_snapshot?: Json
          id?: string
          month?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_calculation_audit_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_details_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_calculation_audit_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "panchkula_payroll_calculation"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "payroll_calculation_audit_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "payroll_calculation_enhanced"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "payroll_calculation_audit_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "payroll_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_employees: {
        Row: {
          aadhaar_number: string | null
          active: boolean | null
          base_salary: number
          created_at: string | null
          date_of_birth: string | null
          department_id: string | null
          employee_code: string | null
          hra_amount: number | null
          id: string
          id_proof_file_path: string | null
          joining_date: string
          name: string
          other_conv_amount: number | null
          pan_number: string | null
          uan_number: string
          unit_id: string | null
          updated_at: string | null
        }
        Insert: {
          aadhaar_number?: string | null
          active?: boolean | null
          base_salary: number
          created_at?: string | null
          date_of_birth?: string | null
          department_id?: string | null
          employee_code?: string | null
          hra_amount?: number | null
          id?: string
          id_proof_file_path?: string | null
          joining_date: string
          name: string
          other_conv_amount?: number | null
          pan_number?: string | null
          uan_number: string
          unit_id?: string | null
          updated_at?: string | null
        }
        Update: {
          aadhaar_number?: string | null
          active?: boolean | null
          base_salary?: number
          created_at?: string | null
          date_of_birth?: string | null
          department_id?: string | null
          employee_code?: string | null
          hra_amount?: number | null
          id?: string
          id_proof_file_path?: string | null
          joining_date?: string
          name?: string
          other_conv_amount?: number | null
          pan_number?: string | null
          uan_number?: string
          unit_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_employees_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["unit_id"]
          },
        ]
      }
      payroll_formulas: {
        Row: {
          active: boolean | null
          created_at: string | null
          created_by: string | null
          description: string | null
          effective_from: string
          effective_to: string | null
          expression: string
          formula_type: Database["public"]["Enums"]["formula_type"]
          id: string
          name: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          effective_from?: string
          effective_to?: string | null
          expression: string
          formula_type: Database["public"]["Enums"]["formula_type"]
          id?: string
          name: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          effective_from?: string
          effective_to?: string | null
          expression?: string
          formula_type?: Database["public"]["Enums"]["formula_type"]
          id?: string
          name?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: []
      }
      payroll_settings: {
        Row: {
          created_at: string | null
          effective_from: string
          el_accrual_ratio: number | null
          esi_rate: number
          lwf_amount: number
          max_el_carryforward: number | null
          monthly_cl_accrual: number | null
          pf_rate: number
          setting_id: string
          sunday_overtime_multiplier: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          effective_from: string
          el_accrual_ratio?: number | null
          esi_rate: number
          lwf_amount?: number
          max_el_carryforward?: number | null
          monthly_cl_accrual?: number | null
          pf_rate: number
          setting_id?: string
          sunday_overtime_multiplier?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          effective_from?: string
          el_accrual_ratio?: number | null
          esi_rate?: number
          lwf_amount?: number
          max_el_carryforward?: number | null
          monthly_cl_accrual?: number | null
          pf_rate?: number
          setting_id?: string
          sunday_overtime_multiplier?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      press_decks: {
        Row: {
          colour: string | null
          created_at: string | null
          deck_no: number
          id: string
          press_id: string | null
        }
        Insert: {
          colour?: string | null
          created_at?: string | null
          deck_no: number
          id?: string
          press_id?: string | null
        }
        Update: {
          colour?: string | null
          created_at?: string | null
          deck_no?: number
          id?: string
          press_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "press_decks_press_id_fkey"
            columns: ["press_id"]
            isOneToOne: false
            referencedRelation: "presses"
            referencedColumns: ["id"]
          },
        ]
      }
      presses: {
        Row: {
          created_at: string | null
          id: string
          name: string | null
          organisation_id: string | null
          serial: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name?: string | null
          organisation_id?: string | null
          serial?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string | null
          organisation_id?: string | null
          serial?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "presses_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      process_logs_dkpkl: {
        Row: {
          captured_at: string | null
          captured_by: string | null
          id: string
          metric: string
          stage: Database["public"]["Enums"]["stage"]
          txt_value: string | null
          uiorn: string
          value: number | null
        }
        Insert: {
          captured_at?: string | null
          captured_by?: string | null
          id?: string
          metric: string
          stage: Database["public"]["Enums"]["stage"]
          txt_value?: string | null
          uiorn: string
          value?: number | null
        }
        Update: {
          captured_at?: string | null
          captured_by?: string | null
          id?: string
          metric?: string
          stage?: Database["public"]["Enums"]["stage"]
          txt_value?: string | null
          uiorn?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "process_logs_dkpkl_captured_by_fkey"
            columns: ["captured_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_logs_dkpkl_uiorn_fkey"
            columns: ["uiorn"]
            isOneToOne: false
            referencedRelation: "orders_dashboard_dkpkl"
            referencedColumns: ["uiorn"]
          },
        ]
      }
      process_logs_se: {
        Row: {
          captured_at: string | null
          captured_by: string | null
          id: string
          metric: string
          stage: Database["public"]["Enums"]["process_stage"]
          txt_value: string | null
          uiorn: string
          value: number | null
        }
        Insert: {
          captured_at?: string | null
          captured_by?: string | null
          id?: string
          metric: string
          stage: Database["public"]["Enums"]["process_stage"]
          txt_value?: string | null
          uiorn: string
          value?: number | null
        }
        Update: {
          captured_at?: string | null
          captured_by?: string | null
          id?: string
          metric?: string
          stage?: Database["public"]["Enums"]["process_stage"]
          txt_value?: string | null
          uiorn?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "process_logs_se_captured_by_fkey"
            columns: ["captured_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_logs_se_uiorn_fkey"
            columns: ["uiorn"]
            isOneToOne: false
            referencedRelation: "orders_dashboard_se"
            referencedColumns: ["uiorn"]
          },
        ]
      }
      process_stages_dkpkl: {
        Row: {
          code: string
          name: string
          ordinal: number
        }
        Insert: {
          code: string
          name: string
          ordinal: number
        }
        Update: {
          code?: string
          name?: string
          ordinal?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          employee_id: string | null
          full_name: string | null
          id: string
          is_active: boolean | null
          is_approved: boolean | null
          organization_id: string
          role: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          employee_id?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean | null
          is_approved?: boolean | null
          organization_id: string
          role?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          employee_id?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          is_approved?: boolean | null
          organization_id?: string
          role?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      publications: {
        Row: {
          created_at: string
          id: string
          journal: string | null
          link: string | null
          title: string
          updated_at: string
          year: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          journal?: string | null
          link?: string | null
          title: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          journal?: string | null
          link?: string | null
          title?: string
          updated_at?: string
          year?: number | null
        }
        Relationships: []
      }
      quality_checkpoints: {
        Row: {
          checkpoint_name: string
          created_at: string | null
          id: string
          inspector_id: string | null
          passed: boolean | null
          remarks: string | null
          stage: string
          test_parameters: Json | null
          test_results: Json | null
          tested_at: string | null
          uiorn: string
        }
        Insert: {
          checkpoint_name: string
          created_at?: string | null
          id?: string
          inspector_id?: string | null
          passed?: boolean | null
          remarks?: string | null
          stage: string
          test_parameters?: Json | null
          test_results?: Json | null
          tested_at?: string | null
          uiorn: string
        }
        Update: {
          checkpoint_name?: string
          created_at?: string | null
          id?: string
          inspector_id?: string | null
          passed?: boolean | null
          remarks?: string | null
          stage?: string
          test_parameters?: Json | null
          test_results?: Json | null
          tested_at?: string | null
          uiorn?: string
        }
        Relationships: [
          {
            foreignKeyName: "quality_checkpoints_inspector_id_fkey"
            columns: ["inspector_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quality_checkpoints_uiorn_fkey"
            columns: ["uiorn"]
            isOneToOne: false
            referencedRelation: "order_punching"
            referencedColumns: ["uiorn"]
          },
        ]
      }
      quarterly_results: {
        Row: {
          created_at: string
          date_period: string | null
          ebitda: number | null
          ebitda_margin: number | null
          id: string
          net_profit: number | null
          quarter: string
          revenue: number | null
          revenue_growth: number | null
          ticker: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_period?: string | null
          ebitda?: number | null
          ebitda_margin?: number | null
          id?: string
          net_profit?: number | null
          quarter: string
          revenue?: number | null
          revenue_growth?: number | null
          ticker?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_period?: string | null
          ebitda?: number | null
          ebitda_margin?: number | null
          id?: string
          net_profit?: number | null
          quarter?: string
          revenue?: number | null
          revenue_growth?: number | null
          ticker?: string
          updated_at?: string
        }
        Relationships: []
      }
      resource_links: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          is_featured: boolean
          title: string
          url: string
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          id?: string
          is_featured?: boolean
          title: string
          url: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          is_featured?: boolean
          title?: string
          url?: string
        }
        Relationships: []
      }
      salary_audit_log: {
        Row: {
          action: string
          batch_id: string | null
          details: Json | null
          id: string
          performed_at: string
          performed_by: string | null
        }
        Insert: {
          action: string
          batch_id?: string | null
          details?: Json | null
          id?: string
          performed_at?: string
          performed_by?: string | null
        }
        Update: {
          action?: string
          batch_id?: string | null
          details?: Json | null
          id?: string
          performed_at?: string
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salary_audit_log_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "salary_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      salary_batches: {
        Row: {
          batch_name: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          id: string
          metadata: Json | null
          period_end: string
          period_start: string
          period_type: string
          status: string
          total_deductions: number
          total_employees: number
          total_gross_amount: number
          total_net_amount: number
          updated_at: string
        }
        Insert: {
          batch_name: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          metadata?: Json | null
          period_end: string
          period_start: string
          period_type: string
          status?: string
          total_deductions?: number
          total_employees?: number
          total_gross_amount?: number
          total_net_amount?: number
          updated_at?: string
        }
        Update: {
          batch_name?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          metadata?: Json | null
          period_end?: string
          period_start?: string
          period_type?: string
          status?: string
          total_deductions?: number
          total_employees?: number
          total_gross_amount?: number
          total_net_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      salary_disbursement: {
        Row: {
          advances_deduction: number | null
          base_salary: number
          batch_id: string | null
          created_at: string | null
          disbursed_on: string | null
          employee_id: string | null
          esi_deduction: number | null
          gross_salary: number | null
          hra_amount: number | null
          month: string
          net_salary: number
          other_conv_amount: number | null
          overtime_amount: number | null
          pf_deduction: number | null
          salary_id: string
          total_days_present: number
          total_hours_worked: number
          unit_id: string | null
          updated_at: string | null
        }
        Insert: {
          advances_deduction?: number | null
          base_salary: number
          batch_id?: string | null
          created_at?: string | null
          disbursed_on?: string | null
          employee_id?: string | null
          esi_deduction?: number | null
          gross_salary?: number | null
          hra_amount?: number | null
          month: string
          net_salary: number
          other_conv_amount?: number | null
          overtime_amount?: number | null
          pf_deduction?: number | null
          salary_id?: string
          total_days_present: number
          total_hours_worked: number
          unit_id?: string | null
          updated_at?: string | null
        }
        Update: {
          advances_deduction?: number | null
          base_salary?: number
          batch_id?: string | null
          created_at?: string | null
          disbursed_on?: string | null
          employee_id?: string | null
          esi_deduction?: number | null
          gross_salary?: number | null
          hra_amount?: number | null
          month?: string
          net_salary?: number
          other_conv_amount?: number | null
          overtime_amount?: number | null
          pf_deduction?: number | null
          salary_id?: string
          total_days_present?: number
          total_hours_worked?: number
          unit_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salary_disbursement_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "salary_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salary_disbursement_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_details_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salary_disbursement_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "panchkula_payroll_calculation"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "salary_disbursement_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "payroll_calculation_enhanced"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "salary_disbursement_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "payroll_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salary_disbursement_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["unit_id"]
          },
        ]
      }
      satguru_categories: {
        Row: {
          category_name: string
          created_at: string
          description: string | null
          id: string
          updated_at: string
        }
        Insert: {
          category_name: string
          created_at?: string
          description?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          category_name?: string
          created_at?: string
          description?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      satguru_csv_upload_log: {
        Row: {
          created_at: string
          error_details: Json | null
          failed_rows: number
          file_name: string
          id: string
          successful_rows: number
          total_rows: number
          updated_at: string
          upload_date: string
          upload_type: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          error_details?: Json | null
          failed_rows?: number
          file_name: string
          id?: string
          successful_rows?: number
          total_rows?: number
          updated_at?: string
          upload_date?: string
          upload_type: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          error_details?: Json | null
          failed_rows?: number
          file_name?: string
          id?: string
          successful_rows?: number
          total_rows?: number
          updated_at?: string
          upload_date?: string
          upload_type?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      satguru_daily_stock_summary: {
        Row: {
          category_name: string | null
          created_at: string
          current_qty: number
          days_of_cover: number | null
          id: string
          item_code: string
          item_name: string
          opening_qty: number
          summary_date: string
          total_grn_qty: number
          total_issued_qty: number
        }
        Insert: {
          category_name?: string | null
          created_at?: string
          current_qty?: number
          days_of_cover?: number | null
          id?: string
          item_code: string
          item_name: string
          opening_qty?: number
          summary_date?: string
          total_grn_qty?: number
          total_issued_qty?: number
        }
        Update: {
          category_name?: string | null
          created_at?: string
          current_qty?: number
          days_of_cover?: number | null
          id?: string
          item_code?: string
          item_name?: string
          opening_qty?: number
          summary_date?: string
          total_grn_qty?: number
          total_issued_qty?: number
        }
        Relationships: []
      }
      satguru_grn_log: {
        Row: {
          amount_inr: number | null
          created_at: string
          date: string
          grn_number: string
          id: string
          invoice_number: string | null
          item_code: string
          qty_received: number
          remarks: string | null
          uom: string
          vendor: string | null
        }
        Insert: {
          amount_inr?: number | null
          created_at?: string
          date?: string
          grn_number: string
          id?: string
          invoice_number?: string | null
          item_code: string
          qty_received: number
          remarks?: string | null
          uom: string
          vendor?: string | null
        }
        Update: {
          amount_inr?: number | null
          created_at?: string
          date?: string
          grn_number?: string
          id?: string
          invoice_number?: string | null
          item_code?: string
          qty_received?: number
          remarks?: string | null
          uom?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "satguru_grn_log_item_code_fkey"
            columns: ["item_code"]
            isOneToOne: false
            referencedRelation: "satguru_item_master"
            referencedColumns: ["item_code"]
          },
          {
            foreignKeyName: "satguru_grn_log_item_code_fkey"
            columns: ["item_code"]
            isOneToOne: false
            referencedRelation: "satguru_stock_summary"
            referencedColumns: ["item_code"]
          },
        ]
      }
      satguru_issue_log: {
        Row: {
          created_at: string
          date: string
          id: string
          item_code: string
          purpose: string | null
          qty_issued: number
          remarks: string | null
          total_issued_qty: number | null
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          item_code: string
          purpose?: string | null
          qty_issued: number
          remarks?: string | null
          total_issued_qty?: number | null
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          item_code?: string
          purpose?: string | null
          qty_issued?: number
          remarks?: string | null
          total_issued_qty?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "satguru_issue_log_item_code_fkey"
            columns: ["item_code"]
            isOneToOne: false
            referencedRelation: "satguru_item_master"
            referencedColumns: ["item_code"]
          },
          {
            foreignKeyName: "satguru_issue_log_item_code_fkey"
            columns: ["item_code"]
            isOneToOne: false
            referencedRelation: "satguru_stock_summary"
            referencedColumns: ["item_code"]
          },
        ]
      }
      satguru_item_master: {
        Row: {
          auto_code: string | null
          category_id: string | null
          created_at: string
          gsm: number | null
          id: string
          item_code: string
          item_name: string
          qualifier: string | null
          size_mm: string | null
          status: string
          uom: string
          updated_at: string
          usage_type: string | null
        }
        Insert: {
          auto_code?: string | null
          category_id?: string | null
          created_at?: string
          gsm?: number | null
          id?: string
          item_code: string
          item_name: string
          qualifier?: string | null
          size_mm?: string | null
          status?: string
          uom?: string
          updated_at?: string
          usage_type?: string | null
        }
        Update: {
          auto_code?: string | null
          category_id?: string | null
          created_at?: string
          gsm?: number | null
          id?: string
          item_code?: string
          item_name?: string
          qualifier?: string | null
          size_mm?: string | null
          status?: string
          uom?: string
          updated_at?: string
          usage_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "satguru_item_master_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "satguru_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "satguru_item_master_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "satguru_category_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      satguru_stock: {
        Row: {
          current_qty: number
          id: string
          item_code: string
          last_updated: string
          max_stock_level: number | null
          min_stock_level: number | null
          opening_qty: number
          reorder_level: number | null
        }
        Insert: {
          current_qty?: number
          id?: string
          item_code: string
          last_updated?: string
          max_stock_level?: number | null
          min_stock_level?: number | null
          opening_qty?: number
          reorder_level?: number | null
        }
        Update: {
          current_qty?: number
          id?: string
          item_code?: string
          last_updated?: string
          max_stock_level?: number | null
          min_stock_level?: number | null
          opening_qty?: number
          reorder_level?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "satguru_stock_item_code_fkey"
            columns: ["item_code"]
            isOneToOne: true
            referencedRelation: "satguru_item_master"
            referencedColumns: ["item_code"]
          },
          {
            foreignKeyName: "satguru_stock_item_code_fkey"
            columns: ["item_code"]
            isOneToOne: true
            referencedRelation: "satguru_stock_summary"
            referencedColumns: ["item_code"]
          },
        ]
      }
      segment_performance: {
        Row: {
          created_at: string
          id: string
          period: string
          revenue_percentage: number | null
          segment_name: string
          ticker: string
        }
        Insert: {
          created_at?: string
          id?: string
          period: string
          revenue_percentage?: number | null
          segment_name: string
          ticker?: string
        }
        Update: {
          created_at?: string
          id?: string
          period?: string
          revenue_percentage?: number | null
          segment_name?: string
          ticker?: string
        }
        Relationships: []
      }
      slitting: {
        Row: {
          blade_type: string | null
          completed_at: string | null
          core_diameter: number | null
          created_at: string | null
          edge_trim_waste: number | null
          finished_roll_count: number | null
          id: string
          number_of_slits: number
          operator_id: string | null
          parent_roll_width: number
          quality_checked_by: string | null
          rewind_tension: number | null
          slit_widths: Json
          slitting_speed: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["process_status"] | null
          total_waste_percentage: number | null
          uiorn: string
          updated_at: string | null
        }
        Insert: {
          blade_type?: string | null
          completed_at?: string | null
          core_diameter?: number | null
          created_at?: string | null
          edge_trim_waste?: number | null
          finished_roll_count?: number | null
          id?: string
          number_of_slits: number
          operator_id?: string | null
          parent_roll_width: number
          quality_checked_by?: string | null
          rewind_tension?: number | null
          slit_widths: Json
          slitting_speed?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["process_status"] | null
          total_waste_percentage?: number | null
          uiorn: string
          updated_at?: string | null
        }
        Update: {
          blade_type?: string | null
          completed_at?: string | null
          core_diameter?: number | null
          created_at?: string | null
          edge_trim_waste?: number | null
          finished_roll_count?: number | null
          id?: string
          number_of_slits?: number
          operator_id?: string | null
          parent_roll_width?: number
          quality_checked_by?: string | null
          rewind_tension?: number | null
          slit_widths?: Json
          slitting_speed?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["process_status"] | null
          total_waste_percentage?: number | null
          uiorn?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "slitting_uiorn_fkey"
            columns: ["uiorn"]
            isOneToOne: false
            referencedRelation: "order_punching"
            referencedColumns: ["uiorn"]
          },
        ]
      }
      slitting_operations: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          machine_id: string | null
          number_of_slits: number | null
          operator_id: string | null
          parent_roll_width: number | null
          quality_parameters: Json | null
          slitting_speed: number | null
          started_at: string | null
          status: string | null
          target_widths: number[] | null
          uiorn: string
          updated_at: string | null
          waste_percentage: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          machine_id?: string | null
          number_of_slits?: number | null
          operator_id?: string | null
          parent_roll_width?: number | null
          quality_parameters?: Json | null
          slitting_speed?: number | null
          started_at?: string | null
          status?: string | null
          target_widths?: number[] | null
          uiorn: string
          updated_at?: string | null
          waste_percentage?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          machine_id?: string | null
          number_of_slits?: number | null
          operator_id?: string | null
          parent_roll_width?: number | null
          quality_parameters?: Json | null
          slitting_speed?: number | null
          started_at?: string | null
          status?: string | null
          target_widths?: number[] | null
          uiorn?: string
          updated_at?: string | null
          waste_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "slitting_operations_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slitting_operations_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slitting_operations_uiorn_fkey"
            columns: ["uiorn"]
            isOneToOne: false
            referencedRelation: "order_punching"
            referencedColumns: ["uiorn"]
          },
        ]
      }
      smeta_points: {
        Row: {
          description: string
          id: number
          point_number: string
          section: string
        }
        Insert: {
          description: string
          id?: number
          point_number: string
          section: string
        }
        Update: {
          description?: string
          id?: number
          point_number?: string
          section?: string
        }
        Relationships: []
      }
      spectro_readings: {
        Row: {
          a: number | null
          b: number | null
          captured_at: string | null
          delta_e: number | null
          id: string
          job_id: string | null
          l: number | null
          press_id: string | null
          user_id: string | null
        }
        Insert: {
          a?: number | null
          b?: number | null
          captured_at?: string | null
          delta_e?: number | null
          id?: string
          job_id?: string | null
          l?: number | null
          press_id?: string | null
          user_id?: string | null
        }
        Update: {
          a?: number | null
          b?: number | null
          captured_at?: string | null
          delta_e?: number | null
          id?: string
          job_id?: string | null
          l?: number | null
          press_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spectro_readings_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spectro_readings_press_id_fkey"
            columns: ["press_id"]
            isOneToOne: false
            referencedRelation: "presses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spectro_readings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      stage_metrics_dkpkl: {
        Row: {
          id: string
          input_type: string | null
          metric_key: string | null
          metric_label: string | null
          stage_code: string | null
          unit: string | null
        }
        Insert: {
          id?: string
          input_type?: string | null
          metric_key?: string | null
          metric_label?: string | null
          stage_code?: string | null
          unit?: string | null
        }
        Update: {
          id?: string
          input_type?: string | null
          metric_key?: string | null
          metric_label?: string | null
          stage_code?: string | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stage_metrics_dkpkl_stage_code_fkey"
            columns: ["stage_code"]
            isOneToOne: false
            referencedRelation: "process_stages_dkpkl"
            referencedColumns: ["code"]
          },
        ]
      }
      stage_status_dkpkl: {
        Row: {
          finished_at: string | null
          remarks: string | null
          stage: Database["public"]["Enums"]["stage"]
          started_at: string | null
          status: string | null
          uiorn: string
        }
        Insert: {
          finished_at?: string | null
          remarks?: string | null
          stage: Database["public"]["Enums"]["stage"]
          started_at?: string | null
          status?: string | null
          uiorn: string
        }
        Update: {
          finished_at?: string | null
          remarks?: string | null
          stage?: Database["public"]["Enums"]["stage"]
          started_at?: string | null
          status?: string | null
          uiorn?: string
        }
        Relationships: [
          {
            foreignKeyName: "stage_status_dkpkl_uiorn_fkey"
            columns: ["uiorn"]
            isOneToOne: false
            referencedRelation: "orders_dashboard_dkpkl"
            referencedColumns: ["uiorn"]
          },
        ]
      }
      staging_artworks_se: {
        Row: {
          circum: number | null
          coil_size: string | null
          customer_name: string | null
          cut_length: string | null
          cyl_qty: string | null
          dimensions: string | null
          file_hyperlink: string | null
          file_id: string | null
          item_code: string
          item_name: string | null
          last_run: string | null
          length: string | null
          location: string | null
          mileage_m: string | null
          no_of_colours: string | null
          qr_code: string | null
          remarks: string | null
          total_runs: string | null
          ups: number | null
        }
        Insert: {
          circum?: number | null
          coil_size?: string | null
          customer_name?: string | null
          cut_length?: string | null
          cyl_qty?: string | null
          dimensions?: string | null
          file_hyperlink?: string | null
          file_id?: string | null
          item_code: string
          item_name?: string | null
          last_run?: string | null
          length?: string | null
          location?: string | null
          mileage_m?: string | null
          no_of_colours?: string | null
          qr_code?: string | null
          remarks?: string | null
          total_runs?: string | null
          ups?: number | null
        }
        Update: {
          circum?: number | null
          coil_size?: string | null
          customer_name?: string | null
          cut_length?: string | null
          cyl_qty?: string | null
          dimensions?: string | null
          file_hyperlink?: string | null
          file_id?: string | null
          item_code?: string
          item_name?: string | null
          last_run?: string | null
          length?: string | null
          location?: string | null
          mileage_m?: string | null
          no_of_colours?: string | null
          qr_code?: string | null
          remarks?: string | null
          total_runs?: string | null
          ups?: number | null
        }
        Relationships: []
      }
      stock: {
        Row: {
          created_at: string | null
          current_qty: number | null
          id: string
          item_code: string
          last_updated: string | null
          opening_qty: number | null
          reserved_qty: number | null
        }
        Insert: {
          created_at?: string | null
          current_qty?: number | null
          id?: string
          item_code: string
          last_updated?: string | null
          opening_qty?: number | null
          reserved_qty?: number | null
        }
        Update: {
          created_at?: string | null
          current_qty?: number | null
          id?: string
          item_code?: string
          last_updated?: string | null
          opening_qty?: number | null
          reserved_qty?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_item_code_fkey"
            columns: ["item_code"]
            isOneToOne: true
            referencedRelation: "item_master"
            referencedColumns: ["item_code"]
          },
          {
            foreignKeyName: "stock_item_code_fkey"
            columns: ["item_code"]
            isOneToOne: true
            referencedRelation: "stock_summary"
            referencedColumns: ["item_code"]
          },
        ]
      }
      stock_analytics_queries: {
        Row: {
          executed_at: string | null
          execution_time_ms: number | null
          filters: Json | null
          id: string
          organization_id: string | null
          query_type: string
          result_count: number | null
          user_id: string | null
        }
        Insert: {
          executed_at?: string | null
          execution_time_ms?: number | null
          filters?: Json | null
          id?: string
          organization_id?: string | null
          query_type: string
          result_count?: number | null
          user_id?: string | null
        }
        Update: {
          executed_at?: string | null
          execution_time_ms?: number | null
          filters?: Json | null
          id?: string
          organization_id?: string | null
          query_type?: string
          result_count?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_analytics_queries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      substrate_catalog: {
        Row: {
          color: string | null
          cost_per_unit: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          length_m: number | null
          substrate_name: string
          substrate_type: string
          supplier: string | null
          thickness_micron: number | null
          updated_at: string | null
          width_mm: number | null
        }
        Insert: {
          color?: string | null
          cost_per_unit?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          length_m?: number | null
          substrate_name: string
          substrate_type: string
          supplier?: string | null
          thickness_micron?: number | null
          updated_at?: string | null
          width_mm?: number | null
        }
        Update: {
          color?: string | null
          cost_per_unit?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          length_m?: number | null
          substrate_name?: string
          substrate_type?: string
          supplier?: string | null
          thickness_micron?: number | null
          updated_at?: string | null
          width_mm?: number | null
        }
        Relationships: []
      }
      substrate_master_dkpkl: {
        Row: {
          gsm: number | null
          micron: number | null
          substrate: string | null
          substrate_name: string
        }
        Insert: {
          gsm?: number | null
          micron?: number | null
          substrate?: string | null
          substrate_name: string
        }
        Update: {
          gsm?: number | null
          micron?: number | null
          substrate?: string | null
          substrate_name?: string
        }
        Relationships: []
      }
      substrate_master_dkpkl_bak: {
        Row: {
          GSM: number | null
          Micron: number | null
          Substrate: string | null
          Substrate_Name: string | null
        }
        Insert: {
          GSM?: number | null
          Micron?: number | null
          Substrate?: string | null
          Substrate_Name?: string | null
        }
        Update: {
          GSM?: number | null
          Micron?: number | null
          Substrate?: string | null
          Substrate_Name?: string | null
        }
        Relationships: []
      }
      substrate_master_se: {
        Row: {
          gsm: number | null
          micron: number | null
          substrate: string | null
          substrate_name: string
        }
        Insert: {
          gsm?: number | null
          micron?: number | null
          substrate?: string | null
          substrate_name: string
        }
        Update: {
          gsm?: number | null
          micron?: number | null
          substrate?: string | null
          substrate_name?: string
        }
        Relationships: []
      }
      substrate_master_se_bak: {
        Row: {
          GSM: number | null
          Micron: number | null
          Substrate: string | null
          Substrate_Name: string | null
        }
        Insert: {
          GSM?: number | null
          Micron?: number | null
          Substrate?: string | null
          Substrate_Name?: string | null
        }
        Update: {
          GSM?: number | null
          Micron?: number | null
          Substrate?: string | null
          Substrate_Name?: string | null
        }
        Relationships: []
      }
      templates: {
        Row: {
          created_at: string | null
          id: string
          organisation_id: string | null
          smeta_point_id: number | null
          template_url: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          organisation_id?: string | null
          smeta_point_id?: number | null
          template_url?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          organisation_id?: string | null
          smeta_point_id?: number | null
          template_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "templates_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "templates_smeta_point_id_fkey"
            columns: ["smeta_point_id"]
            isOneToOne: false
            referencedRelation: "smeta_points"
            referencedColumns: ["id"]
          },
        ]
      }
      token_logs: {
        Row: {
          created_at: string | null
          id: string
          job_id: string | null
          note: string | null
          organisation_id: string | null
          tokens_used: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          job_id?: string | null
          note?: string | null
          organisation_id?: string | null
          tokens_used?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          job_id?: string | null
          note?: string | null
          organisation_id?: string | null
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "token_logs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "token_logs_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      uiorn_counter: {
        Row: {
          last_serial: number
          ui_date: string
        }
        Insert: {
          last_serial: number
          ui_date: string
        }
        Update: {
          last_serial?: number
          ui_date?: string
        }
        Relationships: []
      }
      units: {
        Row: {
          created_at: string | null
          location: string | null
          unit_code: string
          unit_id: string
          unit_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          location?: string | null
          unit_code: string
          unit_id?: string
          unit_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          location?: string | null
          unit_code?: string
          unit_id?: string
          unit_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_jobs: {
        Row: {
          created_at: string | null
          enhanced_prompt: string | null
          error_message: string | null
          id: string
          model_url: string | null
          progress: number | null
          prompt: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          enhanced_prompt?: string | null
          error_message?: string | null
          id?: string
          model_url?: string | null
          progress?: number | null
          prompt: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          enhanced_prompt?: string | null
          error_message?: string | null
          id?: string
          model_url?: string | null
          progress?: number | null
          prompt?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          organisation_id: string | null
          role: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          organisation_id?: string | null
          role?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          organisation_id?: string | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      employee_details_enhanced: {
        Row: {
          aadhaar_number: string | null
          active: boolean | null
          age_years: number | null
          base_salary: number | null
          created_at: string | null
          date_of_birth: string | null
          department_code: string | null
          department_name: string | null
          employee_code: string | null
          hra_amount: number | null
          id: string | null
          id_proof_file_path: string | null
          joining_date: string | null
          name: string | null
          other_conv_amount: number | null
          pan_number: string | null
          plant_location: string | null
          uan_number: string | null
          unit_code: string | null
          unit_name: string | null
          updated_at: string | null
          years_of_service: number | null
        }
        Relationships: []
      }
      manufacturing_analytics: {
        Row: {
          active_orders: number | null
          avg_order_quantity: number | null
          completed_orders: number | null
          high_priority_orders: number | null
          on_hold_orders: number | null
          overdue_orders: number | null
          pending_orders: number | null
          unique_customers: number | null
        }
        Relationships: []
      }
      order_process_history: {
        Row: {
          captured_at: string | null
          captured_by: string | null
          current_order_status:
            | Database["public"]["Enums"]["process_status"]
            | null
          customer_name: string | null
          id: string | null
          metric: string | null
          order_created_at: string | null
          order_quantity: number | null
          priority_level: string | null
          product_description: string | null
          stage: Database["public"]["Enums"]["process_stage"] | null
          txt_value: string | null
          uiorn: string | null
          value: number | null
        }
        Relationships: [
          {
            foreignKeyName: "process_logs_se_captured_by_fkey"
            columns: ["captured_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_logs_se_uiorn_fkey"
            columns: ["uiorn"]
            isOneToOne: false
            referencedRelation: "orders_dashboard_se"
            referencedColumns: ["uiorn"]
          },
        ]
      }
      panchkula_payroll_calculation: {
        Row: {
          base_salary: number | null
          calculation_date: string | null
          casual_leave_balance: number | null
          earned_leave_balance: number | null
          employee_code: string | null
          employee_id: string | null
          employee_name: string | null
          hra_amount: number | null
          joining_date: string | null
          other_conv_amount: number | null
          uan_number: string | null
          unit_code: string | null
          unit_name: string | null
        }
        Relationships: []
      }
      payroll_calculation_enhanced: {
        Row: {
          base_salary: number | null
          casual_leave_balance: number | null
          earned_leave_balance: number | null
          employee_id: string | null
          employee_name: string | null
          hra_amount: number | null
          other_conv_amount: number | null
          uan_number: string | null
          unit_code: string | null
          unit_id: string | null
          unit_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_employees_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["unit_id"]
          },
        ]
      }
      satguru_analytics_consumption_patterns: {
        Row: {
          active_months: number | null
          avg_monthly_consumption: number | null
          category_name: string | null
          coefficient_of_variation: number | null
          consumption_pattern: string | null
          consumption_stddev: number | null
          forecast_next_month: number | null
          item_code: string | null
          item_name: string | null
          last_refreshed: string | null
          safety_stock_recommended: number | null
          seasonality_score: number | null
          total_consumption_24m: number | null
          trend_direction: string | null
          trend_percentage: number | null
        }
        Relationships: [
          {
            foreignKeyName: "satguru_issue_log_item_code_fkey"
            columns: ["item_code"]
            isOneToOne: false
            referencedRelation: "satguru_item_master"
            referencedColumns: ["item_code"]
          },
          {
            foreignKeyName: "satguru_issue_log_item_code_fkey"
            columns: ["item_code"]
            isOneToOne: false
            referencedRelation: "satguru_stock_summary"
            referencedColumns: ["item_code"]
          },
        ]
      }
      satguru_category_stats: {
        Row: {
          active_items: number | null
          category_name: string | null
          consumable_items: number | null
          created_at: string | null
          description: string | null
          fg_items: number | null
          id: string | null
          packaging_items: number | null
          rm_items: number | null
          total_items: number | null
          updated_at: string | null
        }
        Relationships: []
      }
      satguru_stock_summary: {
        Row: {
          category_name: string | null
          current_qty: number | null
          days_of_cover: number | null
          item_code: string | null
          item_name: string | null
          opening_qty: number | null
          total_grn_qty: number | null
          total_issued_qty: number | null
        }
        Relationships: []
      }
      satguru_stock_summary_view: {
        Row: {
          category_id: string | null
          category_name: string | null
          consumption_30_days: number | null
          current_qty: number | null
          item_code: string | null
          item_name: string | null
          last_updated: string | null
          received_30_days: number | null
          reorder_level: number | null
          stock_status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "satguru_item_master_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "satguru_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "satguru_item_master_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "satguru_category_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "satguru_stock_item_code_fkey"
            columns: ["item_code"]
            isOneToOne: true
            referencedRelation: "satguru_item_master"
            referencedColumns: ["item_code"]
          },
          {
            foreignKeyName: "satguru_stock_item_code_fkey"
            columns: ["item_code"]
            isOneToOne: true
            referencedRelation: "satguru_stock_summary"
            referencedColumns: ["item_code"]
          },
        ]
      }
      stock_summary: {
        Row: {
          calculated_qty: number | null
          category_id: string | null
          category_name: string | null
          current_qty: number | null
          days_of_cover: number | null
          issue_30d: number | null
          item_code: string | null
          item_id: string | null
          item_name: string | null
          last_updated: string | null
          opening_qty: number | null
          stock_validation_status: string | null
          total_grn_qty: number | null
          total_issued_qty: number | null
        }
        Relationships: []
      }
      v_stage_rollup_dkpkl: {
        Row: {
          last_done: string | null
          overall_status: string | null
          stage_map: Json | null
          uiorn: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stage_status_dkpkl_uiorn_fkey"
            columns: ["uiorn"]
            isOneToOne: false
            referencedRelation: "orders_dashboard_dkpkl"
            referencedColumns: ["uiorn"]
          },
        ]
      }
    }
    Functions: {
      accrue_monthly_leaves: {
        Args: { p_year: number; p_month: number }
        Returns: number
      }
      advanced_demand_forecast: {
        Args: { p_item_code: string; p_forecast_months?: number }
        Returns: {
          forecast_month: string
          simple_moving_average: number
          exponential_smoothing: number
          linear_trend: number
          seasonal_adjusted: number
          confidence_score: number
          recommended_forecast: number
        }[]
      }
      bytea_to_text: {
        Args: { data: string }
        Returns: string
      }
      calculate_order_progress: {
        Args: Record<PropertyKey, never> | { p_uiorn: string }
        Returns: {
          uiorn: string
          progress_percentage: number
          current_stage: string
          estimated_completion: string
        }[]
      }
      calculate_panchkula_salary: {
        Args: {
          p_employee_id: string
          p_month: string
          p_basic_salary: number
          p_hra_amount: number
          p_other_allowances?: number
        }
        Returns: {
          basic_earned: number
          hra_earned: number
          other_earned: number
          gross_salary: number
          epf_deduction: number
          esi_deduction: number
          lwf_deduction: number
          total_deductions: number
          net_salary: number
          paid_days: number
          present_days: number
          weekly_offs: number
          leave_days: number
        }[]
      }
      check_attendance_data_consistency: {
        Args: Record<PropertyKey, never>
        Returns: {
          employee_name: string
          attendance_date: string
          current_status: string
          hours_worked: number
          suggested_status: string
          reason: string
        }[]
      }
      check_duplicate_process_log: {
        Args: {
          p_uiorn: string
          p_stage: Database["public"]["Enums"]["process_stage"]
          p_metric: string
          p_value?: number
          p_txt_value?: string
          p_minutes_threshold?: number
        }
        Returns: boolean
      }
      cleanup_stuck_jobs: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      correct_sunday_attendance: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      create_prompt_and_job: {
        Args: { p_user_id: string; p_prompt_data: Json; p_job_type?: string }
        Returns: {
          prompt_id: string
          job_id: string
        }[]
      }
      delete_deck_viscosity_reading: {
        Args: { p_reading_id: string }
        Returns: boolean
      }
      delete_job: {
        Args: { p_job_id: string; p_user_id: string }
        Returns: undefined
      }
      delete_process_log: {
        Args: { log_id: string }
        Returns: undefined
      }
      detect_consumption_anomalies: {
        Args: { p_item_code?: string; p_threshold_factor?: number }
        Returns: {
          item_code: string
          item_name: string
          anomaly_date: string
          expected_consumption: number
          actual_consumption: number
          deviation_factor: number
          anomaly_type: string
        }[]
      }
      enhanced_employee_lookup: {
        Args: { p_employee_identifier: string }
        Returns: {
          employee_id: string
          employee_name: string
          uan_number: string
          employee_code: string
          unit_id: string
        }[]
      }
      ensure_admin_users_setup: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      export_employee_master: {
        Args: { p_unit_id?: string }
        Returns: {
          employee_code: string
          employee_name: string
          uan_number: string
          unit_code: string
          unit_name: string
          joining_date: string
          base_salary: number
          active: boolean
        }[]
      }
      export_employee_master_enhanced: {
        Args: Record<PropertyKey, never>
        Returns: {
          employee_code: string
          employee_name: string
          uan_number: string
          unit_code: string
          unit_name: string
          plant_location: string
          department_name: string
          joining_date: string
          date_of_birth: string
          years_of_service: number
          age_years: number
          base_salary: number
          active: boolean
        }[]
      }
      generate_asset_code: {
        Args: { p_location_code: string; p_category_code: string }
        Returns: string
      }
      generate_employee_code: {
        Args: { p_unit_id: string }
        Returns: string
      }
      generate_item_code_with_validation: {
        Args: {
          category_name: string
          qualifier?: string
          size_mm?: string
          gsm?: number
        }
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_deck_viscosity_readings: {
        Args: { p_deck_id: string }
        Returns: {
          captured_at: string
          captured_by: string | null
          deck_id: string
          id: string
          job_id: string | null
          viscosity_cps: number
        }[]
      }
      get_order_process_history: {
        Args: { p_uiorn: string }
        Returns: {
          id: string
          stage: string
          metric: string
          value: number
          txt_value: string
          captured_at: string
          captured_by: string
          customer_name: string
          product_description: string
        }[]
      }
      get_process_statistics: {
        Args: Record<PropertyKey, never>
        Returns: {
          stage: string
          total_entries: number
          latest_activity: string
          unique_orders: number
        }[]
      }
      get_user_jobs_safe: {
        Args: { p_user_id: string }
        Returns: {
          id: string
          prompt_id: string
          user_id: string
          status: string
          progress: number
          result_url: string
          job_type: string
          error_message: string
          created_at: string
          updated_at: string
          prompt_data: Json
        }[]
      }
      get_workflow_bottlenecks: {
        Args: Record<PropertyKey, never>
        Returns: {
          stage: string
          avg_processing_time: number
          pending_orders: number
          bottleneck_score: number
        }[]
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      has_role: {
        Args: { user_role: string }
        Returns: boolean
      }
      http: {
        Args: { request: Database["public"]["CompositeTypes"]["http_request"] }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_delete: {
        Args:
          | { uri: string }
          | { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_get: {
        Args: { uri: string } | { uri: string; data: Json }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_head: {
        Args: { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_header: {
        Args: { field: string; value: string }
        Returns: Database["public"]["CompositeTypes"]["http_header"]
      }
      http_list_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: {
          curlopt: string
          value: string
        }[]
      }
      http_patch: {
        Args: { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_post: {
        Args:
          | { uri: string; content: string; content_type: string }
          | { uri: string; data: Json }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_put: {
        Args: { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_reset_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      http_set_curlopt: {
        Args: { curlopt: string; value: string }
        Returns: boolean
      }
      import_requirements: {
        Args: { csv_url: string }
        Returns: undefined
      }
      insert_attendance_from_csv: {
        Args: { rows: Json }
        Returns: Json
      }
      insert_attendance_from_csv_enhanced: {
        Args: { rows: Json }
        Returns: Json
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_sunday: {
        Args: { input_date: string }
        Returns: boolean
      }
      map_documents_to_smeta: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      map_documents_to_smeta4: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      ml_demand_prediction: {
        Args: {
          p_item_code: string
          p_forecast_horizon?: number
          p_confidence_level?: number
        }
        Returns: {
          forecast_period: string
          algorithm: string
          predicted_demand: number
          confidence_interval_lower: number
          confidence_interval_upper: number
          model_accuracy: number
          feature_importance: Json
        }[]
      }
      next_uiorn: {
        Args: { p_date?: string }
        Returns: string
      }
      next_uiorn_by_date: {
        Args: { p_date?: string }
        Returns: string
      }
      optimize_inventory_levels: {
        Args: { p_category_id?: string; p_service_level?: number }
        Returns: {
          item_code: string
          item_name: string
          current_stock: number
          recommended_reorder_point: number
          recommended_max_stock: number
          economic_order_quantity: number
          total_cost_reduction: number
          implementation_priority: string
        }[]
      }
      process_queued_jobs: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      refresh_analytics_materialized_views: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      refresh_manufacturing_analytics: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      retry_job: {
        Args: { p_job_id: string; p_user_id: string }
        Returns: boolean
      }
      rpc_upsert_stage_status_dkpkl: {
        Args: {
          p_uiorn: string
          p_stage: Database["public"]["Enums"]["stage"]
          p_status: string
          p_remarks?: string
        }
        Returns: undefined
      }
      satguru_check_stock_thresholds: {
        Args: Record<PropertyKey, never>
        Returns: {
          item_code: string
          item_name: string
          current_qty: number
          reorder_level: number
          status: string
        }[]
      }
      satguru_generate_enhanced_item_code: {
        Args: {
          category_name: string
          usage_type?: string
          qualifier?: string
          size_mm?: string
          gsm?: number
        }
        Returns: string
      }
      satguru_generate_item_code: {
        Args: {
          category_name: string
          qualifier?: string
          size_mm?: string
          gsm?: number
        }
        Returns: string
      }
      satguru_get_stock_movement_analysis: {
        Args: { p_item_code?: string; p_category_id?: string; p_days?: number }
        Returns: {
          item_code: string
          item_name: string
          opening_stock: number
          total_received: number
          total_issued: number
          closing_stock: number
          net_movement: number
          movement_percentage: number
        }[]
      }
      satguru_get_workflow_status_counts: {
        Args: { p_uiorn?: string }
        Returns: {
          process_name: string
          pending_count: number
          started_count: number
          in_progress_count: number
          completed_count: number
          on_hold_count: number
          cancelled_count: number
          total_count: number
        }[]
      }
      satguru_get_workflow_summary: {
        Args: { p_uiorn: string }
        Returns: {
          uiorn: string
          customer_name: string
          order_date: string
          delivery_date: string
          order_status: Database["public"]["Enums"]["process_status"]
          order_punching_status: Database["public"]["Enums"]["process_status"]
          gravure_printing_status: Database["public"]["Enums"]["process_status"]
          lamination_status: Database["public"]["Enums"]["process_status"]
          adhesive_coating_status: Database["public"]["Enums"]["process_status"]
          slitting_status: Database["public"]["Enums"]["process_status"]
          packaging_projects_status: Database["public"]["Enums"]["process_status"]
          material_selection_status: Database["public"]["Enums"]["process_status"]
          packaging_selection_status: Database["public"]["Enums"]["process_status"]
          artwork_upload_status: Database["public"]["Enums"]["process_status"]
          cost_estimate_status: Database["public"]["Enums"]["process_status"]
          overall_completion_percentage: number
        }[]
      }
      satguru_log_analytics_query: {
        Args: {
          p_query_type: string
          p_filters?: Json
          p_execution_time_ms?: number
          p_result_count?: number
        }
        Returns: string
      }
      satguru_update_item_code: {
        Args: {
          p_old_item_code: string
          p_new_item_code: string
          p_reason?: string
        }
        Returns: boolean
      }
      satguru_validate_item_code_format: {
        Args: { p_item_code: string; p_usage_type: string }
        Returns: boolean
      }
      satguru_validate_stock_transaction: {
        Args: {
          p_item_code: string
          p_transaction_type: string
          p_quantity: number
        }
        Returns: boolean
      }
      satguru_validate_unique_item_code: {
        Args: { p_item_code: string; p_exclude_id?: string }
        Returns: boolean
      }
      search_employees: {
        Args: {
          p_search_term?: string
          p_department_ids?: string[]
          p_unit_ids?: string[]
          p_min_years_service?: number
          p_max_years_service?: number
          p_plant_location?: string
        }
        Returns: {
          aadhaar_number: string | null
          active: boolean | null
          age_years: number | null
          base_salary: number | null
          created_at: string | null
          date_of_birth: string | null
          department_code: string | null
          department_name: string | null
          employee_code: string | null
          hra_amount: number | null
          id: string | null
          id_proof_file_path: string | null
          joining_date: string | null
          name: string | null
          other_conv_amount: number | null
          pan_number: string | null
          plant_location: string | null
          uan_number: string | null
          unit_code: string | null
          unit_name: string | null
          updated_at: string | null
          years_of_service: number | null
        }[]
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      text_to_bytea: {
        Args: { data: string }
        Returns: string
      }
      update_attendance_from_csv: {
        Args: { rows: Json; update_reason: string }
        Returns: Json
      }
      update_job_status: {
        Args: {
          p_job_id: string
          p_status: string
          p_progress?: number
          p_result_url?: string
          p_error_message?: string
          p_job_type?: string
        }
        Returns: undefined
      }
      update_leave_balance: {
        Args: { emp_id: string; days_used: number }
        Returns: undefined
      }
      update_user_approval: {
        Args: { user_id: string; approved: boolean; admin_notes?: string }
        Returns: undefined
      }
      upsert_deck_viscosity: {
        Args: {
          p_deck_id: string
          p_viscosity_cps: number
          p_job_id?: string
          p_captured_by?: string
        }
        Returns: string
      }
      upsert_leave_balances_from_csv: {
        Args: { rows: Json }
        Returns: Json
      }
      upsert_process_log: {
        Args: {
          p_uiorn: string
          p_stage: Database["public"]["Enums"]["process_stage"]
          p_metric: string
          p_value?: number
          p_txt_value?: string
          p_captured_by?: string
        }
        Returns: string
      }
      urlencode: {
        Args: { data: Json } | { string: string } | { string: string }
        Returns: string
      }
      validate_leave_consumption: {
        Args: {
          p_employee_id: string
          p_leave_type: Database["public"]["Enums"]["attendance_status"]
          p_leave_date: string
          p_days?: number
        }
        Returns: boolean
      }
    }
    Enums: {
      asset_condition: "new" | "good" | "fair" | "poor"
      asset_status: "active" | "maintenance" | "retired" | "disposed"
      attendance_status:
        | "PRESENT"
        | "WEEKLY_OFF"
        | "CASUAL_LEAVE"
        | "EARNED_LEAVE"
        | "UNPAID_LEAVE"
      formula_type: "gross_salary" | "deductions" | "net_salary" | "allowances"
      material_type: "PAPER" | "PLASTIC" | "FOIL" | "LAMINATE" | "COMPOSITE"
      media_type: "audio" | "video"
      packaging_type: "POUCH" | "BAG" | "ROLL" | "SHEET" | "CUSTOM"
      process_stage:
        | "PRINTING"
        | "LAMINATION"
        | "ADHESIVE_COATING"
        | "SLITTING"
        | "DISPATCH"
      process_status:
        | "PENDING"
        | "STARTED"
        | "IN_PROGRESS"
        | "COMPLETED"
        | "ON_HOLD"
        | "CANCELLED"
      stage: "printing" | "lamination" | "adhesive" | "slitting" | "dispatch"
      transfer_status: "pending" | "approved" | "rejected" | "completed"
      variable_type: "fixed" | "calculated" | "employee_specific" | "system"
    }
    CompositeTypes: {
      http_header: {
        field: string | null
        value: string | null
      }
      http_request: {
        method: unknown | null
        uri: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content_type: string | null
        content: string | null
      }
      http_response: {
        status: number | null
        content_type: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content: string | null
      }
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
    Enums: {
      asset_condition: ["new", "good", "fair", "poor"],
      asset_status: ["active", "maintenance", "retired", "disposed"],
      attendance_status: [
        "PRESENT",
        "WEEKLY_OFF",
        "CASUAL_LEAVE",
        "EARNED_LEAVE",
        "UNPAID_LEAVE",
      ],
      formula_type: ["gross_salary", "deductions", "net_salary", "allowances"],
      material_type: ["PAPER", "PLASTIC", "FOIL", "LAMINATE", "COMPOSITE"],
      media_type: ["audio", "video"],
      packaging_type: ["POUCH", "BAG", "ROLL", "SHEET", "CUSTOM"],
      process_stage: [
        "PRINTING",
        "LAMINATION",
        "ADHESIVE_COATING",
        "SLITTING",
        "DISPATCH",
      ],
      process_status: [
        "PENDING",
        "STARTED",
        "IN_PROGRESS",
        "COMPLETED",
        "ON_HOLD",
        "CANCELLED",
      ],
      stage: ["printing", "lamination", "adhesive", "slitting", "dispatch"],
      transfer_status: ["pending", "approved", "rejected", "completed"],
      variable_type: ["fixed", "calculated", "employee_specific", "system"],
    },
  },
} as const
