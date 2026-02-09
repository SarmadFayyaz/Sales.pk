import { saleTypes } from '../../lib/saleTypes'

export default function Filters({ brands, filters, onChange }) {
  const update = (key, value) => onChange({ ...filters, [key]: value })

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <select
        value={filters.brand}
        onChange={(e) => update('brand', e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All Brands</option>
        {brands.map((b) => (
          <option key={b.id} value={b.id}>{b.name}</option>
        ))}
      </select>

      <select
        value={filters.saleType}
        onChange={(e) => update('saleType', e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All Types</option>
        {saleTypes.map((t) => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>

      <select
        value={filters.status}
        onChange={(e) => update('status', e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="expired">Expired</option>
      </select>

      <select
        value={filters.sort}
        onChange={(e) => update('sort', e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="discount_high">Highest Discount</option>
        <option value="popular">Most Popular</option>
        <option value="favorites">Most Favorited</option>
        <option value="ending_soon">Ending Soon</option>
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
        <option value="discount_low">Lowest Discount</option>
      </select>
    </div>
  )
}
