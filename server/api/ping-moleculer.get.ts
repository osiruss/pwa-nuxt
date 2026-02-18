export default defineEventHandler(async (event) => {
  const url = 'http://localhost:3001/tracking/sitpriv/ping'

  try {
    const res = await fetch(url, { method: 'GET' })

    if (!res.ok) {
      setResponseStatus(event, 502)
      return { ok: false, message: `Moleculer ping HTTP ${res.status}` }
    }

    const text = await res.text().catch(() => '')
    return { ok: true, upstream: 'moleculer', raw: text || null, ts: Date.now() }
  } catch (e: any) {
    setResponseStatus(event, 502)
    return { ok: false, message: e?.message ?? String(e) }
  }
})
