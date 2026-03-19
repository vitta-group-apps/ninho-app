
-- Add birth baseline + profile fields to children table
-- These fields power growth intelligence, development context, and priority engine

ALTER TABLE public.children
  ADD COLUMN IF NOT EXISTS birth_weight_g     integer      NULL,
  ADD COLUMN IF NOT EXISTS birth_height_cm    numeric(4,1) NULL,
  ADD COLUMN IF NOT EXISTS birth_head_cm      numeric(4,1) NULL,
  ADD COLUMN IF NOT EXISTS gestational_age_w  integer      NULL,
  ADD COLUMN IF NOT EXISTS premature          boolean      NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pediatrician       text         NULL,
  ADD COLUMN IF NOT EXISTS health_plan        text         NULL,
  ADD COLUMN IF NOT EXISTS sex                text         NULL;
