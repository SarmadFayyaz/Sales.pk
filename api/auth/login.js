import { createAnonClient } from '../_lib/supabase-admin.js'
import { json, error, setCors } from '../_lib/response.js'

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(204).end()

  if (req.method !== 'POST') {
    return error(res, 405, `Method ${req.method} not allowed. Use POST.`)
  }

  const { email, password } = req.body || {}

  if (!email || !password) {
    return error(res, 400, 'Fields "email" and "password" are required.')
  }

  const supabase = createAnonClient()

  const { data, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError) {
    return error(res, 401, authError.message)
  }

  return json(res, 200, {
    access_token: data.session.access_token,
    expires_in: data.session.expires_in,
    user: {
      id: data.user.id,
      email: data.user.email,
    },
  })
}
