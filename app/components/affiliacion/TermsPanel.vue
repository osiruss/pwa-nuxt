<template>
  <section class="lh-termsScreen">
    <div class="lh-scriptCard">
      <div class="lh-scriptCard__head">
        <div>
          <div class="lh-title">Grabación Consentimiento de afiliación.</div>
          <div class="lh-caption">
            Inicia la grabación y lee el script mientras grabas al cliente.
          </div>
        </div>
      </div>

      <div class="lh-scriptLayout">
        <div class="lh-scriptScroll">
          <div class="lh-scriptBody">
            <p v-for="(p, i) in paragraphsToRender" :key="i" class="lh-scriptParagraph" v-html="formatParagraph(p)" />

            <p v-if="source === 'cache'" class="lh-scriptNote">
              Estás viendo una copia offline guardada.
            </p>

            <p v-else-if="error && !paragraphsToRender.length" class="lh-scriptNote">
              No se pudo cargar el contenido.
            </p>

            <p v-if="error" class="lh-scriptNote">
              Contenido cargado en modo offline.
            </p>
          </div>
        </div>

        <div class="lh-scriptFooter">
          <div class="lh-scriptFooter__grid">
            <div class="lh-previewMini">
              <template v-if="cameraOn">
                <div class="lh-previewMini__liveWrap">
                  <slot name="livePreview" />
                  <div v-if="recording" class="lh-previewMini__durationBar">
                    <span class="lh-previewMini__durationIcon">◷</span>
                    <span>{{ formatDuration(recordedDurationSec || 0) }}</span>
                  </div>
                </div>
              </template>

              <template v-else-if="lastPreviewUrl">
                <div class="lh-previewMini__recordedWrap">
                  <video :src="lastPreviewUrl" class="lh-previewMini__video" controls playsinline @play="onPreviewPlay"
                    @pause="onPreviewPause" @ended="onPreviewEnded" />
                  <div v-if="!playingPreview" class="lh-previewMini__overlay">
                    <div class="lh-previewMini__overlayIcon">👁</div>
                    <div class="lh-previewMini__overlayText">Ver grabación</div>
                  </div>
                </div>
              </template>

              <template v-else>
                <div class="lh-previewMini__icon">📷</div>
                <div class="lh-previewMini__title">Vista previa de la cámara</div>
                <div class="lh-previewMini__text">
                  Selecciona "Iniciar Grabación" para comenzar
                </div>
              </template>
            </div>

            <div class="lh-scriptActions">
              <button v-if="!cameraOn && !lastPreviewUrl" class="lh-btnPrimary lh-btnPrimary--capture" type="button"
                @click="$emit('startCamera')" :disabled="syncing">
                ▶&nbsp; Grabar
              </button>

              <button v-else-if="cameraOn && !recording" class="lh-btnPrimary lh-btnPrimary--capture" type="button"
                @click="$emit('startRecording')" :disabled="syncing">
                ▶&nbsp; Grabar
              </button>

              <button v-else-if="recording" class="lh-btnPrimary lh-btnPrimary--capture" type="button"
                @click="$emit('stopRecording')" :disabled="syncing">
                ❚❚&nbsp; Detener
              </button>

              <button v-else class="lh-btnSuccess" type="button" @click="$emit('confirmRecordedVideo')"
                :disabled="syncing">
                ✓&nbsp; Ingresar grabación
              </button>

              <button class="lh-btnMuted" type="button" @click="$emit('stopCamera')"
                :disabled="!cameraOn && !lastPreviewUrl">
                ↺&nbsp; Regrabar
              </button>

              <button class="lh-btnText" type="button" @click="$emit('back')" :disabled="syncing">
                Volver atrás
              </button>

              <button class="lh-btnSecondaryAlt" type="button" @click="$emit('openFilePicker')" :disabled="syncing">
                Adjuntar video
              </button>

              <button class="lh-btnSecondaryAlt" type="button" @click="$emit('toggleVarsForm')" :disabled="syncing">
                Ingresar datos
              </button>
            </div>
          </div>

          <div class="lh-scriptMeta">
            <div class="lh-fieldBlock">
              <label class="lh-label">RUT pensionado</label>
              <div class="lh-inputLike lh-inputLike--withInput">
                <input :value="rut" @input="onRutInput" placeholder="12.345.678-9" class="lh-inputInline" />
              </div>
            </div>
          </div>

          <VarsForm v-if="showVarsForm" :vars="vars" @setVar="onSetVar" @close="$emit('closeVarsForm')"
            @reset="$emit('resetVars')" />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VarsForm from '~/components/affiliacion/VarsForm.vue'

import { ref } from 'vue'

const playingPreview = ref(false)

type Vars = Record<string, any>

const props = defineProps<{
  rut: string
  renderedTitle: string | null | undefined
  pendingx: any
  paragraphs: any
  error: any
  source: any
  online: boolean
  syncing: boolean
  showVarsForm: boolean
  vars: Vars
  lastPreviewUrl?: string
  showRecordPicker?: boolean
  cameraOn: boolean
  recording: boolean
  recordedDurationSec?: number
  hasRecordedPreview?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:rut', v: string): void
  (e: 'back'): void
  (e: 'toggleVarsForm'): void
  (e: 'closeVarsForm'): void
  (e: 'resetVars'): void
  (e: 'setVar', k: string, v: string): void
  (e: 'startCamera'): void
  (e: 'stopCamera'): void
  (e: 'startRecording'): void
  (e: 'stopRecording'): void
  (e: 'openCameraPicker'): void
  (e: 'openFilePicker'): void
  (e: 'confirmRecordedVideo'): void
}>()

const paragraphsToRender = computed<string[]>(() => {
  if (Array.isArray(props.paragraphs)) return props.paragraphs.filter(Boolean)

  if (typeof props.paragraphs === 'string' && props.paragraphs.trim()) {
    return props.paragraphs
      .split(/\n{2,}|\r\n\r\n/)
      .map((x: string) => x.trim())
      .filter(Boolean)
  }

  return []
})

function onRutInput(e: Event) {
  emit('update:rut', (e.target as HTMLInputElement).value)
}

function onSetVar(k: string, v: string) {
  emit('setVar', k, v)
}

function formatParagraph(text: string) {
  return String(text)
    .replace(/\{\{([^}]+)\}\}/g, '<span class="lh-scriptVar">{{$1}}</span>')
    .replace(
      /(Mar[ií]a Antonia Lopez Galvez|Constanza Vera Veas)/gi,
      '<span class="lh-scriptAccent">$1</span>'
    )
}

function formatDuration(sec = 0) {
  const total = Math.max(0, Math.floor(sec))
  const mm = Math.floor(total / 60)
  const ss = total % 60
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
}

function onPreviewPlay() {
  playingPreview.value = true
}

function onPreviewPause() {
  playingPreview.value = false
}

function onPreviewEnded() {
  playingPreview.value = false
}
</script>