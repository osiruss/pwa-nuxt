export default defineEventHandler(async (event) => {
  const url = 'https://v9k9214s-3001.brs.devtunnels.ms/tracking/sitpriv/ping'

  try {
    const res = await fetch(url, { method: 'GET' })

    if (!res.ok) {
      setResponseStatus(event, 502)
      return { ok: false, message: `Ping Moleculer HTTP ${res.status}` }
    }
    const data = await res.json().catch(() => null)

    return { ok: true, upstream: url, data, ts: Date.now() }
  } catch (e: any) {
    setResponseStatus(event, 502)
    return { ok: false, message: e?.message ?? String(e) }
  }
})
