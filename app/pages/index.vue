<template>
  <main style="max-width: 920px; margin: 24px auto; font-family: system-ui; padding: 0 16px;">
    <p>
      Estado conexión: <b>{{ online ? 'ONLINE' : 'OFFLINE' }}</b>
      <small v-if="status.mode === 'verified'"> (verificado)</small>
    </p>

    <br />
    <h1>Afiliación Offline (Nuxt 3)</h1>

    <section style="display: grid; gap: 12px; grid-template-columns: 1fr;">
      <label>
        RUT pensionado
        <input v-model.trim="rut" placeholder="12.345.678-9"
          style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 10px;" />
      </label>

      <div style="display:flex; gap: 8px; flex-wrap: wrap;">
        <button @click="startCamera" :disabled="cameraOn">🎥 Encender cámara</button>
        <button @click="stopCamera" :disabled="!cameraOn">⛔ Apagar cámara</button>
        <button @click="startRecording" :disabled="!cameraOn || recording">⏺️ Grabar</button>
        <button @click="stopRecording" :disabled="!recording">⏹️ Detener</button>

        <!-- Sync manual: solo "ready" -->
        <button @click="syncPending" :disabled="syncing || !online">🔄 Enviar confirmados</button>
      </div>

      <p>
        Pendientes: <b>{{ pendingCount }}</b>
        — Confirmados vencidos (auto): <b>{{ readyExpiredCount }}</b>
      </p>

      <video ref="videoEl" autoplay playsinline muted
        style="width: 100%; max-height: 420px; background:#000; border-radius: 12px;"></video>

      <div v-if="lastPreviewUrl" style="margin-top: 12px;">
        <h3>Última grabación (preview)</h3>
        <video :src="lastPreviewUrl" controls style="width: 100%; border-radius: 12px;"></video>
      </div>

      <!-- LISTADO PENDIENTES -->
      <div v-if="pending.length" style="margin-top: 14px;">
        <div style="display:flex; align-items:center; justify-content:space-between; gap: 10px;">
          <h3 style="margin:0;">📋 Pendientes ({{ pending.length }})</h3>
          <button @click="refreshPending" :disabled="syncing">🔁 Actualizar</button>
        </div>

        <div style="display:flex; flex-direction:column; gap:10px; margin-top:10px;">
          <div v-for="item in sortedPending" :key="item.id" style="display:flex; align-items:center; justify-content:space-between; gap:12px;
                   padding:12px 14px; border:1px solid #e5e5e5; border-radius:12px; background:#fff;">
            <div style="display:flex; flex-direction:column; gap:4px;">
              <div style="font-weight:700;">RUT: {{ item.rut }}</div>
              <div style="font-size:12px; opacity:.75;">
                {{ formatDate(item.createdAt) }} · ID: {{ item.id }}
              </div>
              <div style="font-size:12px; opacity:.75;">
                {{ item.mimeType }} · chunks: {{ item.chunks?.length ?? 0 }}
              </div>

              <div v-if="item.status === 'ready' && item.confirmedAt" style="font-size:12px; opacity:.75;">
                Confirmado: {{ formatDate(item.confirmedAt) }} · Auto-envío en: {{ remainingText(item) }}
              </div>
            </div>

            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; justify-content:flex-end;">
              <span :style="badgeStyle(item.status)">{{ item.status }}</span>

              <button @click="previewPending(item)">▶️ Ver</button>

              <!-- Confirmar -> pasa a ready y activa ventana 5 min -->
              <button v-if="item.status === 'review'" @click="confirmPending(item)" :disabled="syncing">
                ✅ Confirmar
              </button>

              <!-- Enviar manual: solo si ready -->
              <button @click="syncOne(item)" :disabled="syncing || !online || item.status !== 'ready'">
                ⬆️ Subir
              </button>

              <button @click="removePending(item.id)" :disabled="syncing">🗑️</button>
            </div>
          </div>
        </div>
      </div>

      <div v-else style="margin-top: 14px; padding: 10px; border-radius: 10px; background: #f5f5f5;">
        No hay pendientes.
      </div>

      <div v-if="msg" style="padding: 10px; border-radius: 10px; background: #f5f5f5;">
        {{ msg }}
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { idbPut, idbGetAll, idbDelete, type StoredCase } from '~/utils/idb'

const AUTO_SEND_AFTER_MS = 1 * 60 * 1000
const AUTO_CHECK_EVERY_MS = 30 * 1000

const rut = ref('')
const msg = ref('')

const videoEl = ref<HTMLVideoElement | null>(null)
let stream: MediaStream | null = null
const cameraOn = ref(false)

let recorder: MediaRecorder | null = null
const recording = ref(false)
const chunks = ref<Blob[]>([])
const lastPreviewUrl = ref<string>('')

const syncing = ref(false)
const pending = ref<StoredCase[]>([])
const pendingCount = computed(() => pending.value.length)
const sortedPending = computed(() => [...pending.value].sort((a, b) => b.createdAt - a.createdAt))

