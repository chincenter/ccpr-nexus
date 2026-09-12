-- DEMO DATA — NOT REAL CCPR DATA

insert into public.mine_hazards (id, project_id, location_id, hazard_code, hazard_type, status, risk_level, verification_status, date_identified, source, description, created_by, is_demo) values
  ('55555555-1111-1111-1111-000000000001', '33333333-3333-3333-3333-333333333303', '99999999-9999-9999-9999-999999999901', 'MA-P1-HZ-001', 'landmine', 'monitoring', 'high', 'verified', '2025-09-12', 'Community report', 'Suspected landmine near a footpath used by farmers outside Hakha town.', '11111111-1111-1111-1111-111111111109', true),
  ('55555555-1111-1111-1111-000000000002', '33333333-3333-3333-3333-333333333303', '99999999-9999-9999-9999-999999999901', 'MA-P1-HZ-002', 'uxo', 'open', 'medium', 'under_verification', '2025-10-30', 'Village leader report', 'Unexploded ordnance reportedly seen after seasonal flooding exposed old ground.', '11111111-1111-1111-1111-111111111109', true),
  ('55555555-1111-1111-1111-000000000003', '33333333-3333-3333-3333-333333333304', '99999999-9999-9999-9999-999999999903', 'MA-P2-HZ-001', 'unknown', 'in_progress', 'medium', 'reported', '2025-11-08', 'Community report', 'Area flagged during non-technical survey pending confirmation.', '11111111-1111-1111-1111-111111111110', true);

insert into public.mine_hazard_coordinates (hazard_id, coordinates, recorded_by) values
  ('55555555-1111-1111-1111-000000000001', st_setsrid(st_makepoint(93.611234, 22.643219), 4326)::geography, '11111111-1111-1111-1111-111111111109'),
  ('55555555-1111-1111-1111-000000000003', st_setsrid(st_makepoint(93.641987, 23.135522), 4326)::geography, '11111111-1111-1111-1111-111111111110');

insert into public.mre_sessions (project_id, location_id, session_date, session_type, audience_description, participants_male, participants_female, participants_total, facilitator_staff_id, topics, created_by, is_demo) values
  ('33333333-3333-3333-3333-333333333303', '99999999-9999-9999-9999-999999999901', '2025-10-02', 'mre', 'Farmers and school-age children, Hakha outskirts', 22, 28, 50, '11111111-1111-1111-1111-111111111109', 'Hazard recognition, safe behaviour, reporting channels.', '11111111-1111-1111-1111-111111111109', true),
  ('33333333-3333-3333-3333-333333333303', '99999999-9999-9999-9999-999999999901', '2025-11-18', 'community_awareness', 'Village leaders and community health workers', 15, 19, 34, '11111111-1111-1111-1111-111111111109', 'Referral pathways for victim assistance, mapping suspected areas.', '11111111-1111-1111-1111-111111111109', true);

insert into public.mine_surveys (project_id, location_id, survey_date, survey_type, area_covered, findings, status, conducted_by, created_by, is_demo) values
  ('33333333-3333-3333-3333-333333333304', '99999999-9999-9999-9999-999999999903', '2025-11-08', 'non_technical_survey', 'Approx. 4 sq km around Tedim Township footpaths', 'One suspected hazard area flagged for technical survey follow-up.', 'in_progress', '11111111-1111-1111-1111-111111111110', '11111111-1111-1111-1111-111111111110', true),
  ('33333333-3333-3333-3333-333333333304', '99999999-9999-9999-9999-999999999904', '2025-09-25', 'non_technical_survey', 'Matupi Township community land bordering old conflict lines', 'No confirmed hazards found; area recommended for release.', 'closed', '11111111-1111-1111-1111-111111111110', '11111111-1111-1111-1111-111111111110', true);

insert into public.victim_assistance (project_id, location_id, incident_date, age_group, gender, injury_type, assistance_provided, referral_organization, referral_status, status, created_by, is_demo) values
  ('33333333-3333-3333-3333-333333333303', '99999999-9999-9999-9999-999999999901', '2025-08-14', 'adult', 'male', 'Lower limb injury', 'First aid and transport to Hakha health facility.', 'Chin State Health Department', 'completed', 'resolved', '11111111-1111-1111-1111-111111111109', true);
