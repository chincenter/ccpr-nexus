-- Landmine / Mine Action: expand demo data to exercise the new schema
-- (hazard->survey linkage, verification workflow, daily updates, responses,
-- MRE->activity linkage, generated MRE totals) and demonstrate a realistic
-- operational history on one hazard end-to-end.
-- DEMO DATA — NOT REAL CCPR DATA. All rows below are is_demo = true.

-- 1. Seven more hazards (4 under P1 "Mine Risk Education Project", 3 under
-- P2 "Community Liaison & Survey Project"), spanning every status/risk/type.
-- generalized_lat/lng are GENERATED (derived from coordinates_generalized,
-- a geometry point) — set the geometry, not the derived columns.
insert into mine_hazards (id, project_id, location_id, hazard_code, hazard_type, status, risk_level, verification_status, date_identified, source, description, coordinates_generalized, is_demo) values
  ('55555555-1111-1111-1111-000000000004', '33333333-3333-3333-3333-333333333303', '99999999-9999-9999-9999-999999999903', 'MA-P1-HZ-003', 'uxo', 'open', 'high', 'reported', '2026-01-04', 'Community report', 'Unexploded ordnance reported near a footpath outside Tedim Town.', 'POINT(93.68 23.44)', true),
  ('55555555-1111-1111-1111-000000000005', '33333333-3333-3333-3333-333333333303', '99999999-9999-9999-9999-999999999903', 'MA-P1-HZ-004', 'landmine', 'in_progress', 'high', 'under_verification', '2025-11-28', 'Village leader report', 'Suspected mine area affecting agricultural land access.', 'POINT(93.70 23.46)', true),
  ('55555555-1111-1111-1111-000000000006', '33333333-3333-3333-3333-333333333303', '99999999-9999-9999-9999-999999999903', 'MA-P1-HZ-005', 'other_explosive', 'cleared', 'medium', 'cleared', '2025-08-01', 'Historical record', 'Old ordnance fragment site, cleared after technical survey.', 'POINT(93.66 23.43)', true),
  ('55555555-1111-1111-1111-000000000007', '33333333-3333-3333-3333-333333333303', '99999999-9999-9999-9999-999999999903', 'MA-P1-HZ-006', 'unknown', 'monitoring', 'low', 'verified', '2025-09-10', 'Field patrol', 'Low-confidence report, monitored after verification found minimal risk.', 'POINT(93.69 23.45)', true),
  ('55555555-1111-1111-1111-000000000008', '33333333-3333-3333-3333-333333333304', '99999999-9999-9999-9999-999999999905', 'MA-P2-HZ-002', 'landmine', 'open', 'high', 'reported', '2026-01-07', 'Community report', 'Reported minefield edge near a resettlement site.', 'POINT(93.63 23.10)', true),
  ('55555555-1111-1111-1111-000000000009', '33333333-3333-3333-3333-333333333304', '99999999-9999-9999-9999-999999999905', 'MA-P2-HZ-003', 'uxo', 'in_progress', 'medium', 'under_verification', '2025-11-05', 'Field patrol', 'UXO fragments found during a liaison visit.', 'POINT(93.65 23.12)', true),
  ('55555555-1111-1111-1111-000000000010', '33333333-3333-3333-3333-333333333304', '99999999-9999-9999-9999-999999999902', 'MA-P2-HZ-004', 'landmine', 'cleared', 'medium', 'verified', '2025-10-01', 'Technical survey', 'Cleared and verified after full technical survey.', 'POINT(93.62 23.42)', true);

-- precise_lat/precise_lng are ALSO generated (from coordinates) — set only coordinates.
insert into mine_hazard_coordinates (hazard_id, coordinates) values
  ('55555555-1111-1111-1111-000000000004', 'POINT(93.6812 23.4423)'),
  ('55555555-1111-1111-1111-000000000005', 'POINT(93.7024 23.4611)'),
  ('55555555-1111-1111-1111-000000000008', 'POINT(93.6318 23.1044)'),
  ('55555555-1111-1111-1111-000000000010', 'POINT(93.6217 23.4187)');

-- 2. Link the two pre-existing surveys to hazards, and add five more,
-- spanning every survey type and verification state.
update mine_surveys set hazard_id = '55555555-1111-1111-1111-000000000003', verification_status = 'approved' where id = 'ef08f8a0-2f21-461f-a106-49d2e79ec2fe';
update mine_surveys set hazard_id = '55555555-1111-1111-1111-000000000009', verification_status = 'under_review' where id = '1dd2e451-39cf-43ca-b9d5-a36a6ec678ab';

