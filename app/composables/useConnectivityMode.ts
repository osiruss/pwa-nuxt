import { ref, computed, onMounted } from "vue"

type ConnectivityOverride = null | boolean // null = usar ping, true/false = forzar

const LS_KEY = "afiliacion:connectivityOverride:v1"

export const useConnectivityMode = () => {
  const override = ref<ConnectivityOverride>(null)

  onMounted(() => {
    try {
      const raw = localStorage.getItem(LS_KEY)
      if (raw === "true") override.value = true
      else if (raw === "false") override.value = false
      else override.value = null
    } catch {
      override.value = null
    }
  })

  const setAuto = () => {
    override.value = null
    try { localStorage.removeItem(LS_KEY) } catch {}
  }

  const setForcedOnline = () => {
    override.value = true
    try { localStorage.setItem(LS_KEY, "true") } catch {}
  }

  const setForcedOffline = () => {
    override.value = false
    try { localStorage.setItem(LS_KEY, "false") } catch {}
  }

  const modeLabel = computed(() => {
    if (override.value === null) return "AUTO (PING)"
    return override.value ? "FORZADO ONLINE" : "FORZADO OFFLINE"
  })

  return { override, setAuto, setForcedOnline, setForcedOffline, modeLabel }
}