create type assessment_type as enum ('rapid_needs', 'household_assessment', 'sector_assessment', 'post_distribution_monitoring', 'other');
alter table needs_assessments add column assessment_type assessment_type not null default 'rapid_needs';
