export default function SaleCard({ sale }) {
  const today = new Date().toISOString().split('T')[0]
  const isActive = sale.start_date <= today && sale.end_date >= today

  const badgeColor = isActive
    ? 'bg-green-100 text-green-700'
    : 'bg-gray-100 text-gray-500'

  const typeLabel = {
    percentage: `${sale.discount_value}% OFF`,
    flat: `Rs. ${sale.discount_value} OFF`,
    deal: 'Special Deal',
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {sale.brands?.logo_url ? (
            <img
              src={sale.brands.logo_url}
              alt={sale.brands.name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-bold">
              {sale.brands?.name?.charAt(0) || '?'}
            </div>
          )}
          <span className="text-sm font-medium text-gray-700">
            {sale.brands?.name}
          </span>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeColor}`}>
          {isActive ? 'Active' : 'Expired'}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-gray-900">{sale.title}</h3>

      <div className="text-xl font-bold text-blue-600">
        {typeLabel[sale.sale_type] || sale.sale_type}
      </div>

      <div className="text-xs text-gray-500">
        {sale.start_date} &mdash; {sale.end_date}
      </div>

      {sale.sale_url && (
        <a
          href={sale.sale_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto text-center text-sm font-medium py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          View Sale
        </a>
      )}
    </div>
  )
}
