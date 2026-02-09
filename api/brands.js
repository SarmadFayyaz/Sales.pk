import { createAdminClient } from './_lib/supabase-admin.js'
import { validateApiToken } from './_lib/auth.js'
import { json, error, setCors } from './_lib/response.js'

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(204).end()

  const supabase = createAdminClient()

  if (req.method === 'GET') {
    const { data, error: dbError } = await supabase
      .from('brands')
      .select('*')
      .order('created_at', { ascending: false })

    if (dbError) return error(res, 500, 'Failed to fetch brands.')
    return json(res, 200, { brands: data })
  }

  if (req.method === 'POST') {
    const auth = await validateApiToken(req)
    if (!auth) return error(res, 401, 'Invalid or revoked API token.')

    const { name, website_url, category, logo_url } = req.body || {}

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return error(res, 400, 'Field "name" is required and must be a non-empty string.')
    }

    const insertData = { name: name.trim() }
    if (website_url) insertData.website_url = website_url.trim()
    if (category) insertData.category = category.trim()
    if (logo_url) insertData.logo_url = logo_url.trim()

    const { data, error: dbError } = await supabase
      .from('brands')
      .insert(insertData)
      .select()
      .single()

    if (dbError) return error(res, 500, 'Failed to create brand.')
    return json(res, 201, { brand: data })
  }

  return error(res, 405, `Method ${req.method} not allowed.`)
}
