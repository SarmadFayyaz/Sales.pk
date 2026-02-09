export const saleTypes = [
  { value: 'percentage', label: 'Percentage Off', hasValue: true, unit: '%', placeholder: 'e.g. 25', defaultMode: 'upto' },
  { value: 'fixed', label: 'Fixed Amount Off', hasValue: true, unit: 'Rs.', placeholder: 'e.g. 500', defaultMode: 'flat' },
  { value: 'bogo', label: 'Buy 1 Get 1 Free', hasValue: false, defaultMode: null },
  { value: 'b2g1', label: 'Buy 2 Get 1 Free', hasValue: false, defaultMode: null },
  { value: 'deal', label: 'Special Deal', hasValue: false, hasNotes: true, defaultMode: null },
]

export const saleTypeMap = Object.fromEntries(saleTypes.map((t) => [t.value, t]))

export function formatSaleType(type, value, mode) {
  const t = saleTypeMap[type]
  if (!t) return type

  const prefix = mode === 'upto' ? 'Up to ' : mode === 'flat' ? 'Flat ' : ''

  if (type === 'percentage' && value != null) return `${prefix}${value}% OFF`
  if (type === 'fixed' && value != null) return `${prefix}Rs. ${value} OFF`
  if (type === 'bogo') return 'Buy 1 Get 1 Free'
  if (type === 'b2g1') return 'Buy 2 Get 1 Free'
  if (type === 'deal') return 'Special Deal'

  return t.label
}
