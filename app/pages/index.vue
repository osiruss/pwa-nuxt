<template>
  <main style="max-width: 920px; margin: 24px auto; font-family: system-ui; padding: 0 16px;">
    <section style="display: grid; gap: 12px; grid-template-columns: 1fr; position: relative;">
      <div ref="topAnchorEl" style="position: relative; top: -8px;"></div>

      <div v-show="termsAccepted && cameraOn" ref="videoFloatEl" class="video-float draggable-resizable"
        :style="videoFloatStyle">
        <div class="video-float__dragbar" @pointerdown="onDragPointerDown">
          <span class="video-float__dragdot">⋮⋮</span>
          <span class="video-float__dragtext">Cámara</span>
        </div>

        <video ref="videoEl" autoplay playsinline muted class="video-float__video"></video>


        <div class="video-float__resize" @pointerdown="onResizePointerDown" aria-label="Resize"></div>
      </div>


      <p style="margin:0; font-size: 10px;">
        Estado conexión: <b>{{ online ? 'ONLINE' : 'OFFLINE' }}</b>
        <small v-if="status.mode === 'verified'"> (verificado)</small>
      </p>
      <br />
      <div v-if="uiStep === 'rut'" style="display:grid; gap:12px;">

        <label>
          RUT pensionado
          <input v-model.trim="rut" placeholder="12.345.678-9"
            style="width: 100%;  border: 1px solid #ccc; border-radius: 10px; padding-top: 10px; padding-bottom: 10px;" />
        </label>

        <button @click="goToTerms" :disabled="!isRutReady" style="width:100%">Continuar</button>

        <small style="opacity:.7;">
          Ingresa el RUT para continuar.
        </small>
      </div>

      <div v-else style="display:grid; gap:12px;">
        <h1 style="margin: 0;">Afiliación Offline (Nuxt 3)</h1>

        <label>
          RUT pensionado
          <input v-model.trim="rut" placeholder="12.345.678-9"
            style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 10px;" />
        </label>

        <div style="padding: 12px 14px; border:1px solid #e5e5e5; border-radius:12px; background:#fff;">
          <h2 style="margin:0 0 8px 0;">What is Lorem Ipsum?</h2>
          <p style="margin:10px 0; line-height:1.4;">
            Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the
            industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and
            scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into
            electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of
            Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like
            Aldus PageMaker including versions of Lorem Ipsum.
          </p>
          <p>
            Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the
            industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and
            scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into
            electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of
            Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like
            Aldus PageMaker including versions of Lorem Ipsum.
          </p>
          <br />
          <label style="display:flex; gap:10px; align-items:flex-start;">
            <input type="checkbox" v-model="termsAccepted" style="margin-top:4px;" />
            <span>He leído las condiciones.</span>
          </label>
          <br />
          <button @click="back" :disabled="syncing || !online">← Volver</button>
        </div>

        <div v-if="termsAccepted" style="display:grid; gap:12px;">
          <label style="display:flex; flex-direction:column; gap:6px; min-width: 280px;">
            Cámara
            <select v-model="selectedDeviceId" :disabled="!videoInputs.length || recording"
              style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 10px;">
              <option value="">(Automática)</option>
              <option v-for="d in videoInputs" :key="d.deviceId" :value="d.deviceId">
                {{ d.label || `Cámara ${d.deviceId.slice(0, 6)}…` }}
              </option>
            </select>
          </label>
          <div style="display:flex; gap: 8px; flex-wrap: wrap;">
            <button @click="startCamera" :disabled="cameraOn">🎥 Encender cámara</button>
            <button @click="stopCamera" :disabled="!cameraOn">⛔ Apagar cámara</button>

            <button @click="openFilePicker" :disabled="syncing">📎 Adjuntar video</button>
            <input ref="fileInputEl" type="file" accept="video/*" capture="environment" style="display:none"
              @change="onFileSelected" />

            <button @click="syncPending" :disabled="syncing || !online">🔄 Enviar confirmados</button>

          </div>

          <p>
            Pendientes: <b>{{ pendingCount }}</b>
            — Confirmados vencidos (auto): <b>{{ readyExpiredCount }}</b>
          </p>

          <div v-if="lastPreviewUrl" ref="previewAnchorEl" style="margin-top: 12px;">
            <h3>Última grabación (preview)</h3>
            <video :src="lastPreviewUrl" controls style="width: 100%; border-radius: 12px;"></video>
          </div>

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
                    ⏱ {{ formatDuration(mediaMeta[item.id]?.durationSec ?? null) }}
                    · 💾 {{ formatBytes(mediaMeta[item.id]?.sizeBytes ?? 0) }}
                  </div>

                  <div v-if="item.status === 'ready' && item.confirmedAt" style="font-size:12px; opacity:.75;">
                    Confirmado: {{ formatDate(item.confirmedAt) }} · Auto-envío en: {{ remainingText(item) }}
                  </div>
                </div>

                <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; justify-content:flex-end;">
                  <span :style="badgeStyle(item.status)">{{ item.status }}</span>

                  <button @click="previewPending(item)">▶️ Ver</button>

                  <button v-if="item.status === 'review'" @click="confirmPending(item)" :disabled="syncing">
                    ✅ Confirmar
                  </button>

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
        </div>


        <div v-else style="padding:10px; border-radius:10px; background:#f5f5f5;">
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
type MediaMeta = {
  sizeBytes: number;
  durationSec: number | null
}

