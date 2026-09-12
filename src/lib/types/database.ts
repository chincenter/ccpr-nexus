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
      activities: {
        Row: {
          actual: number | null
          archived_at: string | null
          budget: number | null
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          location_id: string | null
          name: string
          notes: string | null
          output_id: string
          priority: Database["public"]["Enums"]["priority_level"]
          project_id: string
          responsible_staff_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["activity_status"]
          target: number | null
          updated_at: string
          updated_by: string | null
          verification_status: Database["public"]["Enums"]["approval_status"]
        }
        Insert: {
          actual?: number | null
          archived_at?: string | null
          budget?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          location_id?: string | null
          name: string
          notes?: string | null
          output_id: string
          priority?: Database["public"]["Enums"]["priority_level"]
          project_id: string
          responsible_staff_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["activity_status"]
          target?: number | null
          updated_at?: string
          updated_by?: string | null
          verification_status?: Database["public"]["Enums"]["approval_status"]
        }
        Update: {
          actual?: number | null
          archived_at?: string | null
          budget?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          location_id?: string | null
          name?: string
          notes?: string | null
          output_id?: string
          priority?: Database["public"]["Enums"]["priority_level"]
          project_id?: string
          responsible_staff_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["activity_status"]
          target?: number | null
          updated_at?: string
          updated_by?: string | null
          verification_status?: Database["public"]["Enums"]["approval_status"]
        }
        Relationships: [
          {
            foreignKeyName: "activities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_output_id_fkey"
            columns: ["output_id"]
            isOneToOne: false
            referencedRelation: "outputs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_responsible_staff_id_fkey"
            columns: ["responsible_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          check_in: string | null
          check_out: string | null
          created_at: string
          created_by: string | null
          date: string
          id: string
          remarks: string | null
          staff_id: string
          status: Database["public"]["Enums"]["attendance_status"]
          updated_at: string
          updated_by: string | null
          work_location: string | null
        }
        Insert: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          created_by?: string | null
          date: string
          id?: string
          remarks?: string | null
          staff_id: string
          status?: Database["public"]["Enums"]["attendance_status"]
          updated_at?: string
          updated_by?: string | null
          work_location?: string | null
        }
        Update: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          created_by?: string | null
          date?: string
          id?: string
          remarks?: string | null
          staff_id?: string
          status?: Database["public"]["Enums"]["attendance_status"]
          updated_at?: string
          updated_by?: string | null
          work_location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          after: Json | null
          before: Json | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          staff_id: string | null
        }
        Insert: {
          action: string
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          staff_id?: string | null
        }
        Update: {
          action?: string
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          staff_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_lines: {
        Row: {
          amount: number
          archived_at: string | null
          budget_id: string
          category: string | null
          created_at: string
          created_by: string | null
          id: string
          line_name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          amount?: number
          archived_at?: string | null
          budget_id: string
          category?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          line_name: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          amount?: number
          archived_at?: string | null
          budget_id?: string
          category?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          line_name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_lines_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_lines_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_lines_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          approved_budget: number
          archived_at: string | null
          created_at: string
          created_by: string | null
          currency: string
          id: string
          notes: string | null
          project_id: string
          revised_budget: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          approved_budget?: number
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          notes?: string | null
          project_id: string
          revised_budget?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          approved_budget?: number
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          notes?: string | null
          project_id?: string
          revised_budget?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budgets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      commitments: {
        Row: {
          amount: number
          archived_at: string | null
          budget_line_id: string
          commitment_date: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          amount: number
          archived_at?: string | null
          budget_line_id: string
          commitment_date?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          amount?: number
          archived_at?: string | null
          budget_line_id?: string
          commitment_date?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commitments_budget_line_id_fkey"
            columns: ["budget_line_id"]
            isOneToOne: false
            referencedRelation: "budget_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commitments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commitments_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          access_level: Database["public"]["Enums"]["document_access_level"]
          archived_at: string | null
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          entity_id: string
          entity_type: string
          id: string
          name: string
          storage_path: string
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          access_level?: Database["public"]["Enums"]["document_access_level"]
          archived_at?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          entity_id: string
          entity_type: string
          id?: string
          name: string
          storage_path: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          access_level?: Database["public"]["Enums"]["document_access_level"]
          archived_at?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          name?: string
          storage_path?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      expenditures: {
        Row: {
          amount: number
          archived_at: string | null
          budget_line_id: string
          created_at: string
          created_by: string | null
          description: string | null
          expense_date: string
          id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          amount: number
          archived_at?: string | null
          budget_line_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expense_date?: string
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          amount?: number
          archived_at?: string | null
          budget_line_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expense_date?: string
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenditures_budget_line_id_fkey"
            columns: ["budget_line_id"]
            isOneToOne: false
            referencedRelation: "budget_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenditures_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenditures_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      indicators: {
        Row: {
          actual: number | null
          archived_at: string | null
          baseline: number | null
          created_at: string
          created_by: string | null
          data_source: string | null
          definition: string | null
          id: string
          name: string
          notes: string | null
          programme_id: string | null
          project_id: string | null
          reporting_period: string | null
          responsible_staff_id: string | null
          result_id: string | null
          result_type:
            | Database["public"]["Enums"]["indicator_result_type"]
            | null
          target: number | null
          unit: string | null
          updated_at: string
          updated_by: string | null
          verification_status: Database["public"]["Enums"]["approval_status"]
        }
        Insert: {
          actual?: number | null
          archived_at?: string | null
          baseline?: number | null
          created_at?: string
          created_by?: string | null
          data_source?: string | null
          definition?: string | null
          id?: string
          name: string
          notes?: string | null
          programme_id?: string | null
          project_id?: string | null
          reporting_period?: string | null
          responsible_staff_id?: string | null
          result_id?: string | null
          result_type?:
            | Database["public"]["Enums"]["indicator_result_type"]
            | null
          target?: number | null
          unit?: string | null
          updated_at?: string
          updated_by?: string | null
          verification_status?: Database["public"]["Enums"]["approval_status"]
        }
        Update: {
          actual?: number | null
          archived_at?: string | null
          baseline?: number | null
          created_at?: string
          created_by?: string | null
          data_source?: string | null
          definition?: string | null
          id?: string
          name?: string
          notes?: string | null
          programme_id?: string | null
          project_id?: string | null
          reporting_period?: string | null
          responsible_staff_id?: string | null
          result_id?: string | null
          result_type?:
            | Database["public"]["Enums"]["indicator_result_type"]
            | null
          target?: number | null
          unit?: string | null
          updated_at?: string
          updated_by?: string | null
          verification_status?: Database["public"]["Enums"]["approval_status"]
        }
        Relationships: [
          {
            foreignKeyName: "indicators_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indicators_programme_id_fkey"
            columns: ["programme_id"]
            isOneToOne: false
            referencedRelation: "programmes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indicators_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indicators_responsible_staff_id_fkey"
            columns: ["responsible_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indicators_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          archived_at: string | null
          coordinates: unknown
          created_at: string
          created_by: string | null
          district: string | null
          id: string
          is_demo: boolean
          is_sensitive: boolean
          location_type: Database["public"]["Enums"]["location_type"]
          name: string
          parent_id: string | null
          state_region: string | null
          township: string | null
          updated_at: string
          updated_by: string | null
          village: string | null
        }
        Insert: {
          archived_at?: string | null
          coordinates?: unknown
          created_at?: string
          created_by?: string | null
          district?: string | null
          id?: string
          is_demo?: boolean
          is_sensitive?: boolean
          location_type: Database["public"]["Enums"]["location_type"]
          name: string
          parent_id?: string | null
          state_region?: string | null
          township?: string | null
          updated_at?: string
          updated_by?: string | null
          village?: string | null
        }
        Update: {
          archived_at?: string | null
          coordinates?: unknown
          created_at?: string
          created_by?: string | null
          district?: string | null
          id?: string
          is_demo?: boolean
          is_sensitive?: boolean
          location_type?: Database["public"]["Enums"]["location_type"]
          name?: string
          parent_id?: string | null
          state_region?: string | null
          township?: string | null
          updated_at?: string
          updated_by?: string | null
          village?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      objectives: {
        Row: {
          archived_at: string | null
          code: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          project_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          code?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          project_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          code?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          project_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objectives_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objectives_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objectives_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      outcomes: {
        Row: {
          archived_at: string | null
          code: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          objective_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          code?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          objective_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          code?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          objective_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outcomes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outcomes_objective_id_fkey"
            columns: ["objective_id"]
            isOneToOne: false
            referencedRelation: "objectives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outcomes_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      outputs: {
        Row: {
          archived_at: string | null
          code: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          outcome_id: string
          target: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          code?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          outcome_id: string
          target?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          code?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          outcome_id?: string
          target?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outputs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outputs_outcome_id_fkey"
            columns: ["outcome_id"]
            isOneToOne: false
            referencedRelation: "outcomes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outputs_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      programme_access: {
        Row: {
          created_at: string
          programme_id: string
          staff_id: string
        }
        Insert: {
          created_at?: string
          programme_id: string
          staff_id: string
        }
        Update: {
          created_at?: string
          programme_id?: string
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "programme_access_programme_id_fkey"
            columns: ["programme_id"]
            isOneToOne: false
            referencedRelation: "programmes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programme_access_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      programmes: {
        Row: {
          archived_at: string | null
          category: Database["public"]["Enums"]["programme_category"]
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          is_demo: boolean
          lead_staff_id: string | null
          name: string
          start_date: string | null
          status: Database["public"]["Enums"]["lifecycle_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          category: Database["public"]["Enums"]["programme_category"]
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_demo?: boolean
          lead_staff_id?: string | null
          name: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["lifecycle_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          category?: Database["public"]["Enums"]["programme_category"]
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_demo?: boolean
          lead_staff_id?: string | null
          name?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["lifecycle_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "programmes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programmes_lead_staff_id_fkey"
            columns: ["lead_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programmes_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      project_locations: {
        Row: {
          created_at: string
          location_id: string
          project_id: string
        }
        Insert: {
          created_at?: string
          location_id: string
          project_id: string
        }
        Update: {
          created_at?: string
          location_id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_locations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_locations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_team: {
        Row: {
          created_at: string
          project_id: string
          role_on_project: string
          staff_id: string
        }
        Insert: {
          created_at?: string
          project_id: string
          role_on_project?: string
          staff_id: string
        }
        Update: {
          created_at?: string
          project_id?: string
          role_on_project?: string
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_team_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_team_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          archived_at: string | null
          budget: number | null
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          donor: string | null
          end_date: string | null
          id: string
          is_demo: boolean
          name: string
          programme_id: string
          project_officer_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["lifecycle_status"]
          target_beneficiaries: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          budget?: number | null
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          donor?: string | null
          end_date?: string | null
          id?: string
          is_demo?: boolean
          name: string
          programme_id: string
          project_officer_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["lifecycle_status"]
          target_beneficiaries?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          budget?: number | null
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          donor?: string | null
          end_date?: string | null
          id?: string
          is_demo?: boolean
          name?: string
          programme_id?: string
          project_officer_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["lifecycle_status"]
          target_beneficiaries?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_programme_id_fkey"
            columns: ["programme_id"]
            isOneToOne: false
            referencedRelation: "programmes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_project_officer_id_fkey"
            columns: ["project_officer_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      risks: {
        Row: {
          archived_at: string | null
          category: Database["public"]["Enums"]["risk_category"]
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          impact: Database["public"]["Enums"]["risk_level"]
          likelihood: Database["public"]["Enums"]["risk_level"]
          mitigation: string | null
          programme_id: string | null
          project_id: string | null
          responsible_staff_id: string | null
          review_date: string | null
          status: Database["public"]["Enums"]["risk_status"]
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          category?: Database["public"]["Enums"]["risk_category"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          impact?: Database["public"]["Enums"]["risk_level"]
          likelihood?: Database["public"]["Enums"]["risk_level"]
          mitigation?: string | null
          programme_id?: string | null
          project_id?: string | null
          responsible_staff_id?: string | null
          review_date?: string | null
          status?: Database["public"]["Enums"]["risk_status"]
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          category?: Database["public"]["Enums"]["risk_category"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          impact?: Database["public"]["Enums"]["risk_level"]
          likelihood?: Database["public"]["Enums"]["risk_level"]
          mitigation?: string | null
          programme_id?: string | null
          project_id?: string | null
          responsible_staff_id?: string | null
          review_date?: string | null
          status?: Database["public"]["Enums"]["risk_status"]
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "risks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risks_programme_id_fkey"
            columns: ["programme_id"]
            isOneToOne: false
            referencedRelation: "programmes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risks_responsible_staff_id_fkey"
            columns: ["responsible_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risks_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          created_at: string
          created_by: string | null
          email: string
          end_date: string | null
          full_name: string
          id: string
          is_active: boolean
          is_demo: boolean
          job_title: string | null
          phone: string | null
          start_date: string | null
          system_role: Database["public"]["Enums"]["system_role"]
          updated_at: string
          updated_by: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email: string
          end_date?: string | null
          full_name: string
          id?: string
          is_active?: boolean
          is_demo?: boolean
          job_title?: string | null
          phone?: string | null
          start_date?: string | null
          system_role?: Database["public"]["Enums"]["system_role"]
          updated_at?: string
          updated_by?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string
          end_date?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          is_demo?: boolean
          job_title?: string | null
          phone?: string | null
          start_date?: string | null
          system_role?: Database["public"]["Enums"]["system_role"]
          updated_at?: string
          updated_by?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          activity_id: string
          archived_at: string | null
          created_at: string
          created_by: string | null
          dependency_task_id: string | null
          description: string | null
          due_date: string | null
          id: string
          name: string
          notes: string | null
          priority: Database["public"]["Enums"]["priority_level"]
          progress: number
          responsible_staff_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["task_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          activity_id: string
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          dependency_task_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          name: string
          notes?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          progress?: number
          responsible_staff_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          activity_id?: string
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          dependency_task_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          name?: string
          notes?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          progress?: number
          responsible_staff_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_dependency_task_id_fkey"
            columns: ["dependency_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_responsible_staff_id_fkey"
            columns: ["responsible_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
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
      activity_status:
        | "not_started"
        | "ongoing"
        | "completed"
        | "delayed"
        | "cancelled"
      approval_status:
        | "draft"
        | "submitted"
        | "under_review"
        | "approved"
        | "published"
      attendance_status:
        | "present"
        | "leave"
        | "absent"
        | "field_duty"
        | "remote"
      document_access_level: "standard" | "restricted"
      indicator_result_type: "objective" | "outcome" | "output"
      lifecycle_status:
        | "planning"
        | "active"
        | "on_hold"
        | "completed"
        | "cancelled"
      location_type:
        | "state_region"
        | "district"
        | "township"
        | "village"
        | "site"
      priority_level: "low" | "medium" | "high" | "critical"
      programme_category:
        | "humanitarian"
        | "mine_action"
        | "health"
        | "governance"
        | "peacebuilding"
        | "research_policy"
        | "other"
      risk_category:
        | "operational"
        | "financial"
        | "security"
        | "reputational"
        | "programmatic"
        | "compliance"
        | "other"
      risk_level: "low" | "medium" | "high"
      risk_status: "open" | "mitigating" | "monitoring" | "closed"
      system_role:
        | "super_admin"
        | "executive"
        | "programme_manager"
        | "project_officer"
        | "project_assistant"
        | "me_meal"
        | "finance"
        | "viewer"
      task_status:
        | "not_started"
        | "in_progress"
        | "completed"
        | "blocked"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database["public"]

export type Tables<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Row"]
export type TablesInsert<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Update"]
export type Enums<T extends keyof DefaultSchema["Enums"]> =
  DefaultSchema["Enums"][T]
