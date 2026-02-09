const KEY = 'sales_favorites'

function getAll() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || []
  } catch {
    return []
  }
}

export function isFavorite(saleId) {
  return getAll().includes(saleId)
}

export function toggleFavorite(saleId) {
  const favs = getAll()
  const index = favs.indexOf(saleId)
  if (index === -1) {
    favs.push(saleId)
  } else {
    favs.splice(index, 1)
  }
  localStorage.setItem(KEY, JSON.stringify(favs))
  return index === -1 // true = added, false = removed
}
