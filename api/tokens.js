import { randomBytes } from 'node:crypto'
import { createAdminClient } from './_lib/supabase-admin.js'
import { validateSession, hashToken } from './_lib/auth.js'
import { json, error, setCors } from './_lib/response.js'

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(204).end()

  const session = await validateSession(req)
  if (!session) return error(res, 401, 'Authentication required. Provide a valid Supabase access token.')

  const supabase = createAdminClient()

  if (req.method === 'POST') {
    const { name } = req.body || {}
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return error(res, 400, 'Token "name" is required.')
    }

    const rawToken = `spk_${randomBytes(32).toString('hex')}`
    const tokenHash = hashToken(rawToken)

    const { data, error: dbError } = await supabase
      .from('api_tokens')
      .insert({
        token_hash: tokenHash,
        name: name.trim(),
        user_id: session.user.id,
        is_active: true,
      })
      .select('id, name, created_at')
      .single()

    if (dbError) return error(res, 500, 'Failed to create token.')

    return json(res, 201, {
      token: rawToken,
      id: data.id,
      name: data.name,
      created_at: data.created_at,
      warning: 'Store this token securely. It will not be shown again.',
    })
  }

  if (req.method === 'GET') {
    const { data, error: dbError } = await supabase
      .from('api_tokens')
      .select('id, name, is_active, created_at')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (dbError) return error(res, 500, 'Failed to fetch tokens.')
    return json(res, 200, { tokens: data })
  }

  if (req.method === 'DELETE') {
    const { id } = req.body || {}
    if (!id) return error(res, 400, 'Token "id" is required.')

    const { data, error: dbError } = await supabase
      .from('api_tokens')
      .update({ is_active: false })
      .eq('id', id)
      .eq('user_id', session.user.id)
      .select('id')
      .single()

    if (dbError || !data) return error(res, 404, 'Token not found or already revoked.')
    return json(res, 200, { message: 'Token revoked.', id: data.id })
  }

  return error(res, 405, `Method ${req.method} not allowed.`)
}
