
-- Fix circular dependency: owner can't read their own family to satisfy
-- the membership INSERT policy check, because families SELECT requires a
-- membership that doesn't exist yet. Add a direct owner SELECT policy to
-- break the cycle so family creation → membership creation flows correctly.

-- 1. Owner can always read their own family (breaks the circular dependency)
CREATE POLICY "families_select_owner"
  ON public.families
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

-- 2. Set DB-level default for owner_id so it's always populated correctly
ALTER TABLE public.families
  ALTER COLUMN owner_id SET DEFAULT auth.uid();
