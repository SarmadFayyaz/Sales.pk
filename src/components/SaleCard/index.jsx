import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { isFavorite, toggleFavorite } from '../../lib/favorites'
import Avatar from '../Avatar'
import { formatSaleType } from '../../lib/saleTypes'

export default function SaleCard({ sale }) {
  const today = new Date().toISOString().split('T')[0]
  const isActive = sale.start_date <= today && sale.end_date >= today

  const daysLeft = Math.ceil(
    (new Date(sale.end_date) - new Date(today)) / (1000 * 60 * 60 * 24)
  )
  const endingSoon = isActive && daysLeft <= 2

  const [fav, setFav] = useState(() => isFavorite(sale.id))
  const [favCount, setFavCount] = useState(sale.favorite_count || 0)

  const handleFavorite = () => {
    const added = toggleFavorite(sale.id)
    setFav(added)
    setFavCount((c) => Math.max(c + (added ? 1 : -1), 0))
    const fn = added ? 'favorite_sale' : 'unfavorite_sale'
    supabase.rpc(fn, { sale_id: sale.id })
  }

  const badgeColor = isActive
    ? 'bg-green-100 text-green-700'
    : 'bg-gray-100 text-gray-500'

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar src={sale.brands?.logo_url} name={sale.brands?.name || '?'} />
          <span className="text-sm font-medium text-gray-700">
            {sale.brands?.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeColor}`}>
            {isActive ? 'Active' : 'Expired'}
          </span>
          <button
            onClick={handleFavorite}
            className="relative group flex items-center gap-1 text-xl cursor-pointer transition-colors"
          >
            <span className={`inline-block w-6 text-center ${fav ? 'text-red-500' : 'text-gray-300 hover:text-red-400'}`}>
              {fav ? '\u2764\uFE0F' : '\u{1F90D}'}
            </span>
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs text-white bg-gray-800 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {fav ? 'Remove from favorites' : 'Add to favorites'}
            </span>
          </button>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-900">{sale.title}</h3>

      <div className="text-xl font-bold text-blue-600">
        {formatSaleType(sale.sale_type, sale.discount_value, sale.discount_mode)}
      </div>

      {sale.notes && (
        <p className="text-sm text-gray-600">{sale.notes}</p>
      )}

      <div className={`text-xs ${endingSoon ? 'text-red-600 font-semibold animate-blink' : 'text-gray-500'}`}>
        {sale.start_date} &mdash; {sale.end_date}
        {endingSoon && (
          <span className="ml-1">
            ({daysLeft === 0 ? 'Ends today!' : daysLeft === 1 ? '1 day left!' : `${daysLeft} days left!`})
          </span>
        )}
      </div>

      {sale.sale_url && (
        <a
          href={sale.sale_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => supabase.rpc('increment_view_count', { sale_id: sale.id }).then(({ error }) => { if (error) console.error('view_count error:', error) })}
          className="mt-auto text-center text-sm font-medium py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          View Sale
        </a>
      )}
    </div>
  )
}
