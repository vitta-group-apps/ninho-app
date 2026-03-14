
-- ============================================================
-- NINHO PWA — Foundation Schema
-- ============================================================

-- 1. ENUMS
CREATE TYPE public.app_role AS ENUM ('admin', 'monitor', 'viewer');
CREATE TYPE public.health_log_type AS ENUM ('vaccine', 'fever', 'medication', 'note');
CREATE TYPE public.routine_log_type AS ENUM ('sleep', 'feed', 'diaper', 'note');

-- 2. PROFILES (user display info)
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by owner"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- 3. USER ROLES (RBAC — separate table)
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- 4. FAMILIES
CREATE TABLE public.families (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;

-- 5. MEMBERSHIPS
CREATE TABLE public.memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'monitor',
  invited_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (family_id, user_id)
);

ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

-- 6. FAMILIES RLS (after memberships table exists)
CREATE POLICY "Family members can view their families"
  ON public.families FOR SELECT
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE family_id = families.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can insert families"
  ON public.families FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update families"
  ON public.families FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete families"
  ON public.families FOR DELETE
  USING (auth.uid() = owner_id);

-- MEMBERSHIPS RLS
CREATE POLICY "Members can view memberships of their families"
  ON public.memberships FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.families
      WHERE id = memberships.family_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can insert memberships"
  ON public.memberships FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.families
      WHERE id = family_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can update memberships"
  ON public.memberships FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.families
      WHERE id = memberships.family_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can delete memberships"
  ON public.memberships FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.families
      WHERE id = memberships.family_id AND owner_id = auth.uid()
    )
  );

-- 7. CHILDREN
CREATE TABLE public.children (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  blood_type TEXT,
  allergies JSONB DEFAULT '[]'::jsonb,
  medications JSONB DEFAULT '[]'::jsonb,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family members can view children"
  ON public.children FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.families f
      WHERE f.id = children.family_id AND (
        f.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.memberships m
          WHERE m.family_id = f.id AND m.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Admins can manage children"
  ON public.children FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.families f
      WHERE f.id = children.family_id AND f.owner_id = auth.uid()
    )
  );

-- 8. HEALTH LOGS
CREATE TABLE public.health_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  type health_log_type NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.health_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family members can view health logs"
  ON public.health_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.children c
      JOIN public.families f ON f.id = c.family_id
      WHERE c.id = health_logs.child_id AND (
        f.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.memberships m
          WHERE m.family_id = f.id AND m.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Monitors and admins can insert health logs"
  ON public.health_logs FOR INSERT
  WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM public.children c
      JOIN public.families f ON f.id = c.family_id
      WHERE c.id = child_id AND (
        f.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.memberships m
          WHERE m.family_id = f.id AND m.user_id = auth.uid()
            AND m.role IN ('admin', 'monitor')
        )
      )
    )
  );

-- 9. ROUTINE LOGS
CREATE TABLE public.routine_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  type routine_log_type NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_time TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.routine_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family members can view routine logs"
  ON public.routine_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.children c
      JOIN public.families f ON f.id = c.family_id
      WHERE c.id = routine_logs.child_id AND (
        f.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.memberships m
          WHERE m.family_id = f.id AND m.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Monitors and admins can insert routine logs"
  ON public.routine_logs FOR INSERT
  WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM public.children c
      JOIN public.families f ON f.id = c.family_id
      WHERE c.id = child_id AND (
        f.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.memberships m
          WHERE m.family_id = f.id AND m.user_id = auth.uid()
            AND m.role IN ('admin', 'monitor')
        )
      )
    )
  );

-- 10. TIMESTAMP TRIGGERS
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_families_updated_at
  BEFORE UPDATE ON public.families
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_children_updated_at
  BEFORE UPDATE ON public.children
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 11. AUTO-CREATE PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 12. AVATARS STORAGE
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
