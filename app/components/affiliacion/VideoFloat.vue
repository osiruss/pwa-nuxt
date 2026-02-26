<template>
  <div ref="root" class="video-float draggable-resizable" :style="styleObj">
    <slot />

    <div class="video-float__drag" @pointerdown="$emit('dragStart', $event)" title="Mover"></div>
    <div class="video-float__resize" @pointerdown="$emit('resizeStart', $event)" title="Redimensionar"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps<{ styleObj: Record<string, string> }>()
const emit = defineEmits<{
  (e: 'dragStart', ev: PointerEvent): void
  (e: 'resizeStart', ev: PointerEvent): void
  (e: 'mount', el: HTMLElement | null): void
}>()

const root = ref<HTMLElement | null>(null)

onMounted(() => emit('mount', root.value))
onBeforeUnmount(() => emit('mount', null))
</script>