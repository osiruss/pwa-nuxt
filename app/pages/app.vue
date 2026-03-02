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

      <RutStep v-if="uiStep === 'rut'" v-model:rut="rut" :disabled="!isRutReady" @continue="goToTerms" />

      <div v-else class="stack">
        <TermsPanel v-model:rut="rut" v-model:accepted="termsAccepted" :renderedTitle="renderedTitle"
          :pendingx="pendingx" :paragraphs="paragraphs" :error="error" :source="source" :online="online"
          :syncing="syncing" :showVarsForm="showVarsForm" :vars="vars" @toggleVarsForm="toggleVarsForm"
          @closeVarsForm="showVarsForm = false" @resetVars="resetVars" @setVar="setVar" @back="back" />

        <div v-if="termsAccepted" class="stack">
          <CameraPanel
            v-model:selectedDeviceId="selectedDeviceId"
            :videoInputs="videoInputs"
            :recording="recording"
            :cameraOn="cameraOn"
            :syncing="syncing"
            :online="online"
            :pendingCount="pendingCount"
            :readyExpiredCount="readyExpiredCount"
            :lastPreviewUrl="lastPreviewUrl"
            :showRecordPicker="isMobile"
            @startCamera="startCamera"
            @stopCamera="stopCamera"
            @openFilePicker="openFilePicker"
            @openCameraPicker="openCameraPicker"
            @syncPending="syncPending"
          >
            <!-- 📎 Adjuntar: SIN capture => NO abre cámara -->
            <template #fileInput>
              <input
                ref="fileInputEl"
                type="file"
                accept="video/*"
                class="hidden"
                @change="onFileSelected"
              />
            </template>

            <!-- 🎥 Grabar: CON capture => abre cámara trasera -->
            <template #cameraInput>
              <input
                ref="cameraInputEl"
                type="file"
                accept="video/*"
                capture="environment"
                class="hidden"
                @change="onFileSelected"
              />
            </template>

            <PendingList
              :items="sortedPending"
              :mediaMeta="mediaMeta"
              :syncing="syncing"
              :online="online"
              :formatBytes="formatBytes"
              :formatDuration="formatDuration"
              :formatDate="formatDate"
              :badgeStyle="badgeStyle"
              :remainingText="remainingText"
              @refresh="refreshPending"
              @edit="editPendingVideo"
              @preview="previewPending"
              @download="downloadPending"
              @confirm="confirmPending"
              @syncOne="syncOne"
              @remove="removePending"
            />

            <div v-if="msg" class="msg">{{ msg }}</div>
          </CameraPanel>
          <!-- <CameraPanel v-model:selectedDeviceId="selectedDeviceId" :videoInputs="videoInputs" :recording="recording"
            :cameraOn="cameraOn" :syncing="syncing" :online="online" :pendingCount="pendingCount"
            :readyExpiredCount="readyExpiredCount" :lastPreviewUrl="lastPreviewUrl" @startCamera="startCamera"
            @stopCamera="stopCamera" @openFilePicker="openFilePicker" @syncPending="syncPending">
            <template #fileInput>
              <input ref="fileInputEl" type="file" accept="video/*" capture="environment" class="hidden"
                @change="onFileSelected" />
            </template>

            <PendingList :items="sortedPending" :mediaMeta="mediaMeta" :syncing="syncing" :online="online"
              :formatBytes="formatBytes" :formatDuration="formatDuration" :formatDate="formatDate"
              :badgeStyle="badgeStyle" :remainingText="remainingText" @refresh="refreshPending" @edit="editPendingVideo"
              @preview="previewPending" @download="downloadPending" @confirm="confirmPending" @syncOne="syncOne"
              @remove="removePending" />

            <div v-if="msg" class="msg">{{ msg }}</div>
          </CameraPanel> -->
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

import RutStep from '~/components/affiliacion/RutStep.vue'
import TermsPanel from '~/components/affiliacion/TermsPanel.vue'
import CameraPanel from '~/components/affiliacion/CameraPanel.vue'
import PendingList from '~/components/affiliacion/PendingList.vue'

import { useDevices } from '~/composables/useDevices'
import { useFloatingVideo } from '~/composables/useFloatingVideo'
import { useAnchorsPreview } from '~/composables/useAnchorsPreview'
import { usePendingCases } from '~/composables/usePendingCases'
import { useAutoSend } from '~/composables/useAutoSend'
import { useSyncUpload } from '~/composables/useSyncUpload'
import { useMediaCapture } from '~/composables/useMediaCapture'

const router = useRouter()
const { override, setAuto } = useConnectivityMode()

/* ------------------------ Network status ------------------------ */
const { status, ping } = useNetworkStatus({
  pingUrl: '/api/ping-moleculer',
  verify: true,
  intervalMs: 10_000,
  timeoutMs: 4_000
})

const online = computed(() => {
  if (override.value !== null) return override.value
  return status.value.online
})