import {
  ref,
  onMounted,
  onBeforeUnmount,
  computed,
  watch
} from 'vue'

import {
  idbPut,
  idbGetAll,
  idbDelete,
  type StoredCase
} from '~/utils/idb'

const mediaMeta = ref<Record<string, MediaMeta>>({})

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
const autoTimeouts = new Map<string, any>()

const videoInputs = ref<MediaDeviceInfo[]>([])
const selectedDeviceId = ref<string>('')
const permissionPrimed = ref(false)

const fileInputEl = ref<HTMLInputElement | null>(null)

type UiStep = 'rut' | 'terms'
const uiStep = ref<UiStep>('rut')
const termsAccepted = ref(false)

const isRutReady = computed(() => {
  const r = (rut.value || "").trim()
  return r.length >= 8
})

const topAnchorEl = ref<HTMLElement | null>(null)

const previewAnchorEl = ref<HTMLElement | null>(null)

const videoFloatEl = ref<HTMLElement | null>(null)

const floatX = ref(14)
const floatY = ref(14)
const floatW = ref(220)
const floatH = ref<number | null>(null)

const MIN_W = 220
const MAX_W = 520

let dragging = false
let dragStartX = 0
let dragStartY = 0
let dragOriginX = 0
let dragOriginY = 0

let resizing = false
let resizeStartX = 0
let resizeStartY = 0
let resizeOriginW = 0

const videoFloatStyle = computed(() => {
  return {
    left: `${floatX.value}px`,
    top: `${floatY.value}px`,
    width: `${floatW.value}px`
  } as Record<string, string>
})



function updateInitialSizeOnResize() {
  floatW.value = getInitialFloatWidth()
  snapOverlayIntoViewport()
}


