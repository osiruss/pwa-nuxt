<template>
  <main class="page">
    <section class="card">
      <button class="btn-home" type="button" @click="goHome" title="Volver al selector">x</button>
      <div ref="topAnchorEl" class="top-anchor"></div>
      <div v-show="termsAccepted && cameraOn" ref="videoFloatEl" class="video-float draggable-resizable"
        :style="videoFloatStyle">
        <video ref="videoEl" autoplay playsinline muted class="video-float__video"></video>

        <div class="video-float__drag" @pointerdown="onDragPointerDown" title="Mover"></div>

        <div class="video-float__resize" @pointerdown="onResizePointerDown" title="Redimensionar"></div>
      </div>
      <p class="status">
        Estado conexión: <b>{{ online ? 'ONLINE' : 'OFFLINE' }}</b>
        <small v-if="status.mode === 'verified'"> (verificado)</small>
      </p>
      <div v-if="uiStep === 'rut'" class="stack">
        <label class="field">
          <span class="label">RUT pensionado</span>
          <input v-model.trim="rut" placeholder="12.345.678-9" class="input" />
        </label>

        <button class="btn" @click="goToTerms" :disabled="!isRutReady">Continuar</button>

        <small class="hint">Ingresa el RUT para continuar.</small>
      </div>
      <div v-else class="stack">

        <label class="field">
          <span class="label">RUT pensionado</span>
          <input v-model.trim="rut" placeholder="12.345.678-9" class="input" />
        </label>
        <!-- Terms -->
        <div class="terms">
          <h2 class="terms__title">{{ renderedTitle || (pendingx ? 'Cargando…' : 'Sin titulo') }}</h2>

          <p v-for="(p, i) in paragraphs" :key="i" class="terms__p">
            {{ p }}
          </p>

          <p v-if="source === 'cache'" style="opacity:.7">
            Estás viendo una copia offline guardada.
          </p>
          <p v-else-if="error && !paragraphs" style="opacity:.7">
            No se pudo cargar el contenido.
          </p>

          <label class="checkbox">
            <input type="checkbox" v-model="termsAccepted" />
            <span>He leído las condiciones.</span>
          </label>

          <button class="btn btn-ghost2" @click="back" :disabled="syncing || !online">
            ← Volver
          </button>

          <button class="btn" type="button" @click="toggleVarsForm">📝 Ingresar datos</button>
          <!-- FORMUALRIO INGRESO DE DATOS -->
          <div v-if="showVarsForm" class="vars-panel">
            <label class="field">
              <span class="label">Nombre pensionado(a)</span>
              <input class="input" :value="vars.nombre"
                @input="setVar('nombre', ($event.target as HTMLInputElement).value)" />
            </label>

            <label class="field">
              <span class="label">Rut Afiliado</span>
              <input class="input" :value="vars.rutAfiliado"
                @input="setVar('rutAfiliado', ($event.target as HTMLInputElement).value)" />
            </label>

            <label class="field">
              <span class="label">Nombre Ejecutivo</span>
              <input class="input" :value="vars.nombreEjecutivo"
                @input="setVar('nombreEjecutivo', ($event.target as HTMLInputElement).value)" />
            </label>

            <label class="field">
              <span class="label">Fecha</span>
              <input class="input" :value="vars.fecha"
                @input="setVar('fecha', ($event.target as HTMLInputElement).value)" />
            </label>

            <label class="field">
              <span class="label">Hora</span>
              <input class="input" :value="vars.hora"
                @input="setVar('hora', ($event.target as HTMLInputElement).value)" />
            </label>

            <div style="display:flex; gap:8px; margin-top:8px;">
              <button class="btn" type="button" @click="showVarsForm = false">
                Guardar
              </button>

              <button class="btn" type="button" @click="resetVars">Limpiar</button>
            </div>
          </div>

          <p v-if="error" class="terms__p" style="opacity:.7">
            contenido cargado modo offline.
          </p>
        </div>

        <div v-if="termsAccepted" class="stack">
          <label class="field">
            <span class="label">Cámara</span>
            <select v-model="selectedDeviceId" :disabled="!videoInputs.length || recording" class="input">
              <option value="">(Automática)</option>
              <option v-for="d in videoInputs" :key="d.deviceId" :value="d.deviceId">
                {{ d.label || `Cámara ${d.deviceId.slice(0, 6)}…` }}
              </option>
            </select>
          </label>

          <div class="actions">
            <button class="btn" @click="startCamera" :disabled="cameraOn">🎥 Encender cámara</button>
            <button class="btn" @click="stopCamera" :disabled="!cameraOn">⛔ Apagar cámara</button>

            <button class="btn" @click="openFilePicker" :disabled="syncing">📎 Adjuntar video</button>
            <input ref="fileInputEl" type="file" accept="video/*" capture="environment" class="hidden"
              @change="onFileSelected" />

            <button class="btn" @click="syncPending" :disabled="syncing || !online">🔄 Enviar confirmados</button>
          </div>

          <p class="meta">
            Pendientes: <b>{{ pendingCount }}</b>
            — Confirmados vencidos (auto): <b>{{ readyExpiredCount }}</b>
          </p>

          <div v-if="lastPreviewUrl" ref="previewAnchorEl" class="preview">
            <h3 class="subtitle">Última grabación (preview)</h3>
            <video :src="lastPreviewUrl" controls class="preview__video"></video>
          </div>

          <div v-if="pending.length" class="pending">
            <div class="pending__head">
              <h3 class="subtitle">📋 Pendientes ({{ pending.length }})</h3>
              <button class="btn" @click="refreshPending" :disabled="syncing">🔁 Actualizar</button>
            </div>

            <div class="pending__list">
              <div v-for="item in sortedPending" :key="item.id" class="pending__item">
                <div class="pending__info">
                  <div class="pending__rut">RUT: {{ item.rut }}</div>
                  <div class="pending__sub">{{ formatDate(item.createdAt) }} · ID: {{ item.id }}</div>

                  <div class="pending__sub">
                    ⏱ {{ formatDuration(mediaMeta[item.id]?.durationSec ?? null) }}
                    · 💾 {{ formatBytes(mediaMeta[item.id]?.sizeBytes ?? 0) }}
                  </div>

                  <div v-if="item.status === 'ready' && item.confirmedAt" class="pending__sub">
                    Confirmado: {{ formatDate(item.confirmedAt) }} · Auto-envío en: {{ remainingText(item) }}
                  </div>
                </div>

                <div class="pending__actions">
                  <span :style="badgeStyle(item.status)">{{ item.status }}</span>
                  <button class="btn" @click="editPendingVideo(item)" :disabled="syncing">
                    ✏️ Editar video
                  </button>

                  <button class="btn" @click="previewPending(item)">▶️ Ver</button>
                  <button @click="downloadPending(item)">⬇️ Descargar</button>

                  <button v-if="item.status === 'review'" class="btn" @click="confirmPending(item)" :disabled="syncing">
                    ✅ Confirmar
                  </button>

                  <button class="btn" @click="syncOne(item)" :disabled="syncing || !online || item.status !== 'ready'">
                    ⬆️ Subir
                  </button>

                  <button class="btn" @click="removePending(item.id)" :disabled="syncing">🗑️</button>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="empty">No hay pendientes.</div>

          <div v-if="msg" class="msg">{{ msg }}</div>
        </div>

        <div v-else class="empty">
          Acepta los términos para habilitar cámara, grabación, adjuntar y envío.
        </div>
      </div>
    </section>

    <div v-if="termsAccepted && cameraOn" class="bottom-controls">
      <button class="btn-ghost" @click="stopCamera" :disabled="!cameraOn">⛔</button>
      <button class="btn-record" v-if="!recording" @click="startRecording" :disabled="!cameraOn">●</button>
      <button class="btn-stop" v-else @click="stopRecording">■</button>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { idbPut, idbGetAll, idbDelete, type StoredCase } from '~/utils/idb'

