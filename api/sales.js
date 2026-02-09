import { createAdminClient } from './_lib/supabase-admin.js'
import { validateApiToken } from './_lib/auth.js'
import { json, error, setCors } from './_lib/response.js'

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(204).end()

  if (req.method !== 'POST') {
    return error(res, 405, `Method ${req.method} not allowed. Use POST.`)
  }

  const auth = await validateApiToken(req)
  if (!auth) return error(res, 401, 'Invalid or revoked API token.')

  const { brand_id, title, sale_type, discount_value, start_date, end_date, sale_url } = req.body || {}

  const errors = []
  if (!brand_id || typeof brand_id !== 'string') errors.push('"brand_id" is required (UUID string).')
  if (!title || typeof title !== 'string' || title.trim().length === 0) errors.push('"title" is required.')
  if (!sale_type || !['percentage', 'flat', 'deal'].includes(sale_type)) {
    errors.push('"sale_type" is required and must be one of: percentage, flat, deal.')
  }
  if (!start_date || !/^\d{4}-\d{2}-\d{2}$/.test(start_date)) {
    errors.push('"start_date" is required (YYYY-MM-DD format).')
  }
  if (!end_date || !/^\d{4}-\d{2}-\d{2}$/.test(end_date)) {
    errors.push('"end_date" is required (YYYY-MM-DD format).')
  }
  if (start_date && end_date && start_date > end_date) {
    errors.push('"start_date" must not be after "end_date".')
  }

  if (errors.length > 0) {
    return error(res, 400, errors.join(' '))
  }

  if (discount_value !== undefined && discount_value !== null) {
    if (typeof discount_value !== 'number' || discount_value < 0) {
      return error(res, 400, '"discount_value" must be a non-negative number.')
    }
  }

  const supabase = createAdminClient()

  const { data: brand, error: brandError } = await supabase
    .from('brands')
    .select('id')
    .eq('id', brand_id)
    .single()

  if (brandError || !brand) {
    return error(res, 404, `Brand with id "${brand_id}" not found.`)
  }

  // Check 3-sale-per-brand limit (non-expired sales)
  const today = new Date().toISOString().split('T')[0]
  const { count } = await supabase
    .from('sales')
    .select('id', { count: 'exact', head: true })
    .eq('brand_id', brand_id)
    .gte('end_date', today)

  if (count >= 3) {
    return error(res, 409, 'This brand already has 3 active sales. Remove or let one expire first.')
  }

  const insertData = {
    brand_id,
    title: title.trim(),
    sale_type,
    start_date,
    end_date,
    discount_value: discount_value ?? null,
    status: 'pending',
    created_by: auth.userId,
  }
  if (sale_url) insertData.sale_url = sale_url.trim()

  const { data, error: dbError } = await supabase
    .from('sales')
    .insert(insertData)
    .select('*, brands(name)')
    .single()

  if (dbError) return error(res, 500, 'Failed to create sale.')

  return json(res, 201, { sale: data })
}
