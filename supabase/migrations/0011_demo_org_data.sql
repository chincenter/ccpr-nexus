-- ============================================================================
-- DEMO DATA — NOT REAL CCPR DATA
-- Connected Phase 1 seed data: 4 programmes, 8 projects, and the full
-- results chain (objectives -> outcomes -> outputs -> activities -> tasks)
-- down through real database relationships, per the section 41-43 test
-- scenarios. All fictional except staff row 101, which is the real first
-- super_admin account (see 0012_real_admin_account.sql).
-- ============================================================================

-- Staff -----------------------------------------------------------------
insert into public.staff (id, full_name, job_title, system_role, email, is_active, is_demo) values
  ('11111111-1111-1111-1111-111111111101', 'Van Bawi Mang', 'Executive Director', 'super_admin', 'lalnunboris@gmail.com', true, false),
  ('11111111-1111-1111-1111-111111111102', 'Demo Executive Director', 'Deputy Director', 'executive', 'demo.executive@ccpr-nexus.test', true, true),
  ('11111111-1111-1111-1111-111111111103', 'Demo Programme Manager (Humanitarian)', 'Programme Manager', 'programme_manager', 'demo.pm.humanitarian@ccpr-nexus.test', true, true),
  ('11111111-1111-1111-1111-111111111104', 'Demo Programme Manager (Mine Action)', 'Programme Manager', 'programme_manager', 'demo.pm.mineaction@ccpr-nexus.test', true, true),
  ('11111111-1111-1111-1111-111111111105', 'Demo Programme Manager (Health)', 'Programme Manager', 'programme_manager', 'demo.pm.health@ccpr-nexus.test', true, true),
  ('11111111-1111-1111-1111-111111111106', 'Demo Programme Manager (Governance)', 'Programme Manager', 'programme_manager', 'demo.pm.governance@ccpr-nexus.test', true, true),
  ('11111111-1111-1111-1111-111111111107', 'Demo Project Officer (Emergency Response)', 'Project Officer', 'project_officer', 'demo.po.emergency@ccpr-nexus.test', true, true),
  ('11111111-1111-1111-1111-111111111108', 'Demo Project Officer (Displacement Support)', 'Project Officer', 'project_officer', 'demo.po.displacement@ccpr-nexus.test', true, true),
  ('11111111-1111-1111-1111-111111111109', 'Demo Project Officer (Mine Risk Education)', 'Project Officer', 'project_officer', 'demo.po.mre@ccpr-nexus.test', true, true),
  ('11111111-1111-1111-1111-111111111110', 'Demo Project Officer (Community Liaison & Survey)', 'Project Officer', 'project_officer', 'demo.po.survey@ccpr-nexus.test', true, true),
  ('11111111-1111-1111-1111-111111111111', 'Demo Project Officer (Health Outreach)', 'Project Officer', 'project_officer', 'demo.po.healthoutreach@ccpr-nexus.test', true, true),
  ('11111111-1111-1111-1111-111111111112', 'Demo Project Officer (Mobile Clinic)', 'Project Officer', 'project_officer', 'demo.po.mobileclinic@ccpr-nexus.test', true, true),
  ('11111111-1111-1111-1111-111111111113', 'Demo Project Officer (Governance Support)', 'Project Officer', 'project_officer', 'demo.po.governance@ccpr-nexus.test', true, true),
  ('11111111-1111-1111-1111-111111111114', 'Demo Project Officer (Policy Advocacy)', 'Project Officer', 'project_officer', 'demo.po.policy@ccpr-nexus.test', true, true),
  ('11111111-1111-1111-1111-111111111115', 'Demo Project Assistant', 'Field Assistant', 'project_assistant', 'demo.assistant@ccpr-nexus.test', true, true),
  ('11111111-1111-1111-1111-111111111116', 'Demo MEAL Officer', 'M&E Officer', 'me_meal', 'demo.meal@ccpr-nexus.test', true, true),
  ('11111111-1111-1111-1111-111111111117', 'Demo Finance Officer', 'Finance Officer', 'finance', 'demo.finance@ccpr-nexus.test', true, true),
  ('11111111-1111-1111-1111-111111111118', 'Demo Viewer', 'External Observer', 'viewer', 'demo.viewer@ccpr-nexus.test', true, true);

update public.staff set created_by = '11111111-1111-1111-1111-111111111101'
where id <> '11111111-1111-1111-1111-111111111101';

