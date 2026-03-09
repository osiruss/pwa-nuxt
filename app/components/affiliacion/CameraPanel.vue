<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  selectedDeviceId: string
  videoInputs: Array<{ deviceId: string; label?: string }>
  recording: boolean
  cameraOn: boolean
  syncing: boolean
  online: boolean
  pendingCount: number
  readyExpiredCount: number
  lastPreviewUrl?: string
  showRecordPicker?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:selectedDeviceId', value: string): void
  (e: 'startCamera'): void
  (e: 'stopCamera'): void
  (e: 'openFilePicker'): void
  (e: 'openCameraPicker'): void
  (e: 'syncPending'): void
}>()

const hasPreview = computed(() => !!props.lastPreviewUrl)
const canSync = computed(() => props.online && !props.syncing && props.pendingCount > 0)
</script>

<template>
  <section class="lh-captureScreen">
    <div class="lh-captureScreen__top">
      <div class="lh-captureScreen__status">
        <span class="lh-chip" :class="online ? 'lh-chip--success' : 'lh-chip--muted'">
          {{ online ? 'ONLINE' : 'OFFLINE' }}
        </span>

        <span v-if="pendingCount > 0" class="lh-chip lh-chip--soft">
          Pendientes: {{ pendingCount }}
        </span>

        <span v-if="readyExpiredCount > 0" class="lh-chip lh-chip--warning">
          Vencidos: {{ readyExpiredCount }}
        </span>
      </div>

      <div v-if="videoInputs?.length" class="lh-deviceSelect">
        <label class="lh-deviceSelect__label">Cámara</label>
        <select
          class="lh-deviceSelect__select"
          :value="selectedDeviceId"
          @change="emit('update:selectedDeviceId', ($event.target as HTMLSelectElement).value)"
        >
          <option
            v-for="device in videoInputs"
            :key="device.deviceId"
            :value="device.deviceId"
          >
            {{ device.label || 'Cámara disponible' }}
          </option>
        </select>
      </div>
    </div>

    <div class="lh-captureLayout">
      <!-- Preview -->
      <div class="lh-previewCard">
        <template v-if="hasPreview">
          <video
            :src="lastPreviewUrl"
            class="lh-previewCard__video"
            controls
            playsinline
          />
        </template>

        <template v-else>
          <div class="lh-previewCard__empty">
            <div class="lh-previewCard__icon">📷</div>
            <div class="lh-previewCard__title">Vista previa de la cámara</div>
            <div class="lh-previewCard__text">
              Selecciona “Iniciar Grabación” para comenzar
            </div>
          </div>
        </template>
      </div>

      <!-- Actions -->
      <div class="lh-captureActions">
        <div class="lh-captureActions__row">
          <button
            class="lh-roundAction"
            type="button"
            @click="emit(showRecordPicker ? 'openCameraPicker' : 'startCamera')"
          >
            ▶
          </button>

          <button
            class="lh-roundAction lh-roundAction--outline"
            type="button"
            @click="emit('stopCamera')"
            :disabled="!cameraOn"
          >
            ↺
          </button>
        </div>

        <button
          class="lh-btnPrimary lh-btnPrimary--capture"
          type="button"
          @click="emit(showRecordPicker ? 'openCameraPicker' : 'startCamera')"
          :disabled="syncing"
        >
          Ingresar
        </button>

        <button
          class="lh-btnOutline"
          type="button"
          @click="emit('openFilePicker')"
          :disabled="syncing"
        >
          Adjuntar video
        </button>

        <button
          class="lh-btnSecondaryAlt"
          type="button"
          @click="emit('syncPending')"
          :disabled="!canSync"
        >
          {{ syncing ? 'Sincronizando...' : 'Enviar pendientes' }}
        </button>
      </div>
    </div>

    <div class="lh-captureScreen__slot">
      <slot name="fileInput" />
      <slot name="cameraInput" />
      <slot />
    </div>
  </section>
</template>