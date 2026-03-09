<template>
  <main class="page" :class="{ 'page--full': uiStep === 'welcome' }">
    <section class="card">
      <div ref="topAnchorEl" class="top-anchor"></div>
      <LoginStep v-if="uiStep === 'login'" :rut="rut" :pass="pass" :loading="loginLoading" :error="loginError"
        @update:rut="rut = $event" @update:pass="pass = $event" @submit="onLoginSubmit" @forgot="onForgot" />

      <WelcomeView v-else-if="uiStep === 'welcome'" @enter="uiStep = 'rut'" />

      <PreAffiliationView v-else-if="uiStep === 'pre'" @continue="onPreContinue" @cancel="uiStep = 'welcome'" />

      <PreAffiliationStep2View v-else-if="uiStep === 'pre2'" @consult="onConsultAffiliation" @back="uiStep = 'pre'"
        @cancel="uiStep = 'welcome'" />

      <PreAffiliationConsultResultView v-else-if="uiStep === 'resultView'" :rut="consultResult.rut"
        :prospect-name="consultResult.prospectName" :benefit-start-date="consultResult.benefitStartDate"
        :compensation-box="consultResult.compensationBox" :status="consultResult.status" @continue="goFromResultToPre3"
        @back="goBackStep" @cancel="cancelPreAffiliation" />

      <PreAffiliationStep3View v-else-if="uiStep === 'pre3'" @startBiometric="onStartBiometric" @back="goBackFromPre3"
        @cancel="cancelPreAffiliation" />

      <PreAffiliationBiometricSuccessView v-else-if="uiStep === 'pre4'" @continue="goFromPre4ToNext" />

      <PreAffiliationSubmittedView v-else-if="uiStep === 'pre5'" :event-id="submittedResult.eventId"
        :status-text="submittedResult.statusText" :submitted-at="submittedResult.submittedAt"
        :client-rut="submittedResult.clientRut" :client-name="submittedResult.clientName"
        :compensation-box="submittedResult.compensationBox" :executive-name="submittedResult.executiveName"
        :executive-rut="submittedResult.executiveRut" :executive-email="submittedResult.executiveEmail"
        :branch-code="submittedResult.branchCode" @goHome="goToHomeFromSubmitted" />
        
      <template v-else>
        <RutStep v-if="uiStep === 'rut'" v-model:rut="rut" :disabled="!isRutReady" @continue="goToTerms" />
        <PreAffiliationRecordingView v-else>
          <div class="stack">
            <TermsPanel v-model:rut="rut" :renderedTitle="renderedTitle" :pendingx="pendingx" :paragraphs="paragraphs"
              :error="error" :source="source" :online="online" :syncing="syncing" :showVarsForm="showVarsForm"
              :vars="vars" :lastPreviewUrl="lastPreviewUrl" :showRecordPicker="isMobile" :cameraOn="cameraOn"
              :recording="recording" :recordedDurationSec="recordedDurationSec"
              :hasRecordedPreview="!!lastPreviewUrl && !cameraOn" @toggleVarsForm="toggleVarsForm"
              @closeVarsForm="showVarsForm = false" @resetVars="resetVars" @setVar="setVar" @back="back"
              @startCamera="startCameraWithGuion" @stopCamera="onStopCameraWithReset" @startRecording="onStartRecording"
              @stopRecording="onStopRecording" @openCameraPicker="openCameraPicker" @openFilePicker="openFilePicker">
              <template #livePreview>
                <video ref="videoEl" autoplay playsinline muted class="lh-previewMini__live"></video>
              </template>
            </TermsPanel>

            <input ref="fileInputEl" type="file" accept="video/*" class="hidden" @change="onFileSelected" />

            <input ref="cameraInputEl" type="file" accept="video/*" capture="environment" class="hidden"
              @change="onFileSelected" />

            <PendingList :items="sortedPending" :mediaMeta="mediaMeta" :syncing="syncing" :online="online"
              :formatBytes="formatBytes" :formatDuration="formatDuration" :formatDate="formatDate"
              :badgeStyle="badgeStyle" :remainingText="remainingText" @refresh="refreshPending" @edit="editPendingVideo"
              @preview="previewPending" @download="downloadPending" @confirm="confirmPending" @syncOne="syncOne"
              @remove="removePending" />

            <div v-if="msg" class="msg">{{ msg }}</div>
          </div>
        </PreAffiliationRecordingView>
      </template>
    </section>

    <nav v-if="uiStep !== 'login'" class="appBottom">
      <div class="appBottom__inner">
        <button class="appBottom__tab" :class="{ 'appBottom__tab--active': uiStep === 'welcome' }" type="button"
          @click="uiStep = 'welcome'">
          <span class="appBottom__pill" :class="{ 'appBottom__pill--plain': uiStep !== 'welcome' }">
            <UiIcon name="home" :size="22" />
          </span>
          <span class="appBottom__text">Inicio</span>
        </button>

        <button class="appBottom__tab" type="button" @click="menuOpen = true">
          <span class="appBottom__pill appBottom__pill--plain">
            <UiIcon name="menu" :size="22" />
          </span>
          <span class="appBottom__text appBottom__text--blue">Menú</span>
        </button>
      </div>
    </nav>

    <AppMenuDrawer v-model="menuOpen" :items="menuItems" :active-key="uiStep === 'welcome'
      ? 'home'
      : ['pre', 'pre2', 'resultView', 'pre3', 'pre4', 'pre5'].includes(uiStep)
        ? 'pre'
        : undefined
      " @select="onMenuSelect" @logout="onMenuLogout" />

  </main>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { idbPut, idbGetAll, idbDelete, type StoredCase } from '~/utils/idb'
