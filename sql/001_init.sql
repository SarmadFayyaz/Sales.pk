-- =============================================
-- 1. Tables
-- =============================================

CREATE TABLE "brands" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "website_url" TEXT,
    "category" TEXT,
    "logo_url" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sales" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "brand_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "sale_type" TEXT NOT NULL,
    "discount_value" DECIMAL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "sale_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    "created_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "api_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "token_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "api_tokens_pkey" PRIMARY KEY ("id")
);

-- =============================================
-- 2. Indexes & Foreign Keys
-- =============================================

CREATE INDEX "idx_sales_brand_id" ON "sales"("brand_id");
CREATE INDEX "api_tokens_token_hash_idx" ON "api_tokens"("token_hash");
CREATE INDEX "api_tokens_user_id_idx" ON "api_tokens"("user_id");

ALTER TABLE "sales" ADD CONSTRAINT "sales_brand_id_fkey"
    FOREIGN KEY ("brand_id") REFERENCES "brands"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Case-insensitive unique brand name
CREATE UNIQUE INDEX "brands_name_unique" ON "brands" (LOWER(name));

-- =============================================
-- 3. Helper function: get current user's role
--    Reads from auth.users.raw_app_meta_data
-- =============================================

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT COALESCE(
    (SELECT raw_app_meta_data->>'role' FROM auth.users WHERE id = auth.uid()),
    'editor'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =============================================
-- 4. Trigger: max 3 non-expired sales per brand
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

CREATE TRIGGER enforce_brand_sale_limit
  BEFORE INSERT OR UPDATE ON sales
  FOR EACH ROW EXECUTE FUNCTION check_brand_sale_limit();

-- =============================================
-- 5. Enable RLS on all tables
-- =============================================

ALTER TABLE "brands" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sales" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "api_tokens" ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 6. RLS policies — Brands
-- =============================================

CREATE POLICY "Anyone can read brands"
    ON "brands" FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Admins can create brands"
    ON "brands" FOR INSERT
    TO authenticated
    WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Admins can update brands"
    ON "brands" FOR UPDATE
    TO authenticated
    USING (public.get_user_role() = 'admin')
    WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Admins can delete brands"
    ON "brands" FOR DELETE
    TO authenticated
    USING (public.get_user_role() = 'admin');

-- =============================================
-- 7. RLS policies — Sales
-- =============================================

CREATE POLICY "Anon can read approved sales"
    ON "sales" FOR SELECT
    TO anon
    USING (status = 'approved');

CREATE POLICY "Authenticated can read all sales"
    ON "sales" FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated can create sales"
    ON "sales" FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Admins can update sales"
    ON "sales" FOR UPDATE
    TO authenticated
    USING (public.get_user_role() = 'admin')
    WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Editors can update own pending sales"
    ON "sales" FOR UPDATE
    TO authenticated
    USING (public.get_user_role() = 'editor' AND created_by = auth.uid() AND status = 'pending')
    WITH CHECK (public.get_user_role() = 'editor' AND status = 'pending');

CREATE POLICY "Admins can delete sales"
    ON "sales" FOR DELETE
    TO authenticated
    USING (public.get_user_role() = 'admin');

CREATE POLICY "Editors can delete own pending sales"
    ON "sales" FOR DELETE
    TO authenticated
    USING (public.get_user_role() = 'editor' AND created_by = auth.uid() AND status = 'pending');

-- =============================================
-- 8. RLS policies — API Tokens
-- =============================================

CREATE POLICY "Users can read own tokens"
    ON "api_tokens" FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can create own tokens"
    ON "api_tokens" FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own tokens"
    ON "api_tokens" FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own tokens"
    ON "api_tokens" FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- =============================================
-- 9. User management functions (called via supabase.rpc())
-- =============================================

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
-- 10. Set yourself as admin (replace email)
-- =============================================
-- UPDATE auth.users
-- SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb
-- WHERE email = 'your-email@example.com';
