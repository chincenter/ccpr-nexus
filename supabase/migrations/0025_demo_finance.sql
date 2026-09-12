-- DEMO DATA — NOT REAL CCPR DATA
do $$
declare
  v_admin uuid := '11111111-1111-1111-1111-111111111101';
  v_budget_hum1 uuid;
  v_budget_hum2 uuid;
  v_budget_ma1 uuid;
  v_budget_gov1 uuid;
  v_line uuid;
begin
  insert into public.budgets (project_id, approved_budget, revised_budget, created_by)
  values ('33333333-3333-3333-3333-333333333301', 120000, 125000, v_admin)
  returning id into v_budget_hum1;

  insert into public.budget_lines (budget_id, line_name, category, amount, created_by) values
    (v_budget_hum1, 'NFI Procurement', 'supplies', 70000, v_admin),
    (v_budget_hum1, 'Distribution Logistics', 'logistics', 30000, v_admin),
    (v_budget_hum1, 'Staff & Admin', 'admin', 20000, v_admin);

  select id into v_line from public.budget_lines where budget_id = v_budget_hum1 and line_name = 'NFI Procurement';
  insert into public.expenditures (budget_line_id, amount, expense_date, description, created_by) values
    (v_line, 45000, current_date - 60, 'Initial NFI kit purchase', v_admin),
    (v_line, 15000, current_date - 20, 'Replenishment order', v_admin);
  insert into public.commitments (budget_line_id, amount, commitment_date, description, created_by) values
    (v_line, 10000, current_date - 5, 'Purchase order pending delivery', v_admin);

  select id into v_line from public.budget_lines where budget_id = v_budget_hum1 and line_name = 'Distribution Logistics';
  insert into public.expenditures (budget_line_id, amount, expense_date, description, created_by) values
    (v_line, 20000, current_date - 30, 'Transport and warehousing', v_admin);

  select id into v_line from public.budget_lines where budget_id = v_budget_hum1 and line_name = 'Staff & Admin';
  insert into public.expenditures (budget_line_id, amount, expense_date, description, created_by) values
    (v_line, 10000, current_date - 15, 'Field team costs', v_admin);

  -- HUM-P2
  insert into public.budgets (project_id, approved_budget, created_by)
  values ('33333333-3333-3333-3333-333333333302', 95000, v_admin)
  returning id into v_budget_hum2;

  insert into public.budget_lines (budget_id, line_name, category, amount, created_by) values
    (v_budget_hum2, 'Shelter Materials', 'supplies', 60000, v_admin),
    (v_budget_hum2, 'Labor', 'labor', 25000, v_admin),
    (v_budget_hum2, 'Assessment', 'admin', 10000, v_admin);

  select id into v_line from public.budget_lines where budget_id = v_budget_hum2 and line_name = 'Shelter Materials';
  insert into public.expenditures (budget_line_id, amount, expense_date, description, created_by) values
    (v_line, 25000, current_date - 40, 'Timber and roofing materials', v_admin);
  insert into public.commitments (budget_line_id, amount, commitment_date, description, created_by) values
    (v_line, 15000, current_date - 10, 'Second materials batch ordered', v_admin);

  select id into v_line from public.budget_lines where budget_id = v_budget_hum2 and line_name = 'Labor';
  insert into public.expenditures (budget_line_id, amount, expense_date, description, created_by) values
    (v_line, 10000, current_date - 25, 'Construction crew wages', v_admin);

  -- MA-P1
  insert into public.budgets (project_id, approved_budget, created_by)
  values ('33333333-3333-3333-3333-333333333303', 60000, v_admin)
  returning id into v_budget_ma1;

  insert into public.budget_lines (budget_id, line_name, category, amount, created_by) values
    (v_budget_ma1, 'MRE Materials', 'supplies', 15000, v_admin),
    (v_budget_ma1, 'Facilitator Stipends', 'personnel', 30000, v_admin),
    (v_budget_ma1, 'Transport', 'logistics', 15000, v_admin);

  select id into v_line from public.budget_lines where budget_id = v_budget_ma1 and line_name = 'MRE Materials';
  insert into public.expenditures (budget_line_id, amount, expense_date, description, created_by) values
    (v_line, 12000, current_date - 50, 'Printed materials and signage', v_admin);

  select id into v_line from public.budget_lines where budget_id = v_budget_ma1 and line_name = 'Facilitator Stipends';
  insert into public.expenditures (budget_line_id, amount, expense_date, description, created_by) values
    (v_line, 20000, current_date - 30, 'Q1-Q2 facilitator payments', v_admin);

  select id into v_line from public.budget_lines where budget_id = v_budget_ma1 and line_name = 'Transport';
  insert into public.expenditures (budget_line_id, amount, expense_date, description, created_by) values
    (v_line, 8000, current_date - 20, 'Vehicle hire', v_admin);

  -- GOV-P1 — deliberately near budget limit on one line, to exercise the utilization warning
  insert into public.budgets (project_id, approved_budget, created_by)
  values ('33333333-3333-3333-3333-333333333307', 40000, v_admin)
  returning id into v_budget_gov1;

  insert into public.budget_lines (budget_id, line_name, category, amount, created_by) values
    (v_budget_gov1, 'Consultation Logistics', 'logistics', 20000, v_admin),
    (v_budget_gov1, 'Capacity Building', 'training', 20000, v_admin);

  select id into v_line from public.budget_lines where budget_id = v_budget_gov1 and line_name = 'Consultation Logistics';
  insert into public.expenditures (budget_line_id, amount, expense_date, description, created_by) values
    (v_line, 18000, current_date - 45, 'Venue, travel, and per diem', v_admin);

  select id into v_line from public.budget_lines where budget_id = v_budget_gov1 and line_name = 'Capacity Building';
  insert into public.expenditures (budget_line_id, amount, expense_date, description, created_by) values
    (v_line, 5000, current_date - 20, 'Workshop materials', v_admin);
  insert into public.commitments (budget_line_id, amount, commitment_date, description, created_by) values
    (v_line, 5000, current_date - 5, 'Trainer contract pending', v_admin);
end $$;
