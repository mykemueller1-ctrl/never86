-- ============================================================================
-- Frontline -> CEO Reporting Layer  (the "altitude" / report-problems-at-scale layer)
-- ============================================================================
-- Applied to Supabase project never86 (ref: zjtbhsouhwyyfwoyjgow).
--
-- Goal: turn the raw agent_findings ledger into role-tiered views so each level
-- sees only what it can act on:
--   * Frontline GM   -> every open finding for their store, as a do-now task
--   * Area director  -> one row per store, ranked by dollars at risk
--   * CEO            -> systemic problems aggregated to ONE line, ranked by $ exposure
--
-- Detectors already exist (void_hunter, 3p_fee_exposure, per_guest_anomaly,
-- catering_hidden_line, tip_variance_detector, data_hygiene, ...) and write to
-- public.agent_findings. This migration adds ONLY the routing/altitude layer.
--
-- An "operator" is a row in public.operator_users (operator_id = operator_users.id).
-- Taco Bomba was onboarded as operator_id 4 (pos_type='toast'); the CTAP/16-unit
-- Toast demo is operator_id 3.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- TIER 1: Frontline GM
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_findings_frontline
WITH (security_invoker = true) AS
SELECT f.operator_id,
       f.location_id,
       l.name  AS location,
       l.city,
       l.state,
       f.severity,
       (CASE f.severity WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END) AS sev_rank,
       f.agent_key,
       f.finding_type,
       f.headline,
       f.dollar_impact,
       f.recommended_action,
       f.evidence,
       f.period_start,
       f.period_end,
       f.status,
       f.created_at
FROM agent_findings f
LEFT JOIN operator_locations l
       ON l.id = f.location_id AND l.operator_id = f.operator_id
WHERE f.status = 'open';

-- ---------------------------------------------------------------------------
-- TIER 2: Area / Multi-unit director
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_findings_area
WITH (security_invoker = true) AS
SELECT f.operator_id,
       f.location_id,
       l.name  AS location,
       l.city,
       l.state,
       count(*)                                              AS open_findings,
       count(*) FILTER (WHERE f.severity = 'high')           AS high_ct,
       count(*) FILTER (WHERE f.severity = 'medium')         AS medium_ct,
       round(coalesce(sum(f.dollar_impact), 0), 2)           AS dollars_at_risk,
       (array_agg(f.finding_type ORDER BY f.dollar_impact DESC NULLS LAST))[1] AS top_issue,
       round(coalesce(max(f.dollar_impact), 0), 2)           AS top_issue_dollars
FROM agent_findings f
LEFT JOIN operator_locations l
       ON l.id = f.location_id AND l.operator_id = f.operator_id
WHERE f.status = 'open'
GROUP BY f.operator_id, f.location_id, l.name, l.city, l.state;

-- ---------------------------------------------------------------------------
-- TIER 3: CEO -- systemic problem board (multi-store / big-dollar / high-severity)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_findings_ceo
WITH (security_invoker = true) AS
SELECT f.operator_id,
       f.agent_key,
       f.finding_type,
       (CASE WHEN bool_or(f.severity = 'high')   THEN 'high'
             WHEN bool_or(f.severity = 'medium') THEN 'medium'
             ELSE 'low' END)                                  AS worst_severity,
       count(*)                                               AS findings,
       count(DISTINCT f.location_id)                          AS stores_affected,
       round(coalesce(sum(f.dollar_impact), 0), 2)            AS total_dollar_impact,
       (array_agg(f.recommended_action ORDER BY f.dollar_impact DESC NULLS LAST))[1] AS recommended_action
FROM agent_findings f
WHERE f.status = 'open'
GROUP BY f.operator_id, f.agent_key, f.finding_type
HAVING count(DISTINCT f.location_id) >= 3
    OR coalesce(sum(f.dollar_impact), 0) >= 50000
    OR bool_or(f.severity = 'high');

-- ---------------------------------------------------------------------------
-- Routing brain: seed mm_decision_rules (idempotent). Encodes which findings
-- elevate to which tier. Seeded for operator 3 (live demo) and 4 (Taco Bomba).
-- ---------------------------------------------------------------------------
INSERT INTO mm_decision_rules
  (operator_id, scope_type, trigger_name, trigger_condition, decision_action, escalation_path, severity, automation_level, do_not_do, success_metric)
SELECT op.id, r.scope_type, r.trigger_name, r.trigger_condition::jsonb, r.decision_action, r.escalation_path, r.severity, r.automation_level, r.do_not_do, r.success_metric
FROM (VALUES (3),(4)) AS op(id)
CROSS JOIN (VALUES
  ('operator','frontline_open_finding','{"status":"open"}','Show on store GM dashboard as a do-now task with the recommended_action attached.','frontline_gm','low','auto_surface',NULL,'Open findings resolved within 7 days'),
  ('operator','area_store_outlier','{"min_dollars_at_risk":25000}','Flag the store to the multi-unit director; compare against network median and trend.','area_director','medium','recommend',NULL,'Store dollars-at-risk trending down WoW'),
  ('operator','ceo_systemic_problem','{"min_stores_affected":3}','Roll up to the CEO problem board as ONE systemic line; route to a process/vendor/training decision.','ceo','high','recommend','Do not present per-store noise to the CEO; aggregate first.','Count of systemic problems open at CEO tier'),
  ('operator','ceo_dollar_threshold','{"min_total_dollar_impact":50000}','Escalate to CEO ranked by dollar exposure.','ceo','high','recommend',NULL,'Total dollar exposure on CEO board trending down'),
  ('operator','void_outlier_repeat','{"agent_key":"void_hunter","repeat_weeks":2}','Escalate employee void pattern from GM to area director; require manager reason review before action.','area_director','medium','recommend','Do not auto-accuse staff; review void reasons first.','Repeat void outliers cleared'),
  ('operator','third_party_fee_leak','{"agent_key":"3p_fee_exposure","min_total_dollar_impact":100000}','CEO decision: renegotiate platform fees and/or shift volume to first-party ordering.','ceo','high','recommend',NULL,'Effective 3P fee percent reduced')
) AS r(scope_type,trigger_name,trigger_condition,decision_action,escalation_path,severity,automation_level,do_not_do,success_metric)
WHERE NOT EXISTS (SELECT 1 FROM mm_decision_rules m WHERE m.operator_id=op.id AND m.trigger_name=r.trigger_name);

-- ============================================================================
-- ROLLBACK
--   DROP VIEW IF EXISTS v_findings_ceo, v_findings_area, v_findings_frontline;
--   DELETE FROM mm_decision_rules WHERE operator_id IN (3,4)
--     AND trigger_name IN ('frontline_open_finding','area_store_outlier',
--       'ceo_systemic_problem','ceo_dollar_threshold','void_outlier_repeat','third_party_fee_leak');
--   DELETE FROM operator_users WHERE email='ceo@taco-bomba.n86.app';  -- Taco Bomba stub
-- ============================================================================
