-- CreateTable
CREATE TABLE "brands" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "website_url" TEXT,
    "category" TEXT,
    "logo_url" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "brand_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "sale_type" TEXT NOT NULL,
    "discount_value" DECIMAL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "sale_url" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_sales_brand_id" ON "sales"("brand_id");

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_brand_id_fkey"
    FOREIGN KEY ("brand_id") REFERENCES "brands"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- =============================================
-- Row Level Security (RLS)
-- Prisma does not generate these — added manually
-- =============================================

-- Enable RLS
ALTER TABLE "brands" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sales" ENABLE ROW LEVEL SECURITY;

-- BRANDS policies
CREATE POLICY "Anyone can read brands"
    ON "brands" FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Authenticated users can create brands"
    ON "brands" FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update brands"
    ON "brands" FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated users can delete brands"
    ON "brands" FOR DELETE
    TO authenticated
    USING (true);

-- SALES policies
CREATE POLICY "Anyone can read sales"
    ON "sales" FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Authenticated users can create sales"
    ON "sales" FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update sales"
    ON "sales" FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated users can delete sales"
    ON "sales" FOR DELETE
    TO authenticated
    USING (true);
