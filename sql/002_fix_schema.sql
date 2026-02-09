-- =============================================
-- 002_fix_schema.sql
-- Run this in the Supabase SQL Editor to fix
-- missing columns, tables, and update RLS to
-- use app_metadata instead of user_roles.
-- =============================================

-- =============================================
-- 1. Add missing columns to sales table
-- =============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sales' AND column_name = 'status'
  ) THEN
    ALTER TABLE "sales" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'pending'
      CHECK (status IN ('pending', 'approved', 'rejected'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sales' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE "sales" ADD COLUMN "created_by" UUID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sales' AND column_name = 'discount_mode'
  ) THEN
    ALTER TABLE "sales" ADD COLUMN "discount_mode" TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sales' AND column_name = 'notes'
  ) THEN
    ALTER TABLE "sales" ADD COLUMN "notes" TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sales' AND column_name = 'view_count'
  ) THEN
    ALTER TABLE "sales" ADD COLUMN "view_count" INTEGER NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sales' AND column_name = 'favorite_count'
  ) THEN
    ALTER TABLE "sales" ADD COLUMN "favorite_count" INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

-- =============================================
-- 2. Create api_tokens table (if not exists)
-- =============================================

CREATE TABLE IF NOT EXISTS "api_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "token_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "api_tokens_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "api_tokens_token_hash_idx" ON "api_tokens"("token_hash");
CREATE INDEX IF NOT EXISTS "api_tokens_user_id_idx" ON "api_tokens"("user_id");

ALTER TABLE "api_tokens" ENABLE ROW LEVEL SECURITY;

-- api_tokens RLS (drop if exists, then recreate)
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can read own tokens" ON "api_tokens";
  DROP POLICY IF EXISTS "Users can create own tokens" ON "api_tokens";
  DROP POLICY IF EXISTS "Users can update own tokens" ON "api_tokens";
  DROP POLICY IF EXISTS "Users can delete own tokens" ON "api_tokens";
END $$;

CREATE POLICY "Users can read own tokens"
    ON "api_tokens" FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can create own tokens"
    ON "api_tokens" FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own tokens"
    ON "api_tokens" FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own tokens"
    ON "api_tokens" FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- =============================================
-- 3. Update get_user_role() to use app_metadata
--    instead of user_roles table
-- =============================================

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT COALESCE(
    (SELECT raw_app_meta_data->>'role' FROM auth.users WHERE id = auth.uid()),
    'editor'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =============================================
-- 4. Ensure sales RLS policies exist
-- =============================================

DO $$
BEGIN
  DROP POLICY IF EXISTS "Anon can read approved sales" ON "sales";
  DROP POLICY IF EXISTS "Authenticated can read all sales" ON "sales";
  DROP POLICY IF EXISTS "Authenticated can create sales" ON "sales";
  DROP POLICY IF EXISTS "Admins can update sales" ON "sales";
  DROP POLICY IF EXISTS "Editors can update own pending sales" ON "sales";
  DROP POLICY IF EXISTS "Admins can delete sales" ON "sales";
  DROP POLICY IF EXISTS "Editors can delete own pending sales" ON "sales";
END $$;

CREATE POLICY "Anon can read approved sales"
    ON "sales" FOR SELECT TO anon
    USING (status = 'approved');

CREATE POLICY "Authenticated can read all sales"
    ON "sales" FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Authenticated can create sales"
    ON "sales" FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "Admins can update sales"
    ON "sales" FOR UPDATE TO authenticated
    USING (public.get_user_role() = 'admin')
    WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Editors can update own pending sales"
    ON "sales" FOR UPDATE TO authenticated
    USING (public.get_user_role() = 'editor' AND created_by = auth.uid() AND status = 'pending')
    WITH CHECK (public.get_user_role() = 'editor' AND status = 'pending');

CREATE POLICY "Admins can delete sales"
    ON "sales" FOR DELETE TO authenticated
    USING (public.get_user_role() = 'admin');

CREATE POLICY "Editors can delete own pending sales"
    ON "sales" FOR DELETE TO authenticated
    USING (public.get_user_role() = 'editor' AND created_by = auth.uid() AND status = 'pending');

-- =============================================
-- 5. Ensure brands RLS policies exist
-- =============================================

DO $$
BEGIN
  DROP POLICY IF EXISTS "Anyone can read brands" ON "brands";
  DROP POLICY IF EXISTS "Admins can create brands" ON "brands";
  DROP POLICY IF EXISTS "Admins can update brands" ON "brands";
  DROP POLICY IF EXISTS "Admins can delete brands" ON "brands";
END $$;

CREATE POLICY "Anyone can read brands"
    ON "brands" FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "Admins can create brands"
    ON "brands" FOR INSERT TO authenticated
    WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Admins can update brands"
    ON "brands" FOR UPDATE TO authenticated
    USING (public.get_user_role() = 'admin')
    WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Admins can delete brands"
    ON "brands" FOR DELETE TO authenticated
    USING (public.get_user_role() = 'admin');

-- =============================================
-- 6. Ensure sale limit trigger exists
-- =============================================

CREATE OR REPLACE FUNCTION check_brand_sale_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM sales
      WHERE brand_id = NEW.brand_id
      AND end_date >= CURRENT_DATE
      AND id != NEW.id) >= 3 THEN
    RAISE EXCEPTION 'Brand cannot have more than 3 active sales at a time';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_brand_sale_limit ON sales;
