<template>
  <div class="stack">
    <label class="field">
      <span class="label">Cámara</span>
      <select :value="selectedDeviceId" @change="onDeviceChange" :disabled="!videoInputs.length || recording" class="input">
        <option value="">(Automática)</option>
        <option v-for="d in videoInputs" :key="d.deviceId" :value="d.deviceId">
          {{ d.label || `Cámara ${d.deviceId.slice(0, 6)}…` }}
        </option>
      </select>
    </label>

    <div class="actions">
      <button class="btn" @click="$emit('startCamera')" :disabled="cameraOn">🎥 Encender cámara</button>
      <button class="btn" @click="$emit('stopCamera')" :disabled="!cameraOn">⛔ Apagar cámara</button>

      <button class="btn" @click="$emit('openFilePicker')" :disabled="syncing">📎 Adjuntar video</button>
      <slot name="fileInput" />

      <button class="btn" @click="$emit('syncPending')" :disabled="syncing || !online">🔄 Enviar confirmados</button>
    </div>

    <p class="meta">
      Pendientes: <b>{{ pendingCount }}</b>
      — Confirmados vencidos (auto): <b>{{ readyExpiredCount }}</b>
    </p>

    <div v-if="lastPreviewUrl" class="preview">
      <h3 class="subtitle">Última grabación (preview)</h3>
      <video :src="lastPreviewUrl" controls class="preview__video"></video>
    </div>

    <slot />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  selectedDeviceId: string
  videoInputs: MediaDeviceInfo[]
  recording: boolean
  cameraOn: boolean
  syncing: boolean
  online: boolean
  pendingCount: number
  readyExpiredCount: number
  lastPreviewUrl: string
}>()

const emit = defineEmits<{
  (e: 'update:selectedDeviceId', v: string): void
  (e: 'startCamera'): void
  (e: 'stopCamera'): void
  (e: 'openFilePicker'): void
  (e: 'syncPending'): void
}>()

function onDeviceChange(e: Event) {
  emit('update:selectedDeviceId', (e.target as HTMLSelectElement).value)
}
</script>