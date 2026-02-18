import { ref, onMounted, onBeforeUnmount } from 'vue'

type NetworkStatus = {
  online: boolean
  lastCheckedAt: number | null
  mode: 'browser' | 'verified'
  lastError?: string
}

export function useNetworkStatus(options?: {
  pingUrl?: string
  intervalMs?: number
  timeoutMs?: number
  verify?: boolean
}) {
  const pingUrl = options?.pingUrl ?? '/api/ping-moleculer'
  const intervalMs = options?.intervalMs ?? 15_000
  const timeoutMs = options?.timeoutMs ?? 4_000
  const verify = options?.verify ?? true

  const status = ref<NetworkStatus>({
    online: typeof navigator !== 'undefined' ? navigator.onLine : true,
    lastCheckedAt: null,
    mode: 'browser'
  })

  let timer: any = null

  function setOnline(v: boolean, mode: NetworkStatus['mode'], err?: string) {
    status.value.online = v
    status.value.mode = mode
    status.value.lastCheckedAt = Date.now()
    status.value.lastError = err
  }

  async function ping() {
    if (!navigator.onLine) {
      setOnline(false, 'browser')
      return
    }

    if (!verify) {
      setOnline(true, 'browser')
      return
    }

    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), timeoutMs)

    try {
      const res = await fetch(`${pingUrl}${pingUrl.includes('?') ? '&' : '?'}t=${Date.now()}`, {
        method: 'GET',
        cache: 'no-store',
        signal: ctrl.signal
      })
      clearTimeout(t)

      if (res.ok) setOnline(true, 'verified')
      else setOnline(false, 'verified', `Ping HTTP ${res.status}`)
    } catch (e: any) {
      clearTimeout(t)
      setOnline(false, 'verified', e?.message ?? String(e))
    }
  }

  function onOnline() {
    setOnline(true, 'browser')
    ping()
  }

  function onOffline() {
    setOnline(false, 'browser')
  }

  onMounted(() => {
    setOnline(navigator.onLine, 'browser')
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    ping()

    timer = setInterval(() => ping(), intervalMs)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('online', onOnline)
    window.removeEventListener('offline', onOffline)
    if (timer) clearInterval(timer)
  })

  return {
    status,
    ping
  }
}