const router = useRouter()


const { override, modeLabel } = useConnectivityMode()


const { status, ping } = useNetworkStatus({
  pingUrl: '/api/ping-moleculer',
  verify: true,
  intervalMs: 10_000,
  timeoutMs: 4_000
})

// 3) DESPUÉS: online final (override manda)
const online = computed(() => {
  if (override.value !== null) return override.value
  return status.value.online
})

// 4) DESPUÉS: composables que dependen de online
const { renderedTitle, paragraphs, vars, setVar, pendingx, error, source } = useTerms(online)



type MediaMeta = { sizeBytes: number; durationSec: number | null }
type UiStep = 'rut' | 'terms'


const editingId = ref<string | null>(null)
const editingOriginal = ref<any | null>(null)


const AUTO_SEND_AFTER_MS = 1 * 60 * 1000
const AUTO_CHECK_EVERY_MS = 30 * 1000

const rut = ref('')
const msg = ref('')

const videoEl = ref<HTMLVideoElement | null>(null)
const fileInputEl = ref<HTMLInputElement | null>(null)

let stream: MediaStream | null = null
let recorder: MediaRecorder | null = null

const cameraOn = ref(false)
const recording = ref(false)
const chunks = ref<Blob[]>([])
const lastPreviewUrl = ref('')

const syncing = ref(false)
const pending = ref<StoredCase[]>([])
const mediaMeta = ref<Record<string, MediaMeta>>({})

const pendingCount = computed(() => pending.value.length)
const sortedPending = computed(() => [...pending.value].sort((a, b) => b.createdAt - a.createdAt))

