export function json(res, statusCode, data) {
  res.setHeader('Content-Type', 'application/json')
  res.status(statusCode).json(data)
}

export function error(res, statusCode, message) {
  res.setHeader('Content-Type', 'application/json')
  res.status(statusCode).json({ error: message })
}

export function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}
