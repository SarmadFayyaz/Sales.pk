import { useState, useEffect } from 'react'

const empty = {
  brand_id: '',
  title: '',
  sale_type: 'percentage',
  discount_value: '',
  start_date: '',
  end_date: '',
  sale_url: '',
}

export default function SaleForm({ sale, brands, onSave, onCancel }) {
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm(sale ? {
      brand_id: sale.brand_id || '',
      title: sale.title || '',
      sale_type: sale.sale_type || 'percentage',
      discount_value: sale.discount_value ?? '',
      start_date: sale.start_date || '',
      end_date: sale.end_date || '',
      sale_url: sale.sale_url || '',
    } : empty)
  }, [sale])

  const update = (key, value) => setForm({ ...form, [key]: value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      ...form,
      discount_value: form.discount_value === '' ? null : Number(form.discount_value),
    }
    await onSave(payload)
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        {sale ? 'Edit Sale' : 'Add Sale'}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Brand *</label>
          <select
            required
            value={form.brand_id}
            onChange={(e) => update('brand_id', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select brand</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sale Title *</label>
          <input
            required
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Summer Sale 2026"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sale Type *</label>
          <select
            required
            value={form.sale_type}
            onChange={(e) => update('sale_type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="percentage">Percentage</option>
            <option value="flat">Flat</option>
            <option value="deal">Deal</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Discount Value {form.sale_type !== 'deal' && '*'}
          </label>
          <input
            type="number"
            min="0"
            step="any"
            required={form.sale_type !== 'deal'}
            value={form.discount_value}
            onChange={(e) => update('discount_value', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={form.sale_type === 'percentage' ? 'e.g. 25' : 'e.g. 500'}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
          <input
            type="date"
            required
            value={form.start_date}
            onChange={(e) => update('start_date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
          <input
            type="date"
            required
            value={form.end_date}
            onChange={(e) => update('end_date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Sale URL</label>
          <input
            type="url"
            value={form.sale_url}
            onChange={(e) => update('sale_url', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com/sale"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : sale ? 'Update' : 'Create'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