const uiStep = ref<UiStep>('rut')
const termsAccepted = ref(false)
const isRutReady = computed(() => (rut.value || '').trim().length >= 8)
const topAnchorEl = ref<HTMLElement | null>(null)
const previewAnchorEl = ref<HTMLElement | null>(null)
const videoFloatEl = ref<HTMLElement | null>(null)

const floatX = ref(14)
const floatY = ref(14)
const floatW = ref(100)

const MIN_W = 100
const MAX_W = 520

let dragging = false
let resizing = false
let dragStartX = 0
let dragStartY = 0
let dragOriginX = 0
let dragOriginY = 0
let resizeStartX = 0
let resizeOriginW = 0

const videoFloatStyle = computed(() => ({
  left: `${floatX.value}px`,
  top: `${floatY.value}px`,
  width: `${floatW.value}px`
}))

/** Camera device selection */
const videoInputs = ref<MediaDeviceInfo[]>([])
const selectedDeviceId = ref('')
const permissionPrimed = ref(false)

/** Auto send */
let autoTimer: ReturnType<typeof setInterval> | null = null
const autoTimeouts = new Map<string, ReturnType<typeof setTimeout>>()
const { setAuto } = useConnectivityMode()

const showVarsForm = ref(false)

/* ------------------------ UI helpers ------------------------ */

function extFromMime(mime: string) {
  const m = (mime || '').toLowerCase()
  if (m.includes('mp4')) return 'mp4'
  if (m.includes('quicktime') || m.includes('mov')) return 'mov'
  if (m.includes('webm')) return 'webm'
  return 'bin'
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()

  // revoca luego para no cortar descarga en algunos browsers
  setTimeout(() => {
    try { URL.revokeObjectURL(url) } catch { }
  }, 1500)
}

function downloadPending(item: any) {
  try {
    const mime = item.mimeType || 'application/octet-stream'
    const blob = new Blob(Array.from(item.chunks ?? []), { type: mime })
    const ext = extFromMime(mime)
    const filename = `${item.rut || 'sin-rut'}-${item.createdAt || Date.now()}.${ext}`
    downloadBlob(blob, filename)
    setMsg(`Descargando: ${filename}`)
  } catch (e: any) {
    setMsg(`Error descargando: ${e?.message ?? e}`)
  }
}

function setMsg(t: string) {
  msg.value = t
  console.log(t)
}

function goToTerms() {
  if (!isRutReady.value) return setMsg('Ingresa un RUT válido para continuar.')
  uiStep.value = 'terms'
}

function back() {
  cleanupPreview()
  stopCamera()
  resetFlow()
}

function resetFlow() {
  termsAccepted.value = false
  uiStep.value = 'rut'
  recording.value = false
  chunks.value = []
  recorder = null
  rut.value = ''
  scrollToTopAnchor()
}

function resetToStartAfterDelay(ms = 3000) {
  setTimeout(() => {
    cleanupPreview()
    stopCamera()
    resetFlow()
  }, ms)
}

function cleanupPreview() {
  try {
    if (lastPreviewUrl.value) URL.revokeObjectURL(lastPreviewUrl.value)
  } catch { }
  lastPreviewUrl.value = ''
}

function shouldResetAfterSync() {
  const remaining = pending.value.filter((x: any) => x.status === 'review' || x.status === 'ready')
  return remaining.length === 0
}