import RutStep from '~/components/affiliacion/RutStep.vue'
import TermsPanel from '~/components/affiliacion/TermsPanel.vue'
import PendingList from '~/components/affiliacion/PendingList.vue'
import { useDevices } from '~/composables/useDevices'
import { useAnchorsPreview } from '~/composables/useAnchorsPreview'
import { usePendingCases } from '~/composables/usePendingCases'
import { useAutoSend } from '~/composables/useAutoSend'
import { useSyncUpload } from '~/composables/useSyncUpload'
import { useMediaCapture } from '~/composables/useMediaCapture'
import { formatRut, isValidRut } from '~/utils/rut'
import LoginStep from '~/components/affiliacion/LoginStep.vue'
import WelcomeView from '~/components/affiliacion/WelcomeView.vue'
import AppMenuDrawer, { type AppMenuItem } from '~/components/ui/AppMenuDrawer.vue'
import PreAffiliationView from '~/components/affiliacion/PreAffiliationView.vue'
import PreAffiliationStep2View from '~/components/affiliacion/PreAffiliationStep2View.vue'
import PreAffiliationStep3View from '~/components/affiliacion/PreAffiliationStep3View.vue'
import PreAffiliationConsultResultView from '~/components/affiliacion/PreAffiliationConsultResultView.vue'
import PreAffiliationBiometricSuccessView from '~/components/affiliacion/PreAffiliationBiometricSuccessView.vue'

import PreAffiliationRecordingView from '~/components/affiliacion/PreAffiliationRecordingView.vue'
import PreAffiliationSubmittedView from '~/components/affiliacion/PreAffiliationSubmittedView.vue'

const menuOpen = ref(false)
const recordingStartedAt = ref<number | null>(null)
const recordedDurationSec = ref<number>(0)
let recordingTimer: number | null = null

const menuItems: AppMenuItem[] = [
  { key: 'home', label: 'Inicio', icon: 'home' },
  { key: 'pre', label: 'Ingresar Preafiliación', icon: 'user-plus-solid' },
  { key: 'history', label: 'Historial', icon: 'file-lines-solid' },
]

const preEventId = ref('')
const preBranchCode = ref('')

const router = useRouter()
const { override, setAuto } = useConnectivityMode()

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

const consultResult = ref<{
  rut: string
  prospectName: string
  benefitStartDate: string
  compensationBox: string
  status: 'not-affiliated' | 'affiliated'
}>({
  rut: '',
  prospectName: '',
  benefitStartDate: '',
  compensationBox: '',
  status: 'not-affiliated'
})

const {
  videoInputs,
  selectedDeviceId,
  primePermissions,
  loadVideoDevices,
  handleSelectedDeviceChange
} = useDevices()
const {
  renderedTitle,
  paragraphs,
  vars,
  setVar,
  pendingx,
  error,
  source,
  refresh
} = useTerms(online)

type UiStep = 'login' | 'welcome' | 'pre' | 'pre2' | 'pre3' | 'pre4' | 'pre5' | 'resultView' | 'rut' | 'terms'
const uiStep = ref<UiStep>('login')
/* ------------------------ Core state ------------------------ */
const rut = ref('')
const msg = ref('')
const syncing = ref(false)

const pass = ref('')
const loginLoading = ref(false)
const loginError = ref('')

const termsAccepted = ref(false)
const isRutReady = computed(() => isValidRut(rut.value))

const editingId = ref<string | null>(null)
const editingOriginal = ref<any | null>(null)


const submittedResult = ref({
  eventId: '',
  statusText: 'Ingresada',
  submittedAt: '',
  clientRut: '',
  clientName: '',
  compensationBox: '',
  executiveName: 'Constanza Vera Veas',
  executiveRut: '11.111.111-1',
  executiveEmail: 'c.vera@losheroes.cl',
  branchCode: '00002'
})

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


