-- Phase 4 Humanitarian: expand demo data to exercise the new fields (targets,
-- assessment types, distribution status/verification) and demonstrate the
-- unique-households-vs-total-instances distinction (spec section 11) with a
-- household that legitimately receives assistance more than once.
-- DEMO DATA — NOT REAL CCPR DATA. All rows below are is_demo = true.

-- 1. Populate targets/responsible staff/location on the two existing plans.
update assistance_plans set
  target_households = 15,
  target_beneficiaries = 60,
  responsible_staff_id = '11111111-1111-1111-1111-111111111107',
  location_id = '99999999-9999-9999-9999-999999999901'
where id = '44444444-4444-1111-1111-000000000001';

update assistance_plans set
  target_households = 8,
  target_beneficiaries = 30,
  responsible_staff_id = '11111111-1111-1111-1111-111111111108',
  location_id = '99999999-9999-9999-9999-999999999902'
where id = '44444444-4444-1111-1111-000000000002';

-- 2. Vary assessment verification status + type on the two existing assessments,
-- and add a third (a post-distribution monitoring check, appropriately dated
-- after distributions began).
update needs_assessments set verification_status = 'approved' where id = '44444444-1111-1111-1111-000000000001';
update needs_assessments set assessment_type = 'household_assessment', verification_status = 'under_review' where id = '44444444-1111-1111-1111-000000000002';

insert into needs_assessments (id, project_id, location_id, assessment_date, assessment_type, population_estimate, priority, needs, findings, conducted_by, verification_status, is_demo)
values (
  '44444444-1111-1111-1111-000000000003', '33333333-3333-3333-3333-333333333301', '99999999-9999-9999-9999-999999999901',
  '2025-12-22', 'post_distribution_monitoring', 210, 'medium',
  'Follow-up on food assistance adequacy', 'Most households report sufficient food coverage for the ration period; a few flagged fuel shortages for cooking.',
  '11111111-1111-1111-1111-111111111116', 'submitted', true
);

-- 3. Ten more households (5 per project) across Hakha/Falam/Rih.
insert into households (id, project_id, location_id, household_code, household_size, vulnerability_notes, assistance_status, is_demo) values
  ('44444444-2222-1111-1111-000000000006', '33333333-3333-3333-3333-333333333301', '99999999-9999-9999-9999-999999999901', 'HUM-P1-HH-004', 4, null, 'assisted', true),
  ('44444444-2222-1111-1111-000000000007', '33333333-3333-3333-3333-333333333301', '99999999-9999-9999-9999-999999999901', 'HUM-P1-HH-005', 7, 'Female-headed household', 'assisted', true),
  ('44444444-2222-1111-1111-000000000008', '33333333-3333-3333-3333-333333333301', '99999999-9999-9999-9999-999999999901', 'HUM-P1-HH-006', 3, null, 'assisted', true),
  ('44444444-2222-1111-1111-000000000009', '33333333-3333-3333-3333-333333333301', '99999999-9999-9999-9999-999999999901', 'HUM-P1-HH-007', 5, 'Elderly-headed household', 'assisted', true),
  ('44444444-2222-1111-1111-000000000010', '33333333-3333-3333-3333-333333333301', '99999999-9999-9999-9999-999999999901', 'HUM-P1-HH-008', 2, null, 'planned', true),
  ('44444444-2222-1111-1111-000000000011', '33333333-3333-3333-3333-333333333302', '99999999-9999-9999-9999-999999999902', 'HUM-P2-HH-003', 6, null, 'assisted', true),
  ('44444444-2222-1111-1111-000000000012', '33333333-3333-3333-3333-333333333302', '99999999-9999-9999-9999-999999999905', 'HUM-P2-HH-004', 3, 'Recently displaced', 'planned', true),
  ('44444444-2222-1111-1111-000000000013', '33333333-3333-3333-3333-333333333302', '99999999-9999-9999-9999-999999999902', 'HUM-P2-HH-005', 4, null, 'not_assessed', true),
  ('44444444-2222-1111-1111-000000000014', '33333333-3333-3333-3333-333333333302', '99999999-9999-9999-9999-999999999905', 'HUM-P2-HH-006', 2, null, 'not_assessed', true),
  ('44444444-2222-1111-1111-000000000015', '33333333-3333-3333-3333-333333333302', '99999999-9999-9999-9999-999999999902', 'HUM-P2-HH-007', 5, 'Person with disability in household', 'assisted', true);

-- 4. Beneficiaries for the new households (registered members; used to derive
-- "beneficiaries reached" from a household-level distribution record).
insert into beneficiaries (id, household_id, beneficiary_code, age_group, gender, vulnerability_category, is_demo) values
  ('44444444-3333-1111-1111-000000000008', '44444444-2222-1111-1111-000000000006', 'BEN-008', 'adult', 'female', null, true),
  ('44444444-3333-1111-1111-000000000009', '44444444-2222-1111-1111-000000000006', 'BEN-009', 'child', null, null, true),
  ('44444444-3333-1111-1111-000000000010', '44444444-2222-1111-1111-000000000007', 'BEN-010', 'adult', 'female', 'female_headed_household', true),
  ('44444444-3333-1111-1111-000000000011', '44444444-2222-1111-1111-000000000007', 'BEN-011', 'child', null, null, true),
  ('44444444-3333-1111-1111-000000000012', '44444444-2222-1111-1111-000000000007', 'BEN-012', 'child', null, null, true),
  ('44444444-3333-1111-1111-000000000013', '44444444-2222-1111-1111-000000000008', 'BEN-013', 'adult', 'male', null, true),
  ('44444444-3333-1111-1111-000000000014', '44444444-2222-1111-1111-000000000009', 'BEN-014', 'elderly', 'male', null, true),
  ('44444444-3333-1111-1111-000000000015', '44444444-2222-1111-1111-000000000009', 'BEN-015', 'adult', 'female', null, true),
  ('44444444-3333-1111-1111-000000000016', '44444444-2222-1111-1111-000000000011', 'BEN-016', 'adult', 'male', null, true),
  ('44444444-3333-1111-1111-000000000017', '44444444-2222-1111-1111-000000000011', 'BEN-017', 'child', null, null, true),
  ('44444444-3333-1111-1111-000000000018', '44444444-2222-1111-1111-000000000012', 'BEN-018', 'adult', 'female', 'displaced', true),
  ('44444444-3333-1111-1111-000000000019', '44444444-2222-1111-1111-000000000015', 'BEN-019', 'adult', 'male', 'disability', true),
  ('44444444-3333-1111-1111-000000000020', '44444444-2222-1111-1111-000000000015', 'BEN-020', 'child', null, null, true);

-- 5. Existing two distributions get real statuses (the migration default left
-- every pre-existing row at 'planned'). Distribution 1 (P1, food, 2025-11-15)
-- is now complete; distribution 2 (P2, nfi, 2025-12-05) stays upcoming.
update distributions set status = 'completed' where id = '44444444-5555-1111-1111-000000000001';

-- 6. Five more distributions spanning the remaining statuses, including a
-- cancelled one (must not count toward reached/delivered totals) and a
-- repeat visit to HH-001 (already assisted 2025-11-15) to demonstrate that
-- "households reached" counts it once while "assistance instances" counts
-- both.
insert into distributions (id, project_id, assistance_plan_id, location_id, distribution_date, assistance_type, unit, notes, conducted_by, status, is_demo) values
  ('44444444-5555-1111-1111-000000000003', '33333333-3333-3333-3333-333333333301', '44444444-4444-1111-1111-000000000001', '99999999-9999-9999-9999-999999999901', '2025-12-01', 'food', 'bag', 'Second round of food assistance for the same registration list plus newly assessed households.', '11111111-1111-1111-1111-111111111107', 'completed', true),
  ('44444444-5555-1111-1111-000000000004', '33333333-3333-3333-3333-333333333301', '44444444-4444-1111-1111-000000000001', '99999999-9999-9999-9999-999999999901', '2025-12-20', 'food', 'bag', 'Post-distribution monitoring confirmed delivery; marked verified by management.', '11111111-1111-1111-1111-111111111107', 'verified', true),
  ('44444444-5555-1111-1111-000000000005', '33333333-3333-3333-3333-333333333302', '44444444-4444-1111-1111-000000000002', '99999999-9999-9999-9999-999999999902', '2025-11-25', 'nfi', 'kit', 'NFI kits being handed out; still in progress at time of last update.', '11111111-1111-1111-1111-111111111108', 'in_progress', true),
  ('44444444-5555-1111-1111-000000000006', '33333333-3333-3333-3333-333333333302', null, '99999999-9999-9999-9999-999999999905', '2025-10-15', 'cash', 'voucher', 'Cancelled after funding delay; recorded for audit trail only, excluded from reached totals.', '11111111-1111-1111-1111-111111111108', 'cancelled', true),
  ('44444444-5555-1111-1111-000000000007', '33333333-3333-3333-3333-333333333301', null, '99999999-9999-9999-9999-999999999901', '2025-12-27', 'nfi', 'kit', null, '11111111-1111-1111-1111-111111111115', 'in_progress', true);

-- Distribution items. HH-001 appears in both the 2025-11-15 and 2025-12-01
-- food distributions — two assistance instances, one unique household.
insert into distribution_items (distribution_id, household_id, quantity) values
  ('44444444-5555-1111-1111-000000000003', '44444444-2222-1111-1111-000000000001', 2), -- HH-001 repeat visit
  ('44444444-5555-1111-1111-000000000003', '44444444-2222-1111-1111-000000000003', 3),
  ('44444444-5555-1111-1111-000000000003', '44444444-2222-1111-1111-000000000006', 2),
  ('44444444-5555-1111-1111-000000000004', '44444444-2222-1111-1111-000000000002', 1),
  ('44444444-5555-1111-1111-000000000004', '44444444-2222-1111-1111-000000000007', 3),
  ('44444444-5555-1111-1111-000000000004', '44444444-2222-1111-1111-000000000008', 1),
  ('44444444-5555-1111-1111-000000000005', '44444444-2222-1111-1111-000000000004', 1),
  ('44444444-5555-1111-1111-000000000005', '44444444-2222-1111-1111-000000000011', 1),
  ('44444444-5555-1111-1111-000000000006', '44444444-2222-1111-1111-000000000012', 1), -- belongs to a CANCELLED distribution
  ('44444444-5555-1111-1111-000000000007', '44444444-2222-1111-1111-000000000009', 1),
  ('44444444-5555-1111-1111-000000000007', '44444444-2222-1111-1111-000000000010', 1);