insert into mine_surveys (id, project_id, hazard_id, location_id, survey_date, survey_type, area_covered, findings, status, verification_status, conducted_by, is_demo) values
  ('55555555-5555-1111-1111-000000000001', '33333333-3333-3333-3333-333333333303', '55555555-1111-1111-1111-000000000001', '99999999-9999-9999-9999-999999999903', '2025-08-20', 'technical_survey', 'Roughly 4,000 sq m around the initial report point', 'Confirmed presence of anti-personnel devices; marked and monitored pending clearance capacity.', 'closed', 'approved', '11111111-1111-1111-1111-111111111109', true),
  ('55555555-5555-1111-1111-000000000002', '33333333-3333-3333-3333-333333333303', '55555555-1111-1111-1111-000000000004', '99999999-9999-9999-9999-999999999903', '2026-01-05', 'initial_assessment', 'Footpath and immediate surroundings', 'Single UXO item visible on the surface; area cordoned pending technical survey.', 'open', 'submitted', '11111111-1111-1111-1111-111111111109', true),
  ('55555555-5555-1111-1111-000000000003', '33333333-3333-3333-3333-333333333303', '55555555-1111-1111-1111-000000000005', '99999999-9999-9999-9999-999999999903', '2025-12-10', 'non_technical_survey', 'Agricultural plots bordering the reported area', 'Hazard confirmed; boundary marked with community input.', 'closed', 'approved', '11111111-1111-1111-1111-111111111109', true),
  ('55555555-5555-1111-1111-000000000004', '33333333-3333-3333-3333-333333333304', '55555555-1111-1111-1111-000000000008', '99999999-9999-9999-9999-999999999905', '2026-01-08', 'initial_assessment', 'Resettlement site perimeter', 'Community-marked boundary consistent with historical conflict-era reports.', 'open', 'under_review', '11111111-1111-1111-1111-111111111110', true),
  ('55555555-5555-1111-1111-000000000005', '33333333-3333-3333-3333-333333333304', '55555555-1111-1111-1111-000000000010', '99999999-9999-9999-9999-999999999902', '2025-11-30', 'follow_up_assessment', 'Previously cleared area', 'Post-clearance follow-up found no remaining hazard indicators.', 'closed', 'approved', '11111111-1111-1111-1111-111111111110', true);

-- 3. Four Response / Clearance records.
insert into mine_responses (id, project_id, hazard_id, survey_id, location_id, responsible_staff_id, status, progress, start_date, target_completion_date, result, notes, is_demo) values
  ('55555555-6666-1111-1111-000000000001', '33333333-3333-3333-3333-333333333303', '55555555-1111-1111-1111-000000000001', null, '99999999-9999-9999-9999-999999999903', '11111111-1111-1111-1111-111111111109', 'completed', 100, '2025-10-01', '2025-10-20', 'Area cleared and confirmed safe; handed back to community for agricultural use.', null, true),
  ('55555555-6666-1111-1111-000000000002', '33333333-3333-3333-3333-333333333303', '55555555-1111-1111-1111-000000000005', '55555555-5555-1111-1111-000000000003', '99999999-9999-9999-9999-999999999903', '11111111-1111-1111-1111-111111111109', 'in_progress', 45, '2025-12-15', '2026-02-01', null, 'Clearance team on site; working section by section.', true),
  ('55555555-6666-1111-1111-000000000003', '33333333-3333-3333-3333-333333333304', '55555555-1111-1111-1111-000000000003', null, '99999999-9999-9999-9999-999999999905', '11111111-1111-1111-1111-111111111110', 'planned', 0, '2026-02-01', null, null, 'Awaiting clearance team availability.', true),
  ('55555555-6666-1111-1111-000000000004', '33333333-3333-3333-3333-333333333303', '55555555-1111-1111-1111-000000000007', null, '99999999-9999-9999-9999-999999999903', '11111111-1111-1111-1111-111111111109', 'verified', 100, '2025-09-15', '2025-09-25', 'Verified clear by second team; no further action required.', null, true);

