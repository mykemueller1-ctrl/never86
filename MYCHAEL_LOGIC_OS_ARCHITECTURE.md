# Mychael Mueller Logic OS Foundation

**Purpose:** This document defines the additive database foundation for turning each store, concept, and brand into its own structured intelligence container while rolling all learning into a unified **Mychael Mueller Logic OS**.

## Core architecture

The system is designed around a strict hierarchy: **operator → brand → concept → store → evidence → memory → decision rule → playbook → AI training example**. Each layer has its own identity, but every layer remains connected to the same operator boundary through `operator_id`.

| Layer | New table | Role in the OS |
|---|---|---|
| Brand | `operator_brands` | Stores public-facing brand identity, voice, promise, market position, and high-level strategy. |
| Concept | `operator_concepts` | Stores the business model, service style, menu logic, pricing posture, and operating thesis for a specific concept. |
| Store | `operator_store_profiles` | Maps an existing `operator_locations` record to a brand and concept, preserving local constraints, hours, market, and scorecard settings. |
| Decision logic | `mm_logic_principles`, `mm_decision_rules` | Captures Mychael Mueller’s reusable operating beliefs, rules, triggers, thresholds, and recommended actions. |
| Playbooks | `mm_playbooks`, `mm_playbook_steps` | Converts decision logic into repeatable operational workflows for stores, brands, concepts, teams, and AI agents. |
| Memory | `mm_memory_atoms` | Stores normalized facts, lessons, warnings, wins, failures, patterns, and strategic memories with source lineage. |
| Training | `mm_training_examples` | Turns memory and decisions into prompt-ready instruction examples for future custom LLM, agent, or OS behavior. |
| Runtime | `mm_os_runs` | Logs AI/OS reasoning runs and decisions so the system improves from what happened. |

## Design rules

Every new table is additive and non-destructive. The migration does not modify existing application tables or remove any existing policies. Each table includes `operator_id` and uses the existing `current_operator_id()` RLS pattern so authenticated users can only access their own intelligence layer. The migration intentionally avoids anonymous read access because this foundation can hold private business strategy, personal operating logic, documents, and future AI training data.

## First rollout scope

The first rollout creates the database foundation, indexes, comments, and RLS policies. Application UI and ingestion pipelines can then be connected in later phases. This keeps the first push safe: it gives the product a durable schema without forcing risky codepaths or data migrations.
