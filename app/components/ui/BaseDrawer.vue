<script setup lang="ts">
import { watch, onBeforeUnmount, ref, computed } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: boolean
  side?: 'left' | 'right'
  closeOnBackdrop?: boolean
  closeOnEsc?: boolean
  lockBodyScroll?: boolean
  zIndex?: number
  width?: number
  background?: string

  /** Swipe */
  swipeClose?: boolean
  swipeThreshold?: number
}>(), {
  side: 'left',
  closeOnBackdrop: true,
  closeOnEsc: true,
  lockBodyScroll: true,
  zIndex: 9999,
  width: 375,
  background: '#F0F3F7',

  swipeClose: true,
  swipeThreshold: 80
})

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'close'): void
}>()

function close() {
  emit('update:modelValue', false)
  emit('close')
}

function onBackdropClick() {
  if (props.closeOnBackdrop) close()
}

function onKeydown(e: KeyboardEvent) {
  if (!props.modelValue) return
  if (!props.closeOnEsc) return
  if (e.key === 'Escape') close()
}

/* lock body scroll + ESC */
watch(
  () => props.modelValue,
  (open) => {
    if (!process.client) return

    window.removeEventListener('keydown', onKeydown)
    if (open) window.addEventListener('keydown', onKeydown)

    if (props.lockBodyScroll) {
      document.body.style.overflow = open ? 'hidden' : ''
    }
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  if (!process.client) return
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})

/* ---------------- Swipe close (mobile) ---------------- */
const panelEl = ref<HTMLElement | null>(null)

// tracking: observando si el gesto será swipe
const tracking = ref(false)
// dragging: ya entró en swipe real
const dragging = ref(false)

const dragX = ref(0)
const startX = ref(0)
const startY = ref(0)

const dragStyle = computed(() => {
  return dragging.value ? { transform: `translateX(${dragX.value}px)` } : {}
})

function isInteractiveTarget(t: EventTarget | null) {
  const el = t as HTMLElement | null
  if (!el) return false
  // Si tocaste un botón/link/input/etc, NO iniciar swipe
  return !!el.closest('button, a, input, textarea, select, label, [data-no-swipe]')
}

function cleanupSwipe() {
  tracking.value = false
  dragging.value = false
  dragX.value = 0

  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('pointercancel', onPointerUp)
}

function onPointerDown(e: PointerEvent) {
  if (!props.swipeClose) return
  if (!props.modelValue) return
  if (!panelEl.value) return

  // ✅ si tocaste un elemento interactivo, deja que el click funcione
  if (isInteractiveTarget(e.target)) return

  // mouse principal
  if (e.pointerType === 'mouse' && e.button !== 0) return

  tracking.value = true
  dragging.value = false
  dragX.value = 0

  startX.value = e.clientX
  startY.value = e.clientY

  window.addEventListener('pointermove', onPointerMove, { passive: false })
  window.addEventListener('pointerup', onPointerUp, { passive: true })
  window.addEventListener('pointercancel', onPointerUp, { passive: true })
}

function onPointerMove(e: PointerEvent) {
  if (!tracking.value || !panelEl.value) return

  const dx = e.clientX - startX.value
  const dy = e.clientY - startY.value

  const START_SWIPE_PX = 10

  // decidir si realmente es swipe horizontal
  if (!dragging.value) {
    // si el gesto es más vertical, aborta swipe (permite scroll)
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > START_SWIPE_PX) {
      cleanupSwipe()
      return
    }

    // entrar en swipe cuando el movimiento horizontal es claro
    if (Math.abs(dx) > START_SWIPE_PX && Math.abs(dx) > Math.abs(dy)) {
      dragging.value = true
      try {
        panelEl.value.setPointerCapture(e.pointerId)
      } catch {}
    } else {
      return
    }
  }

  // ya en swipe: evita scroll vertical
  e.preventDefault()

  const w = panelEl.value.getBoundingClientRect().width || 1

  if (props.side === 'left') {
    // cerrar hacia la izquierda => dx negativo
    dragX.value = Math.max(-w, Math.min(0, dx))
  } else {
    // cerrar hacia la derecha => dx positivo
    dragX.value = Math.min(w, Math.max(0, dx))
  }
}

function onPointerUp() {
  if (!tracking.value || !panelEl.value) {
    cleanupSwipe()
    return
  }

  const threshold = props.swipeThreshold
  const shouldClose =
    props.side === 'left'
      ? Math.abs(dragX.value) > threshold && dragX.value < 0
      : Math.abs(dragX.value) > threshold && dragX.value > 0

  cleanupSwipe()

  if (shouldClose) close()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="bd-fade">
      <div
        v-if="modelValue"
        class="bd__backdrop"
        :style="{ zIndex: zIndex - 1 }"
        @click="onBackdropClick"
      />
    </Transition>

    <Transition :name="side === 'left' ? 'bd-sheet-left' : 'bd-sheet-right'">
      <aside
        v-if="modelValue"
        class="bd"
        :style="{ zIndex }"
        role="dialog"
        aria-modal="true"
        @click.stop
      >
        <div
          ref="panelEl"
          class="bd__panel"
          :class="[
            side === 'left' ? 'bd__panel--left' : 'bd__panel--right',
            dragging ? 'bd__panel--dragging' : ''
          ]"
          :style="{
            maxWidth: width + 'px',
            background,
            ...dragStyle
          }"
          @pointerdown="onPointerDown"
        >
          <slot />
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>

<style scoped>
.bd__backdrop{
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.25);
}

.bd{
  position: fixed;
  inset: 0;
  display: flex;
  align-items: stretch;
}

/* panel = sheet */
.bd__panel{
  width: 100%;
  height: 100%;
  overflow: hidden;        /* ✅ el scroll vive en tus hijos */
  will-change: transform;

  /* Swipe: permite pan-y (scroll vertical) pero capturamos horizontal al arrastrar */
  touch-action: pan-y;
}

/* durante drag, sin transición para que siga el dedo */
.bd__panel--dragging{
  transition: none !important;
}

.bd__panel--left{ margin-right: auto; }
.bd__panel--right{ margin-left: auto; }

/* ✅ Fade suave */
.bd-fade-enter-active, .bd-fade-leave-active { transition: opacity .22s ease; }
.bd-fade-enter-from, .bd-fade-leave-to { opacity: 0; }

/* ✅ Slide real desde fuera + easing suave */
.bd-sheet-left-enter-active, .bd-sheet-left-leave-active {
  transition: transform .32s cubic-bezier(.22,.61,.36,1);
}
.bd-sheet-left-enter-from, .bd-sheet-left-leave-to {
  transform: translateX(-100%);
}

.bd-sheet-right-enter-active, .bd-sheet-right-leave-active {
  transition: transform .32s cubic-bezier(.22,.61,.36,1);
}
.bd-sheet-right-enter-from, .bd-sheet-right-leave-to {
  transform: translateX(100%);
}
</style>