/* ------------------------ UI helpers ------------------------ */

function startRecordingClock() {
  recordingStartedAt.value = Date.now()
  recordedDurationSec.value = 0

  if (recordingTimer) {
    window.clearInterval(recordingTimer)
    recordingTimer = null
  }

  recordingTimer = window.setInterval(() => {
    if (!recordingStartedAt.value) return
    recordedDurationSec.value = Math.floor((Date.now() - recordingStartedAt.value) / 1000)
  }, 1000)
}

function stopRecordingClock() {
  if (recordingTimer) {
    window.clearInterval(recordingTimer)
    recordingTimer = null
  }

  if (recordingStartedAt.value) {
    recordedDurationSec.value = Math.floor((Date.now() - recordingStartedAt.value) / 1000)
  }

  recordingStartedAt.value = null
}

function resetRecordingClock() {
  if (recordingTimer) {
    window.clearInterval(recordingTimer)
    recordingTimer = null
  }

  recordingStartedAt.value = null
  recordedDurationSec.value = 0
}




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
    } catch { }
  }, 1500)
}


function onConsultAffiliation(payload: { rut: string }) {
  consultResult.value = {
    rut: payload.rut,
    prospectName: 'Maria Antonia Galvez Lopez',
    benefitStartDate: 'Sin afiliación',
    compensationBox: 'Sin afiliación',
    status: 'not-affiliated'
  }

  uiStep.value = 'resultView'
}

function goFromResultToPre3() {
  uiStep.value = 'pre3'
}

function goBackStep() {
  uiStep.value = 'pre2'
}

function goBackFromPre3() {
  uiStep.value = 'resultView'
}

function cancelPreAffiliation() {
  preEventId.value = ''
  preBranchCode.value = ''

  consultResult.value = {
    rut: '',
    prospectName: '',
    benefitStartDate: '',
    compensationBox: '',
    status: 'not-affiliated'
  }

  uiStep.value = 'welcome'
}

function onStartBiometric() {
  uiStep.value = 'pre4'
}

function goFromPre4ToNext() {
  rut.value = consultResult.value.rut || ''
  termsAccepted.value = true
  uiStep.value = 'terms'
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

function onPreContinue(payload: { eventId: string; branchCode: string }) {
  preEventId.value = payload.eventId
  preBranchCode.value = payload.branchCode
  uiStep.value = 'pre2'
}

function goToTerms() {
  if (!isRutReady.value) return setMsg('Ingresa un RUT válido (con dígito verificador).')
  termsAccepted.value = true
  uiStep.value = 'terms'
}

function back() {
  cleanupPreview()
  stopCamera()
  resetRecordingClock()
  resetFlow()
}

function resetFlow() {
  termsAccepted.value = false
  rut.value = ''
  resetRecordingClock()
  scrollToTopAnchor()
}

function onStopCameraWithReset() {
  stopCamera()
  resetRecordingClock()
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

function onMenuSelect(key: string) {
  console.log("🚀 ~ onMenuSelect ~ key:", key)
  if (key === 'home') uiStep.value = 'welcome'
  if (key === 'pre') uiStep.value = 'pre'
  if (key === 'history') {
    console.log('xxxxx')
  }
}

function onMenuLogout() {
  uiStep.value = 'login'
}

async function onStartRecording() {
  startRecordingClock()
  await startRecording()
}

function onStopRecording() {
  stopRecording()
  stopRecordingClock()
}
//LOGIN
async function onLoginSubmit() {
  loginLoading.value = true
  try {
    await new Promise(r => setTimeout(r, 600))
    uiStep.value = 'welcome'
  } catch (err) {
    loginError.value = 'Error de autenticación'
  } finally {
    loginLoading.value = false
  }
}

function onForgot() {
  alert('Recuperación de contraseña próximamente')
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
  if (!el) {
    setMsg('No se encontró el input de cámara.')
    return
  }
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
    const updated:any  = toPlainCase(item, { status: 'review', confirmedAt: null })
    
    await idbPut(updated)
    await refreshPending()
  }

  editingId.value = item.id
  editingOriginal.value = toPlainCase(item)

  previewPending(item)
  await startCamera()
  setMsg(`Editando video del caso: ${item.id}`)
}

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

  const res = await fetch('https://v9k9214s-3001.brs.devtunnels.ms/tracking/sitpriv/upload', {
    method: 'POST',
    body: fd
  })

  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(`Upload falló: ${res.status} ${txt}`)
  }

  submittedResult.value = {
    eventId: preEventId.value || '000987654334',
    statusText: 'Ingresada',
    submittedAt: new Date().toLocaleDateString('es-CL'),
    clientRut: item.rut || rut.value,
    clientName: consultResult.value.prospectName || 'Sin nombre',
    compensationBox: consultResult.value.compensationBox || 'No afiliado',
    executiveName: 'Constanza Vera Veas',
    executiveRut: '11.111.111-1',
    executiveEmail: 'c.vera@losheroes.cl',
    branchCode: preBranchCode.value || '00002'
  }

  uiStep.value = 'pre5'
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
    ; (vars.value as any)[k] = ''
  })
  if (import.meta.client) {
    try {
      localStorage.removeItem('afiliacion:guionVars:v1')
    } catch { }
  }
}

