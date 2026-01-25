-- Backfill clinics.timezone and standardize defaults
-- Source of truth: clinics.timezone (IANA timezone string)
-- Fallback: clinic_schedule_config.timezone, then America/Los_Angeles

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'clinics'
      AND column_name = 'timezone'
  ) THEN
    ALTER TABLE public.clinics
      ADD COLUMN timezone text;
  END IF;
END $$;

-- Ensure a sensible default for newly created clinics
ALTER TABLE public.clinics
  ALTER COLUMN timezone SET DEFAULT 'America/Los_Angeles';

-- Prefer existing clinics.timezone; otherwise use clinic_schedule_config.timezone; otherwise default
UPDATE public.clinics c
SET timezone = COALESCE(c.timezone, cfg.timezone, 'America/Los_Angeles')
FROM public.clinic_schedule_config cfg
WHERE cfg.clinic_id = c.id
  AND c.timezone IS NULL;

-- Final fallback for any clinics without schedule config
UPDATE public.clinics
SET timezone = 'America/Los_Angeles'
WHERE timezone IS NULL;

