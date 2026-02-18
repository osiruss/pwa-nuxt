export default defineEventHandler(async (event) => {
  const target = 'http://localhost:3001/tracking/sitpriv/upload'

  const ct = getHeader(event, 'content-type') || ''
  if (!ct.includes('multipart/form-data')) {
    setResponseStatus(event, 415)
    return { ok: false, message: 'Content-Type debe ser multipart/form-data' }
  }

  const raw = await readRawBody(event, false)

  const res = await fetch(target, {
    method: 'POST',
    headers: { 'content-type': ct },
    body: raw as any
  })

  setResponseStatus(event, res.status)
  const text = await res.text()
  try { return JSON.parse(text) } catch { return text }
})