/* ------------------------ Devices + Terms ------------------------ */
const { videoInputs, selectedDeviceId, primePermissions, loadVideoDevices, handleSelectedDeviceChange } = useDevices()
const { renderedTitle, paragraphs, vars, setVar, pendingx, error, source } = useTerms(online)

type UiStep = 'rut' | 'terms'

/* ------------------------ Core state ------------------------ */
const rut = ref('')
const msg = ref('')
const syncing = ref(false)

const uiStep = ref<UiStep>('rut')
const termsAccepted = ref(false)
const isRutReady = computed(() => (rut.value || '').trim().length >= 8)

const editingId = ref<string | null>(null)
const editingOriginal = ref<any | null>(null)

function setMsg(t: string) {
  msg.value = t
  console.log(t)
}

/* ------------------------ Preview + anchors ------------------------ */
const lastPreviewUrl = ref('')
const { topAnchorEl, previewAnchorEl, scrollToTopAnchor, scrollToPreview, cleanupPreview } = useAnchorsPreview({
  lastPreviewUrl
})

/* ------------------------ Pending store ------------------------ */
const AUTO_SEND_AFTER_MS = 1 * 60 * 1000
const AUTO_CHECK_EVERY_MS = 30 * 1000

const {
  pending,
  mediaMeta,
  pendingCount,
  sortedPending,
  toPlainCase,
  computeMetaForItem,
  refreshPending,
  replaceVideoOnItem,
  removePending: removePendingFromStore,
  confirmToReady,
  isReadyExpired,
  readyExpiredCount,
  remainingText
} = usePendingCases({
  idbGetAll,
  idbPut,
  idbDelete,
  autoSendAfterMs: AUTO_SEND_AFTER_MS
})

/* ------------------------ DOM refs ------------------------ */
const videoEl = ref<HTMLVideoElement | null>(null)
const fileInputEl = ref<HTMLInputElement | null>(null)
const cameraInputEl = ref<HTMLInputElement | null>(null)

/* ------------------------ Media capture (cámara/grabación/attach) ------------------------ */
const { cameraOn, recording, startCamera, stopCamera, startRecording, stopRecording, attachFile } = useMediaCapture({
  rut,
  termsAccepted,
  selectedDeviceId,
  videoEl,

  primePermissions,
  loadVideoDevices,

  replaceVideoOnItem,
  refreshPending,

  setMsg,
  scrollToTopAnchor,
  scrollToPreview,
  cleanupPreview,

  idbPut,
  pending,

  lastPreviewUrl,
  editingId,
  editingOriginal
})

const isMobile = computed(() => import.meta.client && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent))

/* ------------------------ Floating video ------------------------ */
const floatEnabled = computed(() => termsAccepted.value && cameraOn.value)
const { videoFloatEl, videoFloatStyle, onDragPointerDown, onResizePointerDown } = useFloatingVideo({
  enabled: floatEnabled
})

/* ------------------------ UI helpers ------------------------ */
const showVarsForm = ref(false)

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

  setTimeout(() => {
    try {
      URL.revokeObjectURL(url)
    } catch {}
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

/* ------------------------ Flow / navigation ------------------------ */
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

function shouldResetAfterSync() {
  const remaining = pending.value.filter((x: any) => x.status === 'review' || x.status === 'ready')
  return remaining.length === 0
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

/* ------------------------ Pending actions ------------------------ */
async function confirmPending(item: any) {
  const updated = await confirmToReady(item)
  scheduleAutoSend(updated)
  setMsg(`Confirmado: ${updated.id}. Se enviará automático en 1 minuto si no lo envías manualmente.`)
}

async function removePending(id: string) {
  await removePendingFromStore(id)
  setMsg(`Pendiente eliminado: ${id}`)
}

/* ------------------------ File attach ------------------------ */
function openFilePicker() {
  if (!rut.value) return setMsg('Debes ingresar el RUT antes de adjuntar un video.')
  const el = fileInputEl.value
  if (!el) return
  el.value = ''
  el.click()
}

function openCameraPicker() {
  if (!rut.value) return setMsg('Debes ingresar el RUT antes de grabar un video.')
  const el = cameraInputEl.value
  if (!el) return
  el.value = ''
  el.click()
}

async function onFileSelected(ev: Event) {
  const input = ev.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  await attachFile(file)
}

/* ------------------------ Preview + edit ------------------------ */
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

  if (item.status === 'ready') {
    const updated = toPlainCase(item, { status: 'review', confirmedAt: null })
    await idbPut(updated)
    await refreshPending()
  }

  editingId.value = item.id
  editingOriginal.value = toPlainCase(item)

  previewPending(item)
  await startCamera()
  setMsg(`Editando video del caso: ${item.id}`)
}

/* ------------------------ Upload (queda en app) ------------------------ */
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

  const res = await fetch('https://v9k9214s-3001.brs.devtunnels.ms/tracking/sitpriv/upload', { method: 'POST', body: fd })
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(`Upload falló: ${res.status} ${txt}`)
  }
}

