import { ref, computed, onMounted, onBeforeUnmount, type Ref } from 'vue'

export function useFloatingVideo(args: {
  enabled: Ref<boolean>
}) {
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

  function onDragPointerDown(ev: PointerEvent) {
    if (!args.enabled.value) return

    dragging = true
    dragStartX = ev.clientX
    dragStartY = ev.clientY
    dragOriginX = floatX.value
    dragOriginY = floatY.value

    ;(ev.currentTarget as HTMLElement)?.setPointerCapture?.(ev.pointerId)
    window.addEventListener('pointermove', onPointerMove, { passive: false })
    window.addEventListener('pointerup', onPointerUp, { passive: true })
  }

  function onResizePointerDown(ev: PointerEvent) {
    if (!args.enabled.value) return

    resizing = true
    resizeStartX = ev.clientX
    resizeOriginW = floatW.value

    ;(ev.currentTarget as HTMLElement)?.setPointerCapture?.(ev.pointerId)
    window.addEventListener('pointermove', onPointerMove, { passive: false })
    window.addEventListener('pointerup', onPointerUp, { passive: true })
  }

  let onWinResize: (() => void) | null = null

  onMounted(() => {
    floatW.value = getInitialFloatWidth()
    snapOverlayIntoViewport()

    onWinResize = () => {
      floatW.value = getInitialFloatWidth()
      snapOverlayIntoViewport()
    }
    window.addEventListener('resize', onWinResize)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('pointermove', onPointerMove as any)
    window.removeEventListener('pointerup', onPointerUp as any)
    if (onWinResize) window.removeEventListener('resize', onWinResize)
  })

  return {
    videoFloatEl,
    videoFloatStyle,
    onDragPointerDown,
    onResizePointerDown,
    snapOverlayIntoViewport
  }
}