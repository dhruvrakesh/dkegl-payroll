export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
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
      attendance: {
        Row: {
          attendance_date: string
          attendance_id: string
          created_at: string | null
          employee_id: string | null
          hours_worked: number
          overtime_hours: number | null
          unit_id: string | null
          updated_at: string | null
        }
        Insert: {
          attendance_date: string
          attendance_id?: string
          created_at?: string | null
          employee_id?: string | null
          hours_worked: number
          overtime_hours?: number | null
          unit_id?: string | null
          updated_at?: string | null
        }
        Update: {
          attendance_date?: string
          attendance_id?: string
          created_at?: string | null
          employee_id?: string | null
          hours_worked?: number
          overtime_hours?: number | null
          unit_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
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
      master_data_artworks_se: {
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
      payroll_employees: {
        Row: {
          active: boolean | null
          base_salary: number
          created_at: string | null
          id: string
          joining_date: string
          name: string
          uan_number: string
          unit_id: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          base_salary: number
          created_at?: string | null
          id?: string
          joining_date: string
          name: string
          uan_number: string
          unit_id?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          base_salary?: number
          created_at?: string | null
          id?: string
          joining_date?: string
          name?: string
          uan_number?: string
          unit_id?: string | null
          updated_at?: string | null
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
      payroll_settings: {
        Row: {
          created_at: string | null
          effective_from: string
          esi_rate: number
          pf_rate: number
          setting_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          effective_from: string
          esi_rate: number
          pf_rate: number
          setting_id?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          effective_from?: string
          esi_rate?: number
          pf_rate?: number
          setting_id?: string
          updated_at?: string | null
        }
        Relationships: []
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
            referencedRelation: "users"
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
            referencedRelation: "users"
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
          employee_id: string
          id: string
          is_approved: boolean | null
          role: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          employee_id: string
          id: string
          is_approved?: boolean | null
          role?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          employee_id?: string
          id?: string
          is_approved?: boolean | null
          role?: string | null
          updated_at?: string
        }
        Relationships: []
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
      salary_disbursement: {
        Row: {
          advances_deduction: number | null
          base_salary: number
          created_at: string | null
          disbursed_on: string | null
          employee_id: string | null
          esi_deduction: number | null
          month: string
          net_salary: number
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
          created_at?: string | null
          disbursed_on?: string | null
          employee_id?: string | null
          esi_deduction?: number | null
          month: string
          net_salary: number
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
          created_at?: string | null
          disbursed_on?: string | null
          employee_id?: string | null
          esi_deduction?: number | null
          month?: string
          net_salary?: number
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
          unit_id: string
          unit_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          location?: string | null
          unit_id?: string
          unit_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          location?: string | null
          unit_id?: string
          unit_name?: string
          updated_at?: string | null
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
      bytea_to_text: {
        Args: { data: string }
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
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
      is_admin: {
        Args: Record<PropertyKey, never>
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
      next_uiorn: {
        Args: { p_date?: string }
        Returns: string
      }
      next_uiorn_by_date: {
        Args: { p_date?: string }
        Returns: string
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
      update_leave_balance: {
        Args: { emp_id: string; days_used: number }
        Returns: undefined
      }
      update_user_approval: {
        Args: { user_id: string; approved: boolean; admin_notes?: string }
        Returns: undefined
      }
      urlencode: {
        Args: { data: Json } | { string: string } | { string: string }
        Returns: string
      }
    }
    Enums: {
      media_type: "audio" | "video"
      process_stage:
        | "PRINTING"
        | "LAMINATION"
        | "ADHESIVE_COATING"
        | "SLITTING"
        | "DISPATCH"
      stage: "printing" | "lamination" | "adhesive" | "slitting" | "dispatch"
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      media_type: ["audio", "video"],
      process_stage: [
        "PRINTING",
        "LAMINATION",
        "ADHESIVE_COATING",
        "SLITTING",
        "DISPATCH",
      ],
      stage: ["printing", "lamination", "adhesive", "slitting", "dispatch"],
    },
  },
} as const
