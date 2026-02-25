<template>
  <main style="max-width:720px;margin:24px auto;padding:0 16px;font-family:system-ui;">
    <h1>Modo de operación</h1>
    <p>Selecciona cómo quieres que se comporte la app respecto a conectividad.</p>

    <p style="margin:12px 0;">
      Estado: <b>{{ modeLabel }}</b>
    </p>

    <div style="display:flex; gap:10px; flex-wrap:wrap;">
      <button @click="goOnline" style="padding:10px 12px;border:1px solid #ccc;border-radius:10px;background:#fff;cursor:pointer;">
        ✅ Modo Online
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
  </main>
</template>

<script setup lang="ts">
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