CREATE TRIGGER enforce_brand_sale_limit
  BEFORE INSERT OR UPDATE ON sales
  FOR EACH ROW EXECUTE FUNCTION check_brand_sale_limit();

-- =============================================
-- 7. User management functions (called via supabase.rpc())
-- =============================================

-- List all users (admin only)
CREATE OR REPLACE FUNCTION public.list_users()
RETURNS TABLE (id UUID, email TEXT, role TEXT, created_at TIMESTAMPTZ) AS $$
BEGIN
  IF public.get_user_role() != 'admin' THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  RETURN QUERY
  SELECT
    u.id,
    u.email::TEXT,
    COALESCE(u.raw_app_meta_data->>'role', 'editor')::TEXT AS role,
    u.created_at
  FROM auth.users u
  ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update a user's role (admin only)
CREATE OR REPLACE FUNCTION public.update_user_role(target_user_id UUID, new_role TEXT)
RETURNS VOID AS $$
BEGIN
  IF public.get_user_role() != 'admin' THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  IF new_role NOT IN ('admin', 'editor') THEN
    RAISE EXCEPTION 'Role must be "admin" or "editor"';
  END IF;

  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot change your own role';
  END IF;

  UPDATE auth.users
  SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object('role', new_role)
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.list_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_role(UUID, TEXT) TO authenticated;

-- =============================================
-- 8. Increment view count (callable by anyone, including anon)
-- =============================================

CREATE OR REPLACE FUNCTION public.increment_view_count(sale_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE sales SET view_count = view_count + 1 WHERE id = sale_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.increment_view_count(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_view_count(UUID) TO authenticated;

-- =============================================
-- 9. Favorite / unfavorite sale
-- =============================================

CREATE OR REPLACE FUNCTION public.favorite_sale(sale_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE sales SET favorite_count = favorite_count + 1 WHERE id = sale_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.unfavorite_sale(sale_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE sales SET favorite_count = GREATEST(favorite_count - 1, 0) WHERE id = sale_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.favorite_sale(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.favorite_sale(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unfavorite_sale(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.unfavorite_sale(UUID) TO authenticated;

-- =============================================
-- 10. Set your user as admin (replace email)
-- =============================================
-- UPDATE auth.users
-- SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb
-- WHERE email = 'your-email@example.com';

-- =============================================
-- 8. Notify PostgREST to reload schema cache
-- =============================================
NOTIFY pgrst, 'reload schema';