function scrollToTopAnchor() {
  requestAnimationFrame(() => topAnchorEl.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
}

function scrollToPreview() {
  requestAnimationFrame(() => previewAnchorEl.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
}

/* ------------------------ Formatting ------------------------ */
function formatBytes(bytes: number) {
  const kb = 1024
  const mb = kb * 1024
  const gb = mb * 1024
  if (bytes >= gb) return `${(bytes / gb).toFixed(2)} GB`
  if (bytes >= mb) return `${(bytes / mb).toFixed(2)} MB`
  if (bytes >= kb) return `${(bytes / kb).toFixed(1)} KB`
  return `${bytes} B`
}

function formatDuration(sec: number | null) {
  if (sec == null || !Number.isFinite(sec)) return '-'
  const s = Math.floor(sec)
  const mm = Math.floor(s / 60)
  const ss = s % 60
  return `${mm}:${String(ss).padStart(2, '0')}`
}

function formatDate(ts: number) {
  try {
    return new Date(ts).toLocaleString('es-CL')
  } catch {
    return String(ts)
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

/* ------------------------ Floating camera logic ------------------------ */
function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function keepInsideViewport(nextX: number, nextY: number, w: number) {
  const margin = 8
  const vw = window.innerWidth
  const vh = window.innerHeight
  const h = videoFloatEl.value?.getBoundingClientRect().height ?? 200
  const x = clamp(nextX, margin, vw - w - margin)
  const y = clamp(nextY, margin, vh - h - margin)
  return { x, y }
}

function getInitialFloatWidth() {
  const vw = window.innerWidth
  const base = 100
  if (vw < 480) return Math.max(base, vw * 0.6)
  if (vw < 900) return Math.max(base, vw * 0.4)
  return Math.max(base, Math.min(360, vw * 0.25))
}

function snapOverlayIntoViewport() {
  const bounded = keepInsideViewport(floatX.value, floatY.value, floatW.value)
  floatX.value = bounded.x
  floatY.value = bounded.y
}

function onDragPointerDown(ev: PointerEvent) {
  if (!termsAccepted.value || !cameraOn.value) return

  dragging = true
  dragStartX = ev.clientX
  dragStartY = ev.clientY
  dragOriginX = floatX.value
  dragOriginY = floatY.value

    ; (ev.currentTarget as HTMLElement)?.setPointerCapture?.(ev.pointerId)
  window.addEventListener('pointermove', onPointerMove, { passive: false })
  window.addEventListener('pointerup', onPointerUp, { passive: true })
}

function onResizePointerDown(ev: PointerEvent) {
  if (!termsAccepted.value || !cameraOn.value) return

  resizing = true
  resizeStartX = ev.clientX
  resizeOriginW = floatW.value

    ; (ev.currentTarget as HTMLElement)?.setPointerCapture?.(ev.pointerId)
  window.addEventListener('pointermove', onPointerMove, { passive: false })
  window.addEventListener('pointerup', onPointerUp, { passive: true })
}

function onPointerMove(ev: PointerEvent) {
  if (dragging || resizing) ev.preventDefault()

  if (dragging) {
    const dx = ev.clientX - dragStartX
    const dy = ev.clientY - dragStartY
    const bounded = keepInsideViewport(dragOriginX + dx, dragOriginY + dy, floatW.value)
    floatX.value = bounded.x
    floatY.value = bounded.y
    return
  }

  if (resizing) {
    const dx = ev.clientX - resizeStartX
    const nw = clamp(resizeOriginW + dx, MIN_W, Math.min(MAX_W, window.innerWidth - 16))
    floatW.value = nw
    snapOverlayIntoViewport()
  }
}

function onPointerUp() {
  dragging = false
  resizing = false
  window.removeEventListener('pointermove', onPointerMove as any)
  window.removeEventListener('pointerup', onPointerUp as any)
}

/* ------------------------ Media helpers ------------------------ */
function uuid(): string {
  return crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function toPlainCase(item: any, patch?: Partial<any>) {
  return {
    id: item.id,
    rut: item.rut,
    createdAt: item.createdAt,
    mimeType: item.mimeType,
    chunks: Array.from(item.chunks ?? []),
    status: item.status,
    confirmedAt: item.confirmedAt ?? null,
    ...(patch || {})
  }
}

async function replaceVideoOnItem(item: any, patch: {
  chunks: Blob[],
  mimeType: string,
  keepConfirmedAt?: boolean
}) {
  const next = toPlainCase(item, {
    // reemplaza el video
    chunks: [...patch.chunks],
    mimeType: patch.mimeType,

    // actualiza timestamps
    createdAt: Date.now(),

    // al editar, lo mandamos a revisión (o si quieres directo a ready)
    status: 'review',
    confirmedAt: patch.keepConfirmedAt ? item.confirmedAt ?? null : null,
  })

  await idbPut(next as any)

  // recalcular meta (duración/peso)
  computeMetaForItem(next)
    .then((meta) => (mediaMeta.value = { ...mediaMeta.value, [next.id]: meta }))
    .catch(() => (mediaMeta.value = { ...mediaMeta.value, [next.id]: { sizeBytes: 0, durationSec: null } }))

  await refreshPending()
  return next
}

async function fileToChunks(file: File, chunkSize = 1024 * 1024) {
  const out: Blob[] = []
  let offset = 0
  while (offset < file.size) {
    out.push(file.slice(offset, offset + chunkSize, file.type))
    offset += chunkSize
  }
  return out
}

async function computeMetaForItem(item: any): Promise<MediaMeta> {
  const blob = new Blob(Array.from(item.chunks ?? []), { type: item.mimeType || 'video/webm' })
  const sizeBytes = blob.size

  const durationSec = await new Promise<number | null>((resolve) => {
    const url = URL.createObjectURL(blob)
    const v = document.createElement('video')
    v.preload = 'metadata'
    v.muted = true

    const cleanup = () => {
      try {
        URL.revokeObjectURL(url)
      } catch { }
    }

    v.onloadedmetadata = () => {
      const d = Number.isFinite(v.duration) ? v.duration : null
      cleanup()
      resolve(d)
    }
    v.onerror = () => {
      cleanup()
      resolve(null)
    }

    v.src = url
  })

  return { sizeBytes, durationSec }
}



/* ------------------------ Devices/permissions ------------------------ */
async function primePermissions() {
  if (permissionPrimed.value) return
  try {
    const tmp = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    tmp.getTracks().forEach((t) => t.stop())
    permissionPrimed.value = true
  } catch {
    // silent
  }
}

async function loadVideoDevices() {
  if (!navigator.mediaDevices?.enumerateDevices) {
    videoInputs.value = []
    return
  }
  const all = await navigator.mediaDevices.enumerateDevices()
  videoInputs.value = all.filter((d) => d.kind === 'videoinput')
}

/* ------------------------ Pending/IDB ------------------------ */
async function refreshPending() {
  const all = await idbGetAll()
  pending.value = all.filter((x: any) => x.status === 'review' || x.status === 'ready' || x.status === 'error')

  for (const item of pending.value as any[]) {
    if (mediaMeta.value[item.id]) continue
    computeMetaForItem(item)
      .then((meta) => (mediaMeta.value = { ...mediaMeta.value, [item.id]: meta }))
      .catch(() => (mediaMeta.value = { ...mediaMeta.value, [item.id]: { sizeBytes: 0, durationSec: null } }))
  }
}

/* ------------------------ Auto-send scheduling ------------------------ */
function isReadyExpired(item: any) {
  if (item.status !== 'ready') return false
  const t = Number(item.confirmedAt ?? 0)
  if (!t) return false
  return Date.now() - t >= AUTO_SEND_AFTER_MS
}

const readyExpiredCount = computed(() => pending.value.filter(isReadyExpired).length)

function remainingText(item: any) {
  if (item.status !== 'ready' || !item.confirmedAt) return '-'
  const remaining = AUTO_SEND_AFTER_MS - (Date.now() - Number(item.confirmedAt))
  if (remaining <= 0) return 'vencido (se enviará cuando esté online)'
  const mins = Math.floor(remaining / 60000)
  const secs = Math.floor((remaining % 60000) / 1000)
  return `${mins}m ${secs}s`
}

function scheduleAutoSend(item: any) {
  if (item.status !== 'ready') return
  const confirmedAt = Number(item.confirmedAt || 0)
  if (!confirmedAt) return

  const prev = autoTimeouts.get(item.id)
  if (prev) clearTimeout(prev)

  const dueIn = Math.max(0, AUTO_SEND_AFTER_MS - (Date.now() - confirmedAt))
  const t = setTimeout(async () => {
    await syncReadyExpired()
  }, dueIn)

  autoTimeouts.set(item.id, t)
}

/* ------------------------ Camera / Recorder ------------------------ */
async function startCamera() {
  try {
    if (!termsAccepted.value) return setMsg('Debes aceptar los términos antes de usar la cámara.')
    if (!navigator.mediaDevices?.getUserMedia) return setMsg('Este navegador no soporta getUserMedia.')

    if (stream) stopCamera()

    await primePermissions()
    await loadVideoDevices()

    const wantDeviceId = selectedDeviceId.value?.trim()
    const videoConstraints: MediaTrackConstraints = wantDeviceId
      ? { deviceId: { exact: wantDeviceId } }
      : { facingMode: { exact: 'environment' } }

    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: true })
    } catch {
      // fallback chain
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: true })
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true })
      }
    }

    if (videoEl.value) videoEl.value.srcObject = stream
    cameraOn.value = true

    const track = stream.getVideoTracks()[0]
    const settings = track?.getSettings?.()
    if (!wantDeviceId && settings?.deviceId) selectedDeviceId.value = String(settings.deviceId)

    setMsg('Cámara activa.')
    scrollToTopAnchor()
  } catch (e: any) {
    setMsg(`Error al abrir cámara: ${e?.message ?? e}`)
  }
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach((t) => t.stop())
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
  if (!termsAccepted.value) return setMsg('Debes aceptar los términos antes de grabar.')
  if (!stream) return
  if (!rut.value) return setMsg('Debes ingresar el RUT antes de grabar.')

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
    cleanupPreview()
    lastPreviewUrl.value = URL.createObjectURL(blob)

    // ✅ SI ESTOY EDITANDO: reemplazo el video del item existente
    if (editingId.value) {
      const current = pending.value.find((x: any) => x.id === editingId.value) || editingOriginal.value
      if (!current) {
        editingId.value = null
        editingOriginal.value = null
        stopCamera()
        return setMsg('No encontré el pendiente a editar.')
      }

      await replaceVideoOnItem(current, {
        chunks: [...chunks.value],
        mimeType: recorder?.mimeType || 'video/webm',
        keepConfirmedAt: false,
      })

      editingId.value = null
      editingOriginal.value = null

      setMsg('Video actualizado. Revisa y CONFIRMA nuevamente para habilitar envío.')
      stopCamera()
      scrollToPreview()
      return
    }

    // ✅ FLUJO NORMAL: crea nuevo item
    const item: any = {
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
    stopCamera()
    scrollToPreview()
  }

  // recorder.onstop = async () => {
  //   recording.value = false

  //   const blob = new Blob(chunks.value, { type: recorder?.mimeType || 'video/webm' })
  //   cleanupPreview()
  //   lastPreviewUrl.value = URL.createObjectURL(blob)

  //   const item: any = {
  //     id: uuid(),
  //     rut: rut.value,
  //     createdAt: Date.now(),
  //     status: 'review',
  //     confirmedAt: null,
  //     mimeType: recorder?.mimeType || 'video/webm',
  //     chunks: [...chunks.value]
  //   }

  //   await idbPut(item as any)
  //   await refreshPending()
  //   setMsg('Grabación guardada. Revisa y CONFIRMA para dejar listo para envío.')
  //   stopCamera()
  //   scrollToPreview()
  // }

  recorder.start(1000)
  recording.value = true
  setMsg('Grabando...')
}

