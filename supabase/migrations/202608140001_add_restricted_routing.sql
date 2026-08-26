-- HASILTANI decision-engine routing rules
alter table if exists public.grading_results
  drop constraint if exists grading_results_routing_status_check;

alter table if exists public.grading_results
  add constraint grading_results_routing_status_check
  check (routing_status in ('READY','REVIEW','RESTRICTED'));