function getInitialFloatWidth() {
  const vw = window.innerWidth
  const base = 220
  if (vw < 480) return Math.max(base, vw * 0.6)
  if (vw < 900) return Math.max(base, vw * 0.4)
  return Math.max(base, Math.min(360, vw * 0.25))
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function keepInsideViewport(nextX: number, nextY: number, w: number) {
  const margin = 8
  const vw = window.innerWidth
  const vh = window.innerHeight
  const el = videoFloatEl.value
  const h = el?.getBoundingClientRect().height ?? 200
  const x = clamp(nextX, margin, vw - w - margin)
  const y = clamp(nextY, margin, vh - h - margin)
  return { x, y }
}


function getInitialFloatWidthClient() {
  const vw = window.innerWidth
  const base = 220

  if (vw < 480) return Math.max(base, vw * 0.6)
  if (vw < 900) return Math.max(base, vw * 0.4)
  return Math.max(base, Math.min(360, vw * 0.25))
}

function onDragPointerDown(ev: PointerEvent) {
  if (!termsAccepted.value || !cameraOn.value) return

  dragging = true
  dragStartX = ev.clientX
  dragStartY = ev.clientY
  dragOriginX = floatX.value
  dragOriginY = floatY.value

    ; (ev.currentTarget as HTMLElement)?.setPointerCapture?.(ev.pointerId)
  window.addEventListener("pointermove", onPointerMove, { passive: false })
  window.addEventListener("pointerup", onPointerUp, { passive: true })
}

function onResizePointerDown(ev: PointerEvent) {
  if (!termsAccepted.value || !cameraOn.value) return

  resizing = true
  resizeStartX = ev.clientX
  resizeStartY = ev.clientY
  resizeOriginW = floatW.value

    ; (ev.currentTarget as HTMLElement)?.setPointerCapture?.(ev.pointerId)
  window.addEventListener("pointermove", onPointerMove, { passive: false })
  window.addEventListener("pointerup", onPointerUp, { passive: true })
}

function onPointerMove(ev: PointerEvent) {
  if (dragging || resizing) ev.preventDefault()

  if (dragging) {
    const dx = ev.clientX - dragStartX
    const dy = ev.clientY - dragStartY
    const nx = dragOriginX + dx
    const ny = dragOriginY + dy

    const bounded = keepInsideViewport(nx, ny, floatW.value)
    floatX.value = bounded.x
    floatY.value = bounded.y
    return
  }

  if (resizing) {
    const dx = ev.clientX - resizeStartX
    const nw = clamp(resizeOriginW + dx, MIN_W, Math.min(MAX_W, window.innerWidth - 16))
    floatW.value = nw


    const bounded = keepInsideViewport(floatX.value, floatY.value, floatW.value)
    floatX.value = bounded.x
    floatY.value = bounded.y
  }
}

function onPointerUp() {
  dragging = false
  resizing = false
  window.removeEventListener("pointermove", onPointerMove as any)
  window.removeEventListener("pointerup", onPointerUp as any)
}

function snapOverlayIntoViewport() {
  const bounded = keepInsideViewport(floatX.value, floatY.value, floatW.value)
  floatX.value = bounded.x
  floatY.value = bounded.y
}

onMounted(() => {
  floatW.value = getInitialFloatWidthClient()

const onWinResize = () => {
  floatW.value = getInitialFloatWidthClient()
  snapOverlayIntoViewport()
}

window.addEventListener("resize", onWinResize); 
(window as any).__onWinResizeVideoFloat = onWinResize
})

onBeforeUnmount(() => {
  const fn = (window as any).__onWinResizeVideoFloat
if (fn) window.removeEventListener("resize", fn)
  window.removeEventListener("resize", updateInitialSizeOnResize)
  window.removeEventListener("pointermove", onPointerMove as any)
  window.removeEventListener("pointerup", onPointerUp as any)
})


function setMsg(t: string) {
  msg.value = t
  console.log(t)
}

function goToTerms() {
  if (!isRutReady.value) {
    setMsg('Ingresa un RUT válido para continuar.')
    return
  }
  uiStep.value = 'terms'
}

async function acceptTerms() {
  if (!isRutReady.value) {
    setMsg("Ingresa un RUT válido para continuar.")
    return
  }
  termsAccepted.value = true
  setMsg("Términos aceptados. Puedes encender cámara o adjuntar un video.")

  await primePermissions()
  await loadVideoDevices()
}

function formatBytes(bytes: number) {
  const kb = 1024
  const mb = kb * 1024
  const gb = mb * 1024
  if (bytes >= gb) return `${(bytes / gb).toFixed(2)} GB`
  if (bytes >= mb) return `${(bytes / mb).toFixed(2)} MB`
  if (bytes >= kb) return `${(bytes / kb).toFixed(1)} KB`
  return `${bytes} B`
}

function openFilePicker() {
  if (!rut.value) {
    setMsg('Debes ingresar el RUT antes de adjuntar un video.')
    return
  }
  fileInputEl.value?.click()
}

function resetToStart() {
  setTimeout(function () {
    try { stopCamera() } catch { }
    try {
      if (lastPreviewUrl.value) URL.revokeObjectURL(lastPreviewUrl.value)
    } catch { }
    lastPreviewUrl.value = ''
    termsAccepted.value = false
    uiStep.value = 'rut'
    recording.value = false
    chunks.value = []
    recorder = null
    rut.value = ''
    try { scrollToTopAnchor?.() } catch { }
  }, 3000);

}

function back() {
  try { stopCamera() } catch { }
  try {
    if (lastPreviewUrl.value) URL.revokeObjectURL(lastPreviewUrl.value)
  } catch { }
  lastPreviewUrl.value = ''
  termsAccepted.value = false
  uiStep.value = 'rut'
  recording.value = false
  chunks.value = []
  recorder = null
  rut.value = ''
  try { scrollToTopAnchor?.() } catch { }


}

function shouldResetAfterSync() {
  const remainingActionable = pending.value.filter((x: any) =>
    x.status === 'review' || x.status === 'ready'
  )
  return remainingActionable.length === 0
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

async function onFileSelected(ev: Event) {
  const input = ev.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''

  if (!file) return
  if (!rut.value) {
    setMsg('Debes ingresar el RUT antes de adjuntar un video.')
    return
  }

  try {
    setMsg(`Adjuntando video: ${file.name} (${formatBytes(file.size)})...`)

    const mimeType = file.type || 'video/mp4'
    const chunksArr = await fileToChunks(file)

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
      .then((meta) => {
        mediaMeta.value = { ...mediaMeta.value, [item.id]: meta }
      })
      .catch(() => {
        mediaMeta.value = { ...mediaMeta.value, [item.id]: { sizeBytes: file.size, durationSec: null } }
      })

    setMsg('Video adjuntado y guardado OFFLINE. Revisa y CONFIRMA para dejar listo para envío.')
  } catch (e: any) {
    setMsg(`Error adjuntando video: ${e?.message ?? e}`)
  }
}

function formatDuration(sec: number | null) {
  if (sec == null || !Number.isFinite(sec)) return '-'
  const s = Math.floor(sec)
  const mm = Math.floor(s / 60)
  const ss = s % 60
  return `${mm}:${String(ss).padStart(2, '0')}`
}

async function primePermissions() {
  if (permissionPrimed.value) return
  try {
    const tmp = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    tmp.getTracks().forEach(t => t.stop())
    permissionPrimed.value = true
  } catch {
  }
}

async function loadVideoDevices() {
  if (!navigator.mediaDevices?.enumerateDevices) {
    videoInputs.value = []
    return
  }
  const all = await navigator.mediaDevices.enumerateDevices()
  videoInputs.value = all.filter(d => d.kind === 'videoinput')
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
      try { URL.revokeObjectURL(url) } catch { }
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

function uuid(): string {
  return crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function formatDate(ts: number) {
  try {
    return new Date(ts).toLocaleString('es-CL')
  } catch {
    return String(ts)
  }
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

async function refreshPending() {
  const all = await idbGetAll()
  pending.value = all.filter((x: any) => x.status === 'review' || x.status === 'ready' || x.status === 'error')

  for (const item of pending.value as any[]) {
    if (mediaMeta.value[item.id]) continue
    computeMetaForItem(item)
      .then((meta) => {
        mediaMeta.value = { ...mediaMeta.value, [item.id]: meta }
      })
      .catch(() => {
        mediaMeta.value = { ...mediaMeta.value, [item.id]: { sizeBytes: 0, durationSec: null } }
      })
  }
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

async function startCamera() {
  try {
    if (!termsAccepted.value) {
      setMsg("Debes aceptar los términos antes de usar la cámara.")
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setMsg('Este navegador no soporta getUserMedia.')
      return
    }

    if (stream) stopCamera()

    await primePermissions()
    await loadVideoDevices()

    const wantDeviceId = selectedDeviceId.value?.trim()

    let videoConstraints: MediaTrackConstraints

    if (wantDeviceId) {
      videoConstraints = { deviceId: { exact: wantDeviceId } }
    } else {
      videoConstraints = { facingMode: { exact: 'environment' } }
    }

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: true
      })
    } catch (err) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: true
        })
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: true
        })
      }
    }

    if (videoEl.value) videoEl.value.srcObject = stream
    cameraOn.value = true
    const track = stream.getVideoTracks()[0]
    const settings = track?.getSettings?.()
    if (!wantDeviceId && settings?.deviceId) {
      selectedDeviceId.value = String(settings.deviceId)
    }

    setMsg('Cámara trasera activa.')
    scrollToTopAnchor?.()

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
  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm'
  ]
  for (const c of candidates) {
    if ((window as any).MediaRecorder?.isTypeSupported?.(c)) return c
  }
  return 'video/webm'
}