function stopRecording() {
  if (recorder && recording.value) recorder.stop()
}

/* ------------------------ File attach ------------------------ */
function openFilePicker() {
  if (!rut.value) return setMsg('Debes ingresar el RUT antes de adjuntar un video.')
  fileInputEl.value?.click()
}

async function onFileSelected(ev: Event) {
  const input = ev.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (!rut.value) return setMsg('Debes ingresar el RUT antes de adjuntar un video.')

  try {
    setMsg(`Adjuntando video: ${file.name} (${formatBytes(file.size)})...`)

    const mimeType = file.type || 'video/mp4'
    const chunksArr = await fileToChunks(file)

    if (editingId.value) {
      const current = pending.value.find((x: any) => x.id === editingId.value) || editingOriginal.value
      if (!current) {
        editingId.value = null
        editingOriginal.value = null
        return setMsg('No encontré el pendiente a editar.')
      }

      await replaceVideoOnItem(current, {
        chunks: chunksArr,
        mimeType,
        keepConfirmedAt: false,
      })

      editingId.value = null
      editingOriginal.value = null

      setMsg('Video adjuntado y actualizado. Revisa y CONFIRMA nuevamente.')
      return
    }

    const item: any = {
      id: uuid(),
      rut: rut.value,
      createdAt: Date.now(),
      status: 'review',
      confirmedAt: null,
      mimeType,
      chunks: chunksArr
    }

    await idbPut(item as any)
    await refreshPending()

    computeMetaForItem(item)
      .then((meta) => (mediaMeta.value = { ...mediaMeta.value, [item.id]: meta }))
      .catch(() => (mediaMeta.value = { ...mediaMeta.value, [item.id]: { sizeBytes: file.size, durationSec: null } }))

    setMsg('Video adjuntado y guardado OFFLINE. Revisa y CONFIRMA para dejar listo para envío.')
  } catch (e: any) {
    setMsg(`Error adjuntando video: ${e?.message ?? e}`)
  }
}

