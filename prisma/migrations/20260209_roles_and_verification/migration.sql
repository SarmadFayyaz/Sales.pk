-- =============================================
-- Run in Supabase SQL Editor AFTER `npx prisma db push`
-- Prisma handles: user_roles table, sales.status + sales.created_by columns
-- This file handles: RLS policies, functions, triggers, constraints
-- =============================================

-- Backfill: mark all existing sales as approved
UPDATE "sales" SET "status" = 'approved' WHERE "status" = 'pending';

-- CHECK constraint on sales.status
ALTER TABLE "sales" ADD CONSTRAINT "sales_status_check"
  CHECK (status IN ('pending', 'approved', 'rejected'));

-- CHECK constraint on user_roles.role
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_check"
  CHECK (role IN ('admin', 'editor'));

-- =============================================
-- Helper function: get current user's role
-- =============================================

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT COALESCE(
    (SELECT role FROM user_roles WHERE user_id = auth.uid()),
    'editor'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =============================================
-- Unique brand name (case-insensitive)
-- =============================================

CREATE UNIQUE INDEX IF NOT EXISTS "brands_name_unique" ON "brands" (LOWER(name));

-- =============================================
-- Trigger: max 3 non-expired sales per brand
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
-- Drop old write policies on brands & sales
-- =============================================

DROP POLICY IF EXISTS "Authenticated users can create brands" ON "brands";
DROP POLICY IF EXISTS "Authenticated users can update brands" ON "brands";
DROP POLICY IF EXISTS "Authenticated users can delete brands" ON "brands";

DROP POLICY IF EXISTS "Anyone can read sales" ON "sales";
DROP POLICY IF EXISTS "Authenticated users can create sales" ON "sales";
DROP POLICY IF EXISTS "Authenticated users can update sales" ON "sales";
DROP POLICY IF EXISTS "Authenticated users can delete sales" ON "sales";

-- =============================================
-- New RLS policies — Brands (admin-only write)
-- =============================================

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
-- New RLS policies — Sales
-- =============================================

-- SELECT: anon sees only approved; authenticated sees all
CREATE POLICY "Anon can read approved sales"
    ON "sales" FOR SELECT
    TO anon
    USING (status = 'approved');

CREATE POLICY "Authenticated can read all sales"
    ON "sales" FOR SELECT
    TO authenticated
    USING (true);

-- INSERT: both roles can insert
CREATE POLICY "Authenticated can create sales"
    ON "sales" FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- UPDATE: admins can update any; editors can update own pending
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

-- DELETE: admins can delete any; editors can delete own pending
CREATE POLICY "Admins can delete sales"
    ON "sales" FOR DELETE
    TO authenticated
    USING (public.get_user_role() = 'admin');

CREATE POLICY "Editors can delete own pending sales"
    ON "sales" FOR DELETE
    TO authenticated
    USING (public.get_user_role() = 'editor' AND created_by = auth.uid() AND status = 'pending');

-- =============================================
-- RLS policies — user_roles table
-- =============================================

ALTER TABLE "user_roles" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own role"
    ON "user_roles" FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Admins can read all roles"
    ON "user_roles" FOR SELECT
    TO authenticated
    USING (public.get_user_role() = 'admin');

CREATE POLICY "Admins can insert roles"
    ON "user_roles" FOR INSERT
    TO authenticated
    WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Admins can update roles"
    ON "user_roles" FOR UPDATE
    TO authenticated
    USING (public.get_user_role() = 'admin')
    WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Admins can delete roles"
    ON "user_roles" FOR DELETE
    TO authenticated
    USING (public.get_user_role() = 'admin');

-- =============================================
-- Set yourself as admin (replace with your user ID)
-- =============================================
-- INSERT INTO user_roles (user_id, role)
-- VALUES ('<your-supabase-auth-user-id>', 'admin');
