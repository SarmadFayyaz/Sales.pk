import { createHash } from 'node:crypto'
import { createAdminClient } from './supabase-admin.js'

export async function validateSession(req) {
  const authHeader = req.headers['authorization']
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.slice(7)
  const supabase = createAdminClient()

  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null

  return { user }
}

export async function validateApiToken(req) {
  const authHeader = req.headers['authorization']
  if (!authHeader?.startsWith('Bearer ')) return null

  const rawToken = authHeader.slice(7)
  const tokenHash = hashToken(rawToken)

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('api_tokens')
    .select('id, user_id, is_active')
    .eq('token_hash', tokenHash)
    .single()

  if (error || !data || !data.is_active) return null

  return { userId: data.user_id, tokenId: data.id }
}

export function hashToken(rawToken) {
  return createHash('sha256').update(rawToken).digest('hex')
}
