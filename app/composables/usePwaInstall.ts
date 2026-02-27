// composables/usePwaInstall.ts
import { ref, onMounted, onBeforeUnmount } from 'vue'

export function usePwaInstall() {
  const canInstall = ref(false)
  const deferredPrompt = ref<any>(null)

  const debug = ref({
    isStandalone: false,
    isSecure: false,
    hasController: false,
    regCount: 0,
    eventSeen: false,
    appInstalled: false
  })

  const refreshDebug = async () => {
    debug.value.isStandalone =
      window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true
    debug.value.isSecure = window.isSecureContext === true
    debug.value.hasController = !!navigator.serviceWorker?.controller
    const regs = await navigator.serviceWorker?.getRegistrations?.()
    debug.value.regCount = regs?.length ?? 0
  }

  const onBeforeInstallPrompt = (e: any) => {
    e.preventDefault()
    deferredPrompt.value = e
    canInstall.value = true
    debug.value.eventSeen = true
  }

  const onAppInstalled = () => {
    debug.value.appInstalled = true
    canInstall.value = false
    deferredPrompt.value = null
  }

  const install = async () => {
    if (!deferredPrompt.value) return false
    deferredPrompt.value.prompt()
    const choice = await deferredPrompt.value.userChoice
    deferredPrompt.value = null
    canInstall.value = false
    return choice?.outcome === 'accepted'
  }

  onMounted(async () => {
    await refreshDebug()
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onAppInstalled)
    // refresca después de 1s por si el SW toma control tras recarga
    setTimeout(refreshDebug, 1000)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.removeEventListener('appinstalled', onAppInstalled)
  })

  return { canInstall, install, debug }
}