-- Locations ---------------------------------------------------------------
insert into public.locations (id, name, location_type, state_region, township, village, coordinates, is_sensitive, is_demo, created_by) values
  ('99999999-9999-9999-9999-999999999901', 'Hakha Township', 'township', 'Chin State', 'Hakha', null, extensions.ST_GeogFromText('POINT(93.61 22.65)'), false, true, '11111111-1111-1111-1111-111111111101'),
  ('99999999-9999-9999-9999-999999999902', 'Falam Township', 'township', 'Chin State', 'Falam', null, extensions.ST_GeogFromText('POINT(93.68 22.92)'), false, true, '11111111-1111-1111-1111-111111111101'),
  ('99999999-9999-9999-9999-999999999903', 'Tedim Township', 'township', 'Chin State', 'Tedim', null, extensions.ST_GeogFromText('POINT(93.68 23.45)'), false, true, '11111111-1111-1111-1111-111111111101'),
  ('99999999-9999-9999-9999-999999999904', 'Matupi Township', 'township', 'Chin State', 'Matupi', null, extensions.ST_GeogFromText('POINT(93.50 21.80)'), false, true, '11111111-1111-1111-1111-111111111101'),
  ('99999999-9999-9999-9999-999999999905', 'Rih Village', 'village', 'Chin State', 'Falam', 'Rih', extensions.ST_GeogFromText('POINT(93.38 23.14)'), false, true, '11111111-1111-1111-1111-111111111101'),
  ('99999999-9999-9999-9999-999999999906', 'Champhai (cross-border liaison area)', 'district', 'Mizoram, India', null, null, extensions.ST_GeogFromText('POINT(93.33 23.45)'), false, true, '11111111-1111-1111-1111-111111111101');

-- Programmes ----------------------------------------------------------
insert into public.programmes (id, code, name, category, description, lead_staff_id, status, start_date, end_date, is_demo, created_by) values
  ('22222222-2222-2222-2222-222222222201', 'HUM', 'Humanitarian Assistance Programme', 'humanitarian', 'Emergency relief and displacement support across conflict-affected Chin State townships.', '11111111-1111-1111-1111-111111111103', 'active', '2025-01-01', '2026-12-31', true, '11111111-1111-1111-1111-111111111101'),
  ('22222222-2222-2222-2222-222222222202', 'MA', 'Mine Action Programme', 'mine_action', 'Mine risk education, survey, and community liaison in affected areas.', '11111111-1111-1111-1111-111111111104', 'active', '2025-01-01', '2026-12-31', true, '11111111-1111-1111-1111-111111111101'),
  ('22222222-2222-2222-2222-222222222203', 'HLT', 'Community Health Programme', 'health', 'Outreach and mobile clinic services for underserved communities.', '11111111-1111-1111-1111-111111111105', 'active', '2025-01-01', '2026-12-31', true, '11111111-1111-1111-1111-111111111101'),
  ('22222222-2222-2222-2222-222222222204', 'GOV', 'Governance & Peacebuilding Programme', 'governance', 'Stakeholder engagement, policy advocacy, and local governance support.', '11111111-1111-1111-1111-111111111106', 'active', '2025-01-01', '2026-12-31', true, '11111111-1111-1111-1111-111111111101');