function goToHomeFromSubmitted() {
  cleanupPreview()
  stopCamera()
  uiStep.value = 'pre'
}

/* ------------------------ Enciende camara ------------------------ */

async function startCameraWithGuion() {
  console.log('startCameraWithGuion ejecutado', {
    rut: rut.value,
    isRutReady: isRutReady.value,
    uiStep: uiStep.value
  })

  try {
    await refresh()
    console.log('[terms.refresh] ok')
  } catch (e) {
    console.warn('[terms.refresh] falló:', e)
  }

  try {
    console.log('[camera] primePermissions:start')
    await primePermissions()
    console.log('[camera] primePermissions:ok')
  } catch (e) {
    console.error('[camera] primePermissions:error', e)
    setMsg('No se pudieron solicitar permisos de cámara.')
    return
  }

  try {
    console.log('[camera] loadVideoDevices:start')
    await loadVideoDevices()
    console.log('[camera] loadVideoDevices:ok', {
      selectedDeviceId: selectedDeviceId.value,
      devices: videoInputs.value?.map(d => ({
        id: d.deviceId,
        label: d.label
      }))
    })
  } catch (e) {
    console.error('[camera] loadVideoDevices:error', e)
    setMsg('No se pudieron cargar las cámaras disponibles.')
    return
  }

  try {
    console.log('[camera] startCamera:start', {
      videoElExists: !!videoEl.value,
      selectedDeviceId: selectedDeviceId.value
    })

    await startCamera()

    console.log('[camera] startCamera:ok', {
      cameraOn: cameraOn.value,
      videoElExists: !!videoEl.value,
      videoSrcObject: !!videoEl.value?.srcObject
    })
  } catch (e) {
    console.error('[camera] startCamera:error', e)
    setMsg('No se pudo iniciar la cámara. Revisa permisos del navegador.')
  }
}

/* ------------------------ Watches ------------------------ */
watch(
  () => uiStep.value,
  async (step) => {
    if (step !== 'terms') return

    if (!isRutReady.value) {
      setMsg('Ingresa un RUT válido (con dígito verificador) para continuar.')
      return
    }

    termsAccepted.value = true

    try {
      await primePermissions()
      await loadVideoDevices()
      console.log('[terms] permisos y dispositivos listos')
    } catch (e) {
      console.warn('[terms] no se pudieron preparar permisos/dispositivos', e)
    }
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
    await refresh();
  }
)

watch(
  () => rut.value,
  (v) => {
    const formatted = formatRut(v)
    if (formatted !== v) rut.value = formatted
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
  height: 100dvh;
  overflow: hidden;
  font-family: system-ui;
  background: #F0F3F7;
  display: flex;
  flex-direction: column;
}

.card {
  flex: 1;
  min-height: 0;
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

.top-anchor {
  position: absolute;
  top: 0;
  left: 0;
  width: 1px;
  height: 1px;
  pointer-events: none;
}

.hidden {
  display: none;
}

:deep(.stack) {
  display: grid;
  gap: 12px;
}

:deep(.empty),
:deep(.msg) {
  margin-top: 14px;
  padding: 10px;
  border-radius: 10px;
  background: #f5f5f5;
}

.appBottom {
  flex: 0 0 72px;
  height: 72px;
  background: #fff;
  box-shadow: 4px 0px 6px -2px rgba(12, 12, 13, 0.1),
              2px 0px 4px -2px rgba(12, 12, 13, 0.05);
  z-index: 20;
}

.appBottom__inner {
  height: 72px;
  padding: 0 16px;
  display: flex;
}

.appBottom__tab {
  flex: 1;
  height: 72px;
  border: 0;
  background: transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 0;
  color: #00275E;
}

.appBottom__pill {
  height: 28px;
  width: 140px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #FCEEE3;
}

.appBottom__pill--plain {
  background: #fff;
}

.appBottom__text {
  font-size: 12px;
  line-height: 16px;
  font-weight: 600;
  color: #00275E;
}

.appBottom__text--blue {
  color: #00275E;
}

.appBottom__tab--active {
  color: #EE7623;
}

.appBottom__tab--active .appBottom__text {
  color: #EE7623;
}

.appBottom__tab--active .appBottom__pill {
  background: #FCEEE3;
}
</style>