-- 4. Daily Update history. A full chronological sequence on MA-P1-HZ-004
-- mirrors the spec's own worked example (report -> assessment -> survey ->
-- confirmed -> response planned -> response started), demonstrating that
-- historical entries are preserved and shown newest-first.
insert into mine_daily_updates (project_id, hazard_id, survey_id, response_id, location_id, responsible_staff_id, update_date, status_snapshot, progress, summary, next_step, is_demo) values
  ('33333333-3333-3333-3333-333333333303', '55555555-1111-1111-1111-000000000005', null, null, '99999999-9999-9999-9999-999999999903', '11111111-1111-1111-1111-111111111115', '2025-11-28', 'open', null, 'Community report received about a suspected mine area affecting agricultural land access.', 'Schedule initial assessment.', true),
  ('33333333-3333-3333-3333-333333333303', '55555555-1111-1111-1111-000000000005', null, null, '99999999-9999-9999-9999-999999999903', '11111111-1111-1111-1111-111111111109', '2025-12-02', 'open', null, 'Initial assessment conducted; area cordoned off with warning markers.', 'Arrange non-technical survey.', true),
  ('33333333-3333-3333-3333-333333333303', '55555555-1111-1111-1111-000000000005', '55555555-5555-1111-1111-000000000003', null, '99999999-9999-9999-9999-999999999903', '11111111-1111-1111-1111-111111111109', '2025-12-10', 'in_progress', 10, 'Non-technical survey completed; hazard confirmed and boundary marked with community input.', 'Plan clearance response.', true),
  ('33333333-3333-3333-3333-333333333303', '55555555-1111-1111-1111-000000000005', null, '55555555-6666-1111-1111-000000000002', '99999999-9999-9999-9999-999999999903', '11111111-1111-1111-1111-111111111109', '2025-12-15', 'in_progress', 20, 'Response planned; clearance team scheduled for mid-December.', 'Mobilize clearance team.', true),
  ('33333333-3333-3333-3333-333333333303', '55555555-1111-1111-1111-000000000005', null, '55555555-6666-1111-1111-000000000002', '99999999-9999-9999-9999-999999999903', '11111111-1111-1111-1111-111111111109', '2025-12-20', 'in_progress', 45, 'Response started; clearance team working section by section, no incidents.', 'Continue clearance, next update after next working session.', true),
  ('33333333-3333-3333-3333-333333333303', '55555555-1111-1111-1111-000000000004', '55555555-5555-1111-1111-000000000002', null, '99999999-9999-9999-9999-999999999903', '11111111-1111-1111-1111-111111111115', '2026-01-05', 'open', null, 'Field team dispatched after community tip-off; single UXO item visible on the surface, area cordoned.', 'Schedule technical survey.', true),
  ('33333333-3333-3333-3333-333333333304', '55555555-1111-1111-1111-000000000009', '55555555-5555-1111-1111-000000000004', null, '99999999-9999-9999-9999-999999999905', '11111111-1111-1111-1111-111111111110', '2025-11-08', 'in_progress', null, 'Non-technical survey ongoing; UXO fragments confirmed during liaison visit.', 'Complete survey and determine response priority.', true);

-- 5. Four more MRE / community awareness sessions, two linked to the
-- existing MRE activities under P1.
insert into mre_sessions (project_id, activity_id, location_id, session_date, session_type, audience_description, participants_male, participants_female, facilitator_staff_id, topics, is_demo) values
  ('33333333-3333-3333-3333-333333333303', '77777777-7777-7777-7777-777777777705', '99999999-9999-9999-9999-999999999903', '2025-12-05', 'mre', 'Secondary school students, Tedim Town', 18, 20, '11111111-1111-1111-1111-111111111109', 'Hazard recognition, safe behaviour, reporting procedure', true),
  ('33333333-3333-3333-3333-333333333303', '77777777-7777-7777-7777-777777777706', '99999999-9999-9999-9999-999999999903', '2026-01-10', 'community_awareness', 'Farmers and household heads, rural villages', 12, 15, '11111111-1111-1111-1111-111111111109', 'Safe land use, marking systems, reporting hotline', true),
  ('33333333-3333-3333-3333-333333333304', null, '99999999-9999-9999-9999-999999999905', '2025-10-20', 'mre', 'Resettled families near Rih', 25, 30, '11111111-1111-1111-1111-111111111110', 'Risk recognition, child safety messaging', true),
  ('33333333-3333-3333-3333-333333333304', null, '99999999-9999-9999-9999-999999999902', '2025-12-15', 'community_awareness', 'Falam Township community leaders', 10, 8, '11111111-1111-1111-1111-111111111110', 'Community liaison, incident reporting', true);

-- 6. Two more victim assistance / referral cases, minimal PII throughout.
insert into victim_assistance (project_id, location_id, incident_date, age_group, gender, injury_type, assistance_provided, referral_organization, referral_status, status, is_demo) values
  ('33333333-3333-3333-3333-333333333303', '99999999-9999-9999-9999-999999999903', '2025-09-01', 'adult', 'male', 'Upper limb injury', 'First aid and transport to district hospital', 'Chin State Health Department', 'in_progress', 'in_progress', true),
  ('33333333-3333-3333-3333-333333333304', '99999999-9999-9999-9999-999999999905', '2025-10-10', 'youth', 'female', 'Minor shrapnel wound', 'Wound care at community clinic', 'Local clinic', 'referred', 'open', true);