/* ------------------------ Preview + confirm ------------------------ */
function previewPending(item: StoredCase) {
  const blob = new Blob((item as any).chunks, { type: (item as any).mimeType })
  cleanupPreview()
  lastPreviewUrl.value = URL.createObjectURL(blob)
  setMsg(`Preview cargado: ${item.id}`)
}

async function editPendingVideo(item: any) {
  if (recording.value) return setMsg('Estás grabando. Detén la grabación primero.')
  if (syncing.value) return setMsg('Sincronizando. Espera un momento.')
  if (!termsAccepted.value) return setMsg('Debes aceptar los términos para editar.')
  if (!item?.id) return

  // si estaba ready, evitamos que se envíe por auto-send mientras editas
  if (item.status === 'ready') {
    const updated = toPlainCase(item, { status: 'review', confirmedAt: null })
    await idbPut(updated as any)
    await refreshPending()
  }

  editingId.value = item.id
  editingOriginal.value = toPlainCase(item)

  // opcional: previsualiza lo que estás editando
  previewPending(item)

  // enciende cámara para regrabar
  await startCamera()
  setMsg(`Editando video del caso: ${item.id}`)
}

async function confirmPending(item: any) {
  const updated = toPlainCase(item, { status: 'ready', confirmedAt: Date.now() })
  await idbPut(updated as any)
  await refreshPending()
  scheduleAutoSend(updated)
  setMsg(`Confirmado: ${item.id}. Se enviará automático en 1 minuto si no lo envías manualmente.`)
}

/* ------------------------ Upload / sync ------------------------ */
async function uploadCase(item: any) {
  const blob = new Blob(item.chunks, { type: item.mimeType })

  const fd = new FormData()
  fd.append('rut', item.rut)
  fd.append('createdAt', String(item.createdAt))

  const ext = item.mimeType?.includes('mp4')
    ? 'mp4'
    : item.mimeType?.includes('quicktime')
      ? 'mov'
      : item.mimeType?.includes('webm')
        ? 'webm'
        : 'bin'

  fd.append('video', blob, `${item.rut}-${item.createdAt}.${ext}`)

  const res = await fetch('/api/upload', { method: 'POST', body: fd })
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(`Upload falló: ${res.status} ${txt}`)
  }
}

