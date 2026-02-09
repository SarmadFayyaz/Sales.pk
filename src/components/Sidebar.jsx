export default function Sidebar({ activeTab, onTabChange, isAdmin }) {
  const items = [
    { key: 'sales', label: 'Sales' },
    ...(isAdmin ? [
      { key: 'brands', label: 'Brands' },
      { key: 'users', label: 'Users' },
    ] : []),
  ]

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:block w-56 shrink-0">
        <nav className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {items.map((item) => (
            <button
              key={item.key}
              onClick={() => onTabChange(item.key)}
              className={`w-full text-left px-4 py-3 text-sm font-medium border-l-2 transition-colors ${
                activeTab === item.key
                  ? 'border-blue-600 bg-blue-50 text-blue-600'
                  : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Mobile horizontal nav */}
      <div className="md:hidden flex gap-2 mb-4 border-b border-gray-200">
        {items.map((item) => (
          <button
            key={item.key}
            onClick={() => onTabChange(item.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              activeTab === item.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </>
  )
}
