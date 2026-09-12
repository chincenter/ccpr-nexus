-- DEMO DATA — NOT REAL CCPR DATA

insert into public.stakeholders (id, project_id, name, stakeholder_type, organization, location_id, contact_info, engagement_status, created_by, is_demo) values
  ('77777777-1111-1111-1111-000000000001', '33333333-3333-3333-3333-333333333307', 'Hakha Township Administrator', 'government', 'General Administration Department', '99999999-9999-9999-9999-999999999901', 'Office of the Township Administrator, Hakha', 'engaged', '11111111-1111-1111-1111-111111111113', true),
  ('77777777-1111-1111-1111-000000000002', '33333333-3333-3333-3333-333333333307', 'Chin Women''s Network', 'cso', 'Chin Women''s Network', '99999999-9999-9999-9999-999999999901', 'chinwomensnetwork@example.org', 'ongoing', '11111111-1111-1111-1111-111111111113', true),
  ('77777777-1111-1111-1111-000000000003', '33333333-3333-3333-3333-333333333308', 'Falam Community Elders Council', 'community', null, '99999999-9999-9999-9999-999999999902', 'Via village administrator, Falam', 'engaged', '11111111-1111-1111-1111-111111111114', true),
  ('77777777-1111-1111-1111-000000000004', '33333333-3333-3333-3333-333333333308', 'Cross-Border Liaison Office (Mizoram)', 'government', 'State Government of Mizoram', '99999999-9999-9999-9999-999999999906', 'Liaison desk, Champhai', 'not_engaged', '11111111-1111-1111-1111-111111111114', true);

insert into public.consultations (id, project_id, location_id, consultation_date, topic, summary, facilitator_staff_id, created_by, is_demo) values
  ('77777777-2222-1111-1111-000000000001', '33333333-3333-3333-3333-333333333307', '99999999-9999-9999-9999-999999999901', '2025-10-15', 'Local governance priorities for displaced-population services', 'Discussion on coordinating township services with CCPR''s humanitarian and health projects; strong interest in a joint referral pathway.', '11111111-1111-1111-1111-111111111113', '11111111-1111-1111-1111-111111111113', true),
  ('77777777-2222-1111-1111-000000000002', '33333333-3333-3333-3333-333333333308', '99999999-9999-9999-9999-999999999906', '2025-11-22', 'Cross-border coordination on population movement', 'Preliminary discussion with Mizoram-side liaison contacts on information-sharing during periods of increased crossing.', '11111111-1111-1111-1111-111111111114', '11111111-1111-1111-1111-111111111114', true);

insert into public.consultation_stakeholders (consultation_id, stakeholder_id) values
  ('77777777-2222-1111-1111-000000000001', '77777777-1111-1111-1111-000000000001'),
  ('77777777-2222-1111-1111-000000000001', '77777777-1111-1111-1111-000000000002'),
  ('77777777-2222-1111-1111-000000000002', '77777777-1111-1111-1111-000000000003'),
  ('77777777-2222-1111-1111-000000000002', '77777777-1111-1111-1111-000000000004');

insert into public.recommendations (id, consultation_id, description, responsible_staff_id, status, created_by, is_demo) values
  ('77777777-3333-1111-1111-000000000001', '77777777-2222-1111-1111-000000000001', 'Establish a monthly coordination meeting between CCPR project officers and the Township Administrator''s office.', '11111111-1111-1111-1111-111111111113', 'in_progress', '11111111-1111-1111-1111-111111111113', true),
  ('77777777-3333-1111-1111-000000000002', '77777777-2222-1111-1111-000000000002', 'Set up a shared information-sharing protocol with the Mizoram-side liaison office.', '11111111-1111-1111-1111-111111111114', 'open', '11111111-1111-1111-1111-111111111114', true);

insert into public.decisions (id, recommendation_id, project_id, decision_text, decision_date, responsible_body, status, created_by, is_demo) values
  ('77777777-4444-1111-1111-000000000001', '77777777-3333-1111-1111-000000000001', '33333333-3333-3333-3333-333333333307', 'Approved monthly coordination meeting, first session scheduled for December 2025.', '2025-11-01', 'CCPR Governance Programme Team', 'in_progress', '11111111-1111-1111-1111-111111111113', true),
  ('77777777-4444-1111-1111-000000000002', '77777777-3333-1111-1111-000000000002', '33333333-3333-3333-3333-333333333308', 'Agreed in principle to draft a shared information-sharing protocol; pending Mizoram-side sign-off.', '2025-11-28', 'CCPR Governance Programme Team', 'open', '11111111-1111-1111-1111-111111111114', true);

insert into public.governance_actions (decision_id, project_id, action_description, responsible_staff_id, due_date, status, follow_up_notes, created_by, is_demo) values
  ('77777777-4444-1111-1111-000000000001', '33333333-3333-3333-3333-333333333307', 'Schedule and confirm venue for the first monthly coordination meeting.', '11111111-1111-1111-1111-111111111113', '2025-12-10', 'completed', 'Meeting held on 10 Dec 2025 at the Township Administrator''s office.', '11111111-1111-1111-1111-111111111113', true),
  ('77777777-4444-1111-1111-000000000001', '33333333-3333-3333-3333-333333333307', 'Circulate meeting minutes and action points to all attendees.', '11111111-1111-1111-1111-111111111113', '2025-08-20', 'in_progress', null, '11111111-1111-1111-1111-111111111113', true),
  ('77777777-4444-1111-1111-000000000002', '33333333-3333-3333-3333-333333333308', 'Draft the information-sharing protocol document for review.', '11111111-1111-1111-1111-111111111114', '2026-01-15', 'not_started', null, '11111111-1111-1111-1111-111111111114', true);