async function syncOne(item: any) {
  if (!online.value) return setMsg('OFFLINE (ping). No se puede subir.')
  if (item.status !== 'ready') return setMsg('Debes CONFIRMAR el video antes de subir.')
  if (syncing.value) return

  syncing.value = true
  try {
    setMsg(`Subiendo caso ${item.id} (RUT ${item.rut})...`)
    await uploadCase(item)
    await idbDelete(item.id)
    await refreshPending()
    setMsg(`Subido OK y eliminado local: ${item.id}`)
    if (shouldResetAfterSync()) resetToStartAfterDelay()
  } catch (e: any) {
    await idbPut(toPlainCase(item, { status: 'error' }) as any)
    await refreshPending()
    setMsg(`Error subiendo ${item.id}: ${e?.message ?? e}`)
  } finally {
    syncing.value = false
  }
}

async function syncPending() {
  if (!online.value) return setMsg('OFFLINE (ping). No se puede sincronizar.')
  if (syncing.value) return

  syncing.value = true
  try {
    await refreshPending()
    const ready = pending.value.filter((x: any) => x.status === 'ready')
    if (ready.length === 0) return setMsg('No hay confirmados listos para enviar.')

    for (const item of [...ready]) {
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
    if (shouldResetAfterSync()) resetToStartAfterDelay()
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
    for (const item of [...expired]) {
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


function toggleVarsForm() {
  showVarsForm.value = !showVarsForm.value
}

/* ------------------------ Router ------------------------ */
function goHome() {
  setAuto()
  router.push("/")
}

/* ------------------------ Limpia formulario ingreso de datos guión ------------------------ */
function resetVars() {
  Object.keys(vars.value).forEach(k => {
    vars.value[k] = ""
  })

  if (import.meta.client) {
    try {
      localStorage.removeItem("afiliacion:guionVars:v1")
    } catch {}
  }
}

/* ------------------------ Watches ------------------------ */
watch(
  () => termsAccepted.value,
  async (accepted) => {
    if (!accepted) return
    if (!isRutReady.value) {
      termsAccepted.value = false
      return setMsg('Ingresa un RUT válido para continuar.')
    }
    setMsg('Términos aceptados. Puedes encender cámara o adjuntar un video.')
    await primePermissions()
    await loadVideoDevices()
  }
)

watch(
  () => online.value,
  async (isOnline, wasOnline) => {
    if (!wasOnline && isOnline) {
      setMsg('Volviste ONLINE (ping). Revisando confirmados vencidos...')
      await syncReadyExpired()
    }
  }
)

watch(
  () => selectedDeviceId.value,
  async (newId, oldId) => {
    if (newId === oldId) return
    if (!cameraOn.value) return
    if (recording.value) {
      setMsg('No puedes cambiar cámara mientras grabas.')
      selectedDeviceId.value = oldId || ''
      return
    }
    await startCamera()
  }
)

/* ------------------------ Lifecycle ------------------------ */
onMounted(async () => {
  floatW.value = getInitialFloatWidth()
  snapOverlayIntoViewport()

  const onWinResize = () => {
    floatW.value = getInitialFloatWidth()
    snapOverlayIntoViewport()
  }
  window.addEventListener('resize', onWinResize)

  await refreshPending()

  console.log("🚀 ~ override.value:", override.value)
  if (override.value === null) {
    await ping()
  }

  await primePermissions()
  await loadVideoDevices()


  for (const item of pending.value as any[]) scheduleAutoSend(item)

  autoTimer = setInterval(() => {
    syncReadyExpired()
  }, AUTO_CHECK_EVERY_MS)

  onBeforeUnmount(() => {
    window.removeEventListener('resize', onWinResize)
  })
})

onBeforeUnmount(() => {
  stopCamera()
  cleanupPreview()

  if (autoTimer) clearInterval(autoTimer)
  for (const t of autoTimeouts.values()) clearTimeout(t)
  autoTimeouts.clear()

  window.removeEventListener('pointermove', onPointerMove as any)
  window.removeEventListener('pointerup', onPointerUp as any)
})
</script>

<style scoped>
.page {
  max-width: 920px;
  margin: 24px auto;
  font-family: system-ui;
  padding: 0 16px;
}

.card {
  display: grid;
  gap: 12px;
  grid-template-columns: 1fr;
  position: relative;
}

.top-anchor {
  position: relative;
  top: -8px;
}

.status {
  margin: 0;
  font-size: 10px;
}

.stack {
  display: grid;
  gap: 12px;
}

.title {
  margin: 0;
}

.subtitle {
  margin: 0;
}

.field {
  display: grid;
  gap: 6px;
}

.label {
  font-size: 12px;
  opacity: 0.9;
}

.input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 10px;
}

.hint {
  opacity: 0.7;
}

.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.meta {
  margin: 0;
}

.hidden {
  display: none;
}

.terms {
  padding: 12px 14px;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  background: #fff;
  display: grid;
  gap: 10px;
}

.terms__title {
  margin: 0;
}

.terms__p {
  margin: 0;
  line-height: 1.4;
}

.checkbox {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.preview {
  margin-top: 12px;
}

.preview__video {
  width: 100%;
  border-radius: 12px;
}

.pending {
  margin-top: 14px;
}

.pending__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.pending__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
}

.pending__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  background: #fff;
}

.pending__info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pending__rut {
  font-weight: 700;
}

.pending__sub {
  font-size: 12px;
  opacity: 0.75;
}

.pending__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.empty,
.msg {
  margin-top: 14px;
  padding: 10px;
  border-radius: 10px;
  background: #f5f5f5;
}

button.btn,
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

.btn-ghost2 {
  justify-self: start;
}

.draggable-resizable {
  position: fixed;
  z-index: 9999;
  border-radius: 14px;
  overflow: hidden;
  background: #000;
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.28);
  touch-action: none;
}

.video-float__video {
  width: 100%;
  height: auto;
  display: block;
}

.video-float__dragdot {
  opacity: 0.85;
  font-size: 16px;
  line-height: 1;
}

.video-float__dragtext {
  opacity: 0.85;
  font-size: 12px;
}

.video-float__resize {
  position: absolute;
  right: 6px;
  bottom: 6px;
  width: 22px;
  height: 22px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.22);
  cursor: nwse-resize;
}

