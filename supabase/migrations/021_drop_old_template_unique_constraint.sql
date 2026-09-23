-- 021_drop_old_template_unique_constraint.sql
--
-- FIX: Uploading certificate templates fails with:
--   "duplicate key value violates unique constraint
--    certificate_templates_event_template_type_key"
--
-- The OLD image-certificate system stored ONE template row per event per
-- template type (solo/team) using a unique constraint on (event_id, template_type).
--
-- The NEW system supports up to 8 templates per event:
--   4 certificate types (Participation, Winner, Runner Up, 2nd Runner Up)
--   × 2 template types (solo, team)
--
-- Migration 020 added the correct partial unique index
-- (event_id, certificate_type, template_type) but did NOT drop the legacy
-- constraint. The legacy constraint still blocks inserting more than one
-- row per (event_id, template_type), so uploading a second certificate type
-- for the same solo/team slot fails with a duplicate-key error.
--
-- This migration drops the legacy unique rule in BOTH possible forms:
--   • a table CONSTRAINT  → ALTER TABLE ... DROP CONSTRAINT
--   • a standalone INDEX   → DROP INDEX
-- PostgreSQL reports the identical "violates unique constraint" error for
-- both, and DROP CONSTRAINT silently no-ops when the rule is actually a
-- standalone index. Including both statements guarantees the legacy rule is
-- removed no matter how it was originally created.

-- ── 1. Drop legacy unique CONSTRAINT variants ────────────────────────────────

ALTER TABLE public.certificate_templates
  DROP CONSTRAINT IF EXISTS certificate_templates_event_template_type_key;

ALTER TABLE public.certificate_templates
  DROP CONSTRAINT IF EXISTS certificate_templates_event_type_key;

ALTER TABLE public.certificate_templates
  DROP CONSTRAINT IF EXISTS certificates_templates_event_type_key;

-- ── 2. Drop legacy unique INDEX variants ──────────────────────────────────────
-- If the unique rule was created with CREATE UNIQUE INDEX (standalone index),
-- there is no constraint to drop — the INDEX itself must be dropped.

DROP INDEX IF EXISTS public.certificate_templates_event_template_type_key;
DROP INDEX IF EXISTS public.certificate_templates_event_type_key;
DROP INDEX IF EXISTS public.certificates_templates_event_type_key;

-- ── 3. Safety net: drop any remaining unique index on (event_id, template_type) ─
-- Any unique index whose columns exactly match the legacy rule will block the
-- new multi-slot system. This catches renamed / auto-generated variants.

DO $$
DECLARE
  con_name TEXT;
  idx_name TEXT;
BEGIN
  -- Drop any unique CONSTRAINT whose column set is exactly (event_id, template_type)
  FOR con_name IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class tbl ON tbl.oid = con.conrelid
    JOIN pg_namespace ns ON ns.oid = tbl.relnamespace
    WHERE tbl.relname = 'certificate_templates'
      AND ns.nspname = 'public'
      AND con.contype = 'u'
      AND (
        SELECT ARRAY_AGG(a.attname ORDER BY k.ordinality)
        FROM unnest(con.conkey) WITH ORDINALITY AS k(attnum, ordinality)
        JOIN pg_attribute a
          ON a.attrelid = con.conrelid AND a.attnum = k.attnum
      ) = ARRAY['event_id','template_type']
  LOOP
    EXECUTE format('ALTER TABLE public.certificate_templates DROP CONSTRAINT IF EXISTS %I', con_name);
    RAISE NOTICE 'Dropped legacy unique constraint: %', con_name;
  END LOOP;

  -- Drop any standalone unique INDEX whose column set is exactly (event_id, template_type)
  FOR idx_name IN
    SELECT ic.relname
    FROM pg_index ix
    JOIN pg_class ic ON ic.oid = ix.indexrelid
    JOIN pg_class tc ON tc.oid = ix.indrelid
    JOIN pg_namespace ns ON ns.oid = ic.relnamespace
    WHERE tc.relname = 'certificate_templates'
      AND ns.nspname = 'public'
      AND ix.indisunique
      AND (
        SELECT ARRAY_AGG(a.attname ORDER BY k.ordinality)
        FROM unnest(ix.indkey) WITH ORDINALITY AS k(attnum, ordinality)
        JOIN pg_attribute a
          ON a.attrelid = ix.indrelid AND a.attnum = k.attnum
      ) = ARRAY['event_id','template_type']
  LOOP
    EXECUTE format('DROP INDEX IF EXISTS %I.%I', 'public', idx_name);
    RAISE NOTICE 'Dropped legacy unique index: %', idx_name;
  END LOOP;
END $$;

-- ── 4. Confirm the new partial unique index exists ────────────────────────────

CREATE UNIQUE INDEX IF NOT EXISTS idx_cert_templates_event_type_template
  ON public.certificate_templates (event_id, certificate_type, template_type)
  WHERE certificate_type IS NOT NULL AND template_type IS NOT NULL;