-- Projects (8) ----------------------------------------------------------
insert into public.projects (id, code, name, programme_id, donor, project_officer_id, description, start_date, end_date, status, budget, target_beneficiaries, is_demo, created_by) values
  ('33333333-3333-3333-3333-333333333301', 'HUM-P1', 'Emergency Response Project', '22222222-2222-2222-2222-222222222201', 'Demo Donor Foundation', '11111111-1111-1111-1111-111111111107', 'Rapid emergency assistance to displaced households in Hakha and Falam.', '2025-02-01', '2026-01-31', 'active', 120000, 3000, true, '11111111-1111-1111-1111-111111111101'),
  ('33333333-3333-3333-3333-333333333302', 'HUM-P2', 'Displacement Support Project', '22222222-2222-2222-2222-222222222201', 'Demo Relief Fund', '11111111-1111-1111-1111-111111111108', 'Longer-term support for displaced families in Matupi.', '2025-03-01', '2026-02-28', 'active', 95000, 1800, true, '11111111-1111-1111-1111-111111111101'),
  ('33333333-3333-3333-3333-333333333303', 'MA-P1', 'Mine Risk Education Project', '22222222-2222-2222-2222-222222222202', 'Demo Peace Trust', '11111111-1111-1111-1111-111111111109', 'Community mine-risk education sessions across Tedim townships.', '2025-01-15', '2026-01-14', 'active', 60000, 5000, true, '11111111-1111-1111-1111-111111111101'),
  ('33333333-3333-3333-3333-333333333304', 'MA-P2', 'Community Liaison & Survey Project', '22222222-2222-2222-2222-222222222202', 'Demo Peace Trust', '11111111-1111-1111-1111-111111111110', 'Non-technical survey and community liaison near Rih village.', '2025-04-01', '2026-03-31', 'active', 45000, 1200, true, '11111111-1111-1111-1111-111111111101'),
  ('33333333-3333-3333-3333-333333333305', 'HLT-P1', 'Community Health Outreach Project', '22222222-2222-2222-2222-222222222203', 'Demo Health Alliance', '11111111-1111-1111-1111-111111111111', 'Health outreach and referral services in Hakha.', '2025-02-15', '2026-02-14', 'active', 70000, 4000, true, '11111111-1111-1111-1111-111111111101'),
  ('33333333-3333-3333-3333-333333333306', 'HLT-P2', 'Mobile Clinic Project', '22222222-2222-2222-2222-222222222203', 'Demo Health Alliance', '11111111-1111-1111-1111-111111111112', 'Mobile clinic rotations across Falam and Tedim.', '2025-05-01', '2026-04-30', 'planning', 55000, 2500, true, '11111111-1111-1111-1111-111111111101'),
  ('33333333-3333-3333-3333-333333333307', 'GOV-P1', 'Governance Support Project', '22222222-2222-2222-2222-222222222204', 'Demo Democracy Fund', '11111111-1111-1111-1111-111111111113', 'Local stakeholder consultation and governance capacity support.', '2025-01-01', '2025-12-31', 'active', 40000, 800, true, '11111111-1111-1111-1111-111111111101'),
  ('33333333-3333-3333-3333-333333333308', 'GOV-P2', 'Policy Advocacy Project', '22222222-2222-2222-2222-222222222204', 'Demo Democracy Fund', '11111111-1111-1111-1111-111111111114', 'Federal democracy policy research and advocacy briefings.', '2025-06-01', '2026-05-31', 'active', 35000, 400, true, '11111111-1111-1111-1111-111111111101');

-- Project team membership (project assistant + MEAL + finance attached
-- across a few projects so cross-cutting scoping has something to check).
insert into public.project_team (project_id, staff_id, role_on_project) values
  ('33333333-3333-3333-3333-333333333301', '11111111-1111-1111-1111-111111111115', 'field_assistant'),
  ('33333333-3333-3333-3333-333333333301', '11111111-1111-1111-1111-111111111116', 'meal_focal_point'),
  ('33333333-3333-3333-3333-333333333301', '11111111-1111-1111-1111-111111111117', 'finance_focal_point'),
  ('33333333-3333-3333-3333-333333333303', '11111111-1111-1111-1111-111111111115', 'field_assistant'),
  ('33333333-3333-3333-3333-333333333303', '11111111-1111-1111-1111-111111111116', 'meal_focal_point'),
  ('33333333-3333-3333-3333-333333333305', '11111111-1111-1111-1111-111111111116', 'meal_focal_point');

insert into public.project_locations (project_id, location_id) values
  ('33333333-3333-3333-3333-333333333301', '99999999-9999-9999-9999-999999999901'),
  ('33333333-3333-3333-3333-333333333301', '99999999-9999-9999-9999-999999999902'),
  ('33333333-3333-3333-3333-333333333302', '99999999-9999-9999-9999-999999999904'),
  ('33333333-3333-3333-3333-333333333303', '99999999-9999-9999-9999-999999999903'),
  ('33333333-3333-3333-3333-333333333304', '99999999-9999-9999-9999-999999999905'),
  ('33333333-3333-3333-3333-333333333304', '99999999-9999-9999-9999-999999999906'),
  ('33333333-3333-3333-3333-333333333305', '99999999-9999-9999-9999-999999999901'),
  ('33333333-3333-3333-3333-333333333306', '99999999-9999-9999-9999-999999999902'),
  ('33333333-3333-3333-3333-333333333306', '99999999-9999-9999-9999-999999999903'),
  ('33333333-3333-3333-3333-333333333307', '99999999-9999-9999-9999-999999999901'),
  ('33333333-3333-3333-3333-333333333308', '99999999-9999-9999-9999-999999999901');
