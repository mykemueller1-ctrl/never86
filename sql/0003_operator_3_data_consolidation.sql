-- 0003_taco_bamba_data_consolidation.sql
--
-- One-time data cleanup (applied 2026-05-26 to Supabase project `never86`).
-- Goal: consolidate Chef-Led 16-Unit Group's real numbers under a single operator account and
-- correct two confirmed double-counts in the imported Toast data.
--
-- Before this change the data was scattered:
--   * operator 3 "Chef-Led 16-Unit Group"  -> the real Toast data (16 stores, 1045
--     location-breakdown rows, 426 employee-performance rows, 205 agent findings)
--   * operator 4 "Chef-Led 16-Unit Group" (partner acct) -> empty except 7 placeholder stores and
--     6 decision rules that duplicated operator 3's
--   * operator 1 "Community Pizza & Tap" (owner) -> held a misfiled April 2026 Toast
--     sales import (101 rows) that actually belongs to Chef-Led 16-Unit Group
--
-- A full snapshot of every modified table was taken first into zz_backup_20260526_*.

begin;

-- 1. Move the misfiled April 2026 Toast import off Community Pizza onto Chef-Led 16-Unit Group.
--    It is a 16-store monthly aggregate, so it is not tied to a single store.
update operator_sales_transactions set operator_id = 3, location_id = null where operator_id = 1;

-- 2. Drop operator 4's decision rules (exact duplicates of operator 3's 6 rules).
delete from mm_decision_rules where operator_id = 4;

-- 3. Drop operator 4's 7 empty placeholder stores (nothing references locations 18-24).
delete from operator_locations where operator_id = 4;

-- 4. Remove the empty duplicate Chef-Led 16-Unit Group stub, freeing the partner email.
delete from operator_users where id = 4;

-- 5. Promote the data-holding account (operator 3) to the real Chef-Led 16-Unit Group partner account.
update operator_users
  set name = 'Chef-Led 16-Unit Group', restaurant_name = 'Chef-Led 16-Unit Group', email = 'partner-operator3@n86.app'
  where id = 3;

-- 6. Give the 16 real stores proper names (city + original Toast store code).
update operator_locations
  set name = 'Chef-Led 16-Unit Group — ' || city || ' (#' || substring(name from 'Store ([0-9]+)') || ')'
  where operator_id = 3 and name like 'Store %';

commit;

-- ── Corrected reporting views (raw import tables left intact for audit) ──

-- April 2026 sales by category, de-duplicated. The raw table mixes category totals
-- ("X — ALL") with per-channel breakdowns of the same money; summing every row
-- double-counts (~$8.74M). This view keeps only the category totals (~$4.37M).
create or replace view v_taco_bamba_sales_by_category_apr2026 as
select category, total_price as net_sales
from operator_sales_transactions
where operator_id = 3 and item_name ilike '%ALL%'
order by total_price desc;

-- Per-store net sales Jan–Apr 2026, corrected for the 2x over-report in Toast's
-- location/revenue-center breakdown (confirmed by Rik): divide by 2.
create or replace view v_taco_bamba_location_sales as
select l.id as location_id, l.name as store, l.city, l.state,
       round(sum(b.net_sales)/2.0, 2) as net_sales_jan_apr_2026
from toast_location_breakdown b
join operator_locations l on l.id = b.location_id
where b.operator_id = 3
group by l.id, l.name, l.city, l.state
order by net_sales_jan_apr_2026 desc;

-- Headline corrected totals, with an independent cross-check from employee performance.
-- net_jan_apr_corrected = $15.58M vs employee cross-check = $15.72M (agree within ~1%).
create or replace view v_taco_bamba_sales_summary as
select
  (select round(sum(net_sales)/2.0,2) from toast_location_breakdown where operator_id=3)            as net_jan_apr_corrected,
  (select round(sum(net_sales),2)     from toast_employee_performance where operator_id=3)          as net_jan_apr_employee_crosscheck,
  (select round(sum(total_price),2)   from operator_sales_transactions where operator_id=3 and item_name ilike '%ALL%') as net_april_by_category;

alter view v_taco_bamba_sales_by_category_apr2026 set (security_invoker = on);
alter view v_taco_bamba_location_sales           set (security_invoker = on);
alter view v_taco_bamba_sales_summary            set (security_invoker = on);