.video-float__resize::before {
  content: '';
  position: absolute;
  inset: 5px;
  border-right: 2px solid rgba(255, 255, 255, 0.55);
  border-bottom: 2px solid rgba(255, 255, 255, 0.55);
  border-radius: 4px;
}

/* Bottom controls */
.bottom-controls {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 18px 20px 28px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 28px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0));
  backdrop-filter: blur(6px);
  z-index: 9998;
}

.btn-record {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  border: 6px solid white;
  background: red;
  cursor: pointer;
  transition: 0.2s;
}

.btn-record:hover {
  transform: scale(1.05);
}

.btn-stop {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  border: 6px solid white;
  background: #b00020;
  color: white;
  font-size: 22px;
  cursor: pointer;
}

.btn-ghost {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.08);
  color: white;
  font-size: 18px;
  cursor: pointer;
}


.draggable-resizable {
  position: fixed;
  z-index: 9999;
  border-radius: 14px;
  overflow: hidden;
  background: #000;
  border: 1px solid rgba(255, 255, 255, .18);
  box-shadow: 0 14px 40px rgba(0, 0, 0, .28);
  touch-action: none;
  /* CLAVE para drag en móvil */
}

.video-float__video {
  width: 100%;
  height: auto;
  display: block;
}

/* Drag icon */
.video-float__drag {
  position: absolute;
  left: 6px;
  bottom: 6px;
  width: 26px;
  height: 26px;
  border-radius: 8px;
  background: rgba(255, 255, 255, .12);
  border: 1px solid rgba(255, 255, 255, .28);
  cursor: grab;
  z-index: 2;
  /* CLAVE: que quede sobre el video */
  pointer-events: auto;
}

.video-float__drag:active {
  cursor: grabbing;
}

.video-float__drag::before {
  content: "";
  position: absolute;
  inset: 6px;
  background:
    radial-gradient(circle, rgba(255, 255, 255, .75) 2px, transparent 3px) 0 0 / 8px 8px;
  opacity: .95;
}

.video-float__resize {
  position: absolute;
  right: 6px;
  bottom: 6px;
  width: 26px;
  height: 26px;
  border-radius: 8px;
  background: rgba(255, 255, 255, .12);
  border: 1px solid rgba(255, 255, 255, .28);
  cursor: nwse-resize;
  z-index: 2;
  pointer-events: auto;
}

.video-float__resize::before {
  content: "";
  position: absolute;
  inset: 6px;
  border-right: 2px solid rgba(255, 255, 255, .65);
  border-bottom: 2px solid rgba(255, 255, 255, .65);
  border-radius: 4px;
}

.btn-home {
  position: absolute;
  top: 5px;
  right: 5px;

  width: 25px;
  height: 25px;

  border-radius: 50%;
  border: 0px solid #ccc;
  background: #fff;

  display: grid;
  align-items: center;
  justify-content: center;
  place-items: center;
  font-size: 15px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.btn-home:active {
  transform: scale(0.98);
}

.vars-panel {
  margin-top: 10px;
  padding: 14px;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  background: #fafafa;
  display: grid;
  gap: 10px;
}
</style>
