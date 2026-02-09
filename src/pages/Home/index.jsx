import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import SaleCard from '../../components/SaleCard'
import Filters from '../../components/Filters'

export default function Home() {
  const [sales, setSales] = useState([])
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    brand: '',
    saleType: '',
    status: '',
    sort: 'newest',
  })

  useEffect(() => {
    async function fetchData() {
      const [salesRes, brandsRes] = await Promise.all([
        supabase.from('sales').select('*, brands(id, name, logo_url)'),
        supabase.from('brands').select('id, name'),
      ])
      if (salesRes.data) setSales(salesRes.data)
      if (brandsRes.data) setBrands(brandsRes.data)
      setLoading(false)
    }
    fetchData()
  }, [])

  const filtered = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]

    let result = sales.filter((sale) => {
      if (filters.brand && sale.brand_id !== filters.brand) return false
      if (filters.saleType && sale.sale_type !== filters.saleType) return false
      if (filters.status === 'active' && !(sale.start_date <= today && sale.end_date >= today)) return false
      if (filters.status === 'expired' && sale.end_date >= today) return false
      return true
    })

    result.sort((a, b) => {
      if (filters.sort === 'discount') return (b.discount_value || 0) - (a.discount_value || 0)
      return new Date(b.start_date) - new Date(a.start_date)
    })

    return result
  }, [sales, filters])

  if (loading) {
    return <p className="text-gray-500 text-center pt-12">Loading sales...</p>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Latest Sales & Promotions</h1>
      <p className="text-gray-500 mb-6">Browse the best deals from top brands.</p>

      <Filters brands={brands} filters={filters} onChange={setFilters} />

      {filtered.length === 0 ? (
        <p className="text-gray-400 text-center py-12">No sales found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((sale) => (
            <SaleCard key={sale.id} sale={sale} />
          ))}
        </div>
      )}
    </div>
  )
}