async function startRecording() {
  if (!termsAccepted.value) {
    setMsg("Debes aceptar los términos antes de grabar.")
    return
  }
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

  recorder.start(1000)
  recording.value = true
  setMsg('Grabando...')
}

function stopRecording() {
  if (recorder && recording.value) recorder.stop()
}

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
  scheduleAutoSend(updated)

  setMsg(`Confirmado: ${item.id}. Se enviará automático en 1 minuto si no lo envías manualmente.`)
}

async function uploadCase(item: any) {
  const blob = new Blob(item.chunks, { type: item.mimeType })

  const fd = new FormData()
  fd.append('rut', item.rut)
  fd.append('createdAt', String(item.createdAt))

  const ext = (item.mimeType?.includes('mp4')) ? 'mp4'
    : (item.mimeType?.includes('quicktime')) ? 'mov'
      : (item.mimeType?.includes('webm')) ? 'webm'
        : 'bin'

  fd.append('video', blob, `${item.rut}-${item.createdAt}.${ext}`)

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
    if (shouldResetAfterSync()) {
      resetToStart()
    }
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
    if (shouldResetAfterSync()) {
      resetToStart()
    }
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

onMounted(async () => {
  await refreshPending()
  await ping()
  await loadVideoDevices()

  await primePermissions()
  await loadVideoDevices()

  for (const item of pending.value as any[]) {
    scheduleAutoSend(item)
  }

  autoTimer = setInterval(() => {
    syncReadyExpired()
  }, AUTO_CHECK_EVERY_MS)
})

onBeforeUnmount(() => {
  stopCamera()
  if (lastPreviewUrl.value) URL.revokeObjectURL(lastPreviewUrl.value)

  if (autoTimer) clearInterval(autoTimer)

  for (const t of autoTimeouts.values()) clearTimeout(t)
  autoTimeouts.clear()
})

function scrollToTopAnchor() {
  requestAnimationFrame(() => {
    topAnchorEl.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

function scrollToPreview() {
  requestAnimationFrame(() => {
    previewAnchorEl.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

async function reloadCameras() {
  await primePermissions()
  await loadVideoDevices()
  if (videoInputs.value.length === 0) {
    setMsg('No se encontraron cámaras (videoinput).')
  } else {
    setMsg(`Cámaras detectadas: ${videoInputs.value.length}`)
  }
}

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

.video-float {
  position: fixed;
  top: 14px;
  right: 14px;
  width: min(320px, 46vw);
  z-index: 9999;
  border-radius: 14px;
  overflow: hidden;
  background: #000;
  border: 1px solid rgba(255, 255, 255, .18);
  box-shadow: 0 14px 40px rgba(0, 0, 0, .28);
}

.video-float__video {
  width: 100%;
  height: auto;
  display: block;
}

.video-float__actions {
  display: flex;
  gap: 8px;
  padding: 10px;
  background: rgba(18, 24, 38, .72);
  backdrop-filter: blur(6px);
}

.video-float__actions button {
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, .22);
  background: rgba(255, 255, 255, .08);
  color: #fff;
}

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
  background: linear-gradient(to top,
      rgba(0, 0, 0, .85),
      rgba(0, 0, 0, .55),
      rgba(0, 0, 0, 0));
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
  transition: .2s;
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
  border: 2px solid rgba(255, 255, 255, .7);
  background: rgba(255, 255, 255, .08);
  color: white;
  font-size: 18px;
  cursor: pointer;
}

.btn-back-mobile {
  position: fixed;
  top: 16px;
  left: 16px;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: none;
  color: black;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(6px);
  cursor: pointer;
  transition: .2s;
}

.btn-back-mobile:active {
  transform: scale(0.95);
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
}

.video-float__video {
  width: 100%;
  height: auto;
  display: block;
}

.video-float__dragbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 10px;
  background: rgba(18, 24, 38, .78);
  backdrop-filter: blur(6px);
  cursor: grab;
  user-select: none;
}

.video-float__dragbar:active {
  cursor: grabbing;
}

.video-float__dragdot {
  opacity: .85;
  font-size: 16px;
  line-height: 1;
}

.video-float__dragtext {
  opacity: .85;
  font-size: 12px;
}

.video-float__resize {
  position: absolute;
  right: 6px;
  bottom: 6px;
  width: 22px;
  height: 22px;
  border-radius: 8px;
  background: rgba(255, 255, 255, .10);
  border: 1px solid rgba(255, 255, 255, .22);
  cursor: nwse-resize;
}


.video-float__resize::before {
  content: "";
  position: absolute;
  inset: 5px;
  border-right: 2px solid rgba(255, 255, 255, .55);
  border-bottom: 2px solid rgba(255, 255, 255, .55);
  border-radius: 4px;
}
</style>
