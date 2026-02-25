import { ref, onMounted, onUnmounted } from 'vue'
import { idbGetAll, type StoredCase } from '~/utils/idb'

type NetState = 'online' | 'offline'

const netState = ref<NetState>('online')
const pendingCount = ref<number>(0)

export function useOpsBar() {
  const refreshPending = async () => {
    try {
      const all = await idbGetAll()
      pendingCount.value = all.filter((x: StoredCase) => x.status === 'pending' || x.status === 'error').length
    } catch {
      pendingCount.value = 0
    }
  }

  const updateNetwork = () => {
    netState.value = navigator.onLine ? 'online' : 'offline'
  }

  const onCasesChanged = () => {
    refreshPending()
  }

  onMounted(async () => {
    updateNetwork()
    await refreshPending()

    window.addEventListener('online', updateNetwork)
    window.addEventListener('offline', updateNetwork)
    window.addEventListener('cases:changed', onCasesChanged)

    // fallback: refresca cada 10s por si algo no dispara evento (safe)
    const interval = window.setInterval(refreshPending, 10_000)
    ;(useOpsBar as any)._interval = interval
  })

  onUnmounted(() => {
    window.removeEventListener('online', updateNetwork)
    window.removeEventListener('offline', updateNetwork)
    window.removeEventListener('cases:changed', onCasesChanged)

    const interval = (useOpsBar as any)._interval
    if (interval) window.clearInterval(interval)
  })

  return {
    netState,
    pendingCount,
    refreshPending
  }
}