const { status, ping } = useNetworkStatus({
  pingUrl: '/api/ping-moleculer',
  verify: true,
  intervalMs: 10_000,
  timeoutMs: 4_000
})
const online = computed(() => status.value.online)

let autoTimer: any = null

function uuid(): string {
  return crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function setMsg(t: string) {
  msg.value = t
  console.log(t)
}

function formatDate(ts: number) {
  try {
    return new Date(ts).toLocaleString('es-CL')
  } catch {
    return String(ts)
  }
}

/**
 * ✅ CENTRAL: convierte cualquier item (aunque sea Proxy) en objeto plano
 * - NO usar JSON stringify (pierde Blob)
 * - Solo copia campos persistibles y clonables
 */
function toPlainCase(item: any, patch?: Partial<any>) {
  return {
    id: item.id,
    rut: item.rut,
    createdAt: item.createdAt,
    mimeType: item.mimeType,
    chunks: item.chunks, // Blob[]
    status: item.status,
    confirmedAt: item.confirmedAt ?? null,
    ...(patch || {})
  }
}

function badgeStyle(s: any) {
  const base =
    'padding:4px 10px; border-radius:999px; font-size:12px; font-weight:700; text-transform:uppercase;'
  if (s === 'review') return base + ' background:#e3f2fd; color:#0d47a1; border:1px solid #bbdefb;'
  if (s === 'ready') return base + ' background:#fff3cd; color:#856404; border:1px solid #ffe8a1;'
  if (s === 'error') return base + ' background:#ffe5e5; color:#b00020; border:1px solid #ffb3b3;'
  return base + ' background:#f5f5f5; color:#333; border:1px solid #ddd;'
}

function isReadyExpired(item: any) {
  if (item.status !== 'ready') return false
  const t = item.confirmedAt ?? 0
  if (!t) return false
  return Date.now() - t >= AUTO_SEND_AFTER_MS
}

const readyExpiredCount = computed(() => pending.value.filter(isReadyExpired).length)

function remainingText(item: any) {
  if (item.status !== 'ready' || !item.confirmedAt) return '-'
  const remaining = AUTO_SEND_AFTER_MS - (Date.now() - item.confirmedAt)
  if (remaining <= 0) return 'vencido (se enviará cuando esté online)'
  const mins = Math.floor(remaining / 60000)
  const secs = Math.floor((remaining % 60000) / 1000)
  return `${mins}m ${secs}s`
}

// =========================
// IDB
// =========================
async function refreshPending() {
  const all = await idbGetAll()
  pending.value = all.filter((x: any) => x.status === 'review' || x.status === 'ready' || x.status === 'error')
}

// =========================
// CAMERA / RECORD
// =========================
async function startCamera() {
  try {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMsg('Este navegador no soporta getUserMedia.')
      return
    }
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' },
      audio: true
    })
    if (videoEl.value) videoEl.value.srcObject = stream
    cameraOn.value = true
    setMsg('Cámara y micrófono activos.')
  } catch (e: any) {
    setMsg(`Error al abrir cámara: ${e?.message ?? e}`)
  }
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(t => t.stop())
    stream = null
  }
  if (videoEl.value) videoEl.value.srcObject = null
  cameraOn.value = false
  setMsg('Cámara detenida.')
}

function pickMimeType(): string {
  const candidates = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
  for (const c of candidates) {
    if ((window as any).MediaRecorder?.isTypeSupported?.(c)) return c
  }
  return 'video/webm'
}

async function startRecording() {
  if (!stream) return
  if (!rut.value) {
    setMsg('Debes ingresar el RUT antes de grabar.')
    return
  }

  chunks.value = []
  const mimeType = pickMimeType()

  try {
    recorder = new MediaRecorder(stream, { mimeType })
  } catch {
    recorder = new MediaRecorder(stream)
  }

  recorder.ondataavailable = (ev: BlobEvent) => {
    if (ev.data && ev.data.size > 0) chunks.value.push(ev.data)
  }

  recorder.onstop = async () => {
    recording.value = false

    const blob = new Blob(chunks.value, { type: recorder?.mimeType || 'video/webm' })
    if (lastPreviewUrl.value) URL.revokeObjectURL(lastPreviewUrl.value)
    lastPreviewUrl.value = URL.createObjectURL(blob)

    // ✅ Recién grabado queda en review (NO listo)
    const item = {
      id: uuid(),
      rut: rut.value,
      createdAt: Date.now(),
      status: 'review',
      confirmedAt: null,
      mimeType: recorder?.mimeType || 'video/webm',
      chunks: [...chunks.value]
    }

    await idbPut(item as any)
    await refreshPending()
    setMsg('Grabación guardada. Revisa y CONFIRMA para dejar listo para envío.')
  }

  recorder.start(1000)
  recording.value = true
  setMsg('Grabando...')
}

