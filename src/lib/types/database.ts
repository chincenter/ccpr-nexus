export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
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
      assistance_plans: {
        Row: {
          activity_id: string | null
          archived_at: string | null
          assistance_type: Database["public"]["Enums"]["assistance_type"]
          created_at: string
          created_by: string | null
          end_date: string | null
          id: string
          is_demo: boolean
          location_id: string | null
          name: string
          planned_quantity: number | null
          project_id: string
          responsible_staff_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["assistance_plan_status"]
          target_beneficiaries: number | null
          target_criteria: string | null
          target_households: number | null
          unit: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          activity_id?: string | null
          archived_at?: string | null
          assistance_type?: Database["public"]["Enums"]["assistance_type"]
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          is_demo?: boolean
          location_id?: string | null
          name: string
          planned_quantity?: number | null
          project_id: string
          responsible_staff_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["assistance_plan_status"]
          target_beneficiaries?: number | null
          target_criteria?: string | null
          target_households?: number | null
          unit?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          activity_id?: string | null
          archived_at?: string | null
          assistance_type?: Database["public"]["Enums"]["assistance_type"]
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          is_demo?: boolean
          location_id?: string | null
          name?: string
          planned_quantity?: number | null
          project_id?: string
          responsible_staff_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["assistance_plan_status"]
          target_beneficiaries?: number | null
          target_criteria?: string | null
          target_households?: number | null
          unit?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assistance_plans_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assistance_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assistance_plans_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assistance_plans_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assistance_plans_responsible_staff_id_fkey"
            columns: ["responsible_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assistance_plans_updated_by_fkey"
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
      beneficiaries: {
        Row: {
          age_group: Database["public"]["Enums"]["age_group"]
          archived_at: string | null
          beneficiary_code: string
          created_at: string
          created_by: string | null
          gender: string | null
          household_id: string
          id: string
          is_demo: boolean
          updated_at: string
          updated_by: string | null
          vulnerability_category: string | null
        }
        Insert: {
          age_group?: Database["public"]["Enums"]["age_group"]
          archived_at?: string | null
          beneficiary_code: string
          created_at?: string
          created_by?: string | null
          gender?: string | null
          household_id: string
          id?: string
          is_demo?: boolean
          updated_at?: string
          updated_by?: string | null
          vulnerability_category?: string | null
        }
        Update: {
          age_group?: Database["public"]["Enums"]["age_group"]
          archived_at?: string | null
          beneficiary_code?: string
          created_at?: string
          created_by?: string | null
          gender?: string | null
          household_id?: string
          id?: string
          is_demo?: boolean
          updated_at?: string
          updated_by?: string | null
          vulnerability_category?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "beneficiaries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beneficiaries_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beneficiaries_updated_by_fkey"
            columns: ["updated_by"]
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
      consultation_stakeholders: {
        Row: {
          consultation_id: string
          created_at: string
          stakeholder_id: string
        }
        Insert: {
          consultation_id: string
          created_at?: string
          stakeholder_id: string
        }
        Update: {
          consultation_id?: string
          created_at?: string
          stakeholder_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultation_stakeholders_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_stakeholders_stakeholder_id_fkey"
            columns: ["stakeholder_id"]
            isOneToOne: false
            referencedRelation: "stakeholders"
            referencedColumns: ["id"]
          },
        ]
      }
      consultations: {
        Row: {
          archived_at: string | null
          consultation_date: string
          created_at: string
          created_by: string | null
          facilitator_staff_id: string | null
          id: string
          is_demo: boolean
          location_id: string | null
          programme_id: string | null
          project_id: string | null
          summary: string | null
          topic: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          consultation_date?: string
          created_at?: string
          created_by?: string | null
          facilitator_staff_id?: string | null
          id?: string
          is_demo?: boolean
          location_id?: string | null
          programme_id?: string | null
          project_id?: string | null
          summary?: string | null
          topic: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          consultation_date?: string
          created_at?: string
          created_by?: string | null
          facilitator_staff_id?: string | null
          id?: string
          is_demo?: boolean
          location_id?: string | null
          programme_id?: string | null
          project_id?: string | null
          summary?: string | null
          topic?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consultations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_facilitator_staff_id_fkey"
            columns: ["facilitator_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_programme_id_fkey"
            columns: ["programme_id"]
            isOneToOne: false
            referencedRelation: "programmes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      decisions: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string | null
          decision_date: string
          decision_text: string
          id: string
          is_demo: boolean
          programme_id: string | null
          project_id: string | null
          recommendation_id: string | null
          responsible_body: string | null
          status: Database["public"]["Enums"]["case_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          decision_date?: string
          decision_text: string
          id?: string
          is_demo?: boolean
          programme_id?: string | null
          project_id?: string | null
          recommendation_id?: string | null
          responsible_body?: string | null
          status?: Database["public"]["Enums"]["case_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          decision_date?: string
          decision_text?: string
          id?: string
          is_demo?: boolean
          programme_id?: string | null
          project_id?: string | null
          recommendation_id?: string | null
          responsible_body?: string | null
          status?: Database["public"]["Enums"]["case_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "decisions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisions_programme_id_fkey"
            columns: ["programme_id"]
            isOneToOne: false
            referencedRelation: "programmes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisions_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "recommendations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisions_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      distribution_items: {
        Row: {
          archived_at: string | null
          beneficiary_id: string | null
          created_at: string
          created_by: string | null
          distribution_id: string
          household_id: string | null
          id: string
          quantity: number
        }
        Insert: {
          archived_at?: string | null
          beneficiary_id?: string | null
          created_at?: string
          created_by?: string | null
          distribution_id: string
          household_id?: string | null
          id?: string
          quantity: number
        }
        Update: {
          archived_at?: string | null
          beneficiary_id?: string | null
          created_at?: string
          created_by?: string | null
          distribution_id?: string
          household_id?: string | null
          id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "distribution_items_beneficiary_id_fkey"
            columns: ["beneficiary_id"]
            isOneToOne: false
            referencedRelation: "beneficiaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distribution_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distribution_items_distribution_id_fkey"
            columns: ["distribution_id"]
            isOneToOne: false
            referencedRelation: "distributions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distribution_items_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      distributions: {
        Row: {
          archived_at: string | null
          assistance_plan_id: string | null
          assistance_type: Database["public"]["Enums"]["assistance_type"]
          conducted_by: string | null
          created_at: string
          created_by: string | null
          distribution_date: string
          id: string
          is_demo: boolean
          location_id: string | null
          notes: string | null
          project_id: string
          status: Database["public"]["Enums"]["distribution_status"]
          unit: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          assistance_plan_id?: string | null
          assistance_type?: Database["public"]["Enums"]["assistance_type"]
          conducted_by?: string | null
          created_at?: string
          created_by?: string | null
          distribution_date?: string
          id?: string
          is_demo?: boolean
          location_id?: string | null
          notes?: string | null
          project_id: string
          status?: Database["public"]["Enums"]["distribution_status"]
          unit?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          assistance_plan_id?: string | null
          assistance_type?: Database["public"]["Enums"]["assistance_type"]
          conducted_by?: string | null
          created_at?: string
          created_by?: string | null
          distribution_date?: string
          id?: string
          is_demo?: boolean
          location_id?: string | null
          notes?: string | null
          project_id?: string
          status?: Database["public"]["Enums"]["distribution_status"]
          unit?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "distributions_assistance_plan_id_fkey"
            columns: ["assistance_plan_id"]
            isOneToOne: false
            referencedRelation: "assistance_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distributions_conducted_by_fkey"
            columns: ["conducted_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distributions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distributions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distributions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distributions_updated_by_fkey"
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
      governance_actions: {
        Row: {
          action_description: string
          archived_at: string | null
          created_at: string
          created_by: string | null
          decision_id: string | null
          due_date: string | null
          follow_up_notes: string | null
          id: string
          is_demo: boolean
          programme_id: string | null
          project_id: string | null
          responsible_staff_id: string | null
          status: Database["public"]["Enums"]["task_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          action_description: string
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          decision_id?: string | null
          due_date?: string | null
          follow_up_notes?: string | null
          id?: string
          is_demo?: boolean
          programme_id?: string | null
          project_id?: string | null
          responsible_staff_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          action_description?: string
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          decision_id?: string | null
          due_date?: string | null
          follow_up_notes?: string | null
          id?: string
          is_demo?: boolean
          programme_id?: string | null
          project_id?: string | null
          responsible_staff_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "governance_actions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "governance_actions_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "governance_actions_programme_id_fkey"
            columns: ["programme_id"]
            isOneToOne: false
            referencedRelation: "programmes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "governance_actions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "governance_actions_responsible_staff_id_fkey"
            columns: ["responsible_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "governance_actions_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      health_facilities: {
        Row: {
          archived_at: string | null
          contact_person: string | null
          contact_phone: string | null
          created_at: string
          created_by: string | null
          facility_type: Database["public"]["Enums"]["facility_type"]
          id: string
          is_demo: boolean
          location_id: string | null
          name: string
          project_id: string
          status: Database["public"]["Enums"]["lifecycle_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          facility_type?: Database["public"]["Enums"]["facility_type"]
          id?: string
          is_demo?: boolean
          location_id?: string | null
          name: string
          project_id: string
          status?: Database["public"]["Enums"]["lifecycle_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          facility_type?: Database["public"]["Enums"]["facility_type"]
          id?: string
          is_demo?: boolean
          location_id?: string | null
          name?: string
          project_id?: string
          status?: Database["public"]["Enums"]["lifecycle_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "health_facilities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_facilities_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_facilities_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_facilities_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      health_outreach: {
        Row: {
          activity_description: string | null
          archived_at: string | null
          created_at: string
          created_by: string | null
          facility_id: string | null
          female_served: number | null
          id: string
          is_demo: boolean
          location_id: string | null
          male_served: number | null
          outreach_date: string
          people_served: number | null
          project_id: string
          responsible_staff_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          activity_description?: string | null
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          facility_id?: string | null
          female_served?: number | null
          id?: string
          is_demo?: boolean
          location_id?: string | null
          male_served?: number | null
          outreach_date?: string
          people_served?: number | null
          project_id: string
          responsible_staff_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          activity_description?: string | null
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          facility_id?: string | null
          female_served?: number | null
          id?: string
          is_demo?: boolean
          location_id?: string | null
          male_served?: number | null
          outreach_date?: string
          people_served?: number | null
          project_id?: string
          responsible_staff_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "health_outreach_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_outreach_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "health_facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_outreach_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_outreach_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_outreach_responsible_staff_id_fkey"
            columns: ["responsible_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_outreach_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      health_referrals: {
        Row: {
          age_group: Database["public"]["Enums"]["age_group"] | null
          archived_at: string | null
          created_at: string
          created_by: string | null
          facility_id: string | null
          gender: string | null
          id: string
          is_demo: boolean
          project_id: string
          reason: string | null
          referral_date: string
          referred_to: string | null
          responsible_staff_id: string | null
          status: Database["public"]["Enums"]["case_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          age_group?: Database["public"]["Enums"]["age_group"] | null
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          facility_id?: string | null
          gender?: string | null
          id?: string
          is_demo?: boolean
          project_id: string
          reason?: string | null
          referral_date?: string
          referred_to?: string | null
          responsible_staff_id?: string | null
          status?: Database["public"]["Enums"]["case_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          age_group?: Database["public"]["Enums"]["age_group"] | null
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          facility_id?: string | null
          gender?: string | null
          id?: string
          is_demo?: boolean
          project_id?: string
          reason?: string | null
          referral_date?: string
          referred_to?: string | null
          responsible_staff_id?: string | null
          status?: Database["public"]["Enums"]["case_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "health_referrals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_referrals_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "health_facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_referrals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_referrals_responsible_staff_id_fkey"
            columns: ["responsible_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_referrals_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      health_services: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          facility_id: string
          id: string
          is_demo: boolean
          service_type: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          facility_id: string
          id?: string
          is_demo?: boolean
          service_type: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          facility_id?: string
          id?: string
          is_demo?: boolean
          service_type?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "health_services_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_services_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "health_facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_services_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          archived_at: string | null
          assistance_status: Database["public"]["Enums"]["household_assistance_status"]
          created_at: string
          created_by: string | null
          household_code: string
          household_size: number | null
          id: string
          is_demo: boolean
          location_id: string | null
          project_id: string
          updated_at: string
          updated_by: string | null
          vulnerability_notes: string | null
        }
        Insert: {
          archived_at?: string | null
          assistance_status?: Database["public"]["Enums"]["household_assistance_status"]
          created_at?: string
          created_by?: string | null
          household_code: string
          household_size?: number | null
          id?: string
          is_demo?: boolean
          location_id?: string | null
          project_id: string
          updated_at?: string
          updated_by?: string | null
          vulnerability_notes?: string | null
        }
        Update: {
          archived_at?: string | null
          assistance_status?: Database["public"]["Enums"]["household_assistance_status"]
          created_at?: string
          created_by?: string | null
          household_code?: string
          household_size?: number | null
          id?: string
          is_demo?: boolean
          location_id?: string | null
          project_id?: string
          updated_at?: string
          updated_by?: string | null
          vulnerability_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "households_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "households_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "households_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "households_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      indicator_measurements: {
        Row: {
          actual: number
          created_at: string
          entered_by: string | null
          id: string
          indicator_id: string
          notes: string | null
          reporting_period: string
          source: string | null
        }
        Insert: {
          actual: number
          created_at?: string
          entered_by?: string | null
          id?: string
          indicator_id: string
          notes?: string | null
          reporting_period: string
          source?: string | null
        }
        Update: {
          actual?: number
          created_at?: string
          entered_by?: string | null
          id?: string
          indicator_id?: string
          notes?: string | null
          reporting_period?: string
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "indicator_measurements_entered_by_fkey"
            columns: ["entered_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indicator_measurements_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "indicators"
            referencedColumns: ["id"]
          },
        ]
      }
      indicators: {
        Row: {
          actual: number | null
          archived_at: string | null
          baseline: number | null
          code: string | null
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
          code?: string | null
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
          code?: string | null
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
          lat: number | null
          lng: number | null
          location_type: Database["public"]["Enums"]["location_type"]
          name: string
          notes: string | null
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
          lat?: number | null
          lng?: number | null
          location_type: Database["public"]["Enums"]["location_type"]
          name: string
          notes?: string | null
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
          lat?: number | null
          lng?: number | null
          location_type?: Database["public"]["Enums"]["location_type"]
          name?: string
          notes?: string | null
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
      mine_hazard_coordinates: {
        Row: {
          coordinates: unknown
          hazard_id: string
          id: string
          precise_lat: number | null
          precise_lng: number | null
          recorded_at: string
          recorded_by: string | null
        }
        Insert: {
          coordinates: unknown
          hazard_id: string
          id?: string
          precise_lat?: number | null
          precise_lng?: number | null
          recorded_at?: string
          recorded_by?: string | null
        }
        Update: {
          coordinates?: unknown
          hazard_id?: string
          id?: string
          precise_lat?: number | null
          precise_lng?: number | null
          recorded_at?: string
          recorded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mine_hazard_coordinates_hazard_id_fkey"
            columns: ["hazard_id"]
            isOneToOne: true
            referencedRelation: "mine_hazards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mine_hazard_coordinates_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      mine_hazards: {
        Row: {
          archived_at: string | null
          coordinates_generalized: unknown
          created_at: string
          created_by: string | null
          date_identified: string
          description: string | null
          generalized_lat: number | null
          generalized_lng: number | null
          hazard_code: string
          hazard_type: Database["public"]["Enums"]["hazard_type"]
          id: string
          is_demo: boolean
          location_id: string | null
          programme_id: string | null
          project_id: string | null
          risk_level: Database["public"]["Enums"]["risk_level"]
          source: string | null
          status: Database["public"]["Enums"]["mine_action_status"]
          updated_at: string
          updated_by: string | null
          verification_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          archived_at?: string | null
          coordinates_generalized?: unknown
          created_at?: string
          created_by?: string | null
          date_identified?: string
          description?: string | null
          generalized_lat?: number | null
          generalized_lng?: number | null
          hazard_code: string
          hazard_type?: Database["public"]["Enums"]["hazard_type"]
          id?: string
          is_demo?: boolean
          location_id?: string | null
          programme_id?: string | null
          project_id?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"]
          source?: string | null
          status?: Database["public"]["Enums"]["mine_action_status"]
          updated_at?: string
          updated_by?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          archived_at?: string | null
          coordinates_generalized?: unknown
          created_at?: string
          created_by?: string | null
          date_identified?: string
          description?: string | null
          generalized_lat?: number | null
          generalized_lng?: number | null
          hazard_code?: string
          hazard_type?: Database["public"]["Enums"]["hazard_type"]
          id?: string
          is_demo?: boolean
          location_id?: string | null
          programme_id?: string | null
          project_id?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"]
          source?: string | null
          status?: Database["public"]["Enums"]["mine_action_status"]
          updated_at?: string
          updated_by?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "mine_hazards_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mine_hazards_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mine_hazards_programme_id_fkey"
            columns: ["programme_id"]
            isOneToOne: false
            referencedRelation: "programmes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mine_hazards_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mine_hazards_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      mine_surveys: {
        Row: {
          archived_at: string | null
          area_covered: string | null
          conducted_by: string | null
          created_at: string
          created_by: string | null
          findings: string | null
          id: string
          is_demo: boolean
          location_id: string | null
          project_id: string
          status: Database["public"]["Enums"]["mine_action_status"]
          survey_date: string
          survey_type: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          area_covered?: string | null
          conducted_by?: string | null
          created_at?: string
          created_by?: string | null
          findings?: string | null
          id?: string
          is_demo?: boolean
          location_id?: string | null
          project_id: string
          status?: Database["public"]["Enums"]["mine_action_status"]
          survey_date?: string
          survey_type?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          area_covered?: string | null
          conducted_by?: string | null
          created_at?: string
          created_by?: string | null
          findings?: string | null
          id?: string
          is_demo?: boolean
          location_id?: string | null
          project_id?: string
          status?: Database["public"]["Enums"]["mine_action_status"]
          survey_date?: string
          survey_type?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mine_surveys_conducted_by_fkey"
            columns: ["conducted_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mine_surveys_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mine_surveys_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mine_surveys_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mine_surveys_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      mre_sessions: {
        Row: {
          archived_at: string | null
          audience_description: string | null
          created_at: string
          created_by: string | null
          facilitator_staff_id: string | null
          id: string
          is_demo: boolean
          location_id: string | null
          notes: string | null
          participants_female: number | null
          participants_male: number | null
          participants_total: number | null
          project_id: string
          session_date: string
          session_type: string
          topics: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          audience_description?: string | null
          created_at?: string
          created_by?: string | null
          facilitator_staff_id?: string | null
          id?: string
          is_demo?: boolean
          location_id?: string | null
          notes?: string | null
          participants_female?: number | null
          participants_male?: number | null
          participants_total?: number | null
          project_id: string
          session_date?: string
          session_type?: string
          topics?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          audience_description?: string | null
          created_at?: string
          created_by?: string | null
          facilitator_staff_id?: string | null
          id?: string
          is_demo?: boolean
          location_id?: string | null
          notes?: string | null
          participants_female?: number | null
          participants_male?: number | null
          participants_total?: number | null
          project_id?: string
          session_date?: string
          session_type?: string
          topics?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mre_sessions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mre_sessions_facilitator_staff_id_fkey"
            columns: ["facilitator_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mre_sessions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mre_sessions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mre_sessions_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      needs_assessments: {
        Row: {
          archived_at: string | null
          assessment_date: string
          assessment_type: Database["public"]["Enums"]["assessment_type"]
          conducted_by: string | null
          created_at: string
          created_by: string | null
          findings: string | null
          id: string
          is_demo: boolean
          location_id: string | null
          needs: string | null
          population_estimate: number | null
          priority: Database["public"]["Enums"]["priority_level"]
          project_id: string
          updated_at: string
          updated_by: string | null
          verification_status: Database["public"]["Enums"]["approval_status"]
        }
        Insert: {
          archived_at?: string | null
          assessment_date?: string
          assessment_type?: Database["public"]["Enums"]["assessment_type"]
          conducted_by?: string | null
          created_at?: string
          created_by?: string | null
          findings?: string | null
          id?: string
          is_demo?: boolean
          location_id?: string | null
          needs?: string | null
          population_estimate?: number | null
          priority?: Database["public"]["Enums"]["priority_level"]
          project_id: string
          updated_at?: string
          updated_by?: string | null
          verification_status?: Database["public"]["Enums"]["approval_status"]
        }
        Update: {
          archived_at?: string | null
          assessment_date?: string
          assessment_type?: Database["public"]["Enums"]["assessment_type"]
          conducted_by?: string | null
          created_at?: string
          created_by?: string | null
          findings?: string | null
          id?: string
          is_demo?: boolean
          location_id?: string | null
          needs?: string | null
          population_estimate?: number | null
          priority?: Database["public"]["Enums"]["priority_level"]
          project_id?: string
          updated_at?: string
          updated_by?: string | null
          verification_status?: Database["public"]["Enums"]["approval_status"]
        }
        Relationships: [
          {
            foreignKeyName: "needs_assessments_conducted_by_fkey"
            columns: ["conducted_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "needs_assessments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "needs_assessments_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "needs_assessments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "needs_assessments_updated_by_fkey"
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
          id: string
          location_id: string
          project_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          location_id: string
          project_id: string
        }
        Update: {
          created_at?: string
          id?: string
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
          id: string
          project_id: string
          role_on_project: string
          staff_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          role_on_project?: string
          staff_id: string
        }
        Update: {
          created_at?: string
          id?: string
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
      recommendations: {
        Row: {
          archived_at: string | null
          consultation_id: string
          created_at: string
          created_by: string | null
          description: string
          id: string
          is_demo: boolean
          responsible_staff_id: string | null
          status: Database["public"]["Enums"]["case_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          consultation_id: string
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          is_demo?: boolean
          responsible_staff_id?: string | null
          status?: Database["public"]["Enums"]["case_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          consultation_id?: string
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          is_demo?: boolean
          responsible_staff_id?: string | null
          status?: Database["public"]["Enums"]["case_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recommendations_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendations_responsible_staff_id_fkey"
            columns: ["responsible_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendations_updated_by_fkey"
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
      stakeholders: {
        Row: {
          archived_at: string | null
          contact_info: string | null
          created_at: string
          created_by: string | null
          engagement_status: Database["public"]["Enums"]["engagement_status"]
          id: string
          is_demo: boolean
          location_id: string | null
          name: string
          organization: string | null
          programme_id: string | null
          project_id: string | null
          stakeholder_type: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          contact_info?: string | null
          created_at?: string
          created_by?: string | null
          engagement_status?: Database["public"]["Enums"]["engagement_status"]
          id?: string
          is_demo?: boolean
          location_id?: string | null
          name: string
          organization?: string | null
          programme_id?: string | null
          project_id?: string | null
          stakeholder_type?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          contact_info?: string | null
          created_at?: string
          created_by?: string | null
          engagement_status?: Database["public"]["Enums"]["engagement_status"]
          id?: string
          is_demo?: boolean
          location_id?: string | null
          name?: string
          organization?: string | null
          programme_id?: string | null
          project_id?: string | null
          stakeholder_type?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stakeholders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stakeholders_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stakeholders_programme_id_fkey"
            columns: ["programme_id"]
            isOneToOne: false
            referencedRelation: "programmes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stakeholders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stakeholders_updated_by_fkey"
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
      victim_assistance: {
        Row: {
          age_group: Database["public"]["Enums"]["age_group"] | null
          archived_at: string | null
          assistance_provided: string | null
          created_at: string
          created_by: string | null
          gender: string | null
          id: string
          incident_date: string | null
          injury_type: string | null
          is_demo: boolean
          location_id: string | null
          project_id: string
          referral_organization: string | null
          referral_status: Database["public"]["Enums"]["referral_status"]
          status: Database["public"]["Enums"]["case_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          age_group?: Database["public"]["Enums"]["age_group"] | null
          archived_at?: string | null
          assistance_provided?: string | null
          created_at?: string
          created_by?: string | null
          gender?: string | null
          id?: string
          incident_date?: string | null
          injury_type?: string | null
          is_demo?: boolean
          location_id?: string | null
          project_id: string
          referral_organization?: string | null
          referral_status?: Database["public"]["Enums"]["referral_status"]
          status?: Database["public"]["Enums"]["case_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          age_group?: Database["public"]["Enums"]["age_group"] | null
          archived_at?: string | null
          assistance_provided?: string | null
          created_at?: string
          created_by?: string | null
          gender?: string | null
          id?: string
          incident_date?: string | null
          injury_type?: string | null
          is_demo?: boolean
          location_id?: string | null
          project_id?: string
          referral_organization?: string | null
          referral_status?: Database["public"]["Enums"]["referral_status"]
          status?: Database["public"]["Enums"]["case_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "victim_assistance_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "victim_assistance_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "victim_assistance_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "victim_assistance_updated_by_fkey"
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
      age_group: "child" | "youth" | "adult" | "elderly"
      approval_status:
        | "draft"
        | "submitted"
        | "under_review"
        | "approved"
        | "published"
      assessment_type:
        | "rapid_needs"
        | "household_assessment"
        | "sector_assessment"
        | "post_distribution_monitoring"
        | "other"
      assistance_plan_status: "planned" | "ongoing" | "completed" | "cancelled"
      assistance_type:
        | "food"
        | "nfi"
        | "cash"
        | "shelter"
        | "wash"
        | "protection"
        | "livelihood"
        | "other"
      attendance_status:
        | "present"
        | "leave"
        | "absent"
        | "field_duty"
        | "remote"
      case_status: "open" | "in_progress" | "resolved" | "closed"
      distribution_status:
        | "planned"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "verified"
      document_access_level: "standard" | "restricted"
      engagement_status: "not_engaged" | "engaged" | "ongoing" | "inactive"
      facility_type:
        | "clinic"
        | "hospital"
        | "mobile_clinic"
        | "health_post"
        | "other"
      hazard_type: "landmine" | "uxo" | "other_explosive" | "unknown"
      household_assistance_status:
        | "not_assessed"
        | "planned"
        | "assisted"
        | "ineligible"
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
        | "health_facility"
        | "other"
      mine_action_status:
        | "open"
        | "in_progress"
        | "cleared"
        | "monitoring"
        | "closed"
      priority_level: "low" | "medium" | "high" | "critical"
      programme_category:
        | "humanitarian"
        | "mine_action"
        | "health"
        | "governance"
        | "peacebuilding"
        | "research_policy"
        | "other"
      referral_status: "not_referred" | "referred" | "in_progress" | "completed"
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
      verification_status:
        | "reported"
        | "under_verification"
        | "verified"
        | "false_alarm"
        | "cleared"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      activity_status: [
        "not_started",
        "ongoing",
        "completed",
        "delayed",
        "cancelled",
      ],
      age_group: ["child", "youth", "adult", "elderly"],
      approval_status: [
        "draft",
        "submitted",
        "under_review",
        "approved",
        "published",
      ],
      assessment_type: [
        "rapid_needs",
        "household_assessment",
        "sector_assessment",
        "post_distribution_monitoring",
        "other",
      ],
      assistance_plan_status: ["planned", "ongoing", "completed", "cancelled"],
      assistance_type: [
        "food",
        "nfi",
        "cash",
        "shelter",
        "wash",
        "protection",
        "livelihood",
        "other",
      ],
      attendance_status: ["present", "leave", "absent", "field_duty", "remote"],
      case_status: ["open", "in_progress", "resolved", "closed"],
      distribution_status: [
        "planned",
        "in_progress",
        "completed",
        "cancelled",
        "verified",
      ],
      document_access_level: ["standard", "restricted"],
      engagement_status: ["not_engaged", "engaged", "ongoing", "inactive"],
      facility_type: [
        "clinic",
        "hospital",
        "mobile_clinic",
        "health_post",
        "other",
      ],
      hazard_type: ["landmine", "uxo", "other_explosive", "unknown"],
      household_assistance_status: [
        "not_assessed",
        "planned",
        "assisted",
        "ineligible",
      ],
      indicator_result_type: ["objective", "outcome", "output"],
      lifecycle_status: [
        "planning",
        "active",
        "on_hold",
        "completed",
        "cancelled",
      ],
      location_type: [
        "state_region",
        "district",
        "township",
        "village",
        "site",
        "health_facility",
        "other",
      ],
      mine_action_status: [
        "open",
        "in_progress",
        "cleared",
        "monitoring",
        "closed",
      ],
      priority_level: ["low", "medium", "high", "critical"],
      programme_category: [
        "humanitarian",
        "mine_action",
        "health",
        "governance",
        "peacebuilding",
        "research_policy",
        "other",
      ],
      referral_status: ["not_referred", "referred", "in_progress", "completed"],
      risk_category: [
        "operational",
        "financial",
        "security",
        "reputational",
        "programmatic",
        "compliance",
        "other",
      ],
      risk_level: ["low", "medium", "high"],
      risk_status: ["open", "mitigating", "monitoring", "closed"],
      system_role: [
        "super_admin",
        "executive",
        "programme_manager",
        "project_officer",
        "project_assistant",
        "me_meal",
        "finance",
        "viewer",
      ],
      task_status: [
        "not_started",
        "in_progress",
        "completed",
        "blocked",
        "cancelled",
      ],
      verification_status: [
        "reported",
        "under_verification",
        "verified",
        "false_alarm",
        "cleared",
      ],
    },
  },
} as const
