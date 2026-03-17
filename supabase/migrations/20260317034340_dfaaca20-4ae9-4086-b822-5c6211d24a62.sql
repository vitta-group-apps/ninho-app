
-- Fix 1: children ALL policy has no WITH CHECK, so INSERT is silently blocked.
-- Drop and recreate with explicit WITH CHECK so family owners can insert children.
DROP POLICY IF EXISTS "Admins can manage children" ON public.children;

CREATE POLICY "Admins can manage children"
  ON public.children
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.families f
      WHERE f.id = children.family_id
        AND f.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.families f
      WHERE f.id = children.family_id
        AND f.owner_id = auth.uid()
    )
  );

-- Fix 2: routine_logs INSERT policy — extend to also allow family owners (not just members)
-- so that new users who haven't gotten a membership row yet can still log.
DROP POLICY IF EXISTS "Monitors and admins can insert routine logs" ON public.routine_logs;

CREATE POLICY "Monitors and admins can insert routine logs"
  ON public.routine_logs
  FOR INSERT
  WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (
      SELECT 1
      FROM public.children c
      JOIN public.families f ON f.id = c.family_id
      WHERE c.id = routine_logs.child_id
        AND (
          f.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.memberships m
            WHERE m.family_id = f.id
              AND m.user_id = auth.uid()
              AND m.role IN ('admin', 'monitor')
          )
        )
    )
  );
