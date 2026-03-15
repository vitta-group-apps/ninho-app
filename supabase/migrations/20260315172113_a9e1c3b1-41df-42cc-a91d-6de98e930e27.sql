-- Ninho MVP: Add missing tables (plans, vaccines_catalog, child_vaccines, health_events)

-- Plans table
CREATE TABLE IF NOT EXISTS public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  price_cents integer NOT NULL DEFAULT 0
);
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Plans are publicly readable" ON public.plans FOR SELECT USING (true);
INSERT INTO public.plans (code, name, price_cents) VALUES
  ('free', 'Free', 0),
  ('premium_month', 'Premium Mensal', 1990),
  ('premium_year', 'Premium Anual', 14900)
ON CONFLICT (code) DO NOTHING;

-- Vaccines catalog
CREATE TABLE IF NOT EXISTS public.vaccines_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  calendar_type text NOT NULL DEFAULT 'sus',
  description text,
  recommended_age_days integer,
  dose_number integer DEFAULT 1
);
ALTER TABLE public.vaccines_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Vaccines catalog is publicly readable" ON public.vaccines_catalog FOR SELECT USING (true);

-- Child vaccines
CREATE TABLE IF NOT EXISTS public.child_vaccines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  vaccine_id uuid NOT NULL REFERENCES public.vaccines_catalog(id) ON DELETE CASCADE,
  status text CHECK (status IN ('pending', 'done', 'late', 'scheduled')) DEFAULT 'pending',
  applied_on date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.child_vaccines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Family members can view child vaccines" ON public.child_vaccines FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.children c JOIN public.families f ON f.id = c.family_id
    WHERE c.id = child_vaccines.child_id
      AND (f.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.memberships m WHERE m.family_id = f.id AND m.user_id = auth.uid()))
  ));
CREATE POLICY "Admins and monitors can manage child vaccines" ON public.child_vaccines FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.children c JOIN public.families f ON f.id = c.family_id
    WHERE c.id = child_vaccines.child_id
      AND (f.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.memberships m WHERE m.family_id = f.id AND m.user_id = auth.uid() AND m.role IN ('admin', 'monitor')))
  ));
CREATE TRIGGER update_child_vaccines_updated_at
  BEFORE UPDATE ON public.child_vaccines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Health events
CREATE TABLE IF NOT EXISTS public.health_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  severity text CHECK (severity IN ('low', 'medium', 'high')) DEFAULT 'low',
  payload jsonb DEFAULT '{}'::jsonb,
  author_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.health_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Family members can view health events" ON public.health_events FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.children c JOIN public.families f ON f.id = c.family_id
    WHERE c.id = health_events.child_id
      AND (f.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.memberships m WHERE m.family_id = f.id AND m.user_id = auth.uid()))
  ));
CREATE POLICY "Admins and monitors can insert health events" ON public.health_events FOR INSERT
  WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (
      SELECT 1 FROM public.children c JOIN public.families f ON f.id = c.family_id
      WHERE c.id = health_events.child_id
        AND (f.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.memberships m WHERE m.family_id = f.id AND m.user_id = auth.uid() AND m.role IN ('admin', 'monitor')))
    )
  );

-- Seed SUS 2026 vaccines
INSERT INTO public.vaccines_catalog (name, calendar_type, description, recommended_age_days, dose_number) VALUES
  ('BCG', 'sus', 'Proteção contra formas graves de tuberculose', 0, 1),
  ('Hepatite B', 'sus', 'Dose ao nascer — previne hepatite B', 0, 1),
  ('Pentavalente (DTP+Hib+HepB)', 'sus', 'Difteria, tétano, coqueluche, Hib e hepatite B — 1ª dose', 60, 1),
  ('Pentavalente (DTP+Hib+HepB)', 'sus', 'Difteria, tétano, coqueluche, Hib e hepatite B — 2ª dose', 120, 2),
  ('Pentavalente (DTP+Hib+HepB)', 'sus', 'Difteria, tétano, coqueluche, Hib e hepatite B — 3ª dose', 180, 3),
  ('VIP (Poliomielite inativada)', 'sus', '1ª dose — proteção contra poliomielite', 60, 1),
  ('VIP (Poliomielite inativada)', 'sus', '2ª dose — proteção contra poliomielite', 120, 2),
  ('VIP (Poliomielite inativada)', 'sus', '3ª dose — proteção contra poliomielite', 180, 3),
  ('Pneumocócica 10V', 'sus', 'Proteção contra pneumonia e meningite — 1ª dose', 60, 1),
  ('Pneumocócica 10V', 'sus', 'Proteção contra pneumonia e meningite — 2ª dose', 120, 2),
  ('Meningocócica C', 'sus', 'Proteção contra meningite meningocócica C — 1ª dose', 90, 1),
  ('Meningocócica C', 'sus', 'Proteção contra meningite meningocócica C — 2ª dose', 150, 2),
  ('Rotavírus Humano', 'sus', 'Proteção contra gastroenterite grave — 1ª dose', 60, 1),
  ('Rotavírus Humano', 'sus', 'Proteção contra gastroenterite grave — 2ª dose', 120, 2),
  ('Influenza', 'sus', 'Proteção contra gripe sazonal — dose anual', 180, 1),
  ('Hepatite A', 'sus', 'Proteção contra hepatite A', 365, 1),
  ('Tríplice Viral (SCR)', 'sus', 'Sarampo, caxumba e rubéola — 1ª dose', 365, 1),
  ('Varicela', 'sus', 'Proteção contra catapora', 365, 1),
  ('Tríplice Viral (SCR)', 'sus', 'Sarampo, caxumba e rubéola — 2ª dose', 548, 2),
  ('DTP (reforço)', 'sus', 'Reforço difteria, tétano e coqueluche', 548, 4),
  ('VOP (Poliomielite oral)', 'sus', 'Reforço poliomielite oral', 548, 4),
  ('HPV Quadrivalente', 'sus', 'Proteção contra HPV — meninas 9–14 anos e meninos 11–14 anos', 3285, 1)
ON CONFLICT DO NOTHING;