function stopRecording() {
  if (recorder && recording.value) recorder.stop()
}

// =========================
// PREVIEW / CONFIRM
// =========================
function previewPending(item: StoredCase) {
  const blob = new Blob((item as any).chunks, { type: (item as any).mimeType })
  if (lastPreviewUrl.value) URL.revokeObjectURL(lastPreviewUrl.value)
  lastPreviewUrl.value = URL.createObjectURL(blob)
  setMsg(`Preview cargado: ${item.id}`)
}

async function confirmPending(item: any) {
  const updated = toPlainCase(item, {
    status: 'ready',
    confirmedAt: Date.now()
  })

  await idbPut(updated as any)
  await refreshPending()
  setMsg(`Confirmado: ${item.id}. Se enviará automático en 1 minuto si no lo envías manualmente.`)
}

// =========================
// UPLOAD / SYNC
// =========================
async function uploadCase(item: any) {
  const blob = new Blob(item.chunks, { type: item.mimeType })

  const fd = new FormData()
  fd.append('rut', item.rut)
  fd.append('createdAt', String(item.createdAt))
  fd.append('video', blob, `${item.rut}-${item.createdAt}.webm`)

  const res = await fetch('/api/upload', { method: 'POST', body: fd })
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(`Upload falló: ${res.status} ${txt}`)
  }
}

async function syncOne(item: any) {
  if (!online.value) {
    setMsg('OFFLINE (ping). No se puede subir.')
    return
  }
  if (item.status !== 'ready') {
    setMsg('Debes CONFIRMAR el video antes de subir.')
    return
  }
  if (syncing.value) return

  syncing.value = true
  try {
    setMsg(`Subiendo caso ${item.id} (RUT ${item.rut})...`)
    await uploadCase(item)
    await idbDelete(item.id)
    await refreshPending()
    setMsg(`Subido OK y eliminado local: ${item.id}`)
  } catch (e: any) {
    await idbPut(toPlainCase(item, { status: 'error' }) as any)
    await refreshPending()
    setMsg(`Error subiendo ${item.id}: ${e?.message ?? e}`)
  } finally {
    syncing.value = false
  }
}

async function syncPending() {
  if (!online.value) {
    setMsg('OFFLINE (ping). No se puede sincronizar.')
    return
  }
  if (syncing.value) return

  syncing.value = true
  try {
    await refreshPending()
    const ready = pending.value.filter((x: any) => x.status === 'ready')
    if (ready.length === 0) {
      setMsg('No hay confirmados listos para enviar.')
      return
    }

    const items = [...ready]
    for (const item of items) {
      try {
        setMsg(`Subiendo confirmado ${item.id}...`)
        await uploadCase(item)
        await idbDelete(item.id)
      } catch (e: any) {
        await idbPut(toPlainCase(item, { status: 'error' }) as any)
        setMsg(`Error subiendo ${item.id}: ${e?.message ?? e}`)
      }
    }

    await refreshPending()
    setMsg('Envío manual terminado.')
  } finally {
    syncing.value = false
  }
}

async function syncReadyExpired() {
  if (!online.value) return
  if (syncing.value) return

  await refreshPending()
  const expired = pending.value.filter((x: any) => isReadyExpired(x))
  if (expired.length === 0) return

  syncing.value = true
  try {
    const items = [...expired]
    for (const item of items) {
      try {
        setMsg(`(Auto) Subiendo confirmado ${item.id}...`)
        await uploadCase(item)
        await idbDelete(item.id)
      } catch (e: any) {
        await idbPut(toPlainCase(item, { status: 'error' }) as any)
        setMsg(`(Auto) Error subiendo ${item.id}: ${e?.message ?? e}`)
      }
    }
    await refreshPending()
    setMsg('(Auto) Envío automático terminado.')
  } finally {
    syncing.value = false
  }
}

async function removePending(id: string) {
  await idbDelete(id)
  await refreshPending()
  setMsg(`Pendiente eliminado: ${id}`)
}

// ✅ Cuando vuelve ONLINE por ping, intenta auto-enviar vencidos
watch(
  () => online.value,
  async (isOnline, wasOnline) => {
    if (!wasOnline && isOnline) {
      setMsg('Volviste ONLINE (ping). Revisando confirmados vencidos...')
      await syncReadyExpired()
    }
  }
)

onMounted(async () => {
  await refreshPending()
  await ping()
  autoTimer = setInterval(() => {
    syncReadyExpired()
  }, AUTO_CHECK_EVERY_MS)
})

onBeforeUnmount(() => {
  stopCamera()
  if (lastPreviewUrl.value) URL.revokeObjectURL(lastPreviewUrl.value)
  if (autoTimer) clearInterval(autoTimer)
})
</script>



<style scoped>
button {
  padding: 10px 12px;
  border: 1px solid #ccc;
  background: white;
  border-radius: 10px;
  cursor: pointer;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
