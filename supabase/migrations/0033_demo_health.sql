-- DEMO DATA — NOT REAL CCPR DATA

insert into public.health_facilities (id, project_id, location_id, name, facility_type, status, contact_person, contact_phone, created_by, is_demo) values
  ('66666666-1111-1111-1111-000000000001', '33333333-3333-3333-3333-333333333305', '99999999-9999-9999-9999-999999999901', 'Hakha Community Clinic', 'clinic', 'active', 'Dr. Van Sui', '09-000-0001', '11111111-1111-1111-1111-111111111111', true),
  ('66666666-1111-1111-1111-000000000002', '33333333-3333-3333-3333-333333333305', '99999999-9999-9999-9999-999999999902', 'Falam Health Post', 'health_post', 'active', 'Nurse Dawt Hlei', '09-000-0002', '11111111-1111-1111-1111-111111111111', true),
  ('66666666-1111-1111-1111-000000000003', '33333333-3333-3333-3333-333333333306', '99999999-9999-9999-9999-999999999903', 'Mobile Clinic Unit 1', 'mobile_clinic', 'active', 'Dr. Tial Sung', '09-000-0003', '11111111-1111-1111-1111-111111111112', true);

insert into public.health_services (facility_id, service_type, description, created_by, is_demo) values
  ('66666666-1111-1111-1111-000000000001', 'General outpatient care', 'Routine consultations and basic treatment.', '11111111-1111-1111-1111-111111111111', true),
  ('66666666-1111-1111-1111-000000000001', 'Maternal & child health', 'Antenatal checkups and child growth monitoring.', '11111111-1111-1111-1111-111111111111', true),
  ('66666666-1111-1111-1111-000000000002', 'Basic first aid & referral', 'Stabilization and referral to Hakha Community Clinic.', '11111111-1111-1111-1111-111111111111', true),
  ('66666666-1111-1111-1111-000000000003', 'Mobile outpatient consultations', 'Rotating outpatient care across underserved villages.', '11111111-1111-1111-1111-111111111112', true),
  ('66666666-1111-1111-1111-000000000003', 'Vaccination', 'Routine childhood immunization.', '11111111-1111-1111-1111-111111111112', true);

insert into public.health_outreach (project_id, facility_id, location_id, outreach_date, activity_description, people_served, male_served, female_served, responsible_staff_id, created_by, is_demo) values
  ('33333333-3333-3333-3333-333333333305', '66666666-1111-1111-1111-000000000001', '99999999-9999-9999-9999-999999999901', '2025-10-20', 'Community health education session on maternal nutrition.', 64, 20, 44, '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', true),
  ('33333333-3333-3333-3333-333333333306', '66666666-1111-1111-1111-000000000003', '99999999-9999-9999-9999-999999999904', '2025-11-12', 'Mobile clinic visit and vaccination drive in Matupi.', 118, 51, 67, '11111111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111112', true),
  ('33333333-3333-3333-3333-333333333306', '66666666-1111-1111-1111-000000000003', '99999999-9999-9999-9999-999999999905', '2025-12-03', 'Mobile clinic visit to Rih Village.', 42, 19, 23, '11111111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111112', true);

insert into public.health_referrals (project_id, facility_id, referral_date, reason, referred_to, age_group, gender, status, responsible_staff_id, created_by, is_demo) values
  ('33333333-3333-3333-3333-333333333305', '66666666-1111-1111-1111-000000000002', '2025-11-02', 'Suspected complicated pregnancy requiring specialist care.', 'Hakha Community Clinic', 'adult', 'female', 'resolved', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', true),
  ('33333333-3333-3333-3333-333333333306', '66666666-1111-1111-1111-000000000003', '2025-12-04', 'Child with severe respiratory symptoms.', 'Hakha Community Clinic', 'child', 'male', 'open', '11111111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111112', true);