/* ------------------------ Sync composable ------------------------ */
const { syncOne, syncPending, syncReadyExpired } = useSyncUpload({
  online,
  syncing,

  pending,
  refreshPending,
  toPlainCase,
  isReadyExpired,

  idbPut,
  idbDelete,

  setMsg,
  shouldResetAfterSync,
  resetToStartAfterDelay,

  uploadCase
})

/* ------------------------ Auto-send composable ------------------------ */
const { scheduleAutoSend, init: initAutoSend, stop: stopAutoSend } = useAutoSend({
  pending,
  autoSendAfterMs: AUTO_SEND_AFTER_MS,
  autoCheckEveryMs: AUTO_CHECK_EVERY_MS,
  syncReadyExpired
})

/* ------------------------ Vars form ------------------------ */
function toggleVarsForm() {
  showVarsForm.value = !showVarsForm.value
}

function goHome() {
  setAuto()
  router.push('/')
}

function resetVars() {
  Object.keys(vars.value).forEach((k) => {
    ;(vars.value as any)[k] = ''
  })
  if (import.meta.client) {
    try {
      localStorage.removeItem('afiliacion:guionVars:v1')
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
    await handleSelectedDeviceChange({
      newId,
      oldId,
      cameraOn,
      recording,
      startCamera,
      setMsg,
      revert: (v) => (selectedDeviceId.value = v)
    })
  }
)

/* ------------------------ Lifecycle ------------------------ */
onMounted(async () => {
  await refreshPending()

  if (override.value === null) {
    await ping()
  }

  await primePermissions()
  await loadVideoDevices()

  initAutoSend()
})

onBeforeUnmount(() => {
  stopCamera()
  cleanupPreview()
  stopAutoSend()
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

/* ✅ Estas clases ahora viven dentro de componentes, por eso :deep */
:deep(.stack) {
  display: grid;
  gap: 12px;
}

:deep(.field) {
  display: grid;
  gap: 6px;
}

:deep(.label) {
  font-size: 12px;
  opacity: 0.9;
}

:deep(.input) {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 10px;
  box-sizing: border-box;
}

:deep(.hint) {
  opacity: 0.7;
}

:deep(.actions) {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

:deep(.meta) {
  margin: 0;
}

.hidden {
  display: none;
}

:deep(.terms) {
  padding: 12px 14px;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  background: #fff;
  display: grid;
  gap: 10px;
}

:deep(.terms__title) {
  margin: 0;
}

:deep(.terms__p) {
  margin: 0;
  line-height: 1.4;
}

:deep(.checkbox) {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

:deep(.preview) {
  margin-top: 12px;
}

:deep(.preview__video) {
  width: 100%;
  border-radius: 12px;
}

:deep(.pending) {
  margin-top: 14px;
}

:deep(.pending__head) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

:deep(.pending__list) {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
}

:deep(.pending__item) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  background: #fff;
}

:deep(.pending__info) {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

:deep(.pending__rut) {
  font-weight: 700;
}

:deep(.pending__sub) {
  font-size: 12px;
  opacity: 0.75;
}

:deep(.pending__actions) {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

:deep(.empty),
:deep(.msg) {
  margin-top: 14px;
  padding: 10px;
  border-radius: 10px;
  background: #f5f5f5;
}

/* ✅ botones dentro de componentes */
:deep(button.btn),
:deep(button) {
  padding: 10px 12px;
  border: 1px solid #ccc;
  background: white;
  border-radius: 10px;
  cursor: pointer;
}

:deep(button:disabled) {
  opacity: 0.5;
  cursor: not-allowed;
}

:deep(.btn-ghost2) {
  justify-self: start;
}

/* Floating video */
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

/* Drag icon */
.video-float__drag {
  position: absolute;
  left: 6px;
  bottom: 6px;
  width: 26px;
  height: 26px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.28);
  cursor: grab;
  z-index: 2;
  pointer-events: auto;
}

.video-float__drag:active {
  cursor: grabbing;
}

.video-float__drag::before {
  content: "";
  position: absolute;
  inset: 6px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.75) 2px, transparent 3px) 0 0 / 8px 8px;
  opacity: 0.95;
}

.video-float__resize {
  position: absolute;
  right: 6px;
  bottom: 6px;
  width: 26px;
  height: 26px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.28);
  cursor: nwse-resize;
  z-index: 2;
  pointer-events: auto;
}

.video-float__resize::before {
  content: "";
  position: absolute;
  inset: 6px;
  border-right: 2px solid rgba(255, 255, 255, 0.65);
  border-bottom: 2px solid rgba(255, 255, 255, 0.65);
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

:deep(.vars-panel) {
  margin-top: 10px;
  padding: 14px;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  background: #fafafa;
  display: grid;
  gap: 10px;
}
</style>