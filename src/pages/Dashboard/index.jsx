import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import BrandForm from '../../components/Forms/BrandForm'
import SaleForm from '../../components/Forms/SaleForm'

export default function Dashboard() {
  const [tab, setTab] = useState('brands')
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingBrand, setEditingBrand] = useState(null)

  const [sales, setSales] = useState([])
  const [salesLoading, setSalesLoading] = useState(true)
  const [showSaleForm, setShowSaleForm] = useState(false)
  const [editingSale, setEditingSale] = useState(null)

  useEffect(() => {
    fetchBrands()
    fetchSales()
  }, [])

  async function fetchBrands() {
    setLoading(true)
    const { data } = await supabase
      .from('brands')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setBrands(data)
    setLoading(false)
  }

  async function handleSaveBrand(form) {
    if (editingBrand) {
      await supabase.from('brands').update(form).eq('id', editingBrand.id)
    } else {
      await supabase.from('brands').insert(form)
    }
    setShowForm(false)
    setEditingBrand(null)
    fetchBrands()
  }

  async function handleDeleteBrand(id) {
    if (!window.confirm('Delete this brand? All its sales will also be deleted.')) return
    await supabase.from('brands').delete().eq('id', id)
    fetchBrands()
  }

  function openEdit(brand) {
    setEditingBrand(brand)
    setShowForm(true)
  }

  function handleCancel() {
    setShowForm(false)
    setEditingBrand(null)
  }

  async function fetchSales() {
    setSalesLoading(true)
    const { data } = await supabase
      .from('sales')
      .select('*, brands(name)')
      .order('created_at', { ascending: false })
    if (data) setSales(data)
    setSalesLoading(false)
  }

  async function handleSaveSale(form) {
    if (editingSale) {
      await supabase.from('sales').update(form).eq('id', editingSale.id)
    } else {
      await supabase.from('sales').insert(form)
    }
    setShowSaleForm(false)
    setEditingSale(null)
    fetchSales()
  }

  async function handleDeleteSale(id) {
    if (!window.confirm('Delete this sale?')) return
    await supabase.from('sales').delete().eq('id', id)
    fetchSales()
  }

  function openEditSale(sale) {
    setEditingSale(sale)
    setShowSaleForm(true)
  }

  function handleCancelSale() {
    setShowSaleForm(false)
    setEditingSale(null)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h1>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setTab('brands')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            tab === 'brands'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Brands
        </button>
        <button
          onClick={() => setTab('sales')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            tab === 'sales'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Sales
        </button>
      </div>

      {tab === 'brands' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Brands</h2>
            {!showForm && (
              <button
                onClick={() => { setEditingBrand(null); setShowForm(true) }}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg font-medium hover:bg-blue-700"
              >
                + Add Brand
              </button>
            )}
          </div>

          {showForm && (
            <div className="mb-6">
              <BrandForm
                brand={editingBrand}
                onSave={handleSaveBrand}
                onCancel={handleCancel}
              />
            </div>
          )}

          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : brands.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No brands yet. Add one above.</p>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Brand</th>
                    <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Category</th>
                    <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Website</th>
                    <th className="text-right px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {brands.map((brand) => (
                    <tr key={brand.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {brand.logo_url ? (
                            <img src={brand.logo_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">
                              {brand.name.charAt(0)}
                            </div>
                          )}
                          <span className="font-medium text-gray-900">{brand.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                        {brand.category || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                        {brand.website_url ? (
                          <a href={brand.website_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate block max-w-48">
                            {brand.website_url}
                          </a>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openEdit(brand)}
                          className="text-blue-600 hover:underline mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteBrand(brand.id)}
                          className="text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'sales' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Sales</h2>
            {!showSaleForm && (
              <button
                onClick={() => { setEditingSale(null); setShowSaleForm(true) }}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg font-medium hover:bg-blue-700"
              >
                + Add Sale
              </button>
            )}
          </div>

          {showSaleForm && (
            <div className="mb-6">
              <SaleForm
                sale={editingSale}
                brands={brands}
                onSave={handleSaveSale}
                onCancel={handleCancelSale}
              />
            </div>
          )}

          {salesLoading ? (
            <p className="text-gray-500">Loading...</p>
          ) : sales.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No sales yet. Add one above.</p>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Sale</th>
                    <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Brand</th>
                    <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Type</th>
                    <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Dates</th>
                    <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Status</th>
                    <th className="text-right px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sales.map((sale) => {
                    const today = new Date().toISOString().split('T')[0]
                    const isActive = sale.start_date <= today && sale.end_date >= today
                    return (
                      <tr key={sale.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className="font-medium text-gray-900">{sale.title}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                          {sale.brands?.name || '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                          <span className="capitalize">{sale.sale_type}</span>
                          {sale.discount_value != null && ` (${sale.discount_value})`}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">
                          {sale.start_date} — {sale.end_date}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {isActive ? 'Active' : 'Expired'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => openEditSale(sale)}
                            className="text-blue-600 hover:underline mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteSale(sale.id)}
                            className="text-red-600 hover:underline"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
