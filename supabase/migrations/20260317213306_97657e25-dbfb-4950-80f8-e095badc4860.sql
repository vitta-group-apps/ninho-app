
-- ============================================================
-- Drop the overly permissive blanket policies
-- ============================================================

DROP POLICY IF EXISTS "families_select_authenticated" ON public.families;
DROP POLICY IF EXISTS "families_insert_authenticated" ON public.families;
DROP POLICY IF EXISTS "families_update_authenticated" ON public.families;
DROP POLICY IF EXISTS "families_delete_authenticated" ON public.families;

DROP POLICY IF EXISTS "memberships_select_authenticated" ON public.memberships;
DROP POLICY IF EXISTS "memberships_insert_authenticated" ON public.memberships;
DROP POLICY IF EXISTS "memberships_update_authenticated" ON public.memberships;
DROP POLICY IF EXISTS "memberships_delete_authenticated" ON public.memberships;

DROP POLICY IF EXISTS "children_select_authenticated" ON public.children;
DROP POLICY IF EXISTS "children_insert_authenticated" ON public.children;
DROP POLICY IF EXISTS "children_update_authenticated" ON public.children;
DROP POLICY IF EXISTS "children_delete_authenticated" ON public.children;

-- ============================================================
-- FAMILIES — owner-scoped policies
-- ============================================================

CREATE POLICY "Owners can view their own families"
  ON public.families FOR SELECT
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.family_id = families.id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create families"
  ON public.families FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update their family"
  ON public.families FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete their family"
  ON public.families FOR DELETE
  USING (owner_id = auth.uid());

-- ============================================================
-- MEMBERSHIPS — family-scoped policies
-- ============================================================

CREATE POLICY "Family members can view memberships"
  ON public.memberships FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.families f
      WHERE f.id = memberships.family_id AND f.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can insert memberships"
  ON public.memberships FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.families f
      WHERE f.id = family_id AND f.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can update memberships"
  ON public.memberships FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.families f
      WHERE f.id = memberships.family_id AND f.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners or self can delete memberships"
  ON public.memberships FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.families f
      WHERE f.id = memberships.family_id AND f.owner_id = auth.uid()
    )
  );

-- ============================================================
-- CHILDREN — family-scoped policies
-- ============================================================

CREATE POLICY "Family members can view children"
  ON public.children FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.families f
      WHERE f.id = children.family_id
        AND (
          f.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.memberships m
            WHERE m.family_id = f.id AND m.user_id = auth.uid()
          )
        )
    )
  );

CREATE POLICY "Family admins can insert children"
  ON public.children FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.families f
      WHERE f.id = family_id
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

CREATE POLICY "Family admins can update children"
  ON public.children FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.families f
      WHERE f.id = children.family_id
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

CREATE POLICY "Owners can delete children"
  ON public.children FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.families f
      WHERE f.id = children.family_id AND f.owner_id = auth.uid()
    )
  );
