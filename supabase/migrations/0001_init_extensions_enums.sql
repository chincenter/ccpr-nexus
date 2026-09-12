-- Extensions
create extension if not exists pgcrypto;
create extension if not exists postgis;

-- Dedicated schema for security-definer helper functions used by RLS
-- policies, kept out of `public` so it can't be confused with app tables.
create schema if not exists app;

-- Enums -----------------------------------------------------------------

create type system_role as enum (
  'super_admin',
  'executive',
  'programme_manager',
  'project_officer',
  'project_assistant',
  'me_meal',
  'finance',
  'viewer'
);

create type programme_category as enum (
  'humanitarian',
  'mine_action',
  'health',
  'governance',
  'peacebuilding',
  'research_policy',
  'other'
);

-- Shared lifecycle status for programmes and projects
create type lifecycle_status as enum (
  'planning',
  'active',
  'on_hold',
  'completed',
  'cancelled'
);

create type activity_status as enum (
  'not_started',
  'ongoing',
  'completed',
  'delayed',
  'cancelled'
);

create type task_status as enum (
  'not_started',
  'in_progress',
  'completed',
  'blocked',
  'cancelled'
);

create type priority_level as enum (
  'low',
  'medium',
  'high',
  'critical'
);

create type approval_status as enum (
  'draft',
  'submitted',
  'under_review',
  'approved',
  'published'
);

create type location_type as enum (
  'state_region',
  'district',
  'township',
  'village',
  'site'
);
