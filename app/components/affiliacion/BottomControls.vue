<template>
  <div class="bottom-controls">
    <button class="btn-ghost" @click="$emit('stopCamera')" :disabled="!cameraOn">⛔</button>
    <button class="btn-record" v-if="!recording" @click="$emit('startRecording')" :disabled="!cameraOn">●</button>
    <button class="btn-stop" v-else @click="$emit('stopRecording')">■</button>
  </div>
</template>

<script setup lang="ts">
defineProps<{ cameraOn: boolean; recording: boolean }>()
defineEmits<{
  (e: 'stopCamera'): void
  (e: 'startRecording'): void
  (e: 'stopRecording'): void
}>()
</script>