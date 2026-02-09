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

export async function validateAdmin(req) {
  const session = await validateSession(req)
  if (!session) return null

  const role = session.user.app_metadata?.role || 'editor'
  if (role !== 'admin') return { user: session.user, isAdmin: false }

  return { user: session.user, isAdmin: true, userId: session.user.id }
}

export function hashToken(rawToken) {
  return createHash('sha256').update(rawToken).digest('hex')
}
