<!-- <template>
  <main style="max-width:720px;margin:24px auto;padding:0 16px;font-family:system-ui;">
    <h1>Modo de operación</h1>
    <p>Selecciona cómo quieres que se comporte la app respecto a conectividad.</p>

    <p style="margin:12px 0;">
      Estado: <b>{{ modeLabel }}</b>
    </p>

    <div style="display:flex; gap:10px; flex-wrap:wrap;">
      <button @click="goOnline"
        style="padding:10px 12px;border:1px solid #ccc;border-radius:10px;background:#fff;cursor:pointer;">
        ✅ Modo Online
      </button>

      <button @click="goOffline"
        style="padding:10px 12px;border:1px solid #ccc;border-radius:10px;background:#fff;cursor:pointer;">
        📴 Modo Offline
      </button>
    </div>

    <div style="margin-top:14px; opacity:.8;">
      <button @click="setAuto"
        style="padding:8px 10px;border:1px solid #ddd;border-radius:10px;background:#fff;cursor:pointer;">
        Volver a AUTO (usar ping real)
      </button>
    </div>

    <button v-if="canInstall" @click="install()">Instalar app</button>
  </main>
</template>

<script setup lang="ts">

const isStandalone = computed(() =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true
)
import { usePwaInstall } from '~/composables/usePwaInstall'
const { canInstall, install } = usePwaInstall()
const router = useRouter()
const { setForcedOnline, setForcedOffline, setAuto, modeLabel } = useConnectivityMode()

function goOnline() {
  setForcedOnline()
  router.push("/app")
}

function goOffline() {
  setForcedOffline()
  router.push("/app")
}
</script> -->

<template>
  <main style="max-width:720px;margin:24px auto;padding:0 16px;font-family:system-ui;">
    <h1>Modo de operación</h1>

    <p style="margin:12px 0;">
      Estado: <b>{{ modeLabel }}</b>
    </p>

    <div style="display:flex; gap:10px; flex-wrap:wrap;">
      <button @click="goOnline" style="padding:10px 12px;border:1px solid #ccc;border-radius:10px;background:#fff;cursor:pointer;">
        ✅ Modo Onlinessss
      </button>

      <button @click="goOffline" style="padding:10px 12px;border:1px solid #ccc;border-radius:10px;background:#fff;cursor:pointer;">
        📴 Modo Offline
      </button>
    </div>

    <div style="margin-top:14px; opacity:.8;">
      <button @click="setAuto" style="padding:8px 10px;border:1px solid #ddd;border-radius:10px;background:#fff;cursor:pointer;">
        Volver a AUTO (usar ping real)
      </button>
    </div>

    <hr style="margin:16px 0;" />
    ---- {{ canInstall  }}
    <button
      v-if="canInstall"
      @click="install()"
      style="padding:10px 12px;border:1px solid #0b5fff;border-radius:10px;background:#0b5fff;color:#fff;cursor:pointer;"
    >
      📲 Instalar app
    </button>

    <div v-else style="font-size:13px; opacity:.85;">
      <p><b>Instalación:</b> aún no disponible.</p>
      <ul style="margin:8px 0 0 18px;">
        <li>standalone: {{ debug.isStandalone }}</li>
        <li>secure: {{ debug.isSecure }}</li>
        <li>sw controller: {{ debug.hasController }}</li>
        <li>registrations: {{ debug.regCount }}</li>
        <li>event seen: {{ debug.eventSeen }}</li>
        <li>app installed: {{ debug.appInstalled }}</li>
        <li> es app {{ isStandalone }}</li>
      </ul>
    </div>
  </main>
</template>

<script setup lang="ts">
const { canInstall, install, debug } = usePwaInstall()

const isStandalone =
  window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true
console.log("🚀 ~ isStandalone:", isStandalone)

const router = useRouter()
const { setForcedOnline, setForcedOffline, setAuto, modeLabel } = useConnectivityMode()

function goOnline() {
  setForcedOnline()
  router.push("/app")
}

function goOffline() {
  setForcedOffline()
  router.push("/app")
}
</script>