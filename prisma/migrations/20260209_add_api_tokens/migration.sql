-- CreateTable
CREATE TABLE "api_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "token_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "api_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "api_tokens_token_hash_idx" ON "api_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "api_tokens_user_id_idx" ON "api_tokens"("user_id");

-- =============================================
-- Row Level Security (RLS)
-- Prisma does not generate these — added manually
-- =============================================

ALTER TABLE "api_tokens" ENABLE ROW LEVEL SECURITY